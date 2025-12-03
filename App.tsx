import React, { useState, useEffect } from 'react';
import { AudioRecorder, DEFAULT_PROTOCOLS } from './components/AudioRecorder';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { LandingPage } from './components/LandingPage';
import { SettingsModal } from './components/SettingsModal';
import { analyzeAudio } from './services/geminiService';
import { AnalysisResult, AppState, Demographic, ProtocolDef, Language, BiologicalSex, ClinicProfile, ClientDetails, ViewMode, Dialect, AssessmentDomain } from './types';
import { Eye, EyeOff, Settings, WifiOff, Cloud, CloudOff, ArrowLeft, CheckCircle2, Circle, FileOutput, Menu, ChevronRight } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [customProtocols, setCustomProtocols] = useState<ProtocolDef[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('SLP');
  const [showSettings, setShowSettings] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // New state for the selected domain and protocol
  const [activeDomain, setActiveDomain] = useState<AssessmentDomain | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<string | undefined>(undefined);
  
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

  const handleStartAssessment = (domain: AssessmentDomain, protocolId?: string) => {
     setActiveDomain(domain);
     setActiveProtocol(protocolId);
     setAppState(AppState.IDLE);
  };

  const handleNextTask = (domain: AssessmentDomain, protocolId: string) => {
     setActiveDomain(domain);
     setActiveProtocol(protocolId);
     setAppState(AppState.IDLE);
  };

  const handleSwitchProtocol = (protocolId: string) => {
      setActiveProtocol(protocolId);
      // If we are currently viewing results, we might want to stay there if results exist for this protocol,
      // but for simplicity and "assessment flow", we switch to the recorder view for the selected task
      // unless we specifically want to view history.
      // Checking if we have results for this protocol:
      const existingResult = history.find(h => h.protocolId === protocolId || (DEFAULT_PROTOCOLS[protocolId] && h.protocolId === DEFAULT_PROTOCOLS[protocolId].title));
      
      if (existingResult) {
          // If result exists, user might want to see it, or retake it. 
          // Defaulting to recorder (IDLE) allows retaking, and Dashboard usually has a "History" tab.
          // But to be "safe" and allow "switching", IDLE is safest state to ensure the Recorder props update.
          setAppState(AppState.IDLE); 
      } else {
          setAppState(AppState.IDLE);
      }
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
        
        // IMPORTANT: In this flow, we don't reset history if we are in a 'Session'.
        // We append to history so we can generate a consolidated report.
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
    // Start a fresh session
    setHistory([]);
    setAppState(AppState.IDLE);
  };

  const handleRetry = () => {
    setAppState(AppState.IDLE);
  };

  const handleAddProtocol = (protocol: ProtocolDef) => {
    setCustomProtocols(prev => [...prev, protocol]);
  };

  // Logic to find all remaining tasks in the current domain
  const getDomainTasks = (): ProtocolDef[] => {
      if (!activeDomain) return [];
      const allProtocols: Record<string, ProtocolDef> = { 
          ...DEFAULT_PROTOCOLS, 
          ...customProtocols.reduce((acc, p) => ({...acc, [p.id]: p}), {} as Record<string, ProtocolDef>) 
      };
      return Object.values(allProtocols).filter(p => p.category === activeDomain || (p.isCustom && activeDomain === 'General'));
  };
  
  const getRemainingTasks = (): ProtocolDef[] => {
      const domainTasks = getDomainTasks();
      const completedTaskTitles = history.map(h => h.protocolId); 
      return domainTasks.filter(t => !completedTaskTitles.includes(t.title));
  };

  const remainingTasks = appState === AppState.RESULTS ? getRemainingTasks() : [];
  
  const domainTasks = getDomainTasks();
  const completedCount = domainTasks.filter(t => history.some(h => h.protocolId === t.title)).length;
  const totalCount = domainTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Task Sidebar Component
  const TaskSidebar = () => (
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 bottom-0 z-40 overflow-hidden shadow-lg animate-in slide-in-from-left-4 hidden lg:flex">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Domain</h3>
              <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-800 capitalize">{activeDomain}</span>
                  <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">
                      {completedCount}/{totalCount}
                  </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {domainTasks.map(task => {
                  const isCompleted = history.some(h => h.protocolId === task.title);
                  const isActive = activeProtocol === task.id;
                  
                  return (
                      <button
                          key={task.id}
                          onClick={() => handleSwitchProtocol(task.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 group ${
                              isActive 
                              ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                              : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'
                          }`}
                      >
                          <div className={`mt-0.5 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-500' : 'text-slate-300'}`}>
                              {isCompleted ? <CheckCircle2 size={18} className="fill-emerald-50" /> : <Circle size={18} />}
                          </div>
                          <div className="flex-1">
                              <div className={`text-sm font-bold ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{task.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</div>
                          </div>
                          {isActive && <div className="self-center"><ChevronRight size={14} className="text-indigo-400" /></div>}
                      </button>
                  );
              })}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button 
                  onClick={() => setAppState(AppState.RESULTS)} // Or specific report view logic
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                      progress === 100 
                      ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md animate-pulse' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                  <FileOutput size={18} />
                  Unified Report
              </button>
          </div>
      </div>
  );

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
               <div className="flex items-center gap-4">
                 <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors" aria-label="Go Back">
                    <ArrowLeft size={24} />
                 </button>

                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">SS</div>
                    <span className="font-bold text-slate-800 tracking-tight text-lg hidden md:inline">SpeechSight</span>
                 </div>

                 {activeDomain && (
                    <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
                 )}
                 
                 {activeDomain && (
                    <span className="hidden md:inline-flex text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-bold uppercase tracking-wider">
                        {activeDomain} Mode
                    </span>
                 )}
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 mr-4">
                     {effectiveOffline ? (
                         <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                             <WifiOff size={12} /> Offline
                         </div>
                     ) : clinicProfile.enableCloudBackup ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200" title="Encrypted Backup Active">
                            <Cloud size={12} /> Sync
                        </div>
                     ) : null}
                  </div>

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

            <div className="flex flex-1 relative">
                {/* Fixed Left Sidebar for Task Navigation */}
                {activeDomain && <TaskSidebar />}

                {/* Main Content Area */}
                <div className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:w-full print:max-w-none transition-all duration-300 ${activeDomain ? 'lg:pl-80' : ''}`}>
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
                      remainingTasks={remainingTasks}
                      onNextTask={handleNextTask}
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
                      initialProtocolId={activeProtocol}
                    />
                  )}
                </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;