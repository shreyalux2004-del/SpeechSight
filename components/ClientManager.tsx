
import React, { useState } from 'react';
import { User, Calendar, CheckSquare, Plus, X, BrainCircuit, Target, FileText, Clock, Save, Trash2, ArrowRight, Building, Users, Share2, Copy } from 'lucide-react';
import { ClientDetails, TherapyGoal, TherapyNote, AnalysisResult, ClinicProfile } from '../types';

interface ClientManagerProps {
  client: ClientDetails;
  clinicProfile: ClinicProfile;
  onUpdateClient: (client: ClientDetails) => void;
  latestResult?: AnalysisResult;
  onClose: () => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({ client, clinicProfile, onUpdateClient, latestResult, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'goals' | 'plan' | 'notes' | 'team'>('plan');
  
  // Goal State
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<TherapyGoal['category']>('Resonance');

  // Task State
  const [newTaskText, setNewTaskText] = useState("");

  // Share State
  const [newShareEmail, setNewShareEmail] = useState("");
  
  // Add Goal
  const handleAddGoal = () => {
    if (!newGoalText) return;
    const goal: TherapyGoal = {
        id: Date.now().toString(),
        description: newGoalText,
        category: newGoalCategory,
        target: "TBD",
        status: 'In Progress',
        startDate: Date.now()
    };
    onUpdateClient({
        ...client,
        goals: [...client.goals, goal]
    });
    setNewGoalText("");
  };

  const updateGoalStatus = (goalId: string, status: TherapyGoal['status']) => {
      onUpdateClient({
          ...client,
          goals: client.goals.map(g => g.id === goalId ? { ...g, status } : g)
      });
  };

  const deleteGoal = (goalId: string) => {
      onUpdateClient({
          ...client,
          goals: client.goals.filter(g => g.id !== goalId)
      });
  };

  // Therapy Plan Logic
  const generateAutoTasks = () => {
     if (!latestResult) return;
     const suggestions: string[] = [];
     
     if (latestResult.resonanceSeverityIndex > 30) {
         suggestions.push("Biofeedback: Visual nasalance drills");
         suggestions.push("CPAP Therapy / Resistance training");
     }
     if (latestResult.articulation.pcc < 85) {
         suggestions.push("Minimal Pair Contrast therapy");
         suggestions.push("Phonetic placement for error sounds");
     }
     if (latestResult.voiceMetrics.stabilityScore < 70) {
         suggestions.push("SOVT Exercises (Straw phonation)");
         suggestions.push("Resonant Voice Therapy drills");
     }
     if (latestResult.prosody.monotoneSeverity > 60) {
         suggestions.push("Intonation contour tracing");
         suggestions.push("Emotive speech drills");
     }

     const unique = suggestions.filter(s => !client.nextSessionTasks.includes(s));
     
     onUpdateClient({
         ...client,
         nextSessionTasks: [...client.nextSessionTasks, ...unique]
     });
  };

  const addTask = () => {
      if (!newTaskText) return;
      onUpdateClient({
          ...client,
          nextSessionTasks: [...client.nextSessionTasks, newTaskText]
      });
      setNewTaskText("");
  };

  const removeTask = (idx: number) => {
      onUpdateClient({
          ...client,
          nextSessionTasks: client.nextSessionTasks.filter((_, i) => i !== idx)
      });
  };

  const setFollowUp = (months: number) => {
      const date = new Date();
      date.setMonth(date.getMonth() + months);
      onUpdateClient({
          ...client,
          followUpDate: date.getTime()
      });
  };

  // Team Logic
  const shareAccess = () => {
      if (!newShareEmail || !newShareEmail.includes('@')) return;
      onUpdateClient({
          ...client,
          sharedWith: [...client.sharedWith, newShareEmail]
      });
      setNewShareEmail("");
  };

  const removeAccess = (email: string) => {
      onUpdateClient({
          ...client,
          sharedWith: client.sharedWith.filter(e => e !== email)
      });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-start">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
                    {client.name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
                    <div className="text-sm text-slate-500 flex gap-3">
                        <span>{client.age} Years</span>
                        <span>•</span>
                        <span>{client.diagnosis || "No Diagnosis Set"}</span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="text-slate-400" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto">
            {[
                { id: 'plan', label: 'Therapy Plan', icon: Calendar },
                { id: 'goals', label: 'Goals', icon: Target },
                { id: 'notes', label: 'Session Notes', icon: FileText },
                { id: 'team', label: 'Team Access', icon: Users },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'border-indigo-600 text-indigo-600 bg-white' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            
            {/* --- TEAM ACCESS TAB --- */}
            {activeTab === 'team' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Users size={18} className="text-indigo-600" />
                                Multi-Therapist Access
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Grant access to other Speech-Language Pathologists in your clinic. They will be able to view reports and track progress for this client.
                            </p>
                            
                            <div className="flex gap-2 mb-6">
                                <input 
                                    className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Enter SLP email address..."
                                    value={newShareEmail}
                                    onChange={e => setNewShareEmail(e.target.value)}
                                />
                                <button onClick={shareAccess} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-500 flex items-center gap-2">
                                    <Share2 size={16} /> Invite
                                </button>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase">Active Collaborators</h4>
                                {client.sharedWith.length === 0 && <p className="text-sm text-slate-400 italic">No shared access.</p>}
                                {client.sharedWith.map(email => (
                                    <div key={email} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                <User size={14} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{email}</span>
                                        </div>
                                        <button onClick={() => removeAccess(email)} className="text-slate-400 hover:text-rose-500">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Building size={18} className="text-slate-600" />
                                Clinic Institution
                            </h3>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                                <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Organization</span>
                                <div className="font-bold text-slate-800">{clinicProfile.name}</div>
                            </div>
                            
                            <div className="p-4 bg-slate-900 rounded-lg text-white mb-2 relative group cursor-pointer" onClick={() => navigator.clipboard.writeText(clinicProfile.code)}>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Clinic Access Code</span>
                                <div className="font-mono text-xl font-bold tracking-wider">{clinicProfile.code}</div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy size={16} className="text-slate-400" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">Share this code to group multiple therapists under one clinic billing account.</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- PLAN TAB --- */}
            {activeTab === 'plan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Next Session Tasks */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <CheckSquare size={18} className="text-teal-600" />
                                Next Session Tasks
                            </h3>
                            {latestResult && (
                                <button 
                                    onClick={generateAutoTasks}
                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100 flex items-center gap-1 font-semibold"
                                >
                                    <BrainCircuit size={12} /> Auto-Suggest
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-2 mb-4">
                            {client.nextSessionTasks.length === 0 && (
                                <p className="text-sm text-slate-400 italic py-4 text-center">No tasks scheduled.</p>
                            )}
                            {client.nextSessionTasks.map((task, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                                    <span className="text-sm text-slate-700 flex-1">{task}</span>
                                    <button onClick={() => removeTask(i)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 mt-4">
                            <input 
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Add custom task..."
                                value={newTaskText}
                                onChange={e => setNewTaskText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTask()}
                            />
                            <button onClick={addTask} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700">
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Follow-up Scheduler */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Clock size={18} className="text-amber-600" />
                            Next Assessment
                        </h3>
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center mb-6">
                            <span className="block text-xs text-slate-400 uppercase font-bold mb-1">Scheduled Date</span>
                            <div className="text-2xl font-bold text-slate-800">
                                {client.followUpDate ? new Date(client.followUpDate).toLocaleDateString() : "Not Scheduled"}
                            </div>
                            {client.followUpDate && (
                                <span className="text-xs text-indigo-600 font-medium mt-1 block">
                                    {Math.ceil((client.followUpDate - Date.now()) / (1000 * 60 * 60 * 24))} days away
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setFollowUp(3)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 text-slate-600">
                                +3 Months
                            </button>
                            <button onClick={() => setFollowUp(6)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 text-slate-600">
                                +6 Months
                            </button>
                            <input 
                                type="date" 
                                className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600"
                                onChange={(e) => {
                                    if(e.target.value) onUpdateClient({...client, followUpDate: new Date(e.target.value).getTime()})
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* --- GOALS TAB --- */}
            {activeTab === 'goals' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex gap-4 items-end mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Goal Description</label>
                                <input 
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                                    placeholder="e.g. Reduce hypernasality to mild severity"
                                    value={newGoalText}
                                    onChange={e => setNewGoalText(e.target.value)}
                                />
                            </div>
                            <div className="w-40">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                <select 
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none bg-white"
                                    value={newGoalCategory}
                                    onChange={e => setNewGoalCategory(e.target.value as any)}
                                >
                                    <option>Resonance</option>
                                    <option>Articulation</option>
                                    <option>Voice</option>
                                    <option>Prosody</option>
                                </select>
                            </div>
                            <button 
                                onClick={handleAddGoal}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-500 transition-colors"
                            >
                                Add Goal
                            </button>
                        </div>

                        <div className="space-y-3">
                            {client.goals.length === 0 && <p className="text-center text-slate-400 py-8">No active goals found.</p>}
                            {client.goals.map(goal => (
                                <div key={goal.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg hover:shadow-sm transition-shadow bg-white">
                                    <div className={`w-2 h-12 rounded-full ${
                                        goal.status === 'Met' ? 'bg-emerald-500' : goal.status === 'Discontinued' ? 'bg-slate-300' : 'bg-indigo-500'
                                    }`}></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{goal.category}</span>
                                            <span className="text-xs text-slate-300">•</span>
                                            <span className="text-xs text-slate-400">Set {new Date(goal.startDate).toLocaleDateString()}</span>
                                        </div>
                                        <p className="font-semibold text-slate-800">{goal.description}</p>
                                    </div>
                                    <select 
                                        value={goal.status}
                                        onChange={(e) => updateGoalStatus(goal.id, e.target.value as any)}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer ${
                                            goal.status === 'Met' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            goal.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        <option value="In Progress">In Progress</option>
                                        <option value="Met">Met</option>
                                        <option value="Discontinued">Discontinued</option>
                                    </select>
                                    <button onClick={() => deleteGoal(goal.id)} className="text-slate-300 hover:text-rose-500 p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- NOTES TAB --- */}
            {activeTab === 'notes' && (
                <div className="space-y-6">
                    {client.notes.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                            <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-slate-500">No session notes recorded yet.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-8 py-2">
                            {client.notes.sort((a,b) => b.timestamp - a.timestamp).map(note => (
                                <div key={note.id} className="relative bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="absolute -left-[41px] top-5 w-4 h-4 rounded-full bg-white border-4 border-indigo-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-slate-700">
                                            {new Date(note.timestamp).toLocaleDateString()} at {new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                            {note.author}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{note.text}</p>
                                    {note.sessionId && <div className="mt-3 pt-2 border-t border-slate-100">
                                        <span className="text-xs text-indigo-500 font-medium flex items-center gap-1">
                                            Linked to Session {note.sessionId.slice(0,8)}...
                                        </span>
                                    </div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
