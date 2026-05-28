import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  MessageSquare,
  Eye,
  Pill,
  CalendarDays,
  ArrowRight,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle,
  Clock,
  User,
  Mail,
  Phone,
  Globe,
  BrainCircuit,
  Edit,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Dashboard({ 
  session,
  userProfile,
  triageData, 
  medications, 
  consultations, 
  setView, 
  elderlyMode 
}) {
  const lastTriage = triageData || { urgency: "None", score: 0, explanation: "No symptom scans performed yet." };

  const [tab, setTab] = useState('overview');
  const [chatsHistory, setChatsHistory] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLang, setProfileLang] = useState('English');
  const [profileMsg, setProfileMsg] = useState('');
  const [updating, setUpdating] = useState(false);
  const [expandedChat, setExpandedChat] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      supabase.from('chats').select('*').eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { if (data) setChatsHistory(data); });
    }
    if (userProfile) {
      setProfileName(userProfile.name || '');
      setProfilePhone(userProfile.phone || '');
      setProfileLang(userProfile.language || 'English');
    }
  }, [session, userProfile, tab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setUpdating(true);
    setProfileMsg('');
    try {
      const { error } = await supabase.from('profiles').update({
        name: profileName, phone: profilePhone, language: profileLang,
        updated_at: new Date().toISOString()
      }).eq('id', session.user.id);
      if (error) throw error;
      setProfileMsg("Profile updated successfully.");
      setEditingProfile(false);
    } catch (err) {
      setProfileMsg("Update failed. Try again.");
    } finally {
      setUpdating(false);
    }
  };

  const getTriageColor = () => {
    switch (lastTriage.urgency) {
      case "Emergency": return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' };
      case "Visit Clinic Soon": return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' };
      case "Home Care Recommended": return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' };
      default: return { bg: 'bg-white/[0.03]', border: 'border-white/[0.06]', text: 'text-slate-400', dot: 'bg-slate-500' };
    }
  };

  const tc = getTriageColor();

  const features = [
    {
      id: 'chat',
      icon: MessageSquare,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      title: 'Symptom Check',
      desc: 'Describe your symptoms and get instant AI-powered clinical triage analysis.',
      speak: 'Symptom checker'
    },
    {
      id: 'vision',
      icon: Eye,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      title: 'Vision Lab',
      desc: 'Upload wound or skin images for AI-powered visual diagnosis and severity scoring.',
      speak: 'Vision scanner'
    },
    {
      id: 'meds',
      icon: Pill,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      title: 'Medications',
      desc: `Track your prescriptions and dosage schedules. ${medications.length} active.`,
      speak: 'Medications'
    },
    {
      id: 'docs',
      icon: CalendarDays,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      title: 'Appointments',
      desc: `Schedule telemedicine consultations with specialists. ${consultations.length} booked.`,
      speak: 'Appointments'
    },
  ];

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } }
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }
  };

  return (
    <div className="space-y-10 pb-12">

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className={`outfit-font font-bold text-white tracking-tight ${elderlyMode ? 'text-4xl' : 'text-3xl'}`}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}{userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-slate-400 mt-2 text-sm">Here's your health overview.</p>
      </motion.div>

      {/* Triage Status Banner */}
      {lastTriage.urgency !== "None" && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`${tc.bg} border ${tc.border} rounded-2xl p-6`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${tc.dot} mt-1.5 shrink-0 ${lastTriage.urgency === 'Emergency' ? 'animate-pulse' : ''}`} />
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${tc.text}`}>{lastTriage.urgency}</span>
                <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">{lastTriage.explanation}</p>
              </div>
            </div>
            <span className={`text-xs font-bold ${tc.text}`}>{lastTriage.score}%</span>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
        {['overview', 'profile'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
              tab === t ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t === 'overview' ? 'Overview' : 'Profile & History'}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">

          {/* Quick stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-2">Triage Status</span>
              <span className={`text-lg font-bold ${tc.text}`}>{lastTriage.urgency === "None" ? "No scans" : lastTriage.urgency}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-2">Medications</span>
              <span className="text-lg font-bold text-white">{medications.length}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-2">Appointments</span>
              <span className="text-lg font-bold text-white">{consultations.length}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block mb-2">Chat Logs</span>
              <span className="text-lg font-bold text-white">{chatsHistory.length}</span>
            </div>
          </motion.div>

          {/* Feature Navigation Cards */}
          <div>
            <h2 className="outfit-font text-lg font-semibold text-white mb-4">Quick actions</h2>
            <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map(f => {
                const Icon = f.icon;
                return (
                  <motion.button
                    key={f.id}
                    variants={fadeUp}
                    onClick={() => setView(f.id, f.speak)}
                    className="feature-card text-left group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${f.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${f.color}`} />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className={`font-semibold text-white mb-1.5 ${elderlyMode ? 'text-xl' : 'text-base'}`}>{f.title}</h3>
                    <p className={`text-slate-400 leading-relaxed ${elderlyMode ? 'text-base' : 'text-xs'}`}>{f.desc}</p>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Recent medications preview */}
          {medications.length > 0 && (
            <motion.div variants={fadeUp}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="outfit-font text-lg font-semibold text-white">Today's medications</h2>
                <button onClick={() => setView('meds', 'Medications')} className="text-xs text-neon-green hover:text-white transition-colors flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {medications.slice(0, 3).map(med => (
                  <div key={med.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-white block">{med.name}</span>
                      <span className="text-xs text-slate-500">{med.dosage}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {med.timing?.map((t, i) => (
                        <span key={i} className="text-[10px] bg-white/[0.06] text-slate-300 px-2 py-0.5 rounded-full font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

      ) : (
        /* PROFILE & HISTORY TAB */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Profile */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="outfit-font text-xl font-bold text-white">Profile</h2>
                {!editingProfile ? (
                  <button onClick={() => setEditingProfile(true)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <button onClick={() => setEditingProfile(false)} className="text-xs text-slate-400 hover:text-white transition-colors">Cancel</button>
                )}
              </div>

              {profileMsg && (
                <div className="p-3 bg-neon-green/10 border border-neon-green/20 text-neon-green rounded-xl text-xs mb-6">{profileMsg}</div>
              )}

              {editingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">Name</label>
                    <input type="text" required value={profileName} onChange={e => setProfileName(e.target.value)} className="input-field w-full text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">Phone</label>
                    <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="input-field w-full text-sm" placeholder="+1 555-1234" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">Language</label>
                    <select value={profileLang} onChange={e => setProfileLang(e.target.value)} className="input-field w-full text-sm">
                      {['English', 'Hindi', 'Spanish', 'French', 'Bengali', 'Tamil', 'Telugu'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={updating} className="btn-primary w-full py-3 text-sm">
                    {updating ? 'Saving...' : 'Save changes'}
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1">Name</span>
                    <span className="text-sm text-white">{profileName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1">Email</span>
                    <span className="text-sm text-slate-300 font-mono">{session.user.email}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1">Phone</span>
                    <span className="text-sm text-slate-300">{profilePhone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium block mb-1">Language</span>
                    <span className="text-sm text-neon-green">{profileLang}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat history */}
          <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 max-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="outfit-font text-base font-semibold text-white">Chat history</h3>
              <span className="text-[11px] text-slate-500 font-mono">{chatsHistory.length} logs</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {chatsHistory.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-12">No chat history yet.</p>
              ) : (
                chatsHistory.map(chat => (
                  <div key={chat.id} className="p-3.5 bg-dark-950/50 border border-white/[0.04] rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] uppercase tracking-wider font-semibold ${chat.role === 'user' ? 'text-slate-400' : 'text-blue-400'}`}>
                        {chat.role === 'user' ? 'You' : 'AI'}
                      </span>
                      <span className="text-[10px] text-slate-600">{new Date(chat.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{chat.content}</p>
                    {chat.content.length > 80 && (
                      <button 
                        onClick={() => setExpandedChat(expandedChat === chat.id ? null : chat.id)}
                        className="text-[10px] text-neon-green mt-2 flex items-center gap-1"
                      >
                        {expandedChat === chat.id ? 'Less' : 'More'}
                        {expandedChat === chat.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                    {expandedChat === chat.id && (
                      <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap">{chat.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
