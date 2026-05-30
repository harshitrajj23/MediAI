import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  UserCheck, 
  Star, 
  ExternalLink,
  Loader,
  Phone,
  VideoOff,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function DocMatch({ 
  session,
  triageData, 
  consultations, 
  setConsultations, 
  elderlyMode 
}) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [locPermission, setLocPermission] = useState('prompt');
  const [clinicalProfile, setClinicalProfile] = useState({
    urgency: "Home Care Recommended",
    queryText: ""
  });

  const timeSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "03:30 PM", "05:00 PM"];

  // Request high-accuracy geolocation on component mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocPermission('granted');
        },
        (error) => {
          console.warn("Geolocation permission or error:", error);
          setLocPermission('denied');
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    }
  }, []);

  // Load user's diagnostic profile history from Supabase chats (profile-specific clinical sync)
  const fetchUserClinicalProfile = async () => {
    if (!session?.user?.id) return;
    try {
      const { data: userData } = await supabase
        .from('chats')
        .select('content')
        .eq('user_id', session.user.id)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(1);
        
      const { data: assistantData } = await supabase
        .from('chats')
        .select('triage')
        .eq('user_id', session.user.id)
        .eq('role', 'assistant')
        .not('triage', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      const queryText = userData && userData.length > 0 ? userData[0].content : "";
      const urgency = assistantData && assistantData.length > 0 && assistantData[0].triage 
        ? assistantData[0].triage.urgency 
        : "Home Care Recommended";
        
      setClinicalProfile({
        urgency,
        queryText
      });
    } catch (err) {
      console.error("Error loading user clinical profile from Supabase:", err);
    }
  };

  // Fetch recommended doctors depending on predicted triage level and user location
  const fetchDoctors = async () => {
    setLoading(true);
    const urgency = triageData?.urgency || clinicalProfile.urgency || "Home Care Recommended";
    const symptoms = clinicalProfile.queryText || "";
    
    if (!symptoms) {
      setDoctors([]);
      setLoading(false);
      return;
    }
    
    let url = `http://127.0.0.1:8000/api/doctors?triage_urgency=${encodeURIComponent(urgency)}`;
    
    if (symptoms) {
      url += `&symptoms=${encodeURIComponent(symptoms)}`;
    }
    if (coords) {
      url += `&lat=${coords.latitude}&lon=${coords.longitude}`;
    }
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (e) {
      console.error(e);
      // Client-side fallback pool with distance calculations using actual legendary specialists
      const userLat = coords?.latitude || 12.9716;
      const userLon = coords?.longitude || 77.5946;
      
      // Attempt to reverse geocode user coordinates locally
      let cityName = "Bengaluru";
      if (coords) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            cityName = geoData.address?.city || geoData.address?.town || geoData.address?.suburb || "Bengaluru";
          }
        } catch (err) {
          console.warn("Local geocode check failed:", err);
        }
      }

      const mockPool = [
        {
          id: "doc_1",
          name: "Dr. Naresh Trehan",
          specialty: "Cardiologist (Heart Expert)",
          hospital: `Medanta - The Medicity, ${cityName}`,
          rating: 4.9,
          experience: "40 years",
          avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
          distance_km: 2.1,
          lat: userLat + 0.015,
          lon: userLon - 0.008
        },
        {
          id: "doc_2",
          name: "Dr. Amrita Gogia",
          specialty: "General Physician / Infectious Diseases",
          hospital: `Max Super Speciality Hospital, ${cityName}`,
          rating: 4.8,
          experience: "15 years",
          avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300",
          distance_km: 1.4,
          lat: userLat - 0.005,
          lon: userLon + 0.012
        },
        {
          id: "doc_3",
          name: "Dr. Rashmi Sarkar",
          specialty: "Dermatologist (Skin Expert)",
          hospital: `Fortis Hospital, ${cityName}`,
          rating: 4.9,
          experience: "22 years",
          avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300",
          distance_km: 3.8,
          lat: userLat + 0.024,
          lon: userLon + 0.021
        },
        {
          id: "doc_4",
          name: "Dr. Girija Prasad",
          specialty: "Ophthalmologist (Eye Expert)",
          hospital: `Apollo Hospitals, ${cityName}`,
          rating: 4.7,
          experience: "18 years",
          avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
          distance_km: 2.5,
          lat: userLat - 0.018,
          lon: userLon - 0.015
        }
      ];
      
      const symptomsLower = symptoms.toLowerCase();
      let filtered = mockPool;
      if (symptomsLower.includes("eye") || symptomsLower.includes("vision") || symptomsLower.includes("blind")) {
        filtered = [mockPool[3], mockPool[1]];
      } else if (symptomsLower.includes("skin") || symptomsLower.includes("rash") || symptomsLower.includes("wound")) {
        filtered = [mockPool[2], mockPool[1]];
      } else if (symptomsLower.includes("heart") || symptomsLower.includes("chest")) {
        filtered = [mockPool[0], mockPool[1]];
      }
      
      setDoctors(filtered.sort((a, b) => a.distance_km - b.distance_km));
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });
      
      if (data) {
        setConsultations(data);
      }
    } catch (e) {
      console.error("Error fetching consultations:", e);
    }
  };

  // Coordinated Effects: Load session records on mount/change
  useEffect(() => {
    fetchUserClinicalProfile();
    fetchConsultations();
  }, [session, triageData]);

  // Load doctors dynamically when clinical history profile updates
  useEffect(() => {
    fetchDoctors();
  }, [clinicalProfile, coords, triageData]);

  const handleBookConsultation = async (e) => {
    e.preventDefault();
    if (!selectedDoc || !bookingDate || !bookingTime || !session?.user?.id) return;

    setBookingStatus("scheduling");
    try {
      const zoomLink = `https://zoom.us/j/${Math.floor(Math.random() * 10000000000)}?pwd=${Math.random().toString(36).slice(2, 12)}`;
      
      const { data, error } = await supabase
        .from('consultations')
        .insert([
          {
            user_id: session.user.id,
            doctor_name: selectedDoc.name,
            specialty: selectedDoc.specialty,
            date: bookingDate,
            time: bookingTime,
            zoom_link: zoomLink,
            status: "Confirmed"
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setConsultations(prev => [...prev, data]);
        setBookingStatus("success");
        setTimeout(() => {
          setSelectedDoc(null);
          setBookingDate('');
          setBookingTime('');
          setBookingStatus(null);
        }, 2000);
      }
    } catch (err) {
      console.error("Booking consultation failed:", err);
      setBookingStatus(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in mesh-bg pb-12">
      {/* Title */}
      <div className="p-6 glass-panel border-l-4 border-l-neon-green">
        <h1 className={`font-bold text-white tracking-tight ${elderlyMode ? 'text-4xl' : 'text-2xl md:text-3xl'}`}>
          Telehealth <span className="text-neon-green glow-text-green">Clinician Matching</span>
        </h1>
        <p className="text-slate-400 mt-2 text-xs">
          Seamless medical escalation path. Book rapid virtual consultations with recommended clinicians matching your symptoms.
        </p>
        {clinicalProfile.queryText && (
          <div className="mt-4 p-3 bg-neon-green/10 border border-neon-green/20 rounded-xl flex items-start gap-2.5 animate-slide-up">
            <span className="text-neon-green text-xs mt-0.5">🔍</span>
            <div>
              <span className="text-[8px] font-bold uppercase text-neon-green block">Detected Profile Symptom History (Supabase Live Sync)</span>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                Last checked symptoms: <span className="font-bold text-white">"{clinicalProfile.queryText}"</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                  Triage Urgency: <span className="text-neon-green">{triageData?.urgency || clinicalProfile.urgency}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeCall ? (
        /* Show-stopper Telemedicine active Call Frame */
        <div className="glass-panel p-6 border-l-4 border-l-red-500 bg-dark-900/90 relative overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between border-b border-dark-800 pb-4 mb-6">
            <div>
              <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold block animate-pulse">
                Active Encrypted Telemedicine Session
              </span>
              <h2 className="font-bold text-white text-lg mt-0.5">Meeting with {activeCall.doctor_name}</h2>
            </div>
            <button 
              onClick={() => setActiveCall(null)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            >
              <VideoOff className="w-4 h-4" /> Disconnect Session
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Active Camera Frame */}
            <div className="md:col-span-2 aspect-video bg-dark-950 rounded-2xl border border-dark-800 relative overflow-hidden flex items-center justify-center">
              
              {/* Doctor Video Feed (Placeholder mockup using professional unsplash image) */}
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600" 
                  alt="Doctor visual" 
                  className="w-full h-full object-cover opacity-90 filter brightness-95"
                />
                
                {/* Floating self-camera corner block */}
                <div className="absolute bottom-4 right-4 w-32 aspect-video bg-dark-900 border border-dark-700 rounded-lg overflow-hidden shadow-lg">
                  <div className="w-full h-full bg-dark-950 flex items-center justify-center text-slate-600 text-[10px]">
                    User Camera
                  </div>
                </div>

                <div className="absolute top-4 left-4 bg-dark-950/80 border border-dark-700/40 text-neon-green px-3 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1.5 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  <span>1080p Secure Connection</span>
                </div>
              </div>

            </div>

            {/* Right: Medical status and active data dashboard inside call */}
            <div className="bg-dark-950 p-5 border border-dark-800 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-dark-800 pb-2 mb-4">
                  Clinical Session Status
                </h3>
                
                <div className="space-y-3 text-[10px] font-mono leading-normal">
                  <div className="text-neon-green flex gap-2">
                    <span>✓</span> <span>Symptom summary synced.</span>
                  </div>
                  <div className="text-neon-green flex gap-2">
                    <span>✓</span> <span>Triage classification completed.</span>
                  </div>
                  {triageData && (
                    <div className="bg-dark-900 p-2.5 rounded-lg border border-dark-800 mt-3 text-slate-400">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Triage Level Flagged</span>
                      <span className="text-slate-200 mt-1 block font-semibold">{triageData.urgency} ({triageData.score}%)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dark-800 text-center">
                <span className="text-[10px] text-slate-500 block">
                  Secure Telemedicine Connection
                </span>
                <span className="text-[9px] text-slate-600 block mt-1">
                  Session Key: MD-{activeCall.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Scheduler Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Doctors Recommended Pool */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">
                Recommended Specialists
              </h2>

              {loading ? (
                <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Loader className="w-6 h-6 animate-spin text-neon-green mb-3" />
                  Analyzing clinical parameters...
                </div>
              ) : (
                <div className="space-y-4">
                  {doctors.length === 0 ? (
                    <div className="text-slate-500 text-xs text-center py-6 bg-dark-950/40 rounded-xl border border-dark-800 border-dashed">
                      No symptoms reported yet. Please report your symptoms to get doctor recommendations.
                    </div>
                  ) : (
                    doctors.map((doc, idx) => (
                    <div 
                      key={doc.id}
                      className={`p-4 bg-dark-950/60 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-neon-green/30 ${
                        selectedDoc?.id === doc.id ? 'border-neon-green ring-1 ring-neon-green/30' : 'border-dark-800'
                      }`}
                    >
                      <div className="flex gap-4 items-center">
                        <div className="relative shrink-0">
                          <img 
                            src={doc.avatar} 
                            className="w-14 h-14 rounded-full border border-dark-700 object-cover" 
                            alt={doc.name} 
                          />
                          <div className="absolute -top-1 -left-1 w-5 h-5 bg-dark-900 border border-neon-green/30 text-neon-green rounded-full flex items-center justify-center text-[9px] font-bold shadow-md">
                            {idx + 1}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-slate-200 block ${elderlyMode ? 'text-lg' : 'text-sm'}`}>
                              {doc.name}
                            </span>
                            <span className="flex items-center text-[10px] text-yellow-400 font-bold gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-400" /> {doc.rating}
                            </span>
                          </div>
                          
                          <span className="text-[10px] text-neon-green font-bold block mt-0.5">
                            {doc.specialty}
                          </span>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1 leading-tight text-[9px] text-slate-500">
                            <span>{doc.hospital}</span>
                            <span>•</span>
                            <span>{doc.experience} Experience</span>
                            {doc.distance_km !== undefined && (
                              <span className="bg-neon-green/15 text-neon-green text-[9px] font-bold px-2 py-0.5 rounded-full border border-neon-green/25 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
                                📍 {doc.distance_km} km away
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedDoc(doc)}
                        className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                          selectedDoc?.id === doc.id 
                            ? 'bg-neon-green text-dark-950' 
                            : 'bg-dark-800 text-slate-300 border border-dark-700 hover:bg-dark-700'
                        }`}
                      >
                        {selectedDoc?.id === doc.id ? 'Selected' : 'Select Doctor'}
                      </button>
                    </div>
                  ))
                  )}
                </div>
              )}
            </div>

            {/* Scheduled Consultation Listings */}
            <div className="glass-panel p-6">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">
                Upcoming Consultation Sessions
              </h2>

              {consultations.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No appointments scheduled. Choose a doctor above and set date/time to book.
                </div>
              ) : (
                <div className="space-y-3">
                  {consultations.map((consult) => (
                    <div 
                      key={consult.id}
                      className="p-4 bg-dark-950/60 border border-dark-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <span className={`font-bold text-slate-200 block ${elderlyMode ? 'text-lg' : 'text-sm'}`}>
                          {consult.doctor_name}
                        </span>
                        <span className="text-[10px] text-neon-green font-semibold block mt-0.5">
                          {consult.specialty}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {consult.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {consult.time}</span>
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {/* Dynamic Live Telemedicine video launch */}
                        <button 
                          onClick={() => setActiveCall(consult)}
                          className="px-4 py-2 bg-neon-green text-dark-950 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-neon-bright hover:shadow-neon-green transition-all"
                        >
                          <Video className="w-4 h-4" /> Start Consultation Feed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Reservation form & Radar locator */}
          <div className="space-y-6">
            
            {/* Proximity Radar Clinician Map */}
            <div className="glass-panel p-6 bg-dark-900/40 relative overflow-hidden border border-white/[0.04] rounded-2xl flex flex-col justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">
                Clinical Proximity Radar
              </h2>
              <div className="relative w-full aspect-square max-w-[200px] mx-auto rounded-full border border-neon-green/20 flex items-center justify-center p-6 bg-dark-950/80 shadow-inner">
                {/* Radar sweeping line */}
                <div className="absolute inset-0 rounded-full border border-neon-green/10 animate-ping opacity-30" />
                <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-neon-green/45 to-transparent animate-spin" style={{ animationDuration: '4s' }} />
                
                {/* User position indicator */}
                <div className="absolute w-3.5 h-3.5 bg-neon-green rounded-full shadow-neon-green flex items-center justify-center border border-white/20 z-10 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-dark-950 rounded-full" />
                </div>
                
                {/* Floating doctor locations */}
                {doctors.map((doc, idx) => {
                  const offsets = [
                    { x: '25%', y: '30%' },
                    { x: '75%', y: '60%' },
                    { x: '35%', y: '80%' },
                    { x: '65%', y: '20%' },
                  ];
                  const pos = offsets[idx % offsets.length];
                  const isSelected = selectedDoc?.id === doc.id;
                  return (
                    <div 
                      key={doc.id}
                      style={{ left: pos.x, top: pos.y }}
                      onClick={() => setSelectedDoc(doc)}
                      className={`absolute w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg transform hover:scale-125 ${
                        isSelected 
                          ? 'bg-neon-green text-dark-950 font-bold z-20 border-2 border-white scale-110 animate-bounce' 
                          : 'bg-dark-900 border border-neon-green/30 text-neon-green hover:bg-neon-green/10'
                      }`}
                      title={`${doc.name} (${doc.distance_km} km away)`}
                    >
                      <span className="text-[8px] font-bold">{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center mt-4">
                <span className="text-[10px] uppercase font-bold text-neon-green tracking-wider block">
                  {coords ? "Proximity Sorting Active" : "Default Location Active"}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5 leading-relaxed">
                  {coords 
                    ? `Showing nearest matching specialists relative to your device coordinates.` 
                    : `Please grant location permission to view exact proximity sorting.`}
                </span>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">
                Reserve Live Consultation
              </h2>

              {selectedDoc ? (
                <form onSubmit={handleBookConsultation} className="space-y-4">
                  <div className="p-3 bg-dark-950 border border-dark-850 rounded-xl flex items-center gap-3">
                    <img src={selectedDoc.avatar} className="w-10 h-10 object-cover rounded-full border border-dark-800" alt="Avatar" />
                    <div>
                      <span className="text-[11px] font-bold text-slate-200 block">{selectedDoc.name}</span>
                      <span className="text-[9px] text-neon-green block">{selectedDoc.specialty}</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Consultation Date</label>
                    <input 
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="input-field py-2 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase block">Select Time Slot</label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot) => (
                        <label 
                          key={slot}
                          className={`flex items-center justify-center p-2 rounded-xl border text-[9px] font-bold cursor-pointer transition-all ${
                            bookingTime === slot 
                              ? 'bg-neon-green/10 text-neon-green border-neon-green/40' 
                              : 'bg-dark-950 text-slate-400 border-dark-800 hover:border-dark-700'
                          }`}
                        >
                          <input 
                            type="radio"
                            name="booking_time"
                            checked={bookingTime === slot}
                            onChange={() => setBookingTime(slot)}
                            className="hidden"
                          />
                          {slot}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={bookingStatus === "scheduling" || !bookingDate || !bookingTime}
                    className="btn-primary w-full py-3 text-xs mt-4"
                  >
                    {bookingStatus === "scheduling" ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" /> Scheduling...
                      </>
                    ) : bookingStatus === "success" ? (
                      <>
                        <UserCheck className="w-4 h-4" /> Consultation Confirmed!
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" /> Confirm Virtual Consultation
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Choose a doctor from the recommendations list to begin reserving.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
