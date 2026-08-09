"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { ArrowLeft, Play, Bug, FileCode, Folder, ChevronDown, ChevronRight, TerminalSquare, Loader2, FileCode2, FolderOpen, Plus, FolderPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";

const Terminal = dynamic(() => import("@/components/Terminal"), {
  ssr: false,
});

type FileNode = {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
};

const EXTENSION_MAP: Record<string, string> = {
  py: "python",
  js: "javascript",
  jsx: "javascript",
  cpp: "cpp",
  c: "c",
  java: "java",
  cs: "csharp",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown"
};

export default function PracticeMode() {
  const { user } = useAuth();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  
  const [output, setOutput] = useState("Terminal ready...\n");
  const [isRunning, setIsRunning] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [previewContent, setPreviewContent] = useState("");
  const [autoRunCmd, setAutoRunCmd] = useState<string | null>(null);

  const [isDebugging, setIsDebugging] = useState(false);
  const [debugContext, setDebugContext] = useState("");
  const [debugResult, setDebugResult] = useState("");
  const [isWaitingDebug, setIsWaitingDebug] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]));

  useEffect(() => {
    if (user) {
      fetchFileTree();
    }
  }, [user]);

  const fetchFileTree = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/fs?userId=${user.uid}&t=${Date.now()}`);
      const data = await res.json();
      if (data.tree) setFileTree(data.tree);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) newExpanded.delete(path);
    else newExpanded.add(path);
    setExpandedFolders(newExpanded);
  };

  const handleOpenFile = async (node: FileNode) => {
    if (!user) return;
    if (node.type === "directory") {
      toggleFolder(node.path);
      return;
    }
    
    setActiveFile(node.path);

    if (typeof fileContents[node.path] === "undefined") {
      try {
        const res = await fetch(`/api/fs?userId=${user.uid}&action=readfile&path=${encodeURIComponent(node.path)}&t=${Date.now()}`);
        const data = await res.json();
        setFileContents(prev => ({ ...prev, [node.path]: data.content || "" }));
      } catch (e) {
        console.error(e);
      }
    }
    setPreviewContent("");
  };

  const handleCodeChange = (val: string | undefined) => {
    if (!activeFile) return;
    setFileContents(prev => ({ ...prev, [activeFile]: val || "" }));
  };

  const handleSave = async () => {
    if (!activeFile || !user) return;
    try {
      await fetch("/api/fs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, action: "writefile", path: activeFile, content: fileContents[activeFile] })
      });
      setOutput(prev => prev + `\n[Saved ${activeFile}]\n`);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [activeFile, fileContents]);

  const handleRunCode = async () => {
    if (!activeFile) return;
    const code = fileContents[activeFile];
    const ext = activeFile.split('.').pop() || "";
    let language = "python";
    if (ext === "js" || ext === "jsx") language = "javascript";
    if (ext === "c") language = "c";
    if (ext === "cpp") language = "cpp";
    if (ext === "cs") language = "csharp";
    if (ext === "java") language = "java";
    if (ext === "html") language = "html";

    if (language === "html" || (ext === "jsx")) {
      setIsTerminalOpen(true);
      if (language === "html") {
        setPreviewContent(code);
      } else {
        const html = `<!DOCTYPE html><html><head><script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head><body><div id="root"></div><script type="text/babel" data-type="module">${code}</script></body></html>`;
        setPreviewContent(html);
      }
      return;
    }

    setIsRunning(true);
    setIsTerminalOpen(true);
    setPreviewContent("");
    
    // Auto-save before run
    await handleSave();

    // Generate command based on language
    const fullPath = activeFile.startsWith('/') ? activeFile.substring(1) : activeFile;
    const parts = fullPath.split('/');
    const filename = parts.pop() || "";
    const folderPath = parts.join('/');
    const filenameNoExt = filename.substring(0, filename.lastIndexOf('.'));
    
    const cdCmd = folderPath ? `cd ${folderPath}; ` : "";
    
    let cmd = "";
    if (language === "python") cmd = `${cdCmd}python ${filename}`;
    else if (language === "javascript") cmd = `${cdCmd}node ${filename}`;
    else if (language === "c") cmd = `${cdCmd}gcc ${filename} -o program.exe; ./program.exe`;
    else if (language === "cpp") cmd = `${cdCmd}g++ ${filename} -o program.exe; ./program.exe`;
    else if (language === "java") cmd = `${cdCmd}javac ${filename}; java ${filenameNoExt}`;
    else if (language === "csharp") cmd = `${cdCmd}csc ${filename}; .\\${filenameNoExt}.exe`;
    
    if (cmd) {
        setAutoRunCmd(cmd);
    }
    
    setIsRunning(false);
  };

  const handleDebug = async () => {
    if (!activeFile || !debugContext) return;
    const ext = activeFile.split('.').pop() || "";
    const language = EXTENSION_MAP[ext] || "javascript";

    setIsWaitingDebug(true);
    try {
      const res = await fetch("/api/debugger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fileContents[activeFile], language, context: debugContext }),
      });
      const data = await res.json();
      setDebugResult(data.result);
    } catch (err) {
      setDebugResult("Failed to reach AI debugger.");
    } finally {
      setIsWaitingDebug(false);
    }
  };

  const createFile = async () => {
    if (!user) return;
    const name = prompt("Enter file name (e.g. src/main.c or main.c):");
    if (!name) return;
    try {
      await fetch("/api/fs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, action: "writefile", path: `/${name}`, content: "" })
      });
      fetchFileTree();
      handleOpenFile({ name: name.split('/').pop() || name, path: `/${name}`, type: "file" });
    } catch (e) {
      console.error(e);
    }
  };

  const createFolder = async () => {
    if (!user) return;
    const name = prompt("Enter folder name (e.g. src or utils/math):");
    if (!name) return;
    try {
      await fetch("/api/fs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, action: "mkdir", path: `/${name}` })
      });
      fetchFileTree();
      toggleFolder(`/${name}`);
    } catch (e) {
      console.error(e);
    }
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      return (
        <div key={node.path} style={{ paddingLeft: `${depth * 12}px` }}>
          <div 
            onClick={() => handleOpenFile(node)}
            className={`flex items-center gap-2 py-2 px-2 hover:bg-white/5 rounded cursor-pointer text-sm transition ${activeFile === node.path ? 'bg-[#00e5ff]/10 text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.1)] border border-[#00e5ff]/20' : 'text-gray-400'}`}
          >
            {node.type === "directory" ? (
              <>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <FolderOpen size={16} />
              </>
            ) : (
              <>
                <div className="w-[14px]"></div>
                <FileCode2 size={16} />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </div>
          {node.type === "directory" && isExpanded && node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  const getActiveLanguage = () => {
    if (!activeFile) return "plaintext";
    const ext = activeFile.split('.').pop() || "";
    return EXTENSION_MAP[ext] || "plaintext";
  };

  if (!user) {
    return (
      <div className="flex h-screen bg-[#050B14] items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#00e5ff] mb-4" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050B14] text-gray-300 overflow-hidden font-sans relative">
      
      {/* Dynamic Space Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#00e5ff]/5 blur-[200px]"></div>
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen"></div>
      </div>

      {/* Sidebar */}
      <motion.div 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-16 md:w-64 border-r border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col shrink-0 py-4 relative z-10 shadow-[2px_0_20px_rgba(0,229,255,0.02)]"
      >
        <Link href="/" className="px-4 mb-6 flex items-center justify-center md:justify-start gap-2 hover:text-[#00e5ff] transition">
          <ArrowLeft size={20} />
          <span className="hidden md:inline font-bold text-lg">Exit</span>
        </Link>
        
        <div className="px-4 mb-4 hidden md:flex items-center justify-between">
          <h2 className="text-xs uppercase font-bold text-gray-500">Explorer</h2>
          <div className="flex gap-2">
              <button onClick={createFile} className="text-gray-500 hover:text-white transition" title="New File">
                <Plus size={16} />
              </button>
              <button onClick={createFolder} className="text-gray-500 hover:text-white transition" title="New Folder">
                <FolderPlus size={16} />
              </button>
          </div>
        </div>
        
        <div className="flex flex-col flex-grow overflow-y-auto px-2 md:px-4">
          {renderTree(fileTree)}
        </div>
      </motion.div>

      {/* Main Workspace */}
      <div className="flex-grow flex flex-col min-w-0 relative z-10">
        
        {/* Toolbar */}
        <div className="h-14 border-b border-white/10 bg-white/[0.02] backdrop-blur-md flex items-center justify-between px-4 shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-[#00e5ff] px-3 py-1 bg-[#00e5ff]/10 rounded border border-[#00e5ff]/20 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
              {activeFile ? activeFile.split('/').pop() : "No file selected"}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition ${
                isTerminalOpen ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]" : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
            >
              <TerminalSquare size={16} /> Terminal
            </button>
            <button 
              onClick={() => setIsDebugging(!isDebugging)}
              className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition ${
                isDebugging ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
            >
              <Bug size={16} /> Debug
            </button>
            <button 
              onClick={handleRunCode}
              disabled={isRunning || !activeFile}
              className="bg-[#00e5ff] hover:bg-cyan-400 disabled:opacity-50 text-[#050B14] px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)] transition"
            >
              <Play size={16} fill="currentColor" /> {isRunning ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-grow flex flex-col md:flex-row relative min-h-0">
          
          {/* Code Editor */}
          <div className="flex-grow h-[60%] md:h-full relative border-b md:border-b-0 md:border-r border-white/10 min-w-0 bg-[#050B14]">
            {activeFile ? (
              <Editor
                height="100%"
                language={getActiveLanguage()}
                theme="vs-dark"
                value={fileContents[activeFile] || ""}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500 text-sm">
                Select or create a file in the Explorer to start coding.
              </div>
            )}
          </div>

          {/* AI Debugger Panel */}
          <AnimatePresence>
            {isDebugging && (
              <motion.div 
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="w-full md:w-80 shrink-0 bg-white/[0.02] backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl absolute md:relative right-0 top-0 h-full z-20"
              >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#050B14]/50">
                <h3 className="font-bold flex items-center gap-2 text-purple-400">
                  <Bug size={18} /> AI Debugger
                </h3>
                <button onClick={() => setIsDebugging(false)} className="text-gray-500 hover:text-white">&times;</button>
              </div>
              <div className="flex-grow p-4 overflow-y-auto custom-scrollbar text-sm text-gray-300">
                <p className="mb-4">Describe what this code is supposed to do, and I'll find the bugs for you.</p>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:outline-none focus:border-purple-500/50 backdrop-blur-md h-24 resize-none mb-4"
                  placeholder="E.g. I am trying to reverse a string but it returns undefined..."
                  value={debugContext}
                  onChange={(e) => setDebugContext(e.target.value)}
                />
                <button 
                  onClick={handleDebug}
                  disabled={isWaitingDebug || (!debugContext && !debugResult)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-md font-medium disabled:opacity-50 transition mb-6"
                >
                  {isWaitingDebug ? "Analyzing Code..." : "Analyze Code"}
                </button>
                
                {debugResult && (
                  <div className="p-4 bg-gray-900 rounded-lg border border-purple-500/30 shadow-inner">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Bug size={14}/> Analysis:</h4>
                    <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{debugResult}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
        
        {/* Terminal Area */}
        <AnimatePresence>
          {isTerminalOpen && (
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="h-[40%] md:h-64 bg-[#0a0a0f] border-t border-white/10 flex flex-col shrink-0 relative z-10"
            >
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-[#050B14]/50 backdrop-blur-md text-xs font-mono text-gray-400 shrink-0 z-10">
                <TerminalSquare size={14} /> {previewContent ? "Live Preview" : "Terminal"}
              </div>
              
              {previewContent ? (
                <iframe 
                  srcDoc={previewContent} 
                  className="w-full h-full border-none bg-white" 
                  title="Live Preview" 
                />
              ) : (
                <div className="flex-grow min-h-0 relative">
                    <Terminal 
                        autoRunCommand={autoRunCmd} 
                        onAutoRunComplete={() => setAutoRunCmd(null)}
                    />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
