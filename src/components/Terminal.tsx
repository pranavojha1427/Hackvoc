"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { useAuth } from "@/context/AuthContext";

interface TerminalProps {
  onCommandRun?: (cmd: string) => void;
  autoRunCommand?: string | null;
  onAutoRunComplete?: () => void;
}

export default function Terminal({ onCommandRun, autoRunCommand, onAutoRunComplete }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { user } = useAuth();
  
  const [cwd, setCwd] = useState("/");
  const [isBusy, setIsBusy] = useState(false);
  
  // Keep track of the current input line
  const inputBuffer = useRef("");

  const writePrompt = (term: XTerm, currentDir: string) => {
    // Format: PS C:\workspace\user>
    const dir = currentDir === "/" ? "" : currentDir.replace(/\//g, '\\');
    term.write(`\r\n\x1b[32mPS C:\\practice_workspace\\${user?.uid}${dir}>\x1b[0m `);
  };

  const executeCommand = async (cmd: string, term: XTerm) => {
    if (!cmd.trim()) {
        writePrompt(term, cwd);
        return;
    }

    setIsBusy(true);
    term.write('\r\n');

    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.uid, command: cmd, cwd }),
      });
      const data = await res.json();

      if (data.output) {
        term.write(data.output);
      }
      
      if (data.cwd !== undefined) {
          setCwd(data.cwd);
          writePrompt(term, data.cwd);
      } else {
          writePrompt(term, cwd);
      }
      
      if (onCommandRun) onCommandRun(cmd);
      
    } catch (error) {
      term.write(`\r\n\x1b[31mError connecting to terminal backend\x1b[0m`);
      writePrompt(term, cwd);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    if (!terminalRef.current || !user) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: "#0a0a0f",
        foreground: "#d4d4d4",
        cursor: "#a855f7",
      },
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize: 14,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    let resizeObserver: ResizeObserver | null = null;
    let initTimeout: NodeJS.Timeout;

    // Helper to safely call fit
    const tryFit = () => {
        if (!fitAddonRef.current || !terminalRef.current) return;
        if (terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
            try {
                fitAddonRef.current.fit();
            } catch (e) {
                console.warn('FitAddon error:', e);
            }
        }
    };

    // Delay open to ensure DOM is fully painted
    initTimeout = setTimeout(() => {
        if (!terminalRef.current) return;
        
        try {
            term.open(terminalRef.current);
            setTimeout(tryFit, 50);

            xtermRef.current = term;
            fitAddonRef.current = fitAddon;

            term.writeln("Welcome to the AI Learning Platform Terminal");
            term.writeln("Type your commands here.");
            writePrompt(term, cwd);
            
            resizeObserver = new ResizeObserver(() => {
                setTimeout(tryFit, 50);
            });
            resizeObserver.observe(terminalRef.current);
        } catch (e) {
            console.error("Error opening terminal:", e);
        }
    }, 100);

    term.onData((data) => {
      if (isBusy) return;
      const char = data;
      // Enter
      if (char === '\r') {
        const cmd = inputBuffer.current;
        inputBuffer.current = "";
        executeCommand(cmd, term);
      } 
      // Backspace
      else if (char === '\x7F') {
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write('\b \b');
        }
      } 
      // Printable characters
      else if (char >= String.fromCharCode(0x20) && char <= String.fromCharCode(0x7E)) {
        inputBuffer.current += char;
        term.write(char);
      }
    });

    return () => {
      clearTimeout(initTimeout);
      if (resizeObserver) resizeObserver.disconnect();
      term.dispose();
    };
  }, [user]);

  // Handle auto-run from parent
  useEffect(() => {
      if (autoRunCommand && xtermRef.current && !isBusy) {
          xtermRef.current.write(autoRunCommand);
          executeCommand(autoRunCommand, xtermRef.current).then(() => {
             if (onAutoRunComplete) onAutoRunComplete(); 
          });
      }
  }, [autoRunCommand]);

  return (
    <div className="w-full h-full p-2 bg-[#0a0a0f] relative">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
