
import React, { useState } from 'react';
import { Activity, Mic, Wind, Brain, ChevronRight, Music, Volume2, Timer, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AssessmentDomain } from '../types';

interface LandingPageProps {
  onStart: (domain: AssessmentDomain) => void;
  initialDomainId?: AssessmentDomain | null;
}

type DomainData = {
  id: AssessmentDomain;
  title: string;
  icon: React.ElementType;
  desc: string;
  color: string;
  bgClass: string;
  params: string[];
};

const ASSESSMENT_DOMAINS: DomainData[] = [
  {
    id: 'prosody',
    title: 'Prosody',
    icon: Music,
    desc: 'Intonation, stress, and rhythm analysis.',
    color: 'text-indigo-600',
    bgClass: 'bg-indigo-50 border-indigo-100 hover:border-indigo-200',
    params: [
      'Pitch contour',
      'Pitch variability',
      'Stress pattern accuracy',
      'Rhythm & pausing pattern',
      'Rate of speech (WPM)',
      'Prosody severity index'
    ]
  },
  {
    id: 'articulation', // Acts as Articulation / Phonology
    title: 'Articulation',
    icon: Mic,
    desc: 'Precision, accuracy, and error detection.',
    color: 'text-rose-600',
    bgClass: 'bg-rose-50 border-rose-100 hover:border-rose-200',
    params: [
      'PCC (Percent Consonants Correct)',
      'PVC (Percent Vowels Correct)',
      'Pressure consonant accuracy',
      'Place–manner–voicing error patterns',
      'Substitutions, omissions, distortions',
      'Stimulability'
    ]
  },
  {
    id: 'resonance',
    title: 'Resonance',
    icon: Wind,
    desc: 'Nasality balance and airflow metrics.',
    color: 'text-teal-600',
    bgClass: 'bg-teal-50 border-teal-100 hover:border-teal-200',
    params: [
      'Hypernasality rating (0–3)',
      'Hyponasality rating (0–3)',
      'Nasal emission rating (0–3)',
      'Cul-de-sac resonance rating (0–3)',
      'Oral vs nasal airflow graph',
      'Nasal Resonance Index',
      'Oral vs nasal sentence comparison'
    ]
  },
  {
    id: 'voice',
    title: 'Voice',
    icon: Volume2,
    desc: 'Quality, pitch, and phonatory stability.',
    color: 'text-amber-600',
    bgClass: 'bg-amber-50 border-amber-100 hover:border-amber-200',
    params: [
      'Pitch (F0)',
      'Loudness',
      'Quality (breathy/hoarse/strained)',
      'Phonation range',
      'Maximum phonation time',
      'S/Z ratio',
      'Voice handicap index (clinical scale)'
    ]
  },
  {
    id: 'fluency',
    title: 'Fluency',
    icon: Timer,
    desc: 'Flow, rate, and disfluency tracking.',
    color: 'text-cyan-600',
    bgClass: 'bg-cyan-50 border-cyan-100 hover:border-cyan-200',
    params: [
      'Frequency of disfluencies',
      'Types of disfluencies (part-word, whole-word, blocks)',
      'Duration of stuttering moments',
      'Secondary behaviors',
      'Speech rate',
      'Fluency severity score'
    ]
  },
  {
    id: 'phonology',
    title: 'Phonology',
    icon: Brain,
    desc: 'Pattern analysis and cognitive processing.',
    color: 'text-purple-600',
    bgClass: 'bg-purple-50 border-purple-100 hover:border-purple-200',
    params: [
      'Phonological processes present',
      'Age-appropriateness of processes',
      'Frequency of occurrence',
      'Consistency of errors',
      'Phonological pattern analysis',
      'Phonemic inventory'
    ]
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, initialDomainId }) => {
  const [selectedDomain, setSelectedDomain] = useState<DomainData | null>(() => {
    if (initialDomainId) {
      return ASSESSMENT_DOMAINS.find(d => d.id === initialDomainId) || null;
    }
    return null;
  });

  const handleStart = () => {
    if (selectedDomain) {
        onStart(selectedDomain.id);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-hidden animate-fade-in font-sans">
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-100/50 skew-x-12 transform origin-top pointer-events-none hidden lg:block" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 -left-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

      {/* Main Container */}
      {!selectedDomain ? (
        <div className="relative z-10 container mx-auto px-6 py-12 lg:h-screen flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">
            
            {/* Left Column: Introduction */}
            <div className="flex flex-col items-start text-left max-w-2xl mx-auto lg:mx-0">
                <div className="mb-6 flex items-center gap-3 bg-white p-2 pr-4 rounded-full shadow-sm border border-slate-100 w-fit animate-fade-in">
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                        <Activity className="text-white" size={16} />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">Clinical Speech Analysis AI</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                Speech<span className="text-teal-600">Sight</span>
                </h1>
                
                <p className="text-slate-500 mb-10 text-xl leading-relaxed">
                  Select a domain below to begin a targeted assessment. 
                  Our platform provides instant, clinical-grade metrics for speech-language pathologists.
                </p>

                <div className="flex items-center gap-8 text-slate-400 text-sm font-medium">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500"></div> HIPAA Compliant</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Evidence-Based</span>
                </div>
            </div>

            {/* Right Column: Assessment Domain Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {ASSESSMENT_DOMAINS.map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain)}
                    className={`p-6 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col items-start bg-white ${domain.bgClass}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border transition-colors bg-white ${domain.color}`}>
                      <domain.icon size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-slate-900">{domain.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{domain.desc}</p>
                    <div className="mt-4 flex items-center text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 gap-1">
                        View Protocols <ChevronRight size={14} />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Dedicated Assessment Sub-Page */
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-right-4 duration-300 flex flex-col">
          <div className="container mx-auto max-w-5xl px-6 py-12 flex-1 flex flex-col">
            
            {/* Navigation */}
            <button 
              onClick={() => setSelectedDomain(null)} 
              className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold group w-fit"
            >
               <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
               Back to Domains
            </button>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12 border-b border-slate-100 pb-8">
               <div className={`p-6 rounded-3xl ${selectedDomain.bgClass} bg-opacity-50 border-2`}>
                   <selectedDomain.icon size={48} className={selectedDomain.color} />
               </div>
               <div>
                   <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-slate-900">{selectedDomain.title} Assessment</h1>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${selectedDomain.color.replace('text-', 'bg-').replace('600', '50')} ${selectedDomain.color.replace('text-', 'border-').replace('600', '100')} ${selectedDomain.color}`}>
                        Clinical Protocol
                      </span>
                   </div>
                   <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">{selectedDomain.desc}</p>
               </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               
               {/* Parameters List */}
               <div className="lg:col-span-2">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-slate-400" />
                        Parameters Analyzed
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                         {selectedDomain.params.map((p, idx) => (
                             <div key={idx} className="flex items-start gap-3 group">
                                 <CheckCircle2 size={18} className={`mt-0.5 shrink-0 ${selectedDomain.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                                 <span className="text-slate-700 font-medium leading-relaxed">{p}</span>
                             </div>
                         ))}
                     </div>
                  </div>
                  
                  <div className="mt-8 p-6 rounded-2xl border border-dashed border-slate-300 bg-white">
                      <p className="text-sm text-slate-500 italic">
                        * This assessment utilizes AI-driven acoustic analysis. Results are intended to support clinical decision-making by a licensed Speech-Language Pathologist.
                      </p>
                  </div>
               </div>

               {/* Action / Context Column */}
               <div className="flex flex-col gap-6">
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                       <h3 className="font-bold text-slate-800 mb-4">Assessment Ready</h3>
                       <p className="text-sm text-slate-500 mb-6">
                          Configure your environment. Ensure background noise is minimal before beginning the {selectedDomain.title.toLowerCase()} recording session.
                       </p>
                       <button 
                          onClick={handleStart} 
                          className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                       >
                          <span>Begin Assessment</span>
                          <ChevronRight size={20} />
                       </button>
                   </div>

                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                       <h4 className="font-bold text-slate-700 text-sm mb-2">Instructions</h4>
                       <ul className="text-sm text-slate-500 space-y-2 list-disc pl-4">
                          <li>Position microphone 6 inches from mouth.</li>
                          <li>Follow the on-screen prompts precisely.</li>
                          <li>Speak in your natural volume and pitch.</li>
                       </ul>
                   </div>
               </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
    