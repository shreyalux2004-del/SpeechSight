

import React, { useState, useRef } from 'react';
import { Printer, Mail, Upload, X, Building, User, FileText, Download, Edit, Plus, ChevronRight, AlertTriangle, ArrowRight, ArrowDown, ArrowUp, Bot } from 'lucide-react';
import { AnalysisResult, ClinicProfile } from '../types';

interface ReportGeneratorProps {
  data: AnalysisResult;
  sessionHistory?: AnalysisResult[]; // Allow passing full history for unified report
  comparisonData?: AnalysisResult;
  clinicProfile: ClinicProfile;
  onUpdateProfile: (profile: ClinicProfile) => void;
  onClose: () => void;
}

const PHRASE_BANK = {
  "Resonance": [
    "Hypernasality noted on high-pressure consonants.",
    "Resonance is within normal limits.",
    "Consistent nasal emission observed on fricatives.",
    "Hyponasality detected on nasal consonants /m, n/.",
    "Mixed resonance profile with cul-de-sac characteristics."
  ],
  "Articulation": [
    "Articulation precision is reduced for age.",
    "Intelligibility is adequate for conversational speech.",
    "Multiple substitutions noted, particularly for liquids /r, l/.",
    "Grimacing and compensatory behaviors observed.",
    "Weak intraoral pressure on plosives."
  ],
  "Prosody & Voice": [
    "Prosody is monotonous with reduced pitch variation.",
    "Voice quality is strained-strangled.",
    "Speech rate is excessive, affecting clarity.",
    "Breath support is adequate for phrase length.",
    "Scanning speech rhythm noted."
  ]
};

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ data, sessionHistory, comparisonData, clinicProfile, onUpdateProfile, onClose }) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'settings'>('edit');
  const [editableSummary, setEditableSummary] = useState(data.summary);
  const [editableImpression, setEditableImpression] = useState(
      data.clinicalImpression 
      ? `Clinical impression consistent with ${data.clinicalImpression}.` 
      : "Clinical impression pending."
  );
  
  const printRef = useRef<HTMLDivElement>(null);

  // Use session history if provided, otherwise create single-item array from 'data'
  const reportData = sessionHistory && sessionHistory.length > 0 ? sessionHistory : [data];
  
  // Group results by domain
  const domainGroups = reportData.reduce((acc, result) => {
      const domain = result.assessmentDomain || 'General';
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(result);
      return acc;
  }, {} as Record<string, AnalysisResult[]>);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ ...clinicProfile, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const insertPhrase = (phrase: string, target: 'summary' | 'impression') => {
    if (target === 'summary') {
        setEditableSummary(prev => prev + (prev ? " " : "") + phrase);
    } else {
        setEditableImpression(prev => prev + (prev ? " " : "") + phrase);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const subject = `Speech Analysis Report: ${data.protocolId} - ${new Date(data.timestamp).toLocaleDateString()}`;
    const body = `Please see the attached report for ${data.protocolId}. \n\nImpression: ${editableImpression}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const isComparisonReport = !!comparisonData;

  return (
    // Z-Index increased to 100 to stay above sidebar (z-40) and sticky header (z-50)
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[90vh] sm:h-[95vh] rounded-2xl shadow-2xl flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none overflow-hidden border border-slate-200">
        
        {/* Header (No Print) */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white print:hidden shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-teal-600" />
            {isComparisonReport ? 'Progress Comparison Report' : 'Clinical Report Generator'}
          </h2>
          <div className="flex gap-2">
            <div className="bg-slate-100 p-1 rounded-lg flex">
                <button 
                    onClick={() => setActiveTab('edit')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'edit' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Edit size={14} className="inline mr-1"/> Edit
                </button>
                <button 
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'preview' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Preview
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'settings' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Settings
                </button>
            </div>
            <div className="w-px bg-slate-200 mx-2"></div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content Area - Independent Scrolling */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 print:p-0 print:bg-white print:overflow-visible custom-scrollbar">
          
          {/* --- EDIT TAB --- */}
          {activeTab === 'edit' && (
             <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Clinical Impression</label>
                        <textarea 
                            className="w-full p-4 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 leading-relaxed resize-none"
                            value={editableImpression}
                            onChange={(e) => setEditableImpression(e.target.value)}
                        />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Summary Findings</label>
                        <textarea 
                            className="w-full p-4 border border-slate-300 rounded-lg h-96 focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 leading-relaxed resize-none"
                            value={editableSummary}
                            onChange={(e) => setEditableSummary(e.target.value)}
                        />
                    </div>
                </div>
                
                {/* Phrase Bank Sidebar */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Bot size={18} className="text-indigo-600" /> Phrase Bank
                    </h3>
                    <div className="space-y-6">
                        {Object.entries(PHRASE_BANK).map(([category, phrases]) => (
                            <div key={category}>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{category}</h4>
                                <div className="space-y-2">
                                    {phrases.map((phrase, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => insertPhrase(phrase, 'summary')}
                                            className="w-full text-left text-sm p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors flex items-start gap-2 group"
                                        >
                                            <Plus size={14} className="mt-0.5 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                            <span className="text-slate-600">{phrase}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm space-y-6 m-8 border border-slate-200">
               <h3 className="text-lg font-bold text-slate-700">Clinic Branding</h3>
               <div>
                 <label className="block text-sm font-bold text-slate-600 mb-2">Clinic Logo</label>
                 <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                       {clinicProfile.logo ? (
                         <img src={clinicProfile.logo} alt="Logo" className="w-full h-full object-contain" />
                       ) : (
                         <Building className="text-slate-300" />
                       )}
                    </div>
                    <label className="cursor-pointer bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
                       <Upload size={16} /> Upload Image
                       <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                 </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Clinic Name</label>
                  <input 
                    value={clinicProfile.name}
                    onChange={(e) => onUpdateProfile({...clinicProfile, name: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. SpeechSight Therapy Center"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">SLP Name</label>
                  <input 
                    value={clinicProfile.slpName}
                    onChange={(e) => onUpdateProfile({...clinicProfile, slpName: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Jane Doe, MS, CCC-SLP"
                  />
               </div>
            </div>
          )}

          {/* --- PREVIEW TAB (RENDERED PDF) --- */}
          {activeTab === 'preview' && (
            <div className="flex justify-center p-4 sm:p-8 bg-slate-200/50 print:p-0 print:bg-white min-h-full overflow-x-auto">
                <div ref={printRef} className="w-[210mm] min-w-[210mm] min-h-[297mm] bg-white shadow-xl p-12 print:shadow-none print:w-full print:p-0 text-slate-900 box-border">
                
                {/* 2-Inch Header */}
                <div className="h-32 mb-8 flex items-center justify-between border-b border-transparent print:border-none">
                    {clinicProfile.logo ? (
                        <img src={clinicProfile.logo} alt="Clinic Logo" className="h-24 object-contain" />
                    ) : (
                        <div className="text-slate-300 text-xs p-4 border border-dashed border-slate-200 w-full h-full flex items-center justify-center print:hidden">
                            2-Inch Header Space (Reserved for Letterhead)
                        </div>
                    )}
                    {clinicProfile.logo && (
                        <div className="text-right">
                            <h1 className="text-xl font-bold text-slate-800">{clinicProfile.name}</h1>
                            <p className="text-sm text-slate-500">{clinicProfile.slpName}</p>
                        </div>
                    )}
                </div>

                {/* Report Meta */}
                <div className="mb-8 border-b-2 border-slate-800 pb-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">
                                {isComparisonReport ? 'Progress Report' : 'Diagnostic Report'}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Generated by SpeechSight AI</p>
                        </div>
                        <div className="text-right text-sm">
                            <div><span className="font-bold text-slate-600">Date:</span> {new Date(data.timestamp).toLocaleDateString()}</div>
                            <div><span className="font-bold text-slate-600">Patient:</span> {data.demographic} ({data.sex})</div>
                        </div>
                    </div>
                </div>

                {/* Clinical Impression (Editable) */}
                <div className="mb-8 p-4 bg-slate-50 border-l-4 border-slate-800 rounded-r-lg print:border-slate-800 print:bg-slate-50">
                    <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Clinical Impression</span>
                    <p className="text-lg font-bold text-slate-900 whitespace-pre-wrap">{editableImpression}</p>
                </div>

                {/* --- DOMAIN SECTIONS (Unified Report) --- */}
                {Object.keys(domainGroups).map(domain => {
                    const domainResults = domainGroups[domain];
                    return (
                        <div key={domain} className="mb-8 break-inside-avoid">
                             <h3 className="text-sm font-bold text-white bg-slate-800 px-3 py-1 uppercase mb-4 inline-block rounded">{domain} Analysis</h3>
                             <div className="grid grid-cols-1 gap-4">
                                {domainResults.map((result, i) => (
                                    <div key={i} className="border border-slate-200 rounded-lg p-3 text-sm">
                                        <div className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-2 flex justify-between">
                                            <span>Task: {result.protocolId}</span>
                                            <span className="text-slate-400 font-normal text-xs">Timestamp: {new Date(result.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        {/* Dynamic content based on domain */}
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                            {domain === 'voice' && (
                                                <>
                                                    <div className="flex justify-between"><span>Pitch (F0):</span> <b>{result.voiceMetrics.fundamentalFrequency.toFixed(0)} Hz</b></div>
                                                    <div className="flex justify-between"><span>Jitter:</span> <b>{result.voiceMetrics.jitter.toFixed(2)}%</b></div>
                                                    <div className="flex justify-between"><span>Shimmer:</span> <b>{result.voiceMetrics.shimmer.toFixed(2)}%</b></div>
                                                    <div className="flex justify-between"><span>HNR:</span> <b>{result.voiceMetrics.hnr.toFixed(1)} dB</b></div>
                                                </>
                                            )}
                                            {domain === 'articulation' && (
                                                <>
                                                    <div className="flex justify-between"><span>PCC:</span> <b>{result.articulation.pcc.toFixed(1)}%</b></div>
                                                    <div className="flex justify-between"><span>Intelligibility:</span> <b>{result.articulation.intelligibility}%</b></div>
                                                    {result.articulation.errorPattern.substitutions > 0 && <div className="col-span-2 text-rose-600 text-xs">Substitutions Detected</div>}
                                                </>
                                            )}
                                            {domain === 'resonance' && (
                                                <>
                                                    <div className="flex justify-between"><span>Resonance Type:</span> <b>{result.resonanceType}</b></div>
                                                    <div className="flex justify-between"><span>Severity Index:</span> <b>{result.resonanceSeverityIndex}</b></div>
                                                    <div className="flex justify-between"><span>Nasalance (Est):</span> <b>{result.acousticNasalMetrics.nasalResonanceIndex}%</b></div>
                                                </>
                                            )}
                                            {domain === 'prosody' && (
                                                <>
                                                    <div className="flex justify-between"><span>Speech Rate:</span> <b>{result.prosody.wordsPerMinute} WPM</b></div>
                                                    <div className="flex justify-between"><span>Monotone Severity:</span> <b>{result.prosody.monotoneSeverity}%</b></div>
                                                    <div className="flex justify-between"><span>Stress Accuracy:</span> <b>{result.prosody.stressAccuracy}%</b></div>
                                                </>
                                            )}
                                            {domain === 'fluency' && result.fluency && (
                                                <>
                                                    <div className="flex justify-between"><span>Disfluency Index:</span> <b>{result.fluency.disfluencyIndex}%</b></div>
                                                    <div className="flex justify-between"><span>Severity:</span> <b>{result.fluency.severity}</b></div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    );
                })}


                {/* Findings Body (Editable) */}
                <section className="mb-8">
                    <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-3">Consolidated Summary</h3>
                    <p className="text-sm text-slate-700 leading-relaxed text-justify whitespace-pre-wrap">{editableSummary}</p>
                </section>

                {/* Signature */}
                <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end print:mt-auto">
                    <div className="text-xs text-slate-400">
                        Generated by SpeechSight Clinical AI<br/>
                        {new Date().toLocaleString()}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-48 border-b border-slate-400"></div>
                        <span className="text-xs font-bold text-slate-600 uppercase">Clinician Signature</span>
                    </div>
                </div>

            </div>
          </div>
          )}

        </div>

        {/* Footer Actions (No Print) */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-white rounded-b-2xl print:hidden flex flex-col sm:flex-row justify-end gap-3 shrink-0">
           <button 
             onClick={handleEmail}
             className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
           >
             <Mail size={20} /> Email Report
           </button>
           <button 
             onClick={handlePrint}
             className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
           >
             <Printer size={20} /> Print / Save PDF
           </button>
        </div>
      </div>
    </div>
  );
};
