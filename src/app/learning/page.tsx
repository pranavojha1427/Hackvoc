"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Code, Terminal, Database, Server, Cpu } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const LANGUAGES = [
  { name: "Python", icon: <Terminal size={24} />, desc: "Great for beginners, AI, and Data." },
  { name: "JavaScript", icon: <Code size={24} />, desc: "The language of the web." },
  { name: "Java", icon: <Server size={24} />, desc: "Enterprise and Android apps." },
  { name: "C++", icon: <Cpu size={24} />, desc: "Game dev and high performance." },
  { name: "SQL", icon: <Database size={24} />, desc: "Database management." },
  { name: "HTML", icon: <Code size={24} />, desc: "Structure of web pages." },
  { name: "React", icon: <Code size={24} />, desc: "Modern UI development." },
];

export default function LearningGateway() {
  const router = useRouter();
  const [selected, setSelected] = useState("");

  const handleStart = () => {
    if (selected) {
      router.push(`/learning/${selected.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Dynamic Space Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00e5ff]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 left-4 z-20"
      >
        <Link href="/" className="text-gray-400 hover:text-white transition">
          &larr; Back Home
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center relative z-10"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 mb-8 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
        >
          <Sparkles size={16} />
          <span className="text-sm font-medium">AI Powered Learning</span>
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Language</h1>
        <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
          Select a programming language and our AI will generate a personalized learning roadmap from the absolute basics to Data Structures and Algorithms (DSA).
        </p>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 text-left"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {LANGUAGES.map((lang, index) => (
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={lang.name}
              onClick={() => setSelected(lang.name)}
              className={`p-6 rounded-xl border transition-all duration-300 flex flex-col gap-4 ${
                selected === lang.name 
                  ? "bg-[#00e5ff]/10 border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.3)]" 
                  : "bg-white/[0.02] border-white/10 hover:border-[#00e5ff]/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] backdrop-blur-md"
              }`}
            >
              <div className={`p-3 rounded-lg w-fit transition-colors ${
                selected === lang.name ? "bg-[#00e5ff] text-[#050B14]" : "bg-white/5 text-[#00e5ff]"
              }`}>
                {lang.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold">{lang.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{lang.desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={handleStart}
          disabled={!selected}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            selected 
              ? "bg-[#00e5ff] hover:bg-cyan-400 text-[#050B14] shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] hover:-translate-y-1 cursor-pointer" 
              : "bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed backdrop-blur-md"
          }`}
        >
          Generate Roadmap
        </motion.button>
      </motion.div>
    </div>
  );
}
