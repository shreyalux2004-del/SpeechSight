
import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  LineChart, Line, ScatterChart, Scatter, ZAxis, PieChart, Pie
} from 'recharts';
import { Activity, Waves, Layers, Mic, AlertCircle, RefreshCw, Speech, Repeat, GitCompare, ArrowRight, User, Baby, Flag, Stethoscope, Wind, Play, Pause, Volume2, AlertTriangle, TrendingUp, Timer, Scale, Calculator, Info, Target, AlignCenter, ArrowLeftRight, ChevronDown, ChevronUp, BrainCircuit, Mic2, PauseCircle, FastForward, Bot, Star, FileText, Calendar, Save, Check, Layout, X, Music } from 'lucide-react';
import { AnalysisResult, BiologicalSex, Demographic, ClinicalImpression, ClinicProfile, ClientDetails, TherapyNote, ViewMode, AssessmentDomain } from '../types';
import { MetricCard } from './MetricCard';
import { ReportGenerator } from './ReportGenerator';
import { ClientManager } from './ClientManager';

interface AnalysisDashboardProps {
  history: AnalysisResult[];
  clinicProfile: ClinicProfile;
  onUpdateResult: (id: string, updates: Partial<AnalysisResult>) => void;
  onReset: () => void;
  onRetry: () => void;
  onUpdateProfile: (profile: ClinicProfile) => void;
  clientDetails: ClientDetails;
  onUpdateClient: (client: ClientDetails) => void;
  viewMode: ViewMode;
}

const checkNorms = (val: number, metric: string, demographic: Demographic, sex: BiologicalSex) => {
    const isChild = demographic === 'Child';
    if (metric === 'F0') {
      if (isChild) {
        if (val < 180) return { status: 'Warning', msg: 'Low Pitch' };
        if (val > 400) return { status: 'Warning', msg: 'High Pitch' };
      } else {
        if (sex === 'Male') {
          if (val < 80) return { status: 'Warning', msg: 'Pitch Low' };
          if (val > 180) return { status: 'Warning', msg: 'Pitch High' };
        } else {
          if (val < 160) return { status: 'Warning', msg: 'Pitch Low' };
          if (val > 260) return { status: 'Warning', msg: 'Pitch High' };
        }
      }
    }
    if (metric === 'Jitter') return val > 1.04 ? { status: 'Warning', msg: '>1.04%' } : { status: 'Normal', msg: '' };
    if (metric === 'Shimmer') return val > 3.81 ? { status: 'Warning', msg: '>3.81%' } : { status: 'Normal', msg: '' };
    if (metric === 'HNR') return val < 20 ? { status: 'Warning', msg: '<20dB' } : { status: 'Normal', msg: '' };
    return { status: 'Normal', msg: '' };
};

const NaturalnessRater = ({ value, onChange }: { value?: number, onChange: (val: number) => void }) => {
  const [hoverVal, setHoverVal] = useState(0);
  const labels = ["Unnatural", "Mildly Unnatural", "Fair", "Natural", "Highly Natural"];
  const displayVal = hoverVal || value || 0;
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-start mb-2">
         <span className="text-xs font-bold text-slate-500 uppercase">Prosody Naturalness</span>
         <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Clinician</span>
      </div>
      <div className="flex items-center gap-1 mb-2 justify-center">
         {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => onChange(star)} onMouseEnter={() => setHoverVal(star)} onMouseLeave={() => setHoverVal(0)} className="p-1 transition-transform hover:scale-110">
               <Star size={24} className={`${star <= displayVal ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'} transition-colors`} />
            </button>
         ))}
      </div>
      <div className="text-center text-xs font-medium text-slate-500 h-4">{displayVal > 0 ? labels[displayVal - 1] : "Select Rating"}</div>
    </div>
  );
};

// ... (Other helper components kept the same for brevity, but ClinicalImpressionTag, AudioComparisonPlayer, PerceptualComparison, RatingScale would be here)
const ClinicalImpressionTag = ({ value, onChange }: { value?: ClinicalImpression, onChange: (val: ClinicalImpression) => void }) => {
    const options: ClinicalImpression[] = ['Suspected CAS', 'Suspected Dysarthria', 'Normal', 'Inconclusive'];
    return (
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mt-6">
         <div className="flex items-center gap-2 mb-3">
            <BrainCircuit size={20} className="text-indigo-600" />
            <h4 className="font-bold text-indigo-900 text-sm uppercase tracking-wide">Motor Speech Clinical Impression</h4>
         </div>
         <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
               <button key={opt || 'null'} onClick={() => onChange(value === opt ? null : opt)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${value === opt ? (opt?.includes('CAS') ? 'bg-rose-500 text-white border-rose-600' : opt?.includes('Dysarthria') ? 'bg-orange-500 text-white border-orange-600' : 'bg-indigo-600 text-white border-indigo-700') : 'bg-white text-slate-500 border-slate-200 hover:bg-white/80'}`}>{opt}</button>
            ))}
         </div>
      </div>
    );
};

const AudioComparisonPlayer = ({ clientAudioUrl }: { clientAudioUrl?: string }) => {
    const [isPlayingClient, setIsPlayingClient] = useState(false);
    const clientAudioRef = useRef<HTMLAudioElement>(null);
    const toggleClient = () => {
      if (!clientAudioRef.current || !clientAudioUrl) return;
      if (isPlayingClient) clientAudioRef.current.pause();
      else clientAudioRef.current.play();
      setIsPlayingClient(!isPlayingClient);
    };
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 rounded-full text-slate-500"><Volume2 size={20} /></div>
            <div className="text-sm font-bold text-slate-700">Audio Playback</div>
         </div>
         <div className="flex gap-4">
            <button onClick={toggleClient} disabled={!clientAudioUrl} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${isPlayingClient ? 'bg-teal-100 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600'} ${!clientAudioUrl ? 'opacity-50' : ''}`}>
               {isPlayingClient ? <Pause size={16} /> : <Play size={16} />} Play Recording
            </button>
         </div>
         <audio ref={clientAudioRef} src={clientAudioUrl} onEnded={() => setIsPlayingClient(false)} />
      </div>
    );
};

const PerceptualComparison = ({ label, aiValue, slpValue, onChange, description, scaleMax = 3 }: { label: string, aiValue: number, slpValue: number | undefined, onChange: (val: number) => void, description: string, scaleMax?: number }) => {
    const val = slpValue ?? 0;
    const normalizedAi = (aiValue / 3) * scaleMax;
    return (
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex justify-between items-end mb-4">
          <span className="text-sm font-bold text-slate-700">{label}</span>
          <span className="text-xs font-semibold uppercase text-slate-400">{description}</span>
        </div>
        <div className="relative h-2 bg-slate-200 rounded-full">
           <div className="absolute top-0 bottom-0 w-1 bg-slate-800 z-10" style={{ left: `${(normalizedAi / scaleMax) * 100}%` }}></div>
           <input type="range" min="0" max={scaleMax} step="0.1" value={val} onChange={(e) => onChange(parseFloat(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer z-20" />
           <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md z-10 pointer-events-none bg-indigo-500`} style={{ left: `calc(${(val / scaleMax) * 100}% - 8px)` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Clinician: {val.toFixed(1)}/{scaleMax}</span>
          <span>AI: {aiValue.toFixed(1)}/3 (Raw)</span>
        </div>
      </div>
    );
};

const RatingScale = ({ label, value, description, scaleMax = 3 }: { label: string, value: number, description: string, scaleMax?: number }) => {
    const displayValue = (value / 3) * scaleMax;
    const segments = Math.max(scaleMax, 3);
    const getColor = (v: number) => { 
        const ratio = v / scaleMax;
        if (ratio < 0.33) return 'bg-emerald-500'; 
        if (ratio < 0.66) return 'bg-yellow-400'; 
        return 'bg-rose-600'; 
    };
    return (
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-slate-700">{label}</span>
          <span className="text-xs font-semibold uppercase text-slate-400">{description}</span>
        </div>
        <div className="flex gap-1 h-3 mb-2">
          {Array.from({length: segments + 1}, (_, i) => i).map((level) => (
              <div key={level} className={`flex-1 rounded-sm ${displayValue >= level ? getColor(displayValue) : 'bg-slate-200'} ${Math.round(displayValue) === level ? 'ring-2 ring-slate-300' : 'opacity-40'}`} />
          ))}
        </div>
      </div>
    );
};


export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ history, onUpdateResult, onReset, onRetry, clinicProfile, onUpdateProfile, clientDetails, onUpdateClient, viewMode }) => {
  const [selectedId, setSelectedId] = useState<string>(history[history.length - 1]?.id || '');
  const [isComparing, setIsComparing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showClientManager, setShowClientManager] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  useEffect(() => {
    if (history.length > 0) setSelectedId(history[history.length - 1].id);
  }, [history.length]);

  const data = history.find(h => h.id === selectedId) || history[history.length - 1];
  const comparisonData = isComparing && history.length > 1 ? history.find(h => h.id !== selectedId) || history[history.length - 2] : undefined;

  useEffect(() => {
     if (data) {
         const existingNote = clientDetails.notes.find(n => n.sessionId === data.id);
         setCurrentNote(existingNote ? existingNote.text : "");
         setIsNoteSaved(!!existingNote);
     }
  }, [data?.id, clientDetails.notes]);

  if (!data) return <div>No Data</div>;

  // ... (Keep existing handlers: handleSaveNote, handleSlpRatingUpdate, etc.)
  const handleSaveNote = () => {
      if (!currentNote.trim()) return;
      const existingIndex = clientDetails.notes.findIndex(n => n.sessionId === data.id);
      let updatedNotes = [...clientDetails.notes];
      if (existingIndex >= 0) {
          updatedNotes[existingIndex] = { ...updatedNotes[existingIndex], text: currentNote, timestamp: Date.now() };
      } else {
          const newNote: TherapyNote = {
              id: Date.now().toString(),
              sessionId: data.id,
              timestamp: Date.now(),
              text: currentNote,
              author: clinicProfile.slpName || "Clinician"
          };
          updatedNotes.push(newNote);
      }
      onUpdateClient({ ...clientDetails, notes: updatedNotes });
      setIsNoteSaved(true);
      setTimeout(() => setIsNoteSaved(false), 2000); 
   };
 
   const handleSlpRatingUpdate = (type: 'hypernasality' | 'hyponasality', val: number) => {
      const currentSlpRatings = data.slpRatings || {};
      onUpdateResult(data.id, { slpRatings: { ...currentSlpRatings, [type]: val } });
   };
   const handleNaturalnessUpdate = (val: number) => {
     const currentSlpRatings = data.slpRatings || {};
     onUpdateResult(data.id, { slpRatings: { ...currentSlpRatings, prosodyNaturalness: val } });
   };
   const handleImpressionUpdate = (impression: ClinicalImpression) => onUpdateResult(data.id, { clinicalImpression: impression });
   
   const getResonanceColor = (type: string) => {
     switch (type) {
       case 'Normal': return 'text-teal-600 border-teal-200 bg-teal-50';
       case 'Hypernasal': return 'text-orange-600 border-orange-200 bg-orange-50';
       case 'Hyponasal': return 'text-blue-600 border-blue-200 bg-blue-50';
       case 'Cul-de-sac': return 'text-purple-600 border-purple-200 bg-purple-50';
       default: return 'text-slate-600 border-slate-200 bg-slate-50';
     }
   };
 
  const scaleMax = parseInt(clinicProfile.preferredRatingScale?.split('-')[1] || '3');

  const ratings = data.perceptualRatings;
  const slpRatings = data.slpRatings || {};
  const vpdAlert = data.vpdAlert;
  const prosody = data.prosody;
  const art = data.articulation;
  const aero = data.aerodynamics;
  const fluency = data.fluency;
  const hasAerodynamics = aero && (aero.maxPhonationDuration > 0 || aero.szRatio > 0);
  const isParentMode = viewMode === 'Parent';
  const activeDomain = data.assessmentDomain;

  // VISIBILITY FILTERING
  const shouldShow = (domain: AssessmentDomain) => {
      if (!activeDomain) return true; // Show all if no specific domain selected
      if (domain === 'articulation' && activeDomain === 'phonology') return true;
      if (domain === 'phonology' && activeDomain === 'articulation') return true;
      return activeDomain === domain;
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-6xl mx-auto">
      {/* ... (Keep existing ReportGenerator, ClientManager, Top Navigation) */}
      {showReport && (
          <ReportGenerator 
            data={data}
            comparisonData={comparisonData}
            clinicProfile={clinicProfile}
            onUpdateProfile={onUpdateProfile}
            onClose={() => setShowReport(false)}
          />
      )}
      {showClientManager && (
          <ClientManager 
             client={clientDetails}
             clinicProfile={clinicProfile}
             onUpdateClient={onUpdateClient}
             latestResult={data}
             onClose={() => setShowClientManager(false)}
          />
      )}

       {/* Top Navigation */}
       <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-20 z-40 print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto px-2 pb-2 md:pb-0 scrollbar-hide">
          {history.map((attempt, idx) => (
             <button
                key={attempt.id}
                onClick={() => { setSelectedId(attempt.id); setIsComparing(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${selectedId === attempt.id && !isComparing ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
             >
               Attempt {idx + 1}
             </button>
          ))}
          {history.length > 1 && !isParentMode && (
             <button onClick={() => setIsComparing(true)} className={`ml-2 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${isComparing ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
               <GitCompare size={16} /> Compare
             </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto px-2">
           <button onClick={() => setShowReport(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
             <FileText size={16} /> Report
           </button>
           <button onClick={onRetry} className="flex-1 md:flex-none px-4 py-2 bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
             <RefreshCw size={16} /> New Recording
           </button>
        </div>
      </div>

      {/* Domain Alert Banner */}
      {activeDomain && (
         <div className="bg-slate-800 text-white p-3 rounded-lg text-center text-sm font-medium flex items-center justify-center gap-2">
             <Target size={16} className="text-teal-400"/>
             Showing results only for: <span className="uppercase font-bold tracking-wider text-teal-300">{activeDomain}</span>
         </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* --- RESONANCE SECTION --- */}
        {shouldShow('resonance') && (
            <div className="lg:col-span-8 space-y-6">
                {/* Resonance Summary Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-teal-50 rounded-xl text-teal-600"><Wind size={24} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Resonance Profile</h3>
                                <p className="text-sm text-slate-500">{data.resonanceType} Severity Index: {data.resonanceSeverityIndex}</p>
                            </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getResonanceColor(data.resonanceType)}`}>
                            {data.resonanceType}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        {/* Interactive Sliders for Clinician Ratings */}
                        <div className="col-span-2 space-y-4">
                            <PerceptualComparison 
                                label="Hypernasality" 
                                aiValue={ratings.hypernasality} 
                                slpValue={slpRatings.hypernasality} 
                                onChange={(v) => handleSlpRatingUpdate('hypernasality', v)} 
                                description="High Pressure Consonants"
                                scaleMax={scaleMax}
                            />
                            <PerceptualComparison 
                                label="Hyponasality" 
                                aiValue={ratings.hyponasality} 
                                slpValue={slpRatings.hyponasality} 
                                onChange={(v) => handleSlpRatingUpdate('hyponasality', v)} 
                                description="Nasal Consonants /m, n/"
                                scaleMax={scaleMax}
                            />
                        </div>
                        
                        {/* Nasal Resonance Index Gauge */}
                        <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-100">
                             <span className="text-xs font-bold text-slate-400 uppercase mb-2">Acoustic NRI Score</span>
                             <div className="relative w-32 h-32 flex items-center justify-center">
                                 <PieChart width={128} height={128}>
                                    <Pie
                                        data={[{ value: data.acousticNasalMetrics.nasalResonanceIndex }, { value: 100 - data.acousticNasalMetrics.nasalResonanceIndex }]}
                                        cx="50%" cy="50%" innerRadius={40} outerRadius={55} startAngle={90} endAngle={-270}
                                        dataKey="value" stroke="none"
                                    >
                                        <Cell fill={data.acousticNasalMetrics.nasalResonanceIndex > 30 ? '#fbbf24' : '#10b981'} />
                                        <Cell fill="#e2e8f0" />
                                    </Pie>
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold fill-slate-700">
                                        {data.acousticNasalMetrics.nasalResonanceIndex}
                                    </text>
                                 </PieChart>
                             </div>
                             <span className="text-[10px] font-bold uppercase text-slate-400 mt-1">{data.acousticNasalMetrics.nasalResonanceSeverity} Risk</span>
                        </div>
                    </div>
                </div>

                {/* Nasal Emission & Energy Graph */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Wind size={18} className="text-teal-600"/> Nasal Emission (Fricatives)</h4>
                         {data.acousticNasalMetrics.nasalEmissionOnFricatives.length > 0 ? (
                            <div className="space-y-2">
                                {data.acousticNasalMetrics.nasalEmissionOnFricatives.map((ev, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 bg-rose-50 rounded border border-rose-100 text-sm">
                                        <span className="font-mono font-bold text-rose-800">/{ev.phoneme}/</span>
                                        <span className="text-xs text-rose-600 font-semibold">{ev.severity} Emission ({ev.timestamp.toFixed(1)}s)</span>
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-sm text-slate-400 italic">No significant nasal emission detected on fricatives.</p>}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Waves size={18} className="text-indigo-600"/> Energy Balance (Oral vs Nasal)</h4>
                         <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.acousticNasalMetrics.nasalOralEnergyComparison}>
                                    <defs>
                                        <linearGradient id="gradOral" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="gradNasal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Tooltip />
                                    <Area type="monotone" dataKey="oral" stroke="#3b82f6" fillOpacity={1} fill="url(#gradOral)" name="Oral Energy" />
                                    <Area type="monotone" dataKey="nasal" stroke="#f97316" fillOpacity={1} fill="url(#gradNasal)" name="Nasal Energy" />
                                </AreaChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- VOICE SECTION --- */}
        {shouldShow('voice') && (
            <div className="lg:col-span-4 space-y-6">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Waves size={24} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Voice Quality</h3>
                            <p className="text-sm text-slate-500">Profile: <span className="font-semibold text-indigo-600">{data.voiceMetrics.qualityProfile}</span></p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {/* Stability Score Gauge */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-40 h-24 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-40 bg-slate-100 rounded-full border-4 border-slate-200 box-border"></div>
                                <div className="absolute top-0 left-0 w-full h-40 bg-indigo-500 rounded-full border-4 border-indigo-500 box-border origin-bottom transition-transform duration-1000" 
                                    style={{ transform: `rotate(${(data.voiceMetrics.stabilityScore / 100) * 180 - 180}deg)` }}></div>
                            </div>
                            <div className="text-center -mt-8 relative z-10">
                                <div className="text-3xl font-bold text-slate-800">{data.voiceMetrics.stabilityScore}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stability Score</div>
                            </div>
                        </div>

                        {/* Key Metrics List */}
                        <div className="space-y-3">
                            {[
                                { label: 'Mean F0 (Pitch)', value: `${Math.round(data.voiceMetrics.fundamentalFrequency)} Hz`, status: checkNorms(data.voiceMetrics.fundamentalFrequency, 'F0', data.demographic, data.sex) },
                                { label: 'Pitch Range', value: `${data.voiceMetrics.minPitch}-${data.voiceMetrics.maxPitch} Hz`, status: { status: 'Normal', msg: '' } },
                                { label: 'Jitter', value: `${data.voiceMetrics.jitter.toFixed(2)}%`, status: checkNorms(data.voiceMetrics.jitter, 'Jitter', data.demographic, data.sex) },
                                { label: 'Shimmer', value: `${data.voiceMetrics.shimmer.toFixed(2)}%`, status: checkNorms(data.voiceMetrics.shimmer, 'Shimmer', data.demographic, data.sex) },
                                { label: 'HNR', value: `${data.voiceMetrics.hnr.toFixed(1)} dB`, status: checkNorms(data.voiceMetrics.hnr, 'HNR', data.demographic, data.sex) },
                            ].map((m, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium text-slate-600">{m.label}</span>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-800">{m.value}</div>
                                        {m.status.status === 'Warning' && <span className="text-[10px] text-amber-600 font-bold">{m.status.msg}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
            </div>
        )}

        {/* --- PROSODY SECTION --- */}
        {shouldShow('prosody') && (
            <div className="lg:col-span-12 space-y-6">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Music size={24} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Prosody & Rhythm</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded border font-bold ${prosody.pitchRangeClassification === 'Monotone' || prosody.pitchRangeClassification === 'Restricted' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        {prosody.pitchRangeClassification} Range
                                    </span>
                                    {prosody.isScannedSpeech && (
                                        <span className="text-xs px-2 py-0.5 rounded border font-bold bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                                            <Bot size={10} /> Scanned/Robotic
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">{prosody.wordsPerMinute}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase">WPM</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-4">
                            <NaturalnessRater value={slpRatings.prosodyNaturalness} onChange={handleNaturalnessUpdate} />
                            
                            {/* Monotone Severity */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex justify-between mb-2 text-xs font-bold uppercase text-slate-500">
                                    <span>Melodic</span>
                                    <span>Flat (Monotone)</span>
                                </div>
                                <div className="h-3 bg-gradient-to-r from-emerald-400 via-yellow-400 to-rose-500 rounded-full relative">
                                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-600 rounded-full shadow-sm" style={{ left: `${prosody.monotoneSeverity}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Pitch Contour & Intonation</h4>
                             <div className="h-48 w-full">
                                <ResponsiveContainer>
                                    <LineChart data={prosody.pitchContour}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="pitch" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                             </div>
                        </div>
                        
                        <div className="space-y-4">
                            <MetricCard title="Pausing" value={prosody.pauseMetrics.totalPauses} unit="count">
                                <div className="text-xs text-slate-500">{prosody.pauseMetrics.pausePattern}</div>
                            </MetricCard>
                            <MetricCard title="Stress Accuracy" value={prosody.stressAccuracy} unit="%">
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{ width: `${prosody.stressAccuracy}%` }}></div>
                                </div>
                            </MetricCard>
                        </div>
                    </div>
                 </div>
            </div>
        )}

        {/* --- ARTICULATION SECTION --- */}
        {shouldShow('articulation') && (
            <div className="lg:col-span-12 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-3">
                            <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><Mic size={24} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Articulation & Phonology</h3>
                                <p className="text-sm text-slate-500">Intelligibility: <span className="font-bold text-slate-900">{art.intelligibility}%</span></p>
                            </div>
                         </div>
                         <ClinicalImpressionTag value={data.clinicalImpression} onChange={handleImpressionUpdate} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Error Pattern Chart */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Error Patterns (SODA+)</h4>
                            <div className="h-48">
                                <ResponsiveContainer>
                                    <BarChart data={[
                                        { name: 'Sub', val: art.errorPattern.substitutions },
                                        { name: 'Omis', val: art.errorPattern.omissions },
                                        { name: 'Dist', val: art.errorPattern.distortions },
                                        { name: 'Nasal', val: art.errorPattern.nasalErrors }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={10} />
                                        <YAxis fontSize={10} />
                                        <Tooltip cursor={{fill: '#f1f5f9'}} />
                                        <Bar dataKey="val" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Word Length Effect */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Word Length Effect</h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                                        <span>Monosyllabic</span>
                                        <span>{art.wordLengthMetrics.monosyllabicAccuracy}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${art.wordLengthMetrics.monosyllabicAccuracy}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                                        <span>Multisyllabic</span>
                                        <span>{art.wordLengthMetrics.multisyllabicAccuracy}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: `${art.wordLengthMetrics.multisyllabicAccuracy}%` }}></div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 italic">{art.wordLengthMetrics.description}</p>
                            </div>
                        </div>

                         {/* DDK Rates */}
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Diadochokinesis (DDK)</h4>
                             <div className="space-y-4">
                                 <div className="flex justify-between items-center">
                                     <span className="text-sm font-medium text-slate-600">AMR Rate</span>
                                     <div className="text-right">
                                         <span className="text-lg font-bold text-slate-800">{art.ddkMetrics?.amrRate || 0}</span>
                                         <span className="text-xs text-slate-400 ml-1">syl/s</span>
                                     </div>
                                 </div>
                                 <div className="flex justify-between items-center">
                                     <span className="text-sm font-medium text-slate-600">SMR Rate</span>
                                     <div className="text-right">
                                         <span className="text-lg font-bold text-slate-800">{art.ddkMetrics?.smrRate || 0}</span>
                                         <span className="text-xs text-slate-400 ml-1">syl/s</span>
                                     </div>
                                 </div>
                                 <div className="pt-2 border-t border-slate-200">
                                     <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-1">
                                        <span>Rhythm Regularity</span>
                                        <span>{art.ddkMetrics?.regularity || 0}%</span>
                                     </div>
                                     <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                         <div className="h-full bg-indigo-500" style={{ width: `${art.ddkMetrics?.regularity || 0}%` }}></div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- FLUENCY SECTION --- */}
        {shouldShow('fluency') && fluency && (
            <div className="lg:col-span-12 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-3">
                            <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600"><Timer size={24} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Fluency Analysis</h3>
                                <p className="text-sm text-slate-500">Severity: <span className="font-bold text-cyan-700 uppercase">{fluency.severity}</span></p>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">{fluency.disfluencyIndex}%</div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Disfluency Index</div>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         {/* Breakdown Chart */}
                         <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Disfluency Types</h4>
                             <div className="h-48 w-full">
                                <ResponsiveContainer>
                                    <BarChart data={[
                                        { name: 'Blocks', val: fluency.types.blocks },
                                        { name: 'Prolong', val: fluency.types.prolongations },
                                        { name: 'Repet', val: fluency.types.repetitions },
                                        { name: 'Rev', val: fluency.types.revisions },
                                        { name: 'Int', val: fluency.types.interjections }
                                    ]} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" fontSize={10} />
                                        <YAxis dataKey="name" type="category" fontSize={10} width={50} />
                                        <Tooltip cursor={{fill: '#f1f5f9'}} />
                                        <Bar dataKey="val" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                             </div>
                         </div>

                         {/* Secondary Behaviors */}
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Secondary Behaviors</h4>
                             {fluency.secondaryBehaviors.length > 0 ? (
                                <ul className="space-y-2">
                                    {fluency.secondaryBehaviors.map((b, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                            <AlertCircle size={14} className="mt-0.5 text-rose-500 shrink-0" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                             ) : <p className="text-sm text-slate-400 italic">None observed.</p>}
                         </div>

                         {/* Naturalness */}
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Speech Naturalness</h4>
                             <div className="text-center">
                                 <div className="text-3xl font-bold text-slate-800 mb-1">{fluency.speechNaturalness}/5</div>
                                 <div className="flex justify-center gap-1 mb-2">
                                    {[1,2,3,4,5].map(star => (
                                        <Star key={star} size={16} className={star <= fluency.speechNaturalness ? "fill-cyan-400 text-cyan-400" : "text-slate-300"} />
                                    ))}
                                 </div>
                                 <span className="text-xs font-bold text-slate-400 uppercase">{fluency.rateConsistency} Rate</span>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        )}

      </div>
      
      {/* Audio Playback Footer (if not comparing) */}
      {!isComparing && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-30 print:hidden">
             <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                 <div className="flex-1">
                     <AudioComparisonPlayer clientAudioUrl={data.audioUrl} />
                 </div>
                 <div className="flex items-center gap-4">
                     {/* Notes Quick Entry */}
                     <div className="relative">
                         <div className={`absolute bottom-full right-0 mb-2 bg-slate-800 text-white text-xs px-2 py-1 rounded transition-opacity ${isNoteSaved ? 'opacity-100' : 'opacity-0'}`}>Saved!</div>
                         <textarea 
                             className="w-64 h-12 rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                             placeholder="Quick therapy note..."
                             value={currentNote}
                             onChange={(e) => setCurrentNote(e.target.value)}
                             onBlur={handleSaveNote}
                         />
                     </div>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};
