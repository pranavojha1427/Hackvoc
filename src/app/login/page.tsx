"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import FloatingCubes from "@/components/FloatingCubes";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // router.push("/") will be handled by useEffect
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setError("");
    try {
      await signInWithPopup(auth, provider);
      // router.push("/") will be handled by useEffect
    } catch (err: any) {
      // Ignore false-positive errors where auth succeeds in the background
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err.code === 'auth/cross-origin-opener-policy-crash') {
        // Firebase auth may still succeed in the background via iframe.
        // We set a small delay; if user gets logged in, the useEffect will redirect them.
        setTimeout(() => {
           if (!auth.currentUser) setError("Sign in failed. Please try again.");
        }, 3000);
        return;
      }
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-6 text-gray-300 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/20 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-cyan-900/20 blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen"></div>
        <FloatingCubes />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#0a1525]/80 backdrop-blur-2xl border border-[#00e5ff]/30 rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.15)] p-6 md:p-8 relative z-10"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/20 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex justify-center mb-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20">
            <Sparkles size={16} />
            <span className="text-sm font-bold tracking-wider uppercase">Codely</span>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center relative z-10">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#050B14]/50 border border-gray-800 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#050B14]/50 border border-gray-800 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-[#00e5ff] to-blue-600 text-white font-bold rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 mt-6 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:scale-[1.02] active:scale-95"
          >
            {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="my-8 flex items-center relative z-10">
          <div className="flex-grow border-t border-gray-800"></div>
          <span className="px-4 text-xs font-semibold text-gray-500 tracking-widest">OR</span>
          <div className="flex-grow border-t border-gray-800"></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="w-full bg-[#0a1525] border border-gray-700 text-gray-200 hover:bg-gray-800 hover:border-gray-500 rounded-xl py-3.5 font-medium transition-all flex items-center justify-center gap-3 relative z-10 hover:shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-500 relative z-10">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#00e5ff] hover:text-blue-400 hover:underline font-semibold transition-colors"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
