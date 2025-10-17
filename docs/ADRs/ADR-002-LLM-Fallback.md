---
title: ADR-002: LLM Fallback Strategy
status: Accepted
decision_date: 2025-10-17
---

## Context
LLM chaining can fail due to rate limits or hallucinations; need reliable fallback for consensus gen.

## Decision
Implement hybrid LLM + classical quantum sim fallback in projectIgnition.

## Consequences
Pros: Faster decisions, robust; Cons: Sim approx not exact; Status: Implemented in Phase 3.
