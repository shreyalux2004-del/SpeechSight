
import React, { useState, useEffect } from 'react';
import { AudioRecorder } from './components/AudioRecorder';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { LandingPage } from './components/LandingPage';
import { SettingsModal } from './components/SettingsModal';
import { analyzeAudio } from './services/geminiService';
import { AnalysisResult, AppState, Demographic, ProtocolDef, Language, BiologicalSex, ClinicProfile, ClientDetails, ViewMode, Dialect, AssessmentDomain } from './types';
import { Eye, EyeOff, Settings, WifiOff, Cloud, CloudOff, ArrowLeft } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [customProtocols, setCustomProtocols] = useState<ProtocolDef[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('SLP');
  const [showSettings, setShowSettings] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // New state for the selected domain
  const [activeDomain, setActiveDomain] = useState<AssessmentDomain | null>(null);
  
  // Persist branding (simple state for demo, would be localstorage/db in prod)
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile>({
     id: "clinic-123",
     code: "CLINIC-" + Math.floor(1000 + Math.random() * 9000), 
     name: "SpeechSight Clinic",
     slpName: "Clinical SLP",
     email: "",
     logo: null,
     preferredRatingScale: '0-3', // Default
     enableCloudBackup: true,
     isOfflineMode: false
  });

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Use profile override for offline mode if set
  const effectiveOffline = isOffline || clinicProfile.isOfflineMode;

  // Dummy Client Data for Demo
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
      id: "client-001",
      name: "Alex Smith",
      age: 8,
      diagnosis: "Cleft Palate Repair (Post-Op)",
      goals: [
          { id: "g1", description: "Reduce Hypernasality to mild/normal", category: "Resonance", target: "Mild", status: "In Progress", startDate: Date.now() - 10000000 },
          { id: "g2", description: "Increase MPD to >10 seconds", category: "Voice", target: "10s", status: "In Progress", startDate: Date.now() - 5000000 }
      ],
      notes: [],
      nextSessionTasks: ["Biofeedback for /s/ and /z/", "High-pressure consonant drills"],
      followUpDate: Date.now() + 1000 * 60 * 60 * 24 * 30, // +1 Month
      sharedWith: []
  });

  const handleStartAssessment = (domain: AssessmentDomain) => {
     setActiveDomain(domain);
     setAppState(AppState.IDLE);
  };

  const handleBack = () => {
    if (appState === AppState.RESULTS) {
      setAppState(AppState.IDLE);
    } else {
      setAppState(AppState.LANDING);
    }
  };

  const handleAnalysis = async (audioBlob: Blob, taskContext: string, demographic: Demographic, sex: BiologicalSex, language: Language, bookmarks: number[], dialect?: Dialect) => {
    if (effectiveOffline) {
        // In real app: Queue in IndexedDB
        console.log("Analysis queued (Offline)");
        setAppState(AppState.IDLE);
        return;
    }
    
    setAppState(AppState.PROCESSING);
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        const mimeType = audioBlob.type || 'audio/webm';
        
        // Pass the active domain to the service
        const result = await analyzeAudio(base64Content, mimeType, taskContext, demographic, language, bookmarks, sex, activeDomain || undefined);
        result.dialect = dialect; // Attach dialect metadata

        const audioUrl = URL.createObjectURL(audioBlob);
        result.audioUrl = audioUrl;

        setHistory(prev => [...prev, result]);
        setAppState(AppState.RESULTS);
      } catch (error) {
        console.error(error);
        alert("Analysis failed. Please try again.");
        setAppState(AppState.IDLE);
      }
    };
  };

  const handleUpdateResult = (id: string, updates: Partial<AnalysisResult>) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleReset = () => {
    setHistory([]);
    setAppState(AppState.IDLE);
  };

  const handleRetry = () => {
    setAppState(AppState.IDLE);
  };

  const handleAddProtocol = (protocol: ProtocolDef) => {
    setCustomProtocols(prev => [...prev, protocol]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {showSettings && (
          <SettingsModal 
             profile={clinicProfile} 
             onUpdateProfile={setClinicProfile} 
             onClose={() => setShowSettings(false)} 
          />
      )}

      <main className="min-h-screen flex flex-col">
        {appState === AppState.LANDING ? (
          <LandingPage onStart={handleStartAssessment} initialDomainId={activeDomain} />
        ) : (
          <>
            {/* Top Navigation Bar - Full Width */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
               <div className="flex items-center gap-2">
                 {/* Back Button */}
                 <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors mr-1" aria-label="Go Back">
                    <ArrowLeft size={24} />
                 </button>

                 <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">SS</div>
                 <span className="font-bold text-slate-800 tracking-tight text-lg">SpeechSight</span>
                 {activeDomain && (
                    <span className="hidden md:inline-flex text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-bold uppercase tracking-wider">
                        {activeDomain} Mode
                    </span>
                 )}
                 <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-mono hidden sm:block">
                     {clinicProfile.code}
                 </span>
                 
                 {/* Cloud/Offline Indicators */}
                 <div className="ml-4 flex items-center gap-2">
                     {effectiveOffline ? (
                         <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                             <WifiOff size={12} /> Offline
                         </div>
                     ) : clinicProfile.enableCloudBackup ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200" title="Encrypted Backup Active">
                            <Cloud size={12} /> Cloud Sync
                        </div>
                     ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200" title="Local Only">
                            <CloudOff size={12} /> Local
                        </div>
                     )}
                 </div>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                      <button 
                        onClick={() => setViewMode('SLP')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'SLP' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <Eye size={14} /> SLP
                      </button>
                      <button 
                        onClick={() => setViewMode('Parent')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'Parent' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <EyeOff size={14} /> Parent
                      </button>
                  </div>
                  
                  <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors">
                      <Settings size={20} />
                  </button>
               </div>
            </div>

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:w-full print:max-w-none">
              {appState === AppState.RESULTS && history.length > 0 ? (
                <AnalysisDashboard 
                  history={history} 
                  onUpdateResult={handleUpdateResult}
                  onReset={handleReset} 
                  onRetry={handleRetry}
                  clinicProfile={clinicProfile}
                  onUpdateProfile={setClinicProfile}
                  clientDetails={clientDetails}
                  onUpdateClient={setClientDetails}
                  viewMode={viewMode}
                />
              ) : (
                <AudioRecorder 
                  onAnalysisComplete={handleAnalysis} 
                  isProcessing={appState === AppState.PROCESSING} 
                  attemptNumber={history.length + 1}
                  customProtocols={customProtocols}
                  onAddProtocol={handleAddProtocol}
                  isOffline={effectiveOffline}
                  assessmentDomain={activeDomain || undefined}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
    