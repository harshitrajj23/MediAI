import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  MessageSquareHeart, 
  Eye, 
  Clock, 
  CalendarRange, 
  Accessibility, 
  Heart,
  Volume2,
  LogOut
} from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SymptomChat from './components/SymptomChat';
import VisionLab from './components/VisionLab';
import MedTracker from './components/MedTracker';
import DocMatch from './components/DocMatch';

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [view, setView] = useState('dashboard');
  const [triageData, setTriageData] = useState(null);
  const [medications, setMedications] = useState([]);
  const [consultations, setConsultations] = useState([]);
  
  // Accessibility "Elderly Mode" - automatically scales layout font sizes & increases contrast
  const [elderlyMode, setElderlyMode] = useState(false);

  // Sync session and subscribe to auth state changes
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUserProfile(data);
      }
    } catch (e) {
      console.error("Error loading user profile:", e);
    }
  };

  // Sync medications and bookings directly from Supabase
  const syncInitialData = async (userId) => {
    if (!userId) return;
    try {
      // 1. Fetch Medications from Supabase
      const { data: medsData, error: medsError } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (medsData) {
        setMedications(medsData);
      }
      
      // 2. Fetch Consultations from Supabase
      const { data: consultsData, error: consultsError } = await supabase
        .from('consultations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (consultsData) {
        setConsultations(consultsData);
      }
    } catch (e) {
      console.log("Database connection failed. Initializing with local memory state.", e);
    }
  };

  const handleTriageUpdate = (newTriage) => {
    setTriageData(newTriage);
  };

  // Speaks descriptive tab selections aloud when Elderly Mode is active
  const triggerAccessibilityVoice = (text) => {
    if (elderlyMode && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.82; // Slower pace for optimal elderly audibility
      window.speechSynthesis.speak(utterance);
    }
  };

  const changeView = (newView, voiceLabel) => {
    setView(newView);
    triggerAccessibilityVoice(voiceLabel);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setMedications([]);
    setConsultations([]);
  };

  // Nav mapping
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, speak: "Dashboard Home" },
    { id: 'chat', label: 'AI Symptom Chat', icon: <MessageSquareHeart className="w-5 h-5" />, speak: "Symptom Checker AI Chatbot" },
    { id: 'vision', label: 'AI Vision Lab', icon: <Eye className="w-5 h-5" />, speak: "Epidermal Image scanner" },
    { id: 'meds', label: 'Pill Reminders', icon: <Clock className="w-5 h-5" />, speak: "Medication adherence tracker" },
    { id: 'docs', label: 'Telemedicine', icon: <CalendarRange className="w-5 h-5" />, speak: "Virtual doctor consultation scheduler" },
  ];

  // Render Login screen if not authenticated
  if (!session) {
    return <Auth onAuthSuccess={(s) => setSession(s)} />;
  }

  const userDisplayName = userProfile?.name || session.user.user_metadata?.full_name || session.user.email.split('@')[0];
  const userInitials = userDisplayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'US';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-dark-950 text-slate-100 ${elderlyMode ? 'text-lg' : 'text-sm'}`}>
      
      {/* LEFT NAVIGATION SIDEBAR */}
      <aside className="w-full md:w-64 bg-dark-900 border-b md:border-b-0 md:border-r border-dark-800 flex flex-col justify-between py-6 px-4 shrink-0">
        <div className="space-y-8">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-neon-green/10 flex items-center justify-center border border-neon-green/30 text-neon-green shadow-neon-green animate-pulse">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-wider glow-text-green text-lg">MediAI</span>
              <span className="text-[9px] font-bold text-neon-mint block uppercase tracking-widest mt-0.5">Accessibility Lab</span>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => changeView(item.id, item.speak)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${
                  view === item.id 
                    ? 'bg-neon-green text-dark-950 font-bold shadow-neon-green-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-dark-800/60'
                }`}
              >
                {item.icon}
                <span className={elderlyMode ? 'text-base font-bold' : 'text-xs font-semibold'}>
                  {item.label}
                </span>
                {item.id === 'chat' && triageData?.urgency === 'Emergency' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* User profile / System status info block */}
        <div className="pt-6 border-t border-dark-800 mt-6 md:mt-0 space-y-4">
          {triageData && triageData.urgency === 'Emergency' && (
            <div className="p-3 bg-red-950/40 border border-red-700/60 rounded-xl flex items-center gap-2.5 text-xs text-red-400 animate-pulse-glow">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
              <span className="font-bold">Active Medical Emergency Alert</span>
            </div>
          )}
          
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center font-bold text-xs text-neon-green">
                {userInitials}
              </div>
              <div className="max-w-[120px] truncate">
                <span className="text-xs font-bold text-slate-200 block leading-none truncate">{userDisplayName}</span>
                <span className="text-[9px] text-slate-500 mt-1 block">Patient Dashboard</span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-dark-800 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* HEADER TOOLBAR WITH ACCESSIBILITY CONTROL */}
        <header className="bg-dark-900/40 border-b border-dark-800/60 py-4 px-6 md:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Global Hackathon Sandbox MVP
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Elderly mode Accessibility switch */}
            <button
              onClick={() => {
                const nextMode = !elderlyMode;
                setElderlyMode(nextMode);
                if (nextMode && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance("Elderly accessibility mode active. Layout sizes adjusted.");
                  utterance.lang = 'en-US';
                  utterance.rate = 0.82;
                  window.speechSynthesis.speak(utterance);
                }
              }}
              className={`flex items-center gap-2.5 px-4 py-2 border rounded-xl font-bold transition-all ${
                elderlyMode 
                  ? 'bg-neon-green/10 text-neon-green border-neon-green/40 shadow-neon-green/10' 
                  : 'bg-dark-900 text-slate-400 border-dark-700 hover:text-white hover:border-dark-600'
              }`}
              title="Toggle Large Sizing & Screen Reader Support"
            >
              <Accessibility className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-wider">Elderly Mode</span>
              {elderlyMode && <Volume2 className="w-3.5 h-3.5 text-neon-green animate-pulse" />}
            </button>
          </div>
        </header>

        {/* CENTRAL ROUTER CONTAINER */}
        <div className="flex-1 p-6 md:p-8">
          {view === 'dashboard' && (
            <Dashboard 
              triageData={triageData} 
              medications={medications}
              consultations={consultations}
              setView={setView}
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
              setView={setView}
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
        </div>

      </main>

    </div>
  );
}
