import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { bridge } from '../api/bridge';

interface XTerminalProps {
  terminalId: string;
  onTerminalReady?: (terminalId: string) => void;
  onTerminalClose?: (terminalId: string) => void;
}

// Detect Electron IPC mode: window.astraAPI.terminal is exposed by the preload script
const isElectronTerminal = typeof window !== 'undefined' && !!window.astraAPI?.terminal;

const XTERM_THEME = {
  background: '#1e1e1e',
  foreground: '#cccccc',
  cursor: '#cccccc',
  cursorAccent: '#1e1e1e',
  selection: '#264f78',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#e5e5e5',
};

const XTerminal: React.FC<XTerminalProps> = ({ terminalId, onTerminalReady, onTerminalClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // ── Core terminal setup ────────────────────────────────────────────────────
  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: XTERM_THEME,
      allowTransparency: false,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    let cleanup: () => void;

    if (isElectronTerminal) {
      // ── Electron / IPC mode ────────────────────────────────────────────────
      const api = window.astraAPI.terminal!;

      // Forward xterm.js keystrokes → PTY
      const dataDisposable = terminal.onData((data) => {
        api.write(terminalId, data);
      });

      // Receive PTY output → xterm.js
      const unsubData = api.onData((payload) => {
        if (payload.terminalId === terminalId && terminalInstanceRef.current) {
          terminalInstanceRef.current.write(payload.data);
        }
      });

      // Notify renderer when PTY exits
      const unsubExit = api.onExit((payload) => {
        if (payload.terminalId === terminalId && terminalInstanceRef.current) {
          terminalInstanceRef.current.write(
            `\r\n\x1b[33m[Process exited with code ${payload.exitCode}]\x1b[0m\r\n`
          );
        }
      });

      // Resize handler
      const handleResize = () => {
        if (fitAddonRef.current && terminalInstanceRef.current) {
          fitAddonRef.current.fit();
          const { cols, rows } = terminalInstanceRef.current;
          api.resize(terminalId, cols, rows);
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      // Spawn the PTY
      api.create(terminalId);
      onTerminalReady?.(terminalId);

      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        dataDisposable.dispose();
        unsubData();
        unsubExit();
        api.close(terminalId);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose();
          terminalInstanceRef.current = null;
        }
        onTerminalClose?.(terminalId);
      };
    } else {
      // ── Web / Socket.io mode ───────────────────────────────────────────────
      const sock = bridge.getSocket();

      const dataDisposable = terminal.onData((data) => {
        sock?.emit('terminal:input', { terminalId, data });
      });

      const handleResize = () => {
        if (fitAddonRef.current && terminalInstanceRef.current) {
          fitAddonRef.current.fit();
          const { cols, rows } = terminalInstanceRef.current;
          sock?.emit('terminal:resize', { terminalId, cols, rows });
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      const handleTerminalOutput = (data: { terminalId: string; output: string }) => {
        if (data.terminalId === terminalId && terminalInstanceRef.current) {
          terminalInstanceRef.current.write(data.output);
        }
      };

      sock?.on('terminal:output', handleTerminalOutput);
      sock?.emit('terminal:create', { terminalId });
      onTerminalReady?.(terminalId);

      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        dataDisposable.dispose();
        sock?.off('terminal:output', handleTerminalOutput);
        sock?.emit('terminal:close', { terminalId });
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose();
          terminalInstanceRef.current = null;
        }
        onTerminalClose?.(terminalId);
      };
    }

    return cleanup;
  }, [terminalId, onTerminalReady, onTerminalClose]);

  // ── ResizeObserver for container size changes ─────────────────────────────
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (fitAddonRef.current && terminalInstanceRef.current) {
          fitAddonRef.current.fit();
        }
      }, 100);
    });

    if (terminalRef.current) {
      observer.observe(terminalRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full bg-[#1e1e1e] overflow-hidden"
      style={{ minHeight: '200px' }}
    />
  );
};

export default XTerminal;
