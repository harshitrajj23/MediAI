import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Activity, Lock, Mail, User, ShieldAlert, AlertCircle } from 'lucide-react';

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
        // Sign up with Supabase Auth
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
        
        // If email confirmation is disabled, they might be logged in immediately
        if (data?.session) {
          // Add record to public profiles table automatically
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
          setSuccessMsg("Registration successful! You can now log in instantly. (If email verification is disabled in your dashboard, check your inbox or try logging in!)");
          setIsSignUp(false);
        }
      } else {
        // Log in with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        
        if (data?.session) {
          // Double check if profile exists, if not create one
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
      setErrorMsg(err.message || "Authentication transaction failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6 relative overflow-hidden mesh-bg">
      {/* Aesthetic glowing background mesh circle widgets */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-mint/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Card container */}
      <div className="max-w-md w-full glass-panel p-8 border border-dark-700/80 shadow-neon-green-lg relative z-10 animate-fade-in">
        
        {/* Brand logo header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-neon-green/10 flex items-center justify-center border border-neon-green/30 text-neon-green shadow-neon-green animate-pulse">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-white tracking-wider glow-text-green">MediAI</h1>
            <span className="text-[10px] font-bold text-neon-mint uppercase tracking-widest block mt-0.5">
              Secure Clinician Enclave Access
            </span>
          </div>
        </div>

        {/* Sliding tabs */}
        <div className="grid grid-cols-2 gap-2 bg-dark-950 p-1 border border-dark-800 rounded-xl mb-6">
          <button 
            onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              !isSignUp ? 'bg-neon-green text-dark-950 shadow-md' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              isSignUp ? 'bg-neon-green text-dark-950 shadow-md' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Response messaging banners */}
        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl flex items-start gap-2.5 text-xs mb-6 animate-fade-in">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-start gap-2.5 text-xs mb-6 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {isSignUp && (
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4 h-4 text-slate-500" />
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

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</label>
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

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Security Password</label>
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
            className="btn-primary w-full py-3 bg-neon-green hover:bg-neon-bright text-xs tracking-wider uppercase font-bold mt-6"
          >
            {loading ? "Decrypting credentials..." : isSignUp ? "Create Secure Profile" : "Access Clinic Enclave"}
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center mt-6">
          *Email confirmation can be bypassed inside the Supabase Auth panel for instant demo creation!
        </p>

      </div>
    </div>
  );
}
