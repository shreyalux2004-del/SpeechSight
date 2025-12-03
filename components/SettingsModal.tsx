
import React from 'react';
import { Settings, X, Cloud, Lock, WifiOff, BarChart3, Database } from 'lucide-react';
import { ClinicProfile, RatingScaleType } from '../types';

interface SettingsModalProps {
  profile: ClinicProfile;
  onUpdateProfile: (p: ClinicProfile) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ profile, onUpdateProfile, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
                <Settings size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">App Settings</h2>
                <p className="text-xs text-slate-500">Configure clinical preferences</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
             <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
            
            {/* Rating Scales */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
                    <BarChart3 size={18} className="text-teal-600" />
                    <h3>Perceptual Rating Scale</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {['0-3', '0-5', '0-10'].map((scale) => (
                        <button
                           key={scale}
                           onClick={() => onUpdateProfile({ ...profile, preferredRatingScale: scale as RatingScaleType })}
                           className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                               profile.preferredRatingScale === scale 
                               ? 'bg-teal-50 border-teal-500 text-teal-700 ring-1 ring-teal-500' 
                               : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                           }`}
                        >
                           <div className="text-lg mb-1">{scale}</div>
                           <div className="text-[10px] uppercase opacity-70">
                               {scale === '0-3' ? 'Clinical (Standard)' : scale === '0-5' ? 'Likert' : 'Visual Analog'}
                           </div>
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Select your preferred scale for perceptual ratings (Hypernasality, etc.). 
                    AI results (0-3) will be mathematically mapped to your chosen scale for visualization.
                </p>
            </div>

            {/* Cloud & Data */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
                    <Cloud size={18} className="text-indigo-600" />
                    <h3>Cloud & Backup</h3>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profile.enableCloudBackup ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                            <Database size={16} />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-700">Secure Cloud Backup</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                                <Lock size={10} /> End-to-end Encrypted
                            </div>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={profile.enableCloudBackup}
                            onChange={(e) => onUpdateProfile({ ...profile, enableCloudBackup: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profile.isOfflineMode ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                            <WifiOff size={16} />
                        </div>
                        <div>
                            <div className="font-semibold text-slate-700">Offline Mode</div>
                            <div className="text-xs text-slate-400">
                                Queue analyses locally
                            </div>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={profile.isOfflineMode}
                            onChange={(e) => onUpdateProfile({ ...profile, isOfflineMode: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                </div>
            </div>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                Done
            </button>
        </div>

      </div>
    </div>
  );
};
