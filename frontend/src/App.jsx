import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity,
  MessageSquare,
  Eye,
  Pill,
  CalendarDays,
  LayoutGrid,
  LogOut,
  Accessibility,
  ArrowLeft,
  User,
  Menu,
  X
} from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SymptomChat from './components/SymptomChat';
import VisionLab from './components/VisionLab';
import MedTracker from './components/MedTracker';
import DocMatch from './components/DocMatch';
import LandingPage from './components/LandingPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('dashboard');
  const [triageData, setTriageData] = useState(null);
  const [medications, setMedications] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [showLanding, setShowLanding] = useState(true);
  const [elderlyMode, setElderlyMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        syncInitialData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        syncInitialData(session.user.id);
      } else {
        setUserProfile(null);
        setMedications([]);
        setConsultations([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setUserProfile(data);
    } catch (e) {
      console.error("Error loading profile:", e);
    }
  };

  const syncInitialData = async (userId) => {
    if (!userId) return;
    try {
      const { data: medsData } = await supabase.from('medications').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (medsData) setMedications(medsData);
      
      const { data: consultsData } = await supabase.from('consultations').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (consultsData) setConsultations(consultsData);
    } catch (e) {
      console.log("Database sync failed, using local state.", e);
    }
  };

  const handleTriageUpdate = (newTriage) => setTriageData(newTriage);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setMedications([]);
    setConsultations([]);
    setShowLanding(true);
  };

  const triggerAccessibilityVoice = (text) => {
    if (elderlyMode && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.82;
      window.speechSynthesis.speak(u);
    }
  };

  const navigateTo = (newView, voiceLabel) => {
    setView(newView);
    setMobileMenuOpen(false);
    if (voiceLabel) triggerAccessibilityVoice(voiceLabel);
  };

  // Not logged in
  if (!session) {
    if (showLanding) {
      return <LandingPage onEnterApp={() => setShowLanding(false)} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 p-4">
        <Auth onAuthSuccess={(s) => setSession(s)} />
      </div>
    );
  }

  const userDisplayName = userProfile?.name || session.user.user_metadata?.full_name || session.user.email.split('@')[0];
  const userInitials = userDisplayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid, speak: 'Dashboard' },
    { id: 'chat', label: 'Symptom Check', icon: MessageSquare, speak: 'Symptom checker' },
    { id: 'vision', label: 'Vision Lab', icon: Eye, speak: 'Vision scanner' },
    { id: 'meds', label: 'Medications', icon: Pill, speak: 'Medications' },
    { id: 'docs', label: 'Appointments', icon: CalendarDays, speak: 'Appointments' },
  ];

  const currentPage = navItems.find(n => n.id === view);
  const showBackButton = view !== 'dashboard';

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
  };

  return (
    <div className={`min-h-screen bg-dark-950 text-slate-100 ${elderlyMode ? 'text-lg' : 'text-sm'}`}>
      
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Logo + back */}
            <div className="flex items-center gap-4">
              {showBackButton ? (
                <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">Back</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-neon-green flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-dark-950" />
                  </div>
                  <span className="font-bold text-base tracking-tight">MediAI</span>
                </div>
              )}

              {showBackButton && (
                <span className="text-sm font-semibold text-white">{currentPage?.label}</span>
              )}
            </div>

            {/* Center: Nav links (desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id, item.speak)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const next = !elderlyMode;
                  setElderlyMode(next);
                  if (next && 'speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance("Accessibility mode enabled.");
                    u.rate = 0.82;
                    window.speechSynthesis.speak(u);
                  }
                }}
                className={`p-2 rounded-lg transition-all ${
                  elderlyMode ? 'bg-neon-green/10 text-neon-green' : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'
                }`}
                title="Toggle accessibility mode"
              >
                <Accessibility className="w-4 h-4" />
              </button>

              {/* User avatar */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-[10px] font-bold text-neon-green">
                  {userInitials}
                </div>
                <span className="text-xs font-medium text-slate-300 hidden sm:inline max-w-[100px] truncate">{userDisplayName}</span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/[0.04] transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] bg-dark-950/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id, item.speak)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        view === item.id ? 'bg-white/10 text-white' : 'text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Emergency alert banner */}
      {triageData?.urgency === 'Emergency' && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold text-red-400">Active emergency detected — immediate medical attention recommended</span>
        </div>
      )}

      {/* PAGE CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={view} variants={pageVariants} initial="initial" animate="animate" exit="exit">
            
            {view === 'dashboard' && (
              <Dashboard 
                session={session}
                userProfile={userProfile}
                triageData={triageData} 
                medications={medications}
                consultations={consultations}
                setView={navigateTo}
                elderlyMode={elderlyMode}
              />
            )}

            {view === 'chat' && (
              <SymptomChat 
                session={session}
                onTriageUpdate={handleTriageUpdate} 
                setMedsTrigger={setMedications}
                elderlyMode={elderlyMode}
              />
            )}

            {view === 'vision' && (
              <VisionLab 
                session={session}
                onTriageUpdate={handleTriageUpdate} 
                setView={navigateTo}
                elderlyMode={elderlyMode}
              />
            )}

            {view === 'meds' && (
              <MedTracker 
                session={session}
                medications={medications} 
                setMedications={setMedications}
                elderlyMode={elderlyMode}
              />
            )}

            {view === 'docs' && (
              <DocMatch 
                session={session}
                triageData={triageData} 
                consultations={consultations}
                setConsultations={setConsultations}
                elderlyMode={elderlyMode}
              />
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
