
import React, { useState, useRef } from 'react';
import { Printer, Mail, Upload, X, Building, User, FileText, Download, Edit, Plus, ChevronRight, AlertTriangle, ArrowRight, ArrowDown, ArrowUp, Bot } from 'lucide-react';
import { AnalysisResult, ClinicProfile } from '../types';

interface ReportGeneratorProps {
  data: AnalysisResult;
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

const SeverityBar = ({ label, value, max = 100, reversed = false }: { label: string, value: number, max?: number, reversed?: boolean }) => {
  // value is 0-max. Normalize to 0-100%
  const pct = Math.min((value / max) * 100, 100);
  
  // Logic: 0-25 Normal, 25-50 Mild, 50-75 Mod, 75+ Severe
  // If reversed (e.g. Intelligibility), 75+ is Normal
  
  let zone = 0; // 0=Normal, 3=Severe
  if (!reversed) {
     if (pct < 25) zone = 0;
     else if (pct < 50) zone = 1;
     else if (pct < 75) zone = 2;
     else zone = 3;
  } else {
     if (pct > 75) zone = 0;
     else if (pct > 50) zone = 1;
     else if (pct > 25) zone = 2;
     else zone = 3;
  }

  const labels = ["Normal", "Mild", "Mod", "Severe"];
  const colors = ["#10b981", "#fbbf24", "#f97316", "#f43f5e"];
  
  // Render static SVG for PDF reliability
  return (
    <div className="mb-4 break-inside-avoid">
       <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
         <span>{label}</span>
         <span>{value.toFixed(1)}</span>
       </div>
       <div className="h-4 w-full border border-slate-300 rounded overflow-hidden flex relative">
          <div className="flex-1 bg-emerald-100 border-r border-white/50 relative flex items-center justify-center">
             <span className="text-[8px] text-emerald-800 font-bold opacity-50">NORMAL</span>
          </div>
          <div className="flex-1 bg-amber-100 border-r border-white/50 relative flex items-center justify-center">
             <span className="text-[8px] text-amber-800 font-bold opacity-50">MILD</span>
          </div>
          <div className="flex-1 bg-orange-100 border-r border-white/50 relative flex items-center justify-center">
             <span className="text-[8px] text-orange-800 font-bold opacity-50">MOD</span>
          </div>
          <div className="flex-1 bg-rose-100 relative flex items-center justify-center">
             <span className="text-[8px] text-rose-800 font-bold opacity-50">SEVERE</span>
          </div>
          
          {/* Marker */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10" 
            style={{ 
                left: reversed ? `${100 - pct}%` : `${pct}%`
            }} 
          />
       </div>
    </div>
  );
};

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ data, comparisonData, clinicProfile, onUpdateProfile, onClose }) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'settings'>('edit');
  const [editableSummary, setEditableSummary] = useState(data.summary);
  const [editableImpression, setEditableImpression] = useState(
      data.clinicalImpression 
      ? `Clinical impression consistent with ${data.clinicalImpression}.` 
      : "Clinical impression pending."
  );
  
  const printRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none overflow-hidden">
        
        {/* Header (No Print) */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white print:hidden">
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

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
          
          {/* --- EDIT TAB --- */}
          {activeTab === 'edit' && (
             <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Clinical Impression</label>
                        <textarea 
                            className="w-full p-4 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 leading-relaxed"
                            value={editableImpression}
                            onChange={(e) => setEditableImpression(e.target.value)}
                        />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Summary Findings</label>
                        <textarea 
                            className="w-full p-4 border border-slate-300 rounded-lg h-64 focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 leading-relaxed"
                            value={editableSummary}
                            onChange={(e) => setEditableSummary(e.target.value)}
                        />
                    </div>
                </div>
                
                {/* Phrase Bank Sidebar */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
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
            <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm space-y-6 m-8">
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
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    placeholder="e.g. SpeechSight Therapy Center"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">SLP Name</label>
                  <input 
                    value={clinicProfile.slpName}
                    onChange={(e) => onUpdateProfile({...clinicProfile, slpName: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    placeholder="e.g. Jane Doe, MS, CCC-SLP"
                  />
               </div>
            </div>
          )}

          {/* --- PREVIEW TAB (RENDERED PDF) --- */}
          {activeTab === 'preview' && (
            <div className="flex justify-center p-8 bg-slate-200/50 print:p-0 print:bg-white">
                <div ref={printRef} className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-12 print:shadow-none print:w-full print:p-0 text-slate-900 box-border">
                
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
                                {isComparisonReport ? 'Progress Report' : 'Speech Assessment Report'}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Generated by SpeechSight AI</p>
                        </div>
                        <div className="text-right text-sm">
                            <div><span className="font-bold text-slate-600">Date:</span> {new Date(data.timestamp).toLocaleDateString()}</div>
                            <div><span className="font-bold text-slate-600">Protocol:</span> {data.protocolId}</div>
                            <div><span className="font-bold text-slate-600">Patient:</span> {data.demographic} ({data.sex})</div>
                        </div>
                    </div>
                </div>

                {/* Clinical Impression (Editable) */}
                <div className="mb-8 p-4 bg-slate-50 border-l-4 border-slate-800 rounded-r-lg print:border-slate-800 print:bg-slate-50">
                    <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Clinical Impression</span>
                    <p className="text-lg font-bold text-slate-900 whitespace-pre-wrap">{editableImpression}</p>
                </div>

                {/* --- COMPARISON REPORT LAYOUT --- */}
                {isComparisonReport && comparisonData ? (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-4">Progress Comparison</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600">
                                    <th className="p-2 text-left">Metric</th>
                                    <th className="p-2 text-right">Baseline ({new Date(comparisonData.timestamp).toLocaleDateString()})</th>
                                    <th className="p-2 text-right">Current ({new Date(data.timestamp).toLocaleDateString()})</th>
                                    <th className="p-2 text-center">Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { label: 'Intelligibility', base: comparisonData.articulation.intelligibility, curr: data.articulation.intelligibility, unit: '%', higherIsBetter: true },
                                    { label: 'Resonance Severity', base: comparisonData.resonanceSeverityIndex, curr: data.resonanceSeverityIndex, unit: '', higherIsBetter: false },
                                    { label: 'Voice Stability', base: comparisonData.voiceMetrics.stabilityScore, curr: data.voiceMetrics.stabilityScore, unit: '', higherIsBetter: true },
                                    { label: 'PCC', base: comparisonData.articulation.pcc, curr: data.articulation.pcc, unit: '%', higherIsBetter: true },
                                ].map((row, i) => {
                                    const delta = row.curr - row.base;
                                    const isImproved = row.higherIsBetter ? delta > 0 : delta < 0;
                                    return (
                                        <tr key={i} className="border-b border-slate-100">
                                            <td className="p-2 font-bold text-slate-700">{row.label}</td>
                                            <td className="p-2 text-right text-slate-500">{row.base.toFixed(1)}{row.unit}</td>
                                            <td className="p-2 text-right font-bold text-slate-900">{row.curr.toFixed(1)}{row.unit}</td>
                                            <td className="p-2 text-center flex items-center justify-center gap-1">
                                                {delta !== 0 && (
                                                    <span className={`text-xs font-bold flex items-center ${isImproved ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {isImproved ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                        {Math.abs(delta).toFixed(1)}
                                                    </span>
                                                )}
                                                {delta === 0 && <span className="text-slate-400">-</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* --- SINGLE REPORT METRICS GRID --- */
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="p-3 border border-slate-200 rounded text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase">Intelligibility</div>
                            <div className="text-xl font-bold text-slate-900">{data.articulation.intelligibility}%</div>
                        </div>
                        <div className="p-3 border border-slate-200 rounded text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase">Resonance Idx</div>
                            <div className="text-xl font-bold text-slate-900">{data.resonanceSeverityIndex}</div>
                        </div>
                        <div className="p-3 border border-slate-200 rounded text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase">PCC</div>
                            <div className="text-xl font-bold text-slate-900">{data.articulation.pcc}%</div>
                        </div>
                        <div className="p-3 border border-slate-200 rounded text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase">Stability</div>
                            <div className="text-xl font-bold text-slate-900">{data.voiceMetrics.stabilityScore}</div>
                        </div>
                    </div>
                )}

                {/* --- SEVERITY BARS (PER DOMAIN) --- */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-3">Resonance & Voice Profile</h3>
                        <SeverityBar label="Resonance Severity" value={data.resonanceSeverityIndex} max={100} />
                        <SeverityBar label="Voice Instability" value={100 - data.voiceMetrics.stabilityScore} max={100} />
                        <SeverityBar label="Prosodic Deviation" value={data.prosody.prosodySeverityIndex} max={100} />
                    </div>
                    <div>
                         <h3 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-3">Articulation Profile</h3>
                         {/* For Artic, Normal is 100%. We need to reverse the bar logic (Left = Good/100, Right = Bad/0) */}
                         <SeverityBar label="Intelligibility Deficit" value={100 - data.articulation.intelligibility} max={100} />
                         <SeverityBar label="Consonant Error Rate" value={100 - data.articulation.pcc} max={100} />
                    </div>
                </div>

                {/* Findings Body (Editable) */}
                <section className="mb-8">
                    <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-3">Summary of Findings</h3>
                    <p className="text-sm text-slate-700 leading-relaxed text-justify whitespace-pre-wrap">{editableSummary}</p>
                </section>

                {/* Errors Table */}
                <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-3">Notable Articulation Errors</h3>
                    {data.articulation.detailedErrors && data.articulation.detailedErrors.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="font-semibold py-1">Target</th>
                                <th className="font-semibold py-1">Actual</th>
                                <th className="font-semibold py-1">Pos</th>
                                <th className="font-semibold py-1">Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.articulation.detailedErrors.slice(0, 6).map((err, i) => (
                                <tr key={i} className="border-b border-slate-50 text-slate-700">
                                <td className="py-1">/{err.target}/</td>
                                <td className="py-1">/{err.actual}/</td>
                                <td className="py-1">{err.position}</td>
                                <td className="py-1">{err.type} {err.isNasal ? '(Nasal)' : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    ) : (
                    <p className="text-sm text-slate-500 italic">No specific errors logged in this sample.</p>
                    )}
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
        <div className="p-6 border-t border-slate-200 bg-white rounded-b-2xl print:hidden flex justify-end gap-3">
           <button 
             onClick={handleEmail}
             className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
           >
             <Mail size={20} /> Email Report
           </button>
           <button 
             onClick={handlePrint}
             className="px-6 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg"
           >
             <Printer size={20} /> Print / Save PDF
           </button>
        </div>
      </div>
    </div>
  );
};
