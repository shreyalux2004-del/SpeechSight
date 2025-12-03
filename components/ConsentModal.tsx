
import React, { useState } from 'react';
import { ShieldCheck, FileText, Check, Lock } from 'lucide-react';
import { ConsentRecord } from '../types';

interface ConsentModalProps {
  onConsentGiven: (record: ConsentRecord) => void;
  clientName: string;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ onConsentGiven, clientName }) => {
  const [signatoryName, setSignatoryName] = useState("");
  const [relationship, setRelationship] = useState("Parent/Guardian");
  const [agreedRec, setAgreedRec] = useState(false);
  const [agreedStore, setAgreedStore] = useState(false);
  const [agreedProcess, setAgreedProcess] = useState(false);

  const handleAgree = () => {
    if (!signatoryName || !agreedRec || !agreedStore || !agreedProcess) return;
    
    const record: ConsentRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        clientName: clientName,
        signatoryName: signatoryName,
        relationship: relationship,
        agreedToRecording: agreedRec,
        agreedToDataStorage: agreedStore,
        // In a real app, you would capture IP and User Agent here for audit trails
        ipAddress: "Client-Side Generated", 
    };
    onConsentGiven(record);
  };

  const isComplete = signatoryName.length > 2 && agreedRec && agreedStore && agreedProcess;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
       <div className="bg-white max-w-lg w-full max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
           <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center gap-3 shrink-0">
               <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700">
                   <ShieldCheck size={20} />
               </div>
               <div>
                   <h2 className="text-xl font-bold text-slate-800">Informed Consent</h2>
                   <p className="text-xs text-slate-500">Required for clinical data processing</p>
               </div>
           </div>

           <div className="p-6 space-y-6 overflow-y-auto">
               <div className="text-sm text-slate-600 space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100 leading-relaxed">
                   <p><strong>Voice Recording:</strong> You authorize SpeechSight to record audio samples for clinical analysis. These recordings are analyzed to generate metrics on resonance, prosody, and articulation.</p>
                   <p><strong>Data Processing:</strong> To provide this analysis, encrypted audio data is transmitted securely to a <strong>third-party AI provider (Google Cloud)</strong>. Data is processed strictly for analysis and is not used to train public AI models.</p>
               </div>

               <div className="space-y-4">
                   <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                       <input 
                         type="checkbox" 
                         className="mt-1 w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300 shrink-0"
                         checked={agreedRec}
                         onChange={e => setAgreedRec(e.target.checked)}
                       />
                       <span className="text-sm text-slate-700 font-medium">I consent to the audio recording of my voice (or my child's voice).</span>
                   </label>
                   
                   <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                       <input 
                         type="checkbox" 
                         className="mt-1 w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300 shrink-0"
                         checked={agreedProcess}
                         onChange={e => setAgreedProcess(e.target.checked)}
                       />
                       <span className="text-sm text-slate-700 font-medium">I explicitly consent to the transmission of audio data to Google Cloud AI for processing and analysis.</span>
                   </label>

                   <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                       <input 
                         type="checkbox" 
                         className="mt-1 w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300 shrink-0"
                         checked={agreedStore}
                         onChange={e => setAgreedStore(e.target.checked)}
                       />
                       <span className="text-sm text-slate-700 font-medium">I understand that clinical results will be stored securely for tracking progress.</span>
                   </label>
               </div>

               <div className="space-y-4 pt-4 border-t border-slate-100">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Signatory Name (Electronic Signature)</label>
                       <input 
                          className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                          placeholder="Type your full name here"
                          value={signatoryName}
                          onChange={e => setSignatoryName(e.target.value)}
                       />
                       <p className="text-[10px] text-slate-400 mt-1">By typing your name, you are signing this document electronically.</p>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Relationship to Client</label>
                       <select 
                          className="w-full border border-slate-300 rounded-lg p-3 outline-none bg-white"
                          value={relationship}
                          onChange={e => setRelationship(e.target.value)}
                       >
                           <option>Parent/Guardian</option>
                           <option>Self</option>
                           <option>Caregiver</option>
                           <option>Legal Representative</option>
                       </select>
                   </div>
               </div>
           </div>

           <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2 text-xs text-slate-400">
                   <Lock size={12} />
                   <span>Encrypted Transmission</span>
               </div>
               <button 
                  onClick={handleAgree}
                  disabled={!isComplete}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isComplete ? 'bg-teal-600 text-white shadow-lg shadow-teal-200 hover:bg-teal-500 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
               >
                   <Check size={18} /> Confirm Consent
               </button>
           </div>
       </div>
    </div>
  );
};
