import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Activity, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldAlert, 
  AlertCircle, 
  Heart, 
  Cpu, 
  Volume2, 
  Layers, 
  Globe, 
  ShieldCheck, 
  Terminal, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

// STUNNING INTERACTIVE NEURAL NETWORKS BACKGROUND CANVAS
function NeuralCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = Math.min(100, Math.floor((width * height) / 15000));
    const connectionDistance = 120;
    const mouse = { x: null, y: null, radius: 180 };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 1.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Attract slightly to mouse
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x += (dx / dist) * force * 0.4;
            this.y += (dy / dist) * force * 0.4;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw neural lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw line to mouse
        if (mouse.x !== null && mouse.y !== null) {
          const mDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
          if (mDist < mouse.radius) {
            const alpha = (1 - mDist / mouse.radius) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              language: 'English'
            }
          }
        });

        if (error) throw error;
        
        if (data?.session) {
          await supabase.from('profiles').insert([
            {
              id: data.user.id,
              name: fullName,
              language: 'English',
              phone: ''
            }
          ]);
          onAuthSuccess(data.session);
        } else {
          setSuccessMsg("Registration complete! Access secure profile by signing in instantly.");
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        
        if (data?.session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (!profile) {
            await supabase.from('profiles').insert([
              {
                id: data.user.id,
                name: data.user.user_metadata?.full_name || email.split('@')[0],
                language: 'English',
                phone: ''
              }
            ]);
          }
          onAuthSuccess(data.session);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020402] text-slate-100 flex flex-col lg:flex-row relative overflow-x-hidden select-none">
      
      {/* 3D Flowing Connection Web Canvas */}
      <NeuralCanvas />

      {/* Aesthetic glowing mesh overlays */}
      <div className="absolute top-0 left-0 w-full h-full bg-radial-gradient pointer-events-none z-0" />
      <div className="absolute top-1/6 left-1/5 w-[500px] h-[500px] bg-neon-green/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/6 right-1/5 w-[500px] h-[500px] bg-neon-mint/5 rounded-full blur-[140px] pointer-events-none" />

      {/* LEFT COLUMN: CINEMATIC HEALTHCARE LAB SHOWCASE (Apple + OpenAI inspired) */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 lg:p-24 relative z-10 select-none">
        
        {/* Top brand header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neon-green/10 flex items-center justify-center border border-neon-green/30 text-neon-green shadow-neon-green animate-pulse">
            <Activity className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="font-extrabold text-white tracking-wider glow-text-green text-xl">MediAI</span>
          </div>
        </div>

        {/* Hero Copywriting */}
        <div className="my-12 lg:my-0 space-y-6 max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight glow-text-white">
            Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-emerald-400 to-neon-mint">Health Assistant</span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Get instant health insights, track your medications, and consult with doctors anytime, anywhere.
          </p>
        </div>

      </div>

      {/* RIGHT COLUMN: THE ENCLAVE DECRYPTION ACCESS PORTAL (Form Card Panel) */}
      <div className="w-full lg:w-[460px] bg-[#030603]/80 border-t lg:border-t-0 lg:border-l border-dark-800/80 flex flex-col justify-center p-8 md:p-16 relative z-10 backdrop-blur-lg">
        
        {/* Floating decryption access card */}
        <div className="glass-panel p-8 border border-dark-700/60 shadow-neon-green-lg relative z-20">
          
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <h2 className="font-extrabold text-xl text-white tracking-wider glow-text-green">Welcome to MediAI</h2>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
              Sign in to your account
            </span>
          </div>

          {/* Sliding Login/Signup switcher tabs */}
          <div className="grid grid-cols-2 gap-1 bg-dark-950 p-1 border border-dark-800 rounded-xl mb-6">
            <button 
              onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all ${
                !isSignUp ? 'bg-neon-green text-dark-950 shadow-md font-extrabold' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all ${
                isSignUp ? 'bg-neon-green text-dark-950 shadow-md font-extrabold' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Response alerts banners */}
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl flex items-start gap-2 text-xs mb-5 animate-fade-in">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-start gap-2 text-xs mb-5 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="flex flex-col space-y-1.5">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-4 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Harshit Raj"
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-neon-green"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-1.5">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Secure Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4 h-4 text-slate-500" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. harshit@example.com"
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-neon-green"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-neon-green"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 bg-neon-green hover:bg-neon-bright text-xs tracking-wider uppercase font-extrabold flex items-center justify-center gap-2 mt-6 border-none shadow-neon-green"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"} 
              <ArrowRight className="w-4 h-4 text-dark-950" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
