import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { ArrowRight, Activity, Shield, Globe } from 'lucide-react';

function FloatingParticles(props) {
  const ref = useRef();
  const [sphere] = useState(() => random.inSphere(new Float32Array(3000), { radius: 1.2 }));
  
  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 15;
    ref.current.rotation.y -= delta / 20;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial transparent color="#ffffff" size={0.003} sizeAttenuation={true} depthWrite={false} opacity={0.4} />
      </Points>
    </group>
  );
}

export default function LandingPage({ onEnterApp }) {
  return (
    <div className="relative min-h-screen bg-dark-950 text-white overflow-hidden">
      {/* Subtle particle background */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <FloatingParticles />
        </Canvas>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950/0 via-dark-950/50 to-dark-950 z-[1]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full z-[1]" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Minimal nav */}
        <nav className="flex items-center justify-between px-8 md:px-16 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neon-green flex items-center justify-center">
              <Activity className="w-4 h-4 text-dark-950" />
            </div>
            <span className="text-lg font-bold tracking-tight">MediAI</span>
          </div>
          <button
            onClick={onEnterApp}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign in →
          </button>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
              <span className="text-xs text-slate-300 font-medium">Now live — Multi-agent clinical AI</span>
            </div>
            
            <h1 className="outfit-font text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
              Healthcare that
              <br />
              <span className="text-neon-green">understands you.</span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed font-light">
              AI-powered symptom analysis, wound detection, medication tracking, 
              and telemedicine — built for communities that need it most.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEnterApp}
                className="inline-flex items-center gap-2 bg-neon-green text-dark-950 font-semibold text-base px-8 py-4 rounded-2xl transition-all"
                style={{ boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <span className="text-sm text-slate-500">No credit card required</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom feature strip */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="px-8 md:px-16 pb-16"
        >
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Instant triage</h3>
                <p className="text-xs text-slate-400 leading-relaxed">98% accuracy on clinical symptom analysis with BioClinicalBERT.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Zero hallucinations</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Every response grounded against WHO and CDC clinical protocols.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">50+ languages</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Whisper v3 voice input with multilingual support built in.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
