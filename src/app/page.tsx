"use client";

import Link from "next/link";
import { BookOpen, Code2, Sparkles, BrainCircuit, ShieldCheck, Zap, Activity } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import FloatingCubes from "@/components/FloatingCubes";

export default function Home() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={ref} className="min-h-screen bg-[#050B14] text-white overflow-hidden selection:bg-[#00e5ff] selection:text-black font-sans">
      
      {/* Dynamic Space Background */}
      <motion.div 
        style={{ y: yBackground }}
        className="fixed inset-0 z-0 pointer-events-none"
      >
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/20 blur-[150px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-cyan-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-[#00e5ff]/5 blur-[200px]"></div>
        
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen"></div>
        
        {/* Floating 3D Cubes */}
        <FloatingCubes />
      </motion.div>

      {/* Fixed Glowing Orb */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40 md:opacity-60">
          <div className="relative w-64 h-64 flex items-center justify-center mt-12">
              <div className="w-48 h-48 bg-[#00e5ff]/20 blur-[70px] rounded-full absolute"></div>
              
              {/* Rings */}
              <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                  transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, scale: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
                  className="absolute w-[320px] h-[320px] border border-[#00e5ff]/30 rounded-full border-dashed"
              />
              <motion.div 
                  animate={{ rotate: -360, scale: [1, 1.02, 1] }}
                  transition={{ rotate: { duration: 35, repeat: Infinity, ease: "linear" }, scale: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
                  className="absolute w-[450px] h-[450px] border border-[#00e5ff]/10 rounded-full"
              />

              <motion.div animate={{ y: [-15, 15, -15] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                <BrainCircuit size={100} className="text-[#00e5ff] drop-shadow-[0_0_30px_rgba(0,229,255,0.8)]" strokeWidth={1} />
              </motion.div>
          </div>
      </div>

      {/* Giant Nebula Logo */}
      <div className="w-full flex justify-center items-center py-12 relative z-50">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex items-center gap-4 font-extrabold text-6xl md:text-8xl tracking-tighter"
        >
          <Sparkles className="text-[#00e5ff] w-16 h-16 md:w-24 md:h-24 drop-shadow-[0_0_30px_rgba(0,229,255,0.8)]" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            Nebula
          </span>
        </motion.div>
      </div>

      {/* Hero Section */}
      <motion.section 
        id="hero"
        style={{ opacity: opacityHero }}
        className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center mt-12 overflow-hidden"
      >

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl flex flex-col items-center relative z-10"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Unleashing the Power <br/> of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-blue-500 drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]">AI Learning</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl leading-relaxed">
            Transforming education with personalized, intelligent, and interactive coding experiences.
          </p>
        </motion.div>
      </motion.section>


      {/* Action Plans */}
      <section id="plans" className="relative z-10 py-16 px-8 max-w-5xl mx-auto mb-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Choose Your <span className="text-[#00e5ff]">Path</span></h2>
          <p className="text-gray-400">Choose the environment that fits your needs and start exploring today.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            
          <motion.div 
             whileHover={{ y: -10, scale: 1.02 }}
             className="relative p-8 rounded-3xl bg-[#0a1120] border border-gray-800 hover:border-blue-500 transition-all overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full"></div>
             <h3 className="text-blue-400 font-semibold mb-2">Guided Path</h3>
             <h4 className="text-3xl font-bold mb-6 text-white">Learning Mode</h4>
             <p className="text-gray-400 text-sm mb-8">Best for individuals new to a language who want structured guidance.</p>
             
             <ul className="space-y-4 mb-10">
                 {["Dynamic Roadmaps", "Interactive Quizzes", "Progress Tracking", "AI Mentorship"].map((f, i) => (
                     <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                         <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs">✓</div>
                         {f}
                     </li>
                 ))}
             </ul>
             
             <Link href="/learning">
                 <button className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
                     Start Learning
                 </button>
             </Link>
          </motion.div>

          <motion.div 
             whileHover={{ y: -10, scale: 1.02 }}
             className="relative p-8 rounded-3xl bg-[#0a1525] border border-[#00e5ff]/30 hover:border-[#00e5ff] shadow-[0_0_30px_rgba(0,229,255,0.1)] hover:shadow-[0_0_40px_rgba(0,229,255,0.2)] transition-all overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/20 blur-[50px] rounded-full"></div>
             <h3 className="text-[#00e5ff] font-semibold mb-2">Sandbox</h3>
             <h4 className="text-3xl font-bold mb-6 text-white">Practice Arena</h4>
             <p className="text-gray-400 text-sm mb-8">For users who want to write code, manage files, and debug instantly.</p>
             
             <ul className="space-y-4 mb-10">
                 {["Real File System", "Interactive Terminal", "Live HTML Preview", "AI Debugger"].map((f, i) => (
                     <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                         <div className="w-5 h-5 rounded-full bg-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] text-xs">✓</div>
                         {f}
                     </li>
                 ))}
             </ul>
             
             <Link href="/practice">
                 <button className="w-full py-3 rounded-lg bg-[#00e5ff] text-black hover:shadow-[0_0_20px_rgba(0,229,255,0.5)] font-bold transition-all">
                     Enter Arena
                 </button>
             </Link>
          </motion.div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-gray-500 text-sm">
        <p>© 2026 Nebula Learning Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
