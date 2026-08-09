"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckCircle, Circle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Topic {
  title: string;
  description: string;
  topics: string[];
}

export default function RoadmapPage() {
  const params = useParams();
  const language = decodeURIComponent(params.language as string);
  const router = useRouter();
  const { user } = useAuth();

  const [roadmap, setRoadmap] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetchRoadmap() {
      if (!language || !user) return;
      
      try {
        const res = await fetch(`/api/db?userId=${user.uid}&language=${language}`);
        const data = await res.json();
        
        if (data.exists && data.data) {
          // Load from Local DB
          setRoadmap(data.data.roadmap || []);
          setCompleted(new Set(data.data.completed || []));
          setLoading(false);
        } else {
          // Generate new roadmap
          const aiRes = await fetch("/api/roadmap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language }),
          });
          const aiData = await aiRes.json();
          
          if (aiData.roadmap) {
            setRoadmap(aiData.roadmap);
            
            // Save to Local DB
            await fetch('/api/db', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    language,
                    action: 'save_roadmap',
                    data: { roadmap: aiData.roadmap }
                })
            });
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching roadmap:", err);
        setLoading(false);
      }
    }
    
    if (user) {
      fetchRoadmap();
    }
  }, [language, user]);

  const toggleComplete = async (index: number) => {
    if (!user) return;

    const newCompleted = new Set(completed);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    
    // Optimistic UI update
    setCompleted(newCompleted);

    // Save to Local DB
    try {
      await fetch('/api/db', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              userId: user.uid,
              language,
              action: 'update_progress',
              data: { completed: Array.from(newCompleted) }
          })
      });
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#00e5ff] mb-4" size={48} />
        <h2 className="text-xl font-bold">Loading your personalized roadmap...</h2>
        <p className="text-gray-400">Please wait while we sync your data.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-white p-6 relative overflow-hidden">
      
      {/* Dynamic Space Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00e5ff]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <Link href="/learning" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
              <ArrowLeft size={16} /> Back to Languages
            </Link>
            <h1 className="text-3xl font-bold capitalize flex items-center gap-2">
              <Sparkles className="text-[#00e5ff]" />
              {language} Mastery Roadmap
            </h1>
            <p className="text-gray-400 mt-2">From absolute beginner to DSA.</p>
          </div>
          
          <Link href="/practice" className="px-4 py-2 bg-white/[0.05] border border-white/10 hover:bg-[#00e5ff] hover:text-[#050B14] hover:border-[#00e5ff] backdrop-blur-md text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(0,229,255,0)] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]">
            Go to Practice Mode
          </Link>
        </div>

        <motion.div 
          className="space-y-6 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#00e5ff] before:via-white/10 before:to-transparent"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
        >
          {roadmap.map((section, index) => {
            const isCompleted = completed.has(index);
            return (
              <motion.div 
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                key={index}
                className={`p-6 rounded-xl border transition-all backdrop-blur-md ${
                  isCompleted ? "bg-[#00e5ff]/10 border-[#00e5ff]/50 shadow-[0_0_20px_rgba(0,229,255,0.15)]" : "bg-white/[0.02] border-white/10 hover:border-[#00e5ff]/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                      <button onClick={() => toggleComplete(index)} className="hover:scale-110 transition">
                        {isCompleted ? (
                          <CheckCircle className="text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
                        ) : (
                          <Circle className="text-gray-500 hover:text-[#00e5ff]/50" />
                        )}
                      </button>
                      <span className={isCompleted ? "text-gray-300 line-through decoration-[#00e5ff]/50" : ""}>
                        {section.title}
                      </span>
                    </h2>
                    <p className="text-gray-400 mb-4 ml-9">{section.description}</p>
                  </div>
                </div>

                <div className="ml-9">
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-2">Topics Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {section.topics.map((topic, tIndex) => (
                      <Link 
                        href={`/learning/${language}/${encodeURIComponent(topic)}`}
                        key={tIndex} 
                        className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 hover:bg-[#00e5ff] hover:border-[#00e5ff] hover:text-[#050B14] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] rounded-full text-sm transition-all cursor-pointer"
                      >
                        {topic}
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
