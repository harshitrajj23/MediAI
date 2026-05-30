import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronUp,
  Terminal,
  Cpu,
  Video,
  ExternalLink,
  Flame,
  Bell,
  HeartPulse,
  Shield,
  Sparkles,
  RefreshCw,
  Sparkle
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const BODY_PARTS = {
  head: {
    name: "Neurological & Cerebral System",
    label: "Head / Brain",
    keywords: ["head", "brain", "headache", "migraine", "dizzy", "dizziness", "confusion", "slurred", "skull", "neurolog"],
    coordinates: { x: 100, y: 32 },
    pointerPath: "M 42 32 L 85 32",
    side: "left",
    color: "from-purple-500 to-indigo-500",
    actions: ["Rest in a quiet, dark room.", "Stay hydrated and avoid bright screens.", "Monitor for neck stiffness or sudden confusion."]
  },
  eyes: {
    name: "Visual & Ophthalmic System",
    label: "Eyes / Vision",
    keywords: ["eye", "vision", "blind", "conjunctiv", "glaucoma", "cataract", "redness", "burning", "sight", "cornea", "pupil", "ophthalm"],
    coordinates: { x: 100, y: 45 },
    pointerPath: "M 115 45 L 158 45",
    side: "right",
    color: "from-cyan-500 to-blue-500",
    actions: ["Avoid straining eyes with digital devices.", "Use lubricating eye drops if recommended.", "Protect eyes from bright light."]
  },
  chest: {
    name: "Cardiovascular & Respiratory System",
    label: "Heart / Chest / Lungs",
    keywords: ["chest", "heart", "cardio", "breath", "lung", "cough", "respir", "shortness", "palpitation", "breathless", "asthma"],
    coordinates: { x: 100, y: 76 },
    pointerPath: "M 42 76 L 85 76",
    side: "left",
    color: "from-red-500 to-rose-500",
    actions: ["Rest in an upright position.", "Avoid sudden physical exertion.", "Seek emergency services if chest pain spreads to arm or jaw."]
  },
  stomach: {
    name: "Gastrointestinal & Digestive System",
    label: "Digestive / Stomach",
    keywords: ["stomach", "abdomen", "abdom", "belly", "nausea", "vomit", "digest", "liver", "gastric", "appendix", "intestine", "gut", "cramp", "diarrhea"],
    coordinates: { x: 100, y: 108 },
    pointerPath: "M 115 108 L 158 108",
    side: "right",
    color: "from-amber-500 to-orange-500",
    actions: ["Stick to small, bland meals (BRAT diet).", "Stay hydrated with electrolytes.", "Avoid carbonated, fatty, or highly acidic foods."]
  },
  limbs: {
    name: "Musculoskeletal & Motor System",
    label: "Limbs / Joints / Motor",
    keywords: ["arm", "leg", "joint", "limb", "shoulder", "knee", "foot", "hand", "muscle", "bone", "numbness in arm", "weakness in leg", "sprain"],
    coordinates: { x: 74, y: 135 },
    pointerPath: "M 42 135 L 68 135",
    side: "left",
    color: "from-emerald-500 to-teal-500",
    actions: ["Rest the affected joint or limb (R.I.C.E protocol).", "Apply ice wraps for swelling.", "Avoid heavy lifting or high impact activities."]
  },
  skin: {
    name: "Integumentary & Dermatological System",
    label: "Skin & Dermal Wounds",
    keywords: ["skin", "rash", "wound", "cut", "burn", "lesion", "dermat", "itch", "acne", "eczema", "psoriasis", "dermal", "cellulitis"],
    coordinates: { x: 125, y: 150 },
    pointerPath: "M 132 150 L 158 150",
    side: "right",
    color: "from-fuchsia-500 to-pink-500",
    actions: ["Clean the wound area with mild soap and clean water.", "Apply sterile dressings, avoiding scratching.", "Monitor closely for spreading redness or heat."]
  }
};

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
  const [terminalLogs, setTerminalLogs] = useState([]);

  // Bio-Scanner State Additions
  const [bodyStates, setBodyStates] = useState({
    head: 'healthy',
    eyes: 'healthy',
    chest: 'healthy',
    stomach: 'healthy',
    limbs: 'healthy',
    skin: 'healthy'
  });
  const [selectedPart, setSelectedPart] = useState(null);

  // Initialize and automatically compute user's body issues history
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const localKey = `medi_ai_body_states_${session.user.id}`;
    const cached = localStorage.getItem(localKey);
    
    if (cached) {
      try {
        setBodyStates(JSON.parse(cached));
        return;
      } catch (e) {
        console.error("Error parsing cached body states:", e);
      }
    }
    
    // Auto-detect based on historical records if no cache exists
    const computedStates = {
      head: 'healthy',
      eyes: 'healthy',
      chest: 'healthy',
      stomach: 'healthy',
      limbs: 'healthy',
      skin: 'healthy'
    };

    const allHistoryTexts = [];
    
    // 1. Scan chatsHistory messages
    if (chatsHistory && chatsHistory.length > 0) {
      chatsHistory.forEach(chat => {
        if (chat.content) {
          allHistoryTexts.push(chat.content.toLowerCase());
        }
      });
    }

    // 2. Scan current triage explanation
    if (lastTriage && lastTriage.explanation) {
      allHistoryTexts.push(lastTriage.explanation.toLowerCase());
    }

    // 3. Scan active medications
    const medicationsText = medications.map(m => m.name.toLowerCase() + " " + (m.dosage || "").toLowerCase()).join(" ");
    
    // Perform keyword analysis across collected texts
    Object.keys(BODY_PARTS).forEach(part => {
      const metadata = BODY_PARTS[part];
      
      // Check if any history text matches keywords
      const matchesHistory = allHistoryTexts.some(text => 
        metadata.keywords.some(keyword => text.includes(keyword))
      );

      // Check if medications match keywords
      const matchesMedication = metadata.keywords.some(keyword => medicationsText.includes(keyword));

      if (matchesMedication) {
        computedStates[part] = 'medication';
      } else if (matchesHistory) {
        computedStates[part] = 'active';
      }
    });

    setBodyStates(computedStates);
    localStorage.setItem(localKey, JSON.stringify(computedStates));

  }, [session, chatsHistory, medications, triageData]);

  // Handler to manually update a body part's clinical state
  const handleUpdateBodyPartStatus = (part, status) => {
    if (!session?.user?.id) return;
    const nextStates = { ...bodyStates, [part]: status };
    setBodyStates(nextStates);
    
    const localKey = `medi_ai_body_states_${session.user.id}`;
    localStorage.setItem(localKey, JSON.stringify(nextStates));
    
    // Add dynamic clinical audit logs into scanner terminal feed
    const timeStr = new Date().toLocaleTimeString();
    const systemName = BODY_PARTS[part].label;
    let logText = "";
    let logType = "info";
    
    if (status === 'healthy') {
      logText = `${systemName} cleared. System state healthy.`;
      logType = "success";
    } else if (status === 'medication') {
      logText = `${systemName} mapped to active medication protocols.`;
      logType = "success";
    } else {
      logText = `${systemName} clinical risk warning flagged manually.`;
      logType = "warning";
    }
    
    setTerminalLogs(prev => [
      { id: Date.now(), time: timeStr, text: logText, type: logType },
      ...prev.slice(0, 5)
    ]);
  };

  const renderSvgBody = () => {
    return (
      <div className="relative w-full aspect-[200/220] max-h-[330px] mx-auto select-none flex items-center justify-center overflow-visible bg-dark-950/20 rounded-3xl border border-white/[0.02] p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
        {/* Futuristic Grid Overlay Background */}
        <div className="absolute inset-2 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:12px_12px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none rounded-2xl" />

        {/* Medical crosshairs and frame corners */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-cyan-500/20 pointer-events-none" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-cyan-500/20 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-cyan-500/20 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-cyan-500/20 pointer-events-none" />

        {/* Radiology watermark markers */}
        <div className="absolute bottom-3 left-4 text-[7px] font-mono text-cyan-500/30 tracking-widest uppercase pointer-events-none select-none">
          RAD: POSTERIOR-ANTERIOR
        </div>
        <div className="absolute top-3 right-4 text-[7px] font-mono text-cyan-500/30 tracking-widest uppercase pointer-events-none select-none">
          SYS: AUTO_SCAN // OK
        </div>

        {/* X-Ray Radiographic Skeleton Image */}
        <img 
          src="/human_xray.png" 
          alt="Clinical Radiographic X-Ray" 
          className="h-[90%] w-auto object-contain opacity-80 mix-blend-screen select-none pointer-events-none filter brightness-110 contrast-125 saturate-50 drop-shadow-[0_0_12px_rgba(6,182,212,0.2)] animate-[pulse_8s_ease-in-out_infinite]"
        />

        {/* Scanning laser beam sweep */}
        <div className="absolute top-3 bottom-3 left-3 right-3 overflow-hidden rounded-2xl pointer-events-none">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent animate-[scan_4.5s_ease-in-out_infinite]" />
        </div>

        {/* SVG overlay for pointer lines and interactive hotspots */}
        <svg viewBox="0 0 200 220" className="absolute inset-0 w-full h-full select-none overflow-visible pointer-events-none z-20">
          <defs>
            <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-yellow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* High-tech bio-scanner mesh circles and grids in background */}
          <g opacity="0.05">
            <circle cx="100" cy="110" r="95" fill="none" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="3,6" />
            <circle cx="100" cy="110" r="75" fill="none" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="2,4" />
            <line x1="100" y1="5" x2="100" y2="215" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="5,5" />
            <line x1="5" y1="110" x2="195" y2="110" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="5,5" />
          </g>

          {/* Dynamic pointer lines connecting sidebars to central anatomy */}
          {Object.keys(BODY_PARTS).map(part => {
            const p = BODY_PARTS[part];
            const state = bodyStates[part];
            const isRed = state === 'active';
            const isYellow = state === 'medication';
            const lineColor = isRed ? '#f87171' : isYellow ? '#fbbf24' : 'rgba(255,255,255,0.06)';
            
            return (
              <g key={`pointer-${part}`}>
                <path 
                  d={p.pointerPath} 
                  fill="none" 
                  stroke={lineColor} 
                  strokeWidth="0.8" 
                  strokeDasharray={state !== 'healthy' ? "2,2" : "1,3"} 
                  className="transition-colors duration-500"
                />
                <circle 
                  cx={p.side === 'left' ? 42 : 158} 
                  cy={p.coordinates.y} 
                  r="1.5" 
                  fill={lineColor} 
                  className="transition-colors duration-500"
                />
              </g>
            );
          })}

          {/* Glowing Beacons (Interactive) */}
          {Object.keys(BODY_PARTS).map(part => {
            const p = BODY_PARTS[part];
            const state = bodyStates[part];
            const isRed = state === 'active';
            const isYellow = state === 'medication';
            
            let colorHex = "#06b6d4"; // Cyan for healthy
            let glowFilter = "url(#glow-green)";
            
            if (isRed) {
              colorHex = "#ef4444"; // Red for active issues
              glowFilter = "url(#glow-red)";
            } else if (isYellow) {
              colorHex = "#f59e0b"; // Yellow for on meds
              glowFilter = "url(#glow-yellow)";
            }

            return (
              <g 
                key={`hotspot-${part}`} 
                className="cursor-pointer group/node pointer-events-auto"
                onClick={() => setSelectedPart(part)}
              >
                {/* Larger hover target area */}
                <circle 
                  cx={p.coordinates.x} 
                  cy={p.coordinates.y} 
                  r="12" 
                  fill="transparent" 
                  className="group-hover/node:fill-white/5 transition-colors duration-300"
                />

                {/* Pulsing ring for warning states */}
                {state !== 'healthy' && (
                  <circle 
                    cx={p.coordinates.x} 
                    cy={p.coordinates.y} 
                    r="8.5" 
                    fill="none" 
                    stroke={colorHex} 
                    strokeWidth="1.5"
                    opacity="0.8"
                    className="animate-ping origin-center"
                    style={{ animationDuration: isRed ? '1.4s' : '2.2s' }}
                  />
                )}

                {/* Central solid glow beacon */}
                <circle 
                  cx={p.coordinates.x} 
                  cy={p.coordinates.y} 
                  r={state !== 'healthy' ? "4.5" : "3.5"} 
                  fill={colorHex} 
                  filter={state !== 'healthy' ? glowFilter : ""} 
                  className="transition-all duration-500 group-hover/node:scale-125 shadow-lg"
                />

                {/* Micro center dot for medical accuracy look */}
                {state !== 'healthy' && (
                  <circle 
                    cx={p.coordinates.x} 
                    cy={p.coordinates.y} 
                    r="1.5" 
                    fill="#ffffff" 
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Telemetry log simulator
  useEffect(() => {
    const initialLogs = [
      { id: 1, time: "09:41:02", text: "Grounded RAG guidelines matched successfully.", type: "success" },
      { id: 2, time: "09:41:05", text: "Mistral Large clinical orchestrator online.", type: "info" },
      { id: 3, time: "09:41:08", text: "PubMedBERT symptom extraction verified.", type: "success" },
      { id: 4, time: "09:41:12", text: "Overpass Geolocation API active on node 7.", type: "info" }
    ];
    setTerminalLogs(initialLogs);

    const logPhrases = [
      { text: "BGE vector embeddings computed cleanly.", type: "success" },
      { text: "Telehealth Zoom room credential locked.", type: "info" },
      { text: "Symptom extraction weights optimized.", type: "success" },
      { text: "Telegram pill scheduler synchronizing...", type: "warning" },
      { text: "Telemetry health handshake established.", type: "success" }
    ];

    const interval = setInterval(() => {
      const phrase = logPhrases[Math.floor(Math.random() * logPhrases.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setTerminalLogs(prev => [
        { id: Date.now(), time: timeStr, text: phrase.text, type: phrase.type },
        ...prev.slice(0, 5)
      ]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

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
      case "Emergency": 
        return { 
          bg: 'bg-red-500/10 border-red-500/30', 
          text: 'text-red-400', 
          dot: 'bg-red-500', 
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]',
          label: 'Critical Priority Warning' 
        };
      case "Visit Clinic Soon": 
        return { 
          bg: 'bg-amber-500/10 border-amber-500/30', 
          text: 'text-amber-400', 
          dot: 'bg-amber-500', 
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
          label: 'Clinical Review Required' 
        };
      case "Home Care Recommended": 
        return { 
          bg: 'bg-emerald-500/10 border-emerald-500/30', 
          text: 'text-emerald-400', 
          dot: 'bg-emerald-500', 
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
          label: 'Home Care Care Plan Online' 
        };
      default: 
        return { 
          bg: 'bg-dark-900/40 border-dark-800', 
          text: 'text-slate-400', 
          dot: 'bg-slate-500', 
          glow: '',
          label: 'No Triage Scans Performed' 
        };
    }
  };

  const tc = getTriageColor();

  const features = [
    {
      id: 'chat',
      icon: MessageSquare,
      color: 'text-neon-green group-hover:text-dark-950',
      bgColor: 'bg-neon-green/10 group-hover:bg-neon-green transition-all duration-300',
      title: 'Symptom Check Chat',
      desc: 'Describe your symptoms. Features premium Mistral Large RAG pipelines and PubMed clinical guidance matching.',
      badge: 'Clinically Grounded',
      badgeColor: 'border-neon-green/30 text-neon-green bg-neon-green/5',
      speak: 'Symptom checker'
    },
    {
      id: 'vision',
      icon: Eye,
      color: 'text-cyan-400 group-hover:text-dark-950',
      bgColor: 'bg-cyan-400/10 group-hover:bg-cyan-400 transition-all duration-300',
      title: 'Vision Labs AI',
      desc: 'Upload wound, eye, or skin photos. Our local CLIP computer vision engine scores infection severity instantly.',
      badge: 'Visual Diagnostics',
      badgeColor: 'border-cyan-400/30 text-cyan-400 bg-cyan-400/5',
      speak: 'Vision scanner'
    },
    {
      id: 'meds',
      icon: Pill,
      color: 'text-fuchsia-400 group-hover:text-dark-950',
      bgColor: 'bg-fuchsia-400/10 group-hover:bg-fuchsia-400 transition-all duration-300',
      title: 'Medications adherence',
      desc: `Track your prescriptions and dosage times. Active schedule dispatches alerts instantly.`,
      badge: `${medications.length} Active Alarms`,
      badgeColor: 'border-fuchsia-400/30 text-fuchsia-400 bg-fuchsia-400/5',
      speak: 'Medications'
    },
    {
      id: 'docs',
      icon: CalendarDays,
      color: 'text-amber-400 group-hover:text-dark-950',
      bgColor: 'bg-amber-400/10 group-hover:bg-amber-400 transition-all duration-300',
      title: ' telemedicine Match',
      desc: 'Dynamic local doctor matches using geolocated OSM Overpass query engines centered on your live coordinates.',
      badge: `${consultations.length} Consultations Booked`,
      badgeColor: 'border-amber-400/30 text-amber-400 bg-amber-400/5',
      speak: 'Appointments'
    },
  ];

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } }
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }
  };

  // Compute health index for stats ribbon
  const healthyCount = Object.values(bodyStates).filter(s => s === 'healthy').length;
  const healthIndex = Math.round((healthyCount / Object.keys(bodyStates).length) * 100);

  const statCards = [
    { icon: MessageSquare, value: chatsHistory.length, label: 'Diagnostic Scans', sub: 'Symptom evaluations', gradient: 'from-neon-green/20 via-emerald-500/20 to-neon-green/20', iconColor: 'text-neon-green', iconBg: 'bg-neon-green/10' },
    { icon: Pill, value: medications.length, label: 'Active Medications', sub: 'Scheduled alarms', gradient: 'from-fuchsia-500/20 via-purple-500/20 to-fuchsia-500/20', iconColor: 'text-fuchsia-400', iconBg: 'bg-fuchsia-500/10' },
    { icon: CalendarDays, value: consultations.length, label: 'Consultations', sub: 'Doctors matched', gradient: 'from-amber-500/20 via-orange-500/20 to-amber-500/20', iconColor: 'text-amber-400', iconBg: 'bg-amber-500/10' },
    { icon: HeartPulse, value: `${healthIndex}%`, label: 'Health Index', sub: `${healthyCount}/${Object.keys(bodyStates).length} systems clear`, gradient: 'from-cyan-500/20 via-blue-500/20 to-cyan-500/20', iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PREMIUM SYSTEM HEADER                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/20 animate-pulse">
              System Online
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="outfit-font font-bold tracking-tight text-3xl">
            <span className="text-white">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</span>
            {userProfile?.name && <span className="text-gradient-green">, {userProfile.name.split(' ')[0]}</span>}
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 max-w-md">Welcome to your personal clinical health companion dashboard.</p>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* GREEN GLASSMORPHIC TABS                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="flex gap-1.5 p-1 bg-dark-900/40 backdrop-blur-xl border border-neon-green/10 rounded-2xl w-fit"
      >
        {['overview', 'profile'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-300 capitalize ${
              tab === t 
                ? 'bg-neon-green/10 text-neon-green border-neon-green/20 shadow-[0_0_15px_rgba(34,197,94,0.08)]' 
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
          >
            {t === 'overview' ? 'Agent HUD Overview' : 'Patient Records & Logs'}
          </button>
        ))}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* OVERVIEW PANEL                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {tab === 'overview' ? (
        <div className="space-y-6">
          
          {/* ──── HERO STATS RIBBON ──── */}
          <motion.div 
            variants={stagger} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {statCards.map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <motion.div key={i} variants={fadeUp} className="relative group">
                  {/* Gradient border glow on hover */}
                  <div className={`absolute -inset-[1px] bg-gradient-to-r ${stat.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px]`} />
                  <div className="relative bg-dark-900/60 backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 group-hover:border-transparent transition-all duration-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                        <StatIcon className={`w-4 h-4 ${stat.iconColor}`} />
                      </div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-black text-white font-mono block">{stat.value}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">{stat.sub}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ──── MAIN BENTO GRID ──── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ═══════ BIO-SCANNER PANEL (5 columns) ═══════ */}
            <div className="lg:col-span-5 bg-dark-900/30 backdrop-blur-xl border border-white/[0.04] p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[560px]">
              <div className="absolute left-[-20%] top-[-20%] w-[60%] h-[60%] rounded-full bg-neon-green/5 blur-[80px]" />
              <div className="absolute right-[-20%] bottom-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/5 blur-[80px]" />
              
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-4 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  <div>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-neon-green block">Radiographic Bio-Scan</span>
                    <h3 className="outfit-font font-bold text-white tracking-tight text-base mt-0.5">Interactive X-Ray Scanner</h3>
                  </div>
                </div>
                <Activity className="w-4 h-4 text-neon-green animate-pulse" />
              </div>

              {/* Scanning laser beam animation */}
              <div className="absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon-green/45 to-transparent animate-[scan_4s_ease-in-out_infinite] pointer-events-none select-none z-10" />

              <div className="relative flex-1 flex items-center justify-center py-2">
                {/* Left Side Labels Overlay */}
                <div className="absolute left-0 top-0 bottom-0 w-[55px] flex flex-col justify-between py-4 text-left select-none z-20">
                  {Object.keys(BODY_PARTS).filter(k => BODY_PARTS[k].side === 'left').map(k => {
                    const p = BODY_PARTS[k];
                    const state = bodyStates[k];
                    const color = state === 'active' ? 'text-red-400' : state === 'medication' ? 'text-amber-400' : 'text-slate-500';
                    
                    return (
                      <button 
                        key={`sidebar-${k}`} 
                        className="text-left py-1 hover:text-white transition-all select-all animate-fade-in"
                        onClick={() => setSelectedPart(k)}
                      >
                        <span className={`text-[9px] font-mono font-black uppercase tracking-wider block truncate ${color}`}>
                          {p.label.split(" / ")[0]}
                        </span>
                        <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-widest block font-mono mt-0.5">
                          {state === 'active' ? '🔴 Active' : state === 'medication' ? '🟡 Meds' : '🟢 Healthy'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Holographic Body Canvas */}
                {renderSvgBody()}

                {/* Right Side Labels Overlay */}
                <div className="absolute right-0 top-0 bottom-0 w-[55px] flex flex-col justify-between py-4 text-right select-none z-20">
                  {Object.keys(BODY_PARTS).filter(k => BODY_PARTS[k].side === 'right').map(k => {
                    const p = BODY_PARTS[k];
                    const state = bodyStates[k];
                    const color = state === 'active' ? 'text-red-400' : state === 'medication' ? 'text-amber-400' : 'text-slate-500';
                    
                    return (
                      <button 
                        key={`sidebar-${k}`} 
                        className="text-right py-1 hover:text-white transition-all select-all animate-fade-in"
                        onClick={() => setSelectedPart(k)}
                      >
                        <span className={`text-[9px] font-mono font-black uppercase tracking-wider block truncate ${color}`}>
                          {p.label.split(" / ")[0]}
                        </span>
                        <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-widest block font-mono mt-0.5">
                          {state === 'active' ? '🔴 Active' : state === 'medication' ? '🟡 Meds' : '🟢 Healthy'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/[0.04] pt-3 text-center z-10">
                <p className="text-[9px] text-slate-500 font-mono tracking-tight">
                  Anatomical nodes synced live to patient health records.
                </p>
              </div>
            </div>

            {/* ═══════ RIGHT CONTENT COLUMN (7 columns) ═══════ */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              
              {/* ──── TOP ROW: Triage + Telehealth side-by-side ──── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* TRIAGE STATUS CARD */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative overflow-hidden bg-dark-900/20 backdrop-blur-xl border rounded-3xl p-5 flex flex-col justify-between transition-all duration-500 ${tc.bg} ${tc.border} ${tc.glow}`}
                >
                  {/* Decorative top accent line */}
                  <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent ${
                    tc.text === 'text-red-400' ? 'via-red-500/60' : 
                    tc.text === 'text-amber-400' ? 'via-amber-500/60' : 
                    tc.text === 'text-emerald-400' ? 'via-emerald-500/60' : 'via-slate-500/20'
                  } to-transparent`} />
                  <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full filter blur-[30px] opacity-10 bg-white" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${tc.dot} ${lastTriage.urgency === 'Emergency' ? 'animate-ping' : ''}`} />
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest ${tc.text}`}>
                        {tc.label}
                      </span>
                    </div>
                    <h3 className="outfit-font text-lg font-bold text-white tracking-tight">
                      {lastTriage.urgency === 'None' ? 'Awaiting Input' : lastTriage.urgency}
                    </h3>
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                      {lastTriage.explanation}
                    </p>
                  </div>

                  {lastTriage.urgency !== 'None' && (
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.04]">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Clinical Score</span>
                      <span className={`text-xl font-black ${tc.text} font-mono`}>
                        {lastTriage.score}%
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* TELEHEALTH PORTAL CARD */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-dark-900/30 to-dark-900/20 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-5 flex flex-col justify-between"
                >
                  {/* Decorative top accent line */}
                  <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[8px] font-extrabold uppercase tracking-widest text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 animate-pulse">
                        Live Portal
                      </span>
                      <h3 className="outfit-font font-bold text-white tracking-tight text-sm mt-2">Telemedicine Rooms</h3>
                    </div>
                    <Video className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>

                  {consultations.length === 0 ? (
                    <div className="py-4 text-center border border-white/[0.04] rounded-2xl bg-dark-950/30 flex-1 flex flex-col justify-center items-center">
                      <p className="text-[11px] text-slate-500">No consultations scheduled.</p>
                      <button 
                        onClick={() => setView('docs', 'Appointments')}
                        className="text-[10px] text-indigo-400 font-bold hover:text-white mt-2 transition-colors inline-flex items-center gap-1"
                      >
                        Match specialists <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1 flex flex-col justify-center">
                      {consultations.slice(0, 2).map((consult, i) => (
                        <div key={consult.id || i} className="bg-dark-950/60 border border-white/[0.03] rounded-2xl p-3 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[11px] font-bold text-white block">{consult.doctor_name}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{consult.specialty}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-indigo-400 block">{consult.time}</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5">{consult.date}</span>
                            </div>
                          </div>
                          {consult.zoom_link && (
                            <a 
                              href={consult.zoom_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full py-1.5 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                            >
                              <ExternalLink className="w-3 h-3" /> Launch Consult
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* ──── FEATURE ACTION CARDS (2x2) ──── */}
              <div className="space-y-3">
                <h2 className="outfit-font text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnostic Modules</h2>
                <motion.div 
                  variants={stagger} 
                  initial="hidden" 
                  animate="show" 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {features.map(f => {
                    const FeatureIcon = f.icon;
                    const gradientColors = {
                      'chat': 'from-neon-green/25 via-emerald-500/25 to-neon-green/25',
                      'vision': 'from-cyan-400/25 via-blue-500/25 to-cyan-400/25',
                      'meds': 'from-fuchsia-500/25 via-purple-500/25 to-fuchsia-500/25',
                      'docs': 'from-amber-500/25 via-orange-500/25 to-amber-500/25'
                    };
                    const accentColors = {
                      'chat': 'via-neon-green/40',
                      'vision': 'via-cyan-400/40',
                      'meds': 'via-fuchsia-400/40',
                      'docs': 'via-amber-400/40'
                    };
                    return (
                      <motion.button
                        key={f.id}
                        variants={fadeUp}
                        onClick={() => setView(f.id, f.speak)}
                        className="relative group text-left"
                      >
                        {/* Animated gradient border on hover */}
                        <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradientColors[f.id] || ''} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px]`} />
                        <div className="relative bg-dark-900/40 backdrop-blur-xl border border-white/[0.04] p-5 rounded-3xl overflow-hidden group-hover:border-transparent transition-all duration-500">
                          <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                          </div>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-2xl ${f.bgColor} flex items-center justify-center`}>
                              <FeatureIcon className={`w-4.5 h-4.5 ${f.color}`} />
                            </div>
                            <span className={`px-2 py-0.5 text-[8px] font-bold rounded-lg border uppercase ${f.badgeColor}`}>
                              {f.badge}
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-white mb-1.5 text-xs tracking-tight">{f.title}</h3>
                          <p className="text-slate-400 leading-relaxed text-[11px]">{f.desc}</p>
                          
                          {/* Bottom accent bar */}
                          <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${accentColors[f.id] || ''} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>

              {/* ──── PILL TIMELINE (horizontal) ──── */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-dark-900/30 backdrop-blur-xl border border-white/[0.04] rounded-3xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-fuchsia-400" />
                    <h3 className="outfit-font text-xs font-bold text-slate-400 uppercase tracking-widest">Pill Timeline</h3>
                  </div>
                  {medications.length > 0 && (
                    <button onClick={() => setView('meds', 'Medications')} className="text-[10px] text-neon-green hover:text-white transition-colors flex items-center gap-1 font-bold">
                      View all ({medications.length}) <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                {medications.length === 0 ? (
                  <div className="py-6 text-center border border-white/[0.04] rounded-2xl bg-dark-950/30">
                    <p className="text-[11px] text-slate-500">No scheduled prescriptions.</p>
                    <button 
                      onClick={() => setView('meds', 'Medications')}
                      className="text-[10px] text-neon-green font-bold hover:text-white mt-2 transition-colors inline-flex items-center gap-1"
                    >
                      Set alarm <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                    {medications.slice(0, 5).map(med => {
                      let timeVal = "";
                      let isTelegram = false;
                      
                      if (Array.isArray(med.timing)) {
                        med.timing.forEach(t => {
                          if (t.startsWith("time:")) timeVal = t.substring(5);
                          else if (t.startsWith("msg:")) isTelegram = true;
                        });
                      }
                      
                      return (
                        <div key={med.id} className="min-w-[180px] bg-dark-950/50 border border-white/[0.03] rounded-2xl p-3.5 hover:border-white/[0.08] transition-all duration-200 shrink-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-white">{med.name}</span>
                            {isTelegram && (
                              <span className="text-[7px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.5 rounded font-extrabold uppercase font-mono">
                                BOT
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block">{med.dosage}</span>
                          {timeVal && (
                            <span className="text-[9px] text-neon-green flex items-center gap-1 bg-neon-green/10 border border-neon-green/20 px-1.5 py-0.5 rounded font-bold mt-2 w-fit animate-pulse">
                              <Clock className="w-2.5 h-2.5" /> {timeVal}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Glowing blurred glassmorphic overlay modal for anatomical updates */}
          <AnimatePresence>
            {selectedPart && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-md p-4"
                onClick={() => setSelectedPart(null)}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 15 }} 
                  transition={{ duration: 0.25 }}
                  className="bg-dark-900/90 border border-white/[0.08] rounded-3xl p-6 max-w-md w-full relative overflow-hidden shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full filter blur-3xl opacity-15 bg-gradient-to-br ${BODY_PARTS[selectedPart].color}`} />

                  <div className="flex justify-between items-start mb-5 z-10 relative">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${BODY_PARTS[selectedPart].color} flex items-center justify-center`}>
                        <HeartPulse className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-500 block">Diagnostic System HUD</span>
                        <h3 className="outfit-font text-base font-bold text-white tracking-tight mt-0.5">
                          {BODY_PARTS[selectedPart].label}
                        </h3>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedPart(null)} 
                      className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                  </div>

                  <div className="space-y-5 z-10 relative">
                    <div className="bg-dark-950/60 border border-white/[0.03] rounded-2xl p-4">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-3">Diagnostic Status</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'active', label: 'Active', icon: '🔴', color: 'border-red-500/20 text-red-400 bg-red-500/5', hover: 'hover:border-red-500/50' },
                          { id: 'medication', label: 'On Meds', icon: '🟡', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5', hover: 'hover:border-amber-500/50' },
                          { id: 'healthy', label: 'Resolved', icon: '🟢', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5', hover: 'hover:border-emerald-500/50' }
                        ].map(s => {
                          const isActive = bodyStates[selectedPart] === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                handleUpdateBodyPartStatus(selectedPart, s.id);
                              }}
                              className={`py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                                isActive 
                                  ? s.color + ' border-white/20 shadow-inner' 
                                  : 'border-white/[0.04] text-slate-400 bg-dark-950/20 ' + s.hover
                              }`}
                            >
                              <span className="text-sm">{s.icon}</span>
                              <span>{s.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Ongoing Prescription Alignment</span>
                      {medications.filter(m => 
                        BODY_PARTS[selectedPart].keywords.some(k => m.name.toLowerCase().includes(k))
                      ).length === 0 ? (
                        <div className="p-3 bg-dark-950/30 border border-white/[0.02] rounded-2xl text-center">
                          <p className="text-xs text-slate-500">No active prescriptions mapped for this system.</p>
                        </div>
                      ) : (
                        medications.filter(m => 
                          BODY_PARTS[selectedPart].keywords.some(k => m.name.toLowerCase().includes(k))
                        ).map(med => (
                          <div key={med.id} className="p-3 bg-dark-950/50 border border-white/[0.03] rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-white block">{med.name}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5 block">{med.dosage}</span>
                            </div>
                            <span className="text-[9px] bg-neon-green/10 text-neon-green border border-neon-green/20 px-1.5 py-0.5 rounded font-bold uppercase">Active Alarm</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 space-y-2.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
                        <Shield className="w-3 h-3 text-neon-green" /> Guided Clinical Actions
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                        {BODY_PARTS[selectedPart].actions.map((act, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-neon-green shrink-0">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* PATIENT RECORDS & CHAT HISTORY LOGS TAB */
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          {/* Left Side: Profile Edit Panel */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-dark-900/30 backdrop-blur-xl border border-white/[0.04] rounded-3xl p-6">
              <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-4">
                <div>
                  <h2 className="outfit-font text-base font-bold text-white">Patient Record System</h2>
                  <p className="text-[10px] text-slate-500 mt-1">Configure your personal profile details and language preferences.</p>
                </div>
                {!editingProfile ? (
                  <button onClick={() => setEditingProfile(true)} className="text-xs text-neon-green hover:text-white flex items-center gap-1.5 transition-colors font-bold">
                    <Edit className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                ) : (
                  <button onClick={() => setEditingProfile(false)} className="text-xs text-slate-400 hover:text-white transition-colors">Cancel</button>
                )}
              </div>

              {profileMsg && (
                <div className="p-3 bg-neon-green/10 border border-neon-green/20 text-neon-green rounded-xl text-xs mb-6 font-medium animate-pulse">
                  {profileMsg}
                </div>
              )}

              {editingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Patient Name</label>
                    <input type="text" required value={profileName} onChange={e => setProfileName(e.target.value)} className="input-field w-full text-sm py-3" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Telegram Phone Alert Link</label>
                    <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="input-field w-full text-sm py-3" placeholder="+91 99999-99999" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Communication Language</label>
                    <select value={profileLang} onChange={e => setProfileLang(e.target.value)} className="input-field w-full text-sm py-3 cursor-pointer">
                      {['English', 'Hindi', 'Spanish', 'French', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Marathi'].map(l => <option key={l} value={l} className="bg-dark-950 text-white">{l}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={updating} className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(34,197,94,0.15)]">
                    {updating ? 'Saving changes...' : 'Save profile changes'}
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Patient Name</span>
                    <span className="text-sm font-bold text-white">{profileName || '—'}</span>
                  </div>
                  <div className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Email Account</span>
                    <span className="text-sm text-slate-300 font-mono select-all truncate block">{session.user.email}</span>
                  </div>
                  <div className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Telegram Phone Alert Link</span>
                    <span className="text-sm text-slate-300">{profilePhone || '—'}</span>
                  </div>
                  <div className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Translation Language</span>
                    <span className="text-sm text-neon-green font-bold">{profileLang}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Chat Logs History */}
          <div className="lg:col-span-2 bg-dark-900/30 backdrop-blur-xl border border-white/[0.04] rounded-3xl p-6 flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.04]">
              <div>
                <h3 className="outfit-font text-base font-bold text-white">Symptom Chat History</h3>
                <p className="text-[10px] text-slate-500 mt-1">Symptom check sessions securely stored in your profile.</p>
              </div>
              <span className="text-[9px] bg-white/[0.04] border border-white/[0.06] text-slate-400 px-2 py-0.5 rounded font-bold font-mono uppercase">
                {chatsHistory.length} sessions
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {chatsHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <p className="text-xs text-slate-500">No linguistic symptom evaluations scanned yet.</p>
                </div>
              ) : (
                chatsHistory.map(chat => (
                  <div key={chat.id} className="p-4 bg-dark-950/40 border border-white/[0.02] rounded-2xl hover:border-white/[0.06] transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                        chat.role === 'user' ? 'bg-slate-500/10 text-slate-400' : 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                      }`}>
                        {chat.role === 'user' ? 'Patient' : 'Clinical AI'}
                      </span>
                      <span className="text-[9px] text-slate-600 font-bold">{new Date(chat.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{chat.content}</p>
                    {chat.content.length > 80 && (
                      <button 
                        onClick={() => setExpandedChat(expandedChat === chat.id ? null : chat.id)}
                        className="text-[9px] text-neon-green hover:text-white font-bold mt-2.5 flex items-center gap-1 transition-colors"
                      >
                        {expandedChat === chat.id ? 'Collapse Details' : 'Expand full eval log'}
                        {expandedChat === chat.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                    
                    <AnimatePresence>
                      {expandedChat === chat.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs text-slate-400 mt-2.5 pt-2.5 border-t border-white/[0.02] whitespace-pre-wrap leading-relaxed select-text">
                            {chat.content}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
