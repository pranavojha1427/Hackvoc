"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, BookOpen, Send, Bot, CheckCircle, XCircle, BrainCircuit } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

type MCQ = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type LessonData = {
  content: string;
  mcqs: MCQ[];
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function InteractiveLessonPage() {
  const params = useParams();
  const language = decodeURIComponent(params.language as string);
  const topic = decodeURIComponent(params.topic as string);
  const router = useRouter();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextTopic, setNextTopic] = useState<string | null>(null);
  
  // MCQ State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});

  // Tutor State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    role: 'assistant', 
    content: `Hi! I'm your AI Tutor. Let me know if you have any questions about ${topic}.`
  }]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLesson() {
      if (!language || !topic) return;
      try {
        const res = await fetch("/api/lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, topic }),
        });
        const data = await res.json();
        if (data.content && data.mcqs) {
          setLesson(data);
        }

        // Fetch roadmap to find next topic
        if (user) {
          const dbRes = await fetch(`/api/db?userId=${user.uid}&language=${language}`);
          const dbData = await dbRes.json();
          if (dbData.exists && dbData.data && dbData.data.roadmap) {
            const allTopics = dbData.data.roadmap.flatMap((section: any) => section.topics);
            const currentIndex = allTopics.indexOf(topic);
            if (currentIndex !== -1 && currentIndex < allTopics.length - 1) {
              setNextTopic(allTopics[currentIndex + 1]);
            }
          }
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [language, topic, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAnswerSelect = (qIndex: number, optIndex: number) => {
    if (showResults[qIndex]) return; // prevent changing after checking
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const checkAnswer = (qIndex: number) => {
    if (selectedAnswers[qIndex] === undefined) return;
    setShowResults(prev => ({ ...prev, [qIndex]: true }));
  };

  const handleNextLesson = async () => {
    if (!user) return;
    
    // Save completion
    try {
      await fetch('/api/db', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              userId: user.uid,
              language,
              action: 'update_topic_progress',
              data: { completedTopics: [topic] }
          })
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }

    if (nextTopic) {
      router.push(`/learning/${language}/${encodeURIComponent(nextTopic)}`);
    } else {
      router.push(`/learning/${language}`);
    }
  };

  const allAnswered = lesson?.mcqs && lesson.mcqs.length > 0 && Object.keys(showResults).length === lesson.mcqs.length;

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const newMessage = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: newMessage }]);
    setIsChatting(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          language, 
          topic, 
          message: newMessage,
          history: chatMessages.slice(1) // exclude initial greeting for cleaner history
        }),
      });
      const data = await res.json();
      
      if (data.response) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#050B14] text-white flex flex-col items-center justify-center px-6 text-center">
        <Loader2 className="animate-spin text-[#00e5ff] mb-6" size={64} />
        <h2 className="text-2xl font-bold mb-2">Generating Interactive Lesson...</h2>
        <p className="text-gray-400">Our AI is writing a custom tutorial and generating quizzes for {topic}.</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-2 text-red-400">Failed to generate lesson</h2>
        <Link href={`/learning/${language}`} className="text-blue-500 hover:underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#050B14] text-gray-300 font-sans flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Dynamic Space Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#00e5ff]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[150px]"></div>
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-0 overflow-y-auto custom-scrollbar relative z-10">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#050B14]/80 backdrop-blur-md border-b border-white/10 p-4 px-8 z-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/learning/${language}`} className="p-2 hover:bg-white/10 rounded-full transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white capitalize">{topic}</h1>
              <p className="text-xs text-gray-400 uppercase tracking-widest">{language} Mastery</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
            <BookOpen size={16} className="text-[#00e5ff]"/> AI Generated Lesson
          </div>
        </div>

        {/* Lesson Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto w-full p-8 pb-24"
        >
          <div className="prose prose-invert prose-blue max-w-none prose-headings:text-white prose-a:text-[#00e5ff] prose-pre:bg-white/[0.02] prose-pre:backdrop-blur-md prose-pre:border prose-pre:border-white/10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lesson.content}
            </ReactMarkdown>
          </div>

          {/* MCQ Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 pt-12 border-t border-white/10"
          >
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <BrainCircuit className="text-[#00e5ff]" size={32}/> 
              Knowledge Check
            </h2>
            
            <div className="space-y-12">
              {lesson.mcqs.map((mcq, qIndex) => {
                const isChecked = showResults[qIndex];
                const selected = selectedAnswers[qIndex];
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: qIndex * 0.1 }}
                    key={qIndex} 
                    className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl"
                  >
                    <h3 className="text-lg font-medium text-white mb-6">
                      <span className="text-gray-500 mr-2">{qIndex + 1}.</span> {mcq.question}
                    </h3>
                    
                    <div className="space-y-3">
                      {mcq.options.map((option, optIndex) => {
                        let bgColor = "bg-white/5 hover:bg-white/10";
                        let borderColor = "border-white/10 hover:border-white/20";
                        let icon = null;

                        if (isChecked) {
                          if (optIndex === mcq.correctAnswer) {
                            bgColor = "bg-[#00e5ff]/10";
                            borderColor = "border-[#00e5ff]/50";
                            icon = <CheckCircle size={18} className="text-[#00e5ff] ml-auto drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />;
                          } else if (selected === optIndex) {
                            bgColor = "bg-red-900/20";
                            borderColor = "border-red-500/50";
                            icon = <XCircle size={18} className="text-red-500 ml-auto" />;
                          }
                        } else if (selected === optIndex) {
                          bgColor = "bg-[#00e5ff]/10";
                          borderColor = "border-[#00e5ff]";
                        }

                        return (
                          <button
                            key={optIndex}
                            onClick={() => handleAnswerSelect(qIndex, optIndex)}
                            disabled={isChecked}
                            className={`w-full text-left p-4 rounded-lg border ${bgColor} ${borderColor} transition flex items-center gap-3`}
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              selected === optIndex ? "border-[#00e5ff] bg-[#00e5ff]" : "border-gray-500"
                            }`}>
                              {selected === optIndex && <div className="w-2 h-2 bg-[#050B14] rounded-full" />}
                            </div>
                            <span className={isChecked && optIndex === mcq.correctAnswer ? "text-white font-medium" : "text-gray-300"}>
                              {option}
                            </span>
                            {icon}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      {!isChecked ? (
                        <button 
                          onClick={() => checkAnswer(qIndex)}
                          disabled={selected === undefined}
                          className="px-6 py-2 bg-[#00e5ff] hover:bg-cyan-400 disabled:opacity-50 text-[#050B14] rounded-lg font-bold transition ml-auto shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                        >
                          Check Answer
                        </button>
                      ) : (
                        <div className={`p-4 rounded-lg w-full ${
                          selected === mcq.correctAnswer ? "bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30" : "bg-red-900/20 text-red-300 border border-red-500/30"
                        }`}>
                          <p className="font-bold mb-1">{selected === mcq.correctAnswer ? "Correct!" : "Incorrect."}</p>
                          <p className="text-sm opacity-90">{mcq.explanation}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
               {allAnswered && (
                 <button onClick={handleNextLesson} className="px-8 py-3 bg-[#00e5ff] hover:bg-cyan-400 text-[#050B14] rounded-lg font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] transition-all hover:-translate-y-1 flex items-center gap-2">
                   Complete & Continue <ArrowRight size={18} />
                 </button>
               )}
               <Link href={`/learning/${language}`} className="px-8 py-3 bg-white/[0.05] border border-white/10 hover:bg-white/10 text-white rounded-lg font-bold transition backdrop-blur-md">
                  Return to Roadmap
               </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Side Panel: AI Tutor */}
      <motion.div 
        initial={{ x: 320 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full md:w-80 h-[50vh] md:h-full shrink-0 bg-white/[0.02] backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col shadow-[inset_1px_0_20px_rgba(0,229,255,0.05)] relative z-20"
      >
        <div className="p-4 border-b border-white/10 bg-[#050B14]/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">AI Tutor</h3>
            <p className="text-xs text-gray-500">Ask about {topic}</p>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
              <div className={`p-3 rounded-2xl text-sm backdrop-blur-md ${
                msg.role === 'user' 
                  ? 'bg-[#00e5ff] text-[#050B14] rounded-tr-sm shadow-[0_0_15px_rgba(0,229,255,0.3)] font-medium' 
                  : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/10'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isChatting && (
            <div className="self-start bg-white/5 p-3 rounded-2xl rounded-tl-sm border border-white/10 w-16 flex justify-center backdrop-blur-md">
              <Loader2 size={16} className="animate-spin text-[#00e5ff]" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-4 border-t border-white/10 bg-[#050B14]/50">
          <div className="relative">
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-sm focus:outline-none focus:border-[#00e5ff]/50 text-white placeholder-gray-500 resize-none h-16 custom-scrollbar backdrop-blur-md transition-colors"
              placeholder="I don't understand..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isChatting}
              className="absolute right-2 bottom-2 p-1.5 bg-[#00e5ff] hover:bg-cyan-400 disabled:opacity-50 text-[#050B14] rounded-lg transition shadow-[0_0_10px_rgba(0,229,255,0.3)]"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
