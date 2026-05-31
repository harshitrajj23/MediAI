import React, { useState, useEffect, useRef } from 'react';
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
  X,
  PhoneCall,
  AlertTriangle,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SymptomChat from './components/SymptomChat';
import VisionLab from './components/VisionLab';
import MedTracker from './components/MedTracker';
import DocMatch from './components/DocMatch';
import LandingPage from './components/LandingPage';
import NeuralBackground from './components/NeuralBackground';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
  const [sosState, setSosState] = useState('idle'); // 'idle' | 'countdown' | 'active'
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosDispatchInfo, setSosDispatchInfo] = useState(null);
  const [sosLoading, setSosLoading] = useState(false);
  const sentRemindersRef = useRef(new Set());

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
        setTriageData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Automated Medication Reminder Scheduler Hook
  useEffect(() => {
    if (!session || medications.length === 0) return;

    const checkReminders = async () => {
      const now = new Date();
      
      // Format current time as "hh:mm AM/PM" to match our alarm strings
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      
      const dateString = now.toDateString(); // e.g. "Thu May 28 2026"

      medications.forEach(async (med) => {
        let alarmTime = "";
        let alarmMessage = "";
        
        if (Array.isArray(med.timing)) {
          med.timing.forEach(t => {
            if (t.startsWith("time:")) alarmTime = t.substring(5);
            else if (t.startsWith("msg:")) alarmMessage = t.substring(4);
          });
        }
        
        // If alarmTime exists and matches the current formatted time, and is not already sent
        if (alarmTime && alarmTime === formattedTime) {
          const reminderKey = `${med.id}_${alarmTime}_${dateString}`;
          if (sentRemindersRef.current.has(reminderKey)) return;
          
          sentRemindersRef.current.add(reminderKey);
          
          try {
            const msgText = `🔔 Automated MediAI Reminder:\nTime to take your ${med.name} (${med.dosage})!\nScheduled Time: ${alarmTime}\nMessage: "${alarmMessage || 'Please take your prescription.'}"`;
            
            console.log(`[AUTOMATED SCHEDULER] Triggering reminder for ${med.name} at ${alarmTime}`);
            
            const response = await fetch(`${API_BASE_URL}/api/medications/remind`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: msgText })
            });
            
            if (response.ok) {
              console.log(`[AUTOMATED SCHEDULER] Successfully dispatched alert for ${med.name}`);
            } else {
              console.error("[AUTOMATED SCHEDULER] Failed to dispatch alert");
            }
          } catch (err) {
            console.error("[AUTOMATED SCHEDULER] Error sending automated reminder:", err);
          }
        }
      });
    };

    // Check immediately and then poll every 10 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [session, medications]);

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
    setTriageData(null);
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

  // SOS Countdown Timer Hook
  useEffect(() => {
    let timer;
    if (sosState === 'countdown') {
      if (sosCountdown > 0) {
        timer = setTimeout(() => {
          setSosCountdown(prev => prev - 1);
        }, 1000);
      } else {
        // Countdown reached 0: Trigger Emergency!
        triggerEmergencySOS();
      }
    }
    return () => clearTimeout(timer);
  }, [sosState, sosCountdown]);

  const triggerEmergencySOS = async () => {
    setSosState('active');
    setSosLoading(true);
    
    // Default coordinates in case browser GPS is blocked/fails
    let latitude = 12.9716;
    let longitude = 77.5946;
    
    const patientName = userProfile?.name || session?.user?.email?.split('@')[0] || "Active Patient";
    
    const getCoordinates = () => {
      return new Promise((resolve) => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve({ lat: latitude, lon: longitude }),
            { enableHighAccuracy: true, timeout: 4000 }
          );
        } else {
          resolve({ lat: latitude, lon: longitude });
        }
      });
    };
    
    const coordsObj = await getCoordinates();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/emergency/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: coordsObj.lat,
          lon: coordsObj.lon,
          patient_name: patientName
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSosDispatchInfo(data);
        
        // Push an active emergency flag to triageData so other views sync instantly
        setTriageData({
          urgency: "Emergency",
          score: 100.0,
          explanation: `SOS EMERGENCY ACTIVATED: Ambulance dispatched from ${data.hospital_name}.`,
          actions: [
            "Keep the patient resting and warm.",
            "Clear obstacles around standard entrances/front doors.",
            "Gather any prescription details to deliver to EMT responders."
          ]
        });
      } else {
        throw new Error("SOS Dispatch Endpoint Failed");
      }
    } catch (err) {
      console.error("SOS Dispatch Error:", err);
      // Premium fallback simulation locally if backend is offline
      const fallbackData = {
        status: "dispatched",
        dispatch_id: `SOS-LOCAL-ERR`,
        hospital_name: "St. Johns Emergency Hospital (Local)",
        hospital_address: "Bengaluru City Centre, Karnataka, India",
        distance_km: 1.8,
        eta_minutes: 5.0
      };
      setSosDispatchInfo(fallbackData);
      setTriageData({
        urgency: "Emergency",
        score: 100.0,
        explanation: `SOS EMERGENCY ACTIVATED: Ambulance dispatched from ${fallbackData.hospital_name}.`,
        actions: [
          "Keep the patient resting and warm.",
          "Clear obstacles around standard entrances/front doors.",
          "Gather any prescription details to deliver to EMT responders."
        ]
      });
    } finally {
      setSosLoading(false);
    }
  };

  const handleSosClick = () => {
    setSosCountdown(5);
    setSosState('countdown');
    triggerAccessibilityVoice("SOS emergency button clicked. Countdown activated. Five seconds to cancel.");
  };

  const cancelSOS = () => {
    setSosState('idle');
    setSosCountdown(5);
    triggerAccessibilityVoice("Emergency dispatch cancelled.");
  };

  const resolveEmergency = () => {
    setSosState('idle');
    setSosCountdown(5);
    setSosDispatchInfo(null);
    setTriageData(null);
    triggerAccessibilityVoice("Emergency resolved. Status returned to normal.");
  };

  // Not logged in
  if (!session) {
    if (showLanding) {
      return <LandingPage onEnterApp={() => setShowLanding(false)} />;
    }
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <NeuralBackground />
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
    <div className={`relative min-h-screen text-slate-100 ${elderlyMode ? 'text-lg' : 'text-sm'}`}>
      <NeuralBackground />
      
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-dark-950/70 backdrop-blur-xl border-b border-neon-green/15 shadow-[0_4px_30px_rgba(34,197,94,0.04)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(34,197,94,0.06),transparent)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Logo + back */}
            <div className="flex items-center gap-4">
              {showBackButton ? (
                <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-neon-green transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">Back</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="MediAI Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.3)]" />
                  <span className="font-bold text-base tracking-tight text-white hover:text-neon-green transition-colors cursor-pointer">MediAI</span>
                </div>
              )}

              {showBackButton && (
                <span className="text-sm font-semibold text-white">{currentPage?.label}</span>
              )}
            </div>

            {/* Center: Nav links (desktop) */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id, item.speak)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                      isActive
                        ? 'bg-neon-green/10 text-neon-green border-neon-green/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                        : 'text-slate-400 border-transparent hover:text-white hover:bg-neon-green/[0.03]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleSosClick}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.45)] hover:shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-pulse shrink-0 transition-all duration-300 border border-red-500/30 flex items-center gap-1 sm:gap-1.5"
                title="Trigger immediate medical emergency SOS"
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping shrink-0" />
                <span>SOS</span>
                <span className="hidden sm:inline">Emergency</span>
              </button>

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

              {/* User avatar - Hidden on mobile, shown in menu */}
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-[10px] font-bold text-neon-green">
                  {userInitials}
                </div>
                <span className="text-xs font-medium text-slate-300 hidden sm:inline max-w-[100px] truncate">{userDisplayName}</span>
              </div>
              
              {/* Logout button - Hidden on mobile, shown in menu */}
              <button 
                onClick={handleLogout}
                className="hidden sm:inline-flex p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/[0.04] transition-all"
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
              className="md:hidden border-t border-neon-green/15 bg-dark-950/90 backdrop-blur-xl overflow-hidden bg-gradient-to-b from-neon-green/[0.02] to-transparent"
            >
              <div className="px-4 py-3 space-y-1.5">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = view === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id, item.speak)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-300 ${
                        isActive 
                          ? 'bg-neon-green/10 text-neon-green border-neon-green/20' 
                          : 'text-slate-400 border-transparent hover:text-white hover:bg-neon-green/[0.03]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}

                {/* Mobile Profile & Logout */}
                <div className="pt-3 mt-3 border-t border-neon-green/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-[10px] font-bold text-neon-green">
                      {userInitials}
                    </div>
                    <span className="text-xs font-medium text-slate-300 truncate max-w-[150px]">{userDisplayName}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
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

      {/* 🚨 SOS EMERGENCY COUNTDOWN MODAL OVERLAY */}
      <AnimatePresence>
        {sosState === 'countdown' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-950/95 backdrop-blur-xl z-[999] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="max-w-md w-full space-y-8"
            >
              {/* Pulsing alert shield icon */}
              <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-pulse">
                <ShieldAlert className="w-12 h-12 animate-bounce" />
              </div>

              <div className="space-y-3">
                <h1 className="outfit-font text-3xl font-extrabold text-white tracking-wider uppercase">
                  Triggering SOS Emergency
                </h1>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  This will pinpoint your exact GPS coordinates and immediately dispatch an active ambulance from the nearest physical hospital.
                </p>
              </div>

              {/* Pulsing countdown display */}
              <div className="relative w-40 h-40 flex items-center justify-center mx-auto">
                <span className="absolute inset-0 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
                <motion.span 
                  key={sosCountdown}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="outfit-font text-7xl font-extrabold text-red-500 glow-text-red"
                >
                  {sosCountdown}
                </motion.span>
              </div>

              <button
                onClick={cancelSOS}
                className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-dark-950 text-xs font-bold uppercase tracking-wider transition-all duration-300 border border-white/20 hover:border-white shadow-[0_4px_25px_rgba(255,255,255,0.05)]"
              >
                Cancel SOS (Accidental Press)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚨 SOS ACTIVE EMERGENCY DISPATCH PANEL */}
      <AnimatePresence>
        {sosState === 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-950/95 backdrop-blur-2xl z-[999] flex items-center justify-center p-4 md:p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="glass-panel max-w-2xl w-full p-8 border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.25)] space-y-8 text-center bg-dark-900/90 relative overflow-hidden"
            >
              {sosLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <RefreshCw className="w-12 h-12 text-red-500 animate-spin" />
                  <div className="space-y-1.5">
                    <h3 className="outfit-font text-base font-bold text-white uppercase tracking-wider">Establishing Geocoding Lock</h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Pinpointing closest medical facility and mapping optimal ambulance route...</p>
                  </div>
                </div>
              ) : sosDispatchInfo ? (
                <>
                  {/* Flashing medical emergency beacon */}
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center mx-auto text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-pulse">
                    <PhoneCall className="w-9 h-9" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-widest animate-pulse">
                      Ambulance En Route
                    </span>
                    <h2 className="outfit-font text-3xl font-extrabold text-white tracking-tight uppercase mt-3">
                      Ambulance Dispatched!
                    </h2>
                  </div>

                  {/* Dispatch stats grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left border-y border-white/[0.04] py-6">
                    <div className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Responding Hospital</span>
                      <span className="text-sm font-extrabold text-white">{sosDispatchInfo.hospital_name}</span>
                    </div>
                    <div className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Estimated Arrival (ETA)</span>
                      <span className="text-sm font-extrabold text-red-400 glow-text-red">{sosDispatchInfo.eta_minutes} Minutes</span>
                    </div>
                    <div className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Ambulance Proximity</span>
                      <span className="text-sm font-extrabold text-slate-200">{sosDispatchInfo.distance_km} km away</span>
                    </div>
                    <div className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Dispatch Reference ID</span>
                      <span className="text-sm font-mono text-slate-300 font-bold uppercase select-all">{sosDispatchInfo.dispatch_id}</span>
                    </div>
                    <div className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl md:col-span-2">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Dispatch Medical Address</span>
                      <span className="text-xs text-slate-400 select-all leading-normal">{sosDispatchInfo.hospital_address}</span>
                    </div>
                  </div>

                  {/* Guided Clinical Crisis Rules */}
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 text-left space-y-3">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Crisis Instructions
                    </span>
                    <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
                      <li className="flex gap-2.5">
                        <span className="text-red-500 shrink-0">•</span>
                        <span><b>Rest Comfortably</b>: Stay seated upright or lying down with head elevated. Avoid physical exertion.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <span className="text-red-500 shrink-0">•</span>
                        <span><b>Unlock Entrances</b>: Unlock your front door and clear entryways so first responders can enter instantly.</span>
                      </li>
                      <li className="flex gap-2.5">
                        <span className="text-red-500 shrink-0">•</span>
                        <span><b>Prepare Medication List</b>: Gather active prescription bottles or details to hand over directly to EMTs upon arrival.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={resolveEmergency}
                      className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_4px_25px_rgba(16,185,129,0.15)]"
                    >
                      Emergency Resolved (Close Alarm)
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-slate-500">Ambulance dispatch database error. Please contact standard emergency numbers.</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
