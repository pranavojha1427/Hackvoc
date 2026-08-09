"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const Cube = ({ delay, duration, startX, scale }: { delay: number, duration: number, startX: string, scale: number }) => {
  return (
    <motion.div
      initial={{ 
        y: "120vh", 
        x: startX, 
        rotateX: 60, 
        rotateZ: 45, 
        opacity: 0, 
        scale: 0 
      }}
      animate={{ 
        y: ["120vh", "-20vh"], 
        rotateZ: [45, 405], 
        opacity: [0, 1, 1, 0],
        scale: [scale, scale, scale, scale * 0.8]
      }}
      transition={{ 
        duration: duration, 
        delay: delay,
        repeat: Infinity,
        ease: "linear"
      }}
      className="absolute"
      style={{ width: '60px', height: '60px', transformStyle: 'preserve-3d' }}
    >
      {/* Front Face */}
      <div className="absolute inset-0 bg-[#00e5ff]/20 border border-[#00e5ff]/50 shadow-[0_0_30px_rgba(0,229,255,0.3)] backdrop-blur-sm" style={{ transform: 'translateZ(30px)' }} />
      {/* Back Face */}
      <div className="absolute inset-0 bg-blue-600/20 border border-blue-500/50 backdrop-blur-sm" style={{ transform: 'translateZ(-30px) rotateY(180deg)' }} />
      {/* Right Face */}
      <div className="absolute inset-0 bg-[#00e5ff]/30 border border-[#00e5ff]/50 backdrop-blur-sm" style={{ transform: 'translateX(30px) rotateY(90deg)' }} />
      {/* Left Face */}
      <div className="absolute inset-0 bg-blue-400/20 border border-[#00e5ff]/50 backdrop-blur-sm" style={{ transform: 'translateX(-30px) rotateY(-90deg)' }} />
      {/* Top Face */}
      <div className="absolute inset-0 bg-cyan-300/40 border border-[#00e5ff]/80 backdrop-blur-sm" style={{ transform: 'translateY(-30px) rotateX(90deg)' }} />
      {/* Bottom Face */}
      <div className="absolute inset-0 bg-blue-900/40 border border-blue-500/50 backdrop-blur-sm" style={{ transform: 'translateY(30px) rotateX(-90deg)' }} />
    </motion.div>
  );
}

export default function FloatingCubes() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const cubes = [
    { delay: 0, duration: 25, startX: "10vw", scale: 1 },
    { delay: 4, duration: 30, startX: "80vw", scale: 1.5 },
    { delay: 8, duration: 20, startX: "50vw", scale: 0.8 },
    { delay: 12, duration: 35, startX: "20vw", scale: 2 },
    { delay: 2, duration: 28, startX: "90vw", scale: 1.2 },
    { delay: 15, duration: 22, startX: "35vw", scale: 0.9 },
    { delay: 7, duration: 32, startX: "70vw", scale: 1.3 },
    { delay: 18, duration: 26, startX: "5vw", scale: 1.7 },
    { delay: 5, duration: 20, startX: "60vw", scale: 1.1 },
    { delay: 10, duration: 40, startX: "45vw", scale: 2.5 },
    { delay: 14, duration: 38, startX: "25vw", scale: 0.7 },
    { delay: 22, duration: 24, startX: "75vw", scale: 1.4 },
  ];

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ perspective: '1000px' }}>
      {cubes.map((cube, i) => (
        <Cube key={i} {...cube} />
      ))}
    </div>
  );
}
