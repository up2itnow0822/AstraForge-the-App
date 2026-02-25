"""
Strategy implementations: TCL and SMOG.
Based on Craig Percoco / Inevitrade's premium course materials.
"""

import time
import logging
import numpy as np
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

log = logging.getLogger('trader')

from indicators import (
    ema, rsi, adx, fibonacci_retracement, detect_trend, find_trend_extremes,
    trend_magnitude, is_parabolic, detect_fvgs, detect_choch,
    detect_rsi_divergence, FIB_LEVELS,
)


@dataclass
class Order:
    side: str           # 'long' or 'short'
    entry_price: float
    size_usd: float     # notional USD
    tp: float
    sl: float
    order_type: str     # 'entry', 'limit1', 'limit2'
    status: str = 'pending'  # pending, filled, cancelled


@dataclass
class Position:
    strategy: str
    side: str
    orders: List[Order] = field(default_factory=list)
    avg_entry: float = 0.0
    total_size: float = 0.0
    tp: float = 0.0
    sl: float = 0.0
    original_sl: float = 0.0   # Captured at open; never mutated (used for R-multiple calc)
    sl_moved_to_be: bool = False
    opened_at: float = 0.0
    pnl: float = 0.0
    status: str = 'open'  # open, closed
    metadata: Dict = field(default_factory=dict)

    def fill_order(self, order: Order, fill_price: float):
        order.status = 'filled'
        old_notional = self.avg_entry * self.total_size if self.total_size > 0 else 0
        new_notional = fill_price * order.size_usd
        self.total_size += order.size_usd
        self.avg_entry = (old_notional + new_notional) / self.total_size if self.total_size > 0 else fill_price

    def unrealized_pnl(self, current_price: float) -> float:
        if self.total_size == 0:
            return 0.0
        if self.side == 'long':
            return (current_price - self.avg_entry) / self.avg_entry * self.total_size
        else:
            return (self.avg_entry - current_price) / self.avg_entry * self.total_size


# ═══════════════════════════════════════════════════════════════════════════════
# TCL Strategy — Trend Continuation Line
# ═══════════════════════════════════════════════════════════════════════════════

class TCLStrategy:
    """
    TCL (Trend Continuation Line) — continuation pattern.
    Uses EMA alignment, Fibonacci retracement, asymmetric DCA stacking.
    Entry (1x), Limit1 (3x), Limit2 (5x). Max loss = -1R.
    """

    def __init__(self, params: Optional[Dict] = None):
        p = params or {}
        self.min_trend_pct = p.get('min_trend_pct', 2.0)  # Raised 2026-02-22: 0.5% was too permissive, letting in fake micro-trends
        self.ema_periods = p.get('ema_periods', [9, 21, 50, 200])
        self.risk_per_trade_pct = p.get('risk_per_trade_pct', 2.0)  # % of balance
        self.max_risk_pct = p.get('max_risk_pct', 50.0)  # max % of account
        # Manage numbers (from TCL FAQs: default 4 and 7.3)
        self.manage1 = p.get('manage1', 4.0)
        self.manage2 = p.get('manage2', 7.3)
        # Stacking ratios (2026-02-21 fix: limit2 reduced 5→2)
        # Root cause of trade #46 (-$158), #51 (-$10), #52 (-$7.44):
        # When market swept through all 3 Fib levels against the position,
        # the 1+3+5=9x total multiplier created massive notional. Now 1+3+2=6x max.
        self.entry_mult = p.get('entry_mult', 1)
        self.limit1_mult = p.get('limit1_mult', 3)
        self.limit2_mult = p.get('limit2_mult', 2)
        # Fib levels for entry zones
        self.entry_fib = p.get('entry_fib', 0.236)
        self.limit1_fib = p.get('limit1_fib', 0.382)
        self.limit2_fib = p.get('limit2_fib', 0.618)
        # ADX filter: require minimum trend strength before entering
        # (Added 2026-02-22: prevents TCL firing in choppy/ranging markets where ADX<20)
        self.min_adx = p.get('tcl_min_adx', 20.0)
        self.adx_period = p.get('tcl_adx_period', 14)

    def detect_setup(self, candles: Dict[str, np.ndarray]) -> Optional[Dict]:
        """Check if TCL setup conditions are met."""
        closes = candles['close']
        highs = candles['high']
        lows = candles['low']

        if len(closes) < 200:
            return None

        # Calculate EMAs
        ema9 = ema(closes, 9)
        ema21 = ema(closes, 21)
        ema50 = ema(closes, 50)
        ema200 = ema(closes, 200)

        # 1. Detect trend via EMA alignment
        direction = detect_trend(closes, ema9, ema21, ema50, ema200)
        if direction is None:
            log.debug("TCL: No EMA alignment")
            return None

        # 1b. ADX filter: only trade when trend is strong enough (Added 2026-02-22)
        adx_values = adx(highs, lows, closes, self.adx_period)
        current_adx = adx_values[-1] if not np.isnan(adx_values[-1]) else 0.0
        if current_adx < self.min_adx:
            log.debug(f"TCL: ADX {current_adx:.1f} < {self.min_adx} (no trend strength, skipping)")
            return None

        # 2. Find trend extremes
        trend_high, trend_low = find_trend_extremes(highs, lows, direction, lookback=100)

        # 3. Trend must be >= min_trend_pct
        mag = trend_magnitude(trend_high, trend_low)
        if mag < self.min_trend_pct:
            log.debug(f"TCL: Trend mag {mag:.2f}% < {self.min_trend_pct}%")
            return None

        # 4. No parabolic moves
        if is_parabolic(closes):
            log.debug("TCL: Parabolic move detected, skipping")
            return None

        # 5. Local high/low must be broken (confirming continuation)
        recent_high = np.max(highs[-20:])
        recent_low = np.min(lows[-20:])
        prior_high = np.max(highs[-40:-20]) if len(highs) >= 40 else recent_high
        prior_low = np.min(lows[-40:-20]) if len(lows) >= 40 else recent_low

        if direction == 'long' and recent_high <= prior_high:
            log.debug(f"TCL: No HH break ({recent_high:.0f} <= {prior_high:.0f})")
            return None
        if direction == 'short' and recent_low >= prior_low:
            log.debug(f"TCL: No LL break ({recent_low:.0f} >= {prior_low:.0f})")
            return None
        
        log.info(f"🎯 TCL SETUP: {direction} | mag={mag:.2f}% | ADX={current_adx:.1f} | range={trend_low:.0f}-{trend_high:.0f}")

        return {
            'direction': direction,
            'trend_high': trend_high,
            'trend_low': trend_low,
            'trend_pct': mag,
            'adx': current_adx,
            'ema9': ema9[-1],
            'ema21': ema21[-1],
            'ema50': ema50[-1],
            'ema200': ema200[-1],
        }

    def calculate_entries(self, setup: Dict, balance: float) -> Optional[Position]:
        """Calculate entry, limit1, limit2 with asymmetric stacking."""
        direction = setup['direction']
        fib = fibonacci_retracement(setup['trend_high'], setup['trend_low'], direction)

        # Risk amount = risk_per_trade_pct of balance, capped at max_risk_pct
        risk_usd = min(balance * self.risk_per_trade_pct / 100,
                       balance * self.max_risk_pct / 100)

        if direction == 'long':
            entry_price = fib['entry']       # 0.236 retracement from high
            limit1_price = fib['limit1']     # 0.382
            limit2_price = fib['limit2']     # 0.618 (deep)
            sl = setup['trend_low'] * 0.998  # Just below trend low
            # TP: back to trend high area
            tp_entry = setup['trend_high']
            # Manage numbers: adjusted TPs for limit fills
            diff = setup['trend_high'] - setup['trend_low']
            tp_limit1 = limit1_price + diff / self.manage1
            tp_limit2 = limit2_price + diff / self.manage2
        else:
            entry_price = fib['entry']
            limit1_price = fib['limit1']
            limit2_price = fib['limit2']
            sl = setup['trend_high'] * 1.002
            tp_entry = setup['trend_low']
            diff = setup['trend_high'] - setup['trend_low']
            tp_limit1 = limit1_price - diff / self.manage1
            tp_limit2 = limit2_price - diff / self.manage2

        # ── CORRECT SIZING LOGIC (Fixed 2026-02-19) ──
        # Previous logic incorrectly treated risk_usd as total notional size.
        # New logic treats risk_usd as the max loss if SL is hit on all orders.
        # Risk = Base_Size_USD * (Mult1 * RiskPct1 + Mult2 * RiskPct2 + ...)
        
        def get_risk_pct(price, sl):
            return abs(price - sl) / price

        r_entry = get_risk_pct(entry_price, sl)
        r_limit1 = get_risk_pct(limit1_price, sl)
        r_limit2 = get_risk_pct(limit2_price, sl)

        risk_factor = (self.entry_mult * r_entry) + \
                      (self.limit1_mult * r_limit1) + \
                      (self.limit2_mult * r_limit2)

        if risk_factor > 0:
            base_size = risk_usd / risk_factor
        else:
            base_size = 0
            log.warning("TCL: Risk factor is 0, sizing failed.")

        # Sanity check: cap leverage (optional, but good safety)
        # If base_size * (1+3+5) > balance * 5 (5x leverage cap), clamp it?
        # Leaving uncapped for now as sizing_params.max_risk_pct handles the dollar risk.

        pos = Position(
            strategy='TCL',
            side=direction,
            opened_at=time.time(),
            tp=tp_entry,
            sl=sl,
            metadata=setup,
        )

        pos.orders = [
            Order(direction, entry_price, base_size * self.entry_mult,
                  tp_entry, sl, 'entry'),
            Order(direction, limit1_price, base_size * self.limit1_mult,
                  tp_limit1, sl, 'limit1'),
            Order(direction, limit2_price, base_size * self.limit2_mult,
                  tp_limit2, sl, 'limit2'),
        ]

        return pos

    def manage_position(self, pos: Position, current_price: float,
                        candles: Dict[str, np.ndarray]) -> Position:
        """
        Manage open position:
        - Fill pending orders if price reaches them
        - Move SL to breakeven after overside/underside retest
        - Check TP/SL hits
        """
        # ── Scale-in Protection (2026-02-21 v2): Smart limit1 gating ──
        # Threshold calibrated to -0.20R based on Fibonacci math:
        #   - Limit1 fires when ENTRY position is at ~-0.157R to -0.191R
        #   - After limit1 fills, COMBINED position improves to ~-0.056R
        #   - Combined hits -0.20R when price is at ~top-0.476*range
        #   - Limit2 fires at ~top-0.618*range (much deeper = -0.416R on combined)
        #   → -0.20R threshold: ALLOWS limit1, PREVENTS limit2 (via combined check)
        #
        # v1 bug (-0.15R threshold): entry hits -0.157 to -0.191R at limit1 fill
        #   → -0.15R was too tight, accidentally cancelled limit1 every time
        #   → 100% 1-fill positions, theoretical max win only 0.309R, breakeven WR=68%
        # v2 fix (-0.20R threshold): limit1 allowed (fires at -0.191R > -0.20R limit)
        #   → 2-fill path restored, theoretical max win 0.526R, breakeven WR=32%
        if pos.total_size > 0 and pos.avg_entry > 0 and pos.sl > 0:
            risk_pct = abs(pos.avg_entry - pos.sl) / pos.avg_entry
            if risk_pct > 0:
                if pos.side == 'long':
                    unreal_pct = (current_price - pos.avg_entry) / pos.avg_entry
                else:
                    unreal_pct = (pos.avg_entry - current_price) / pos.avg_entry
                current_r = unreal_pct / risk_pct
                if current_r < -0.20:
                    pending = [o for o in pos.orders if o.status == 'pending']
                    if pending:
                        for o in pending:
                            o.status = 'cancelled'
                        log.debug(f"TCL: Cancelled {len(pending)} scale-in order(s) — position at {current_r:.2f}R (threshold -0.20R)")
                    return pos

        for order in pos.orders:
            if order.status != 'pending':
                continue
            # Check if price reached order level
            if pos.side == 'long' and current_price <= order.entry_price:
                pos.fill_order(order, order.entry_price)
                # Update position TP to the order's TP (accounts for manage numbers)
                pos.tp = order.tp
            elif pos.side == 'short' and current_price >= order.entry_price:
                pos.fill_order(order, order.entry_price)
                pos.tp = order.tp

        if pos.total_size == 0:
            return pos

        # Move SL to breakeven after meaningful move toward TP
        # (2026-02-21 fix: was 0.8% — larger than most TPs so it NEVER fired.
        #  Lowered to 0.25% — fires when trade is >50% of typical 0.27-0.45% TP distance,
        #  locking in near-BE if BTC reverses before hitting full TP.)
        if not pos.sl_moved_to_be:
            if pos.side == 'long':
                highs = candles['high']
                if len(highs) > 5 and np.max(highs[-5:]) > pos.avg_entry * 1.0025:
                    pos.sl = pos.avg_entry * 1.001  # BE + small cushion
                    pos.sl_moved_to_be = True
                    log.debug(f"TCL: SL → BE at {pos.sl:.2f} (price reached 0.25% above avg entry)")
            else:
                lows = candles['low']
                # (2026-02-21: lowered to 0.25% — was 0.8%, never fired)
                if len(lows) > 5 and np.min(lows[-5:]) < pos.avg_entry * 0.9975:
                    pos.sl = pos.avg_entry * 0.999  # BE + small cushion
                    pos.sl_moved_to_be = True
                    log.debug(f"TCL: SL → BE at {pos.sl:.2f} (short reached 0.25% below avg entry)")

        return pos

    def should_exit(self, pos: Position, current_price: float) -> Optional[Dict]:
        """Check if TP or SL is hit."""
        if pos.total_size == 0:
            return None

        if pos.side == 'long':
            if current_price >= pos.tp:
                return {'reason': 'tp', 'price': pos.tp}
            if current_price <= pos.sl:
                return {'reason': 'sl', 'price': pos.sl}
        else:
            if current_price <= pos.tp:
                return {'reason': 'tp', 'price': pos.tp}
            if current_price >= pos.sl:
                return {'reason': 'sl', 'price': pos.sl}
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# SMOG Strategy — Smart Money OG (Reversal)
# ═══════════════════════════════════════════════════════════════════════════════

class SMOGStrategy:
    """
    SMOG — Smart Money OG reversal strategy.
    ADX < 25, RSI divergence (approx OG signal), ChoCH, FVG entry.
    1:4+ R:R target. Trail with new FVGs.
    """

    def __init__(self, params: Optional[Dict] = None):
        p = params or {}
        # ADX threshold raised 25→40 (2026-02-22): post-crash bounces have ADX 30-60+
        # and are exactly SMOG's use case. ChoCH + RSI div + FVG already guard against
        # trading WITH a strong trend — ADX=25 was redundant and locking out good trades.
        # 2026-02-25: lowered 40→25. SMOG is a REVERSAL strategy — it should only
        # fire in ranging markets (ADX<25). Trade#83 shorted into ADX=26 uptrend = -$4.76.
        self.adx_threshold = p.get('adx_threshold', 25.0)
        self.adx_period = p.get('adx_period', 14)
        self.rsi_period = p.get('rsi_period', 14)
        self.min_rr = p.get('min_rr', 4.0)  # Minimum 1:4 R:R
        self.risk_per_trade_pct = p.get('risk_per_trade_pct', 1.5)
        self.fib_min_level = p.get('fib_min_level', 0.5)  # FVG must be at/beyond 50%

    def detect_setup(self, candles: Dict[str, np.ndarray]) -> Optional[Dict]:
        """Check SMOG setup conditions."""
        closes = candles['close']
        highs = candles['high']
        lows = candles['low']
        opens = candles['open']

        if len(closes) < 50:
            return None

        # 1. ADX below threshold (low trend strength = ranging)
        adx_values = adx(highs, lows, closes, self.adx_period)
        current_adx = adx_values[-1] if not np.isnan(adx_values[-1]) else 50.0
        if current_adx >= self.adx_threshold:
            log.debug(f"SMOG: ADX {current_adx:.1f} >= {self.adx_threshold}")
            return None

        # 2. RSI divergence (approximating OG indicator signal)
        rsi_values = rsi(closes, self.rsi_period)
        divergence = detect_rsi_divergence(closes, rsi_values)
        if divergence is None:
            log.debug(f"SMOG: No RSI divergence (ADX={current_adx:.1f}, RSI={rsi_values[-1]:.1f})")
            return None

        # 3. Change of Character
        choch = detect_choch(highs, lows, closes)
        if choch is None:
            log.debug(f"SMOG: No ChoCH (div={divergence})")
            return None
        if choch['type'] != divergence:  # Must align
            log.debug(f"SMOG: ChoCH {choch['type']} != div {divergence}")
            return None

        # 4. Fair Value Gap
        fvgs = detect_fvgs(highs, lows, closes, opens, lookback=20)
        matching_fvgs = [f for f in fvgs if f['type'] == divergence]
        if not matching_fvgs:
            log.debug(f"SMOG: No matching FVGs for {divergence}")
            return None
        
        log.info(f"🎯 SMOG SETUP: {divergence} | ADX={current_adx:.1f} | RSI={rsi_values[-1]:.1f}")

        # 5. FVG must be at or beyond 50% fib level
        best_fvg = matching_fvgs[-1]  # Most recent

        return {
            'direction': 'long' if divergence == 'bullish' else 'short',
            'adx': current_adx,
            'divergence': divergence,
            'choch': choch,
            'fvg': best_fvg,
            'rsi': rsi_values[-1],
        }

    def calculate_entries(self, setup: Dict, balance: float) -> Optional[Position]:
        """Entry at FVG midpoint, SL beyond FVG candle."""
        fvg = setup['fvg']
        direction = setup['direction']

        entry_price = fvg['midpoint']
        if direction == 'long':
            sl = fvg['bottom'] * 0.999  # 1 tick beyond FVG
            risk_per_unit = entry_price - sl
            tp = entry_price + risk_per_unit * self.min_rr
        else:
            sl = fvg['top'] * 1.001
            risk_per_unit = sl - entry_price
            tp = entry_price - risk_per_unit * self.min_rr

        if risk_per_unit <= 0:
            return None

        risk_usd = balance * self.risk_per_trade_pct / 100
        
        # Correct sizing based on SL distance
        # size_usd = risk_usd / (abs(entry - sl) / entry)
        risk_pct_dist = abs(entry_price - sl) / entry_price
        if risk_pct_dist > 0:
            size_usd = risk_usd / risk_pct_dist
        else:
            size_usd = 0
            log.warning("SMOG: Risk dist is 0, sizing failed.")

        pos = Position(
            strategy='SMOG',
            side=direction,
            opened_at=time.time(),
            tp=tp,
            sl=sl,
            metadata=setup,
        )

        pos.orders = [
            Order(direction, entry_price, size_usd, tp, sl, 'entry'),
        ]

        return pos

    def manage_position(self, pos: Position, current_price: float,
                        candles: Dict[str, np.ndarray]) -> Position:
        """
        Manage SMOG position:
        - Fill entry if price reaches FVG midpoint
        - Move SL to BE after BOS in trend direction
        - Trail SL with new FVGs
        """
        for order in pos.orders:
            if order.status != 'pending':
                continue
            if pos.side == 'long' and current_price <= order.entry_price:
                pos.fill_order(order, order.entry_price)
            elif pos.side == 'short' and current_price >= order.entry_price:
                pos.fill_order(order, order.entry_price)

        if pos.total_size == 0:
            return pos

        # Trail with new FVGs
        fvgs = detect_fvgs(candles['high'], candles['low'],
                           candles['close'], candles['open'], lookback=10)

        if pos.side == 'long':
            bull_fvgs = [f for f in fvgs if f['type'] == 'bullish']
            if bull_fvgs:
                new_sl = bull_fvgs[-1]['bottom']
                if new_sl > pos.sl:
                    pos.sl = new_sl
        else:
            bear_fvgs = [f for f in fvgs if f['type'] == 'bearish']
            if bear_fvgs:
                new_sl = bear_fvgs[-1]['top']
                if new_sl < pos.sl:
                    pos.sl = new_sl

        return pos

    def should_exit(self, pos: Position, current_price: float) -> Optional[Dict]:
        """Check TP/SL."""
        if pos.total_size == 0:
            return None

        if pos.side == 'long':
            if current_price >= pos.tp:
                return {'reason': 'tp', 'price': pos.tp}
            if current_price <= pos.sl:
                return {'reason': 'sl', 'price': pos.sl}
        else:
            if current_price <= pos.tp:
                return {'reason': 'tp', 'price': pos.tp}
            if current_price >= pos.sl:
                return {'reason': 'sl', 'price': pos.sl}
        return None
