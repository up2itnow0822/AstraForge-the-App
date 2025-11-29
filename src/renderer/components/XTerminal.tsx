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

const XTerminal: React.FC<XTerminalProps> = ({ terminalId, onTerminalReady, onTerminalClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js terminal
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
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
      },
      allowTransparency: false,
      scrollback: 1000,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal in DOM
    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Handle terminal input
    terminal.onData((data) => {
      // Send input to server
      bridge.socket?.emit('terminal:input', { terminalId, data });
    });

    // Handle terminal resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        const dimensions = terminalInstanceRef.current?.cols && terminalInstanceRef.current?.rows
          ? { cols: terminalInstanceRef.current.cols, rows: terminalInstanceRef.current.rows }
          : { cols: 80, rows: 24 };

        bridge.socket?.emit('terminal:resize', { terminalId, ...dimensions });
      }
    };

    // Initial resize
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);

    // Listen for server output
    const handleTerminalOutput = (data: { terminalId: string; output: string }) => {
      if (data.terminalId === terminalId && terminalInstanceRef.current) {
        terminalInstanceRef.current.write(data.output);
      }
    };

    bridge.socket?.on('terminal:output', handleTerminalOutput);

    // Create the terminal session on server
    bridge.socket?.emit('terminal:create', { terminalId });

    // Notify parent component
    onTerminalReady?.(terminalId);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      bridge.socket?.off('terminal:output', handleTerminalOutput);

      // Close terminal session on server
      bridge.socket?.emit('terminal:close', { terminalId });

      // Dispose terminal
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }

      onTerminalClose?.(terminalId);
    };
  }, [terminalId, onTerminalReady, onTerminalClose]);

  // Handle resize when container changes
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && terminalInstanceRef.current) {
        fitAddonRef.current.fit();
      }
    };

    // Debounced resize
    let timeoutId: NodeJS.Timeout;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
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
