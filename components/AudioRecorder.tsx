import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, FileText, Info, CheckCircle2, Play, Volume2, Ear, AlertTriangle, Check, Scissors, User, Baby, Flag, Plus, Smartphone, MoveVertical, Edit, X, Globe, ChevronDown, Gamepad2, WifiOff } from 'lucide-react';
import { Spectrogram } from './Spectrogram';
import { Demographic, ProtocolDef, ProtocolType, Language, BiologicalSex, Dialect, AssessmentDomain } from '../types';
import { LoudnessMeter, PitchRollercoaster, ResonanceGauge, ClarityRing } from './RealTimeVisualizers';

interface AudioRecorderProps {
  onAnalysisComplete: (audioBlob: Blob, context: string, demographic: Demographic, sex: BiologicalSex, language: Language, bookmarks: number[], dialect?: Dialect) => void;
  isProcessing: boolean;
  attemptNumber: number;
  customProtocols: ProtocolDef[];
  onAddProtocol: (protocol: ProtocolDef) => void;
  isOffline: boolean;
  assessmentDomain?: AssessmentDomain; // New prop
  initialProtocolId?: string; // New prop for pre-selecting task
}

const DIALECT_OPTIONS: Record<Language, string[]> = {
  English: ["US - General", "US - Southern", "UK - RP", "UK - Northern", "Australian", "Indian English", "Singaporean"],
  Tamil: ["Chennai", "Madurai", "Kongu", "Jaffna (Sri Lanka)", "Malaysia"],
  Malayalam: ["Valluvanadan", "Malabar", "Travancore", "Kochi"],
  Bengali: ["Kolkata (Standard)", "Dhaka (Bangladeshi)", "Sylheti"],
  Hindi: ["Standard (Khari Boli)", "Bhojpuri Accent", "Haryanvi Accent"],
  Telugu: ["Coastal (Andhra)", "Rayalaseema", "Telangana"],
  Kannada: ["Mysore (Standard)", "North Karnataka", "Mangalore", "Bangalore"]
};

export const DEFAULT_PROTOCOLS: Record<string, ProtocolDef> = {
  // --- VOICE DOMAIN ---
  vowels: { 
    id: 'vowels',
    title: 'Sustained Vowels',
    description: 'Voice quality stability (/a/, /i/, /u/).',
    focus: 'Jitter, Shimmer, HNR & Intensity',
    steps: {
      English: ["Say 'ahhh' (5 seconds)", "Say 'eee' (5 seconds)", "Say 'ooo' (5 seconds)"]
    },
    layout: 'cards',
    note: 'Isolates laryngeal function. Keep pitch and loudness steady.',
    category: 'voice'
  },
  mpd: {
    id: 'mpd',
    title: 'Max Phonation Time',
    description: 'Respiratory capacity (MPD).',
    focus: 'Aerodynamics & Breath Support',
    steps: {
      English: ["Take a deep breath...", "Say 'ahhh' for as long as you can."]
    },
    layout: 'cards',
    note: 'Measures Maximum Phonation Duration (MPD).',
    category: 'voice'
  },
  sz_ratio: {
    id: 'sz_ratio',
    title: 's/z Ratio',
    description: 'Laryngeal efficiency.',
    focus: 'Glottal Competence',
    steps: {
      English: ["Take a deep breath. Say /s/ as long as you can.", "Take a deep breath. Say /z/ as long as you can."]
    },
    layout: 'cards',
    note: 's/z ratio > 1.4 suggests laryngeal pathology.',
    category: 'voice'
  },
  pitch_glide: {
    id: 'pitch_glide',
    title: 'Pitch Glide',
    description: 'Range flexibility.',
    focus: 'Pitch Range (High-Low)',
    steps: {
      English: ["Glide from your lowest note to your highest note on /a/.", "Glide from your highest note to your lowest note on /a/."]
    },
    layout: 'cards',
    note: 'Assesses physiological pitch range and control.',
    category: 'voice'
  },
  loudness_var: {
    id: 'loudness_var',
    title: 'Loudness Variation',
    description: 'Dynamic control.',
    focus: 'Intensity Range',
    steps: {
      English: ["Say 'Hey!' softly.", "Say 'Hey!' at a conversational volume.", "Say 'Hey!' loudly (as if shouting across the street)."]
    },
    layout: 'cards',
    note: 'Checks ability to modulate vocal intensity.',
    category: 'voice'
  },
  grbas: {
    id: 'grbas',
    title: 'GRBAS Sample',
    description: 'Standard reading for rating.',
    focus: 'Perceptual Voice Quality',
    steps: {
      English: ["The blue spot is on the key again.", "How hard did he hit him?", "We were away a year ago."]
    },
    layout: 'list',
    note: 'Standard sentences for Grade, Roughness, Breathiness, Asthenia, Strain.',
    category: 'voice'
  },
  reading_voice: {
    id: 'reading_voice',
    title: 'Reading Passage (Voice)',
    description: 'Connected speech.',
    focus: 'Voice in Context',
    steps: {
      English: ["When the sunlight strikes raindrops in the air, they act like a prism and form a rainbow.", "The rainbow is a division of white light into many beautiful colors.", "These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon."]
    },
    layout: 'list',
    note: 'Segment of the Rainbow Passage.',
    category: 'voice'
  },

  // --- ARTICULATION DOMAIN ---
  words: {
    id: 'words',
    title: 'Word List',
    description: 'Targeted articulation.',
    focus: 'Phoneme Precision',
    steps: {
      English: ["Puppy", "Baby", "Ticket", "Dad", "Coke", "Giggle", "Sister", "Zoo", "Money", "Noon"]
    },
    layout: 'grid',
    note: 'Phonemically balanced list.',
    category: 'articulation'
  },
  repetition: {
    id: 'repetition',
    title: 'Sentence Repetition',
    description: 'Recall and production.',
    focus: 'Articulation accuracy',
    steps: {
      English: ["The dog ran home.", "She eats a red apple.", "The big yellow bus stopped."]
    },
    layout: 'list',
    note: 'Assesses speech production under imitation load.',
    category: 'articulation'
  },
  phoneme_words: {
    id: 'phoneme_words',
    title: 'Phoneme-Specific',
    description: 'Targeted sounds (/r/, /l/, /s/).',
    focus: 'Specific Error Patterns',
    steps: {
      English: ["Red", "Rabbit", "Carrot", "Door", "Leaf", "Yellow", "Ball", "Sun", "Messy", "Bus"]
    },
    layout: 'grid',
    note: 'Focuses on common error sounds (Liquids, Fricatives).',
    category: 'articulation'
  },
  minimal_pairs: {
    id: 'minimal_pairs',
    title: 'Minimal Pairs',
    description: 'Phonemic contrast.',
    focus: 'Discrimination & Production',
    steps: {
      English: ["Key - Tea", "Go - Doe", "Bow - Boat", "Sea - She", "Fan - Pan"]
    },
    layout: 'list',
    note: 'Checks ability to signal meaning differences via phonemes.',
    category: 'articulation'
  },
  picture_naming: {
    id: 'picture_naming',
    title: 'Picture Naming',
    description: 'Confrontation naming.',
    focus: 'Spontaneous Word Retrieval',
    steps: {
      English: ["(Describe: Cup)", "(Describe: Shoe)", "(Describe: House)", "(Describe: Tree)", "(Describe: Dog)"]
    },
    layout: 'cards',
    note: 'Simulated picture naming task.',
    category: 'articulation'
  },

  // --- RESONANCE DOMAIN ---
  mixed: {
    id: 'mixed',
    title: 'Mixed Sentences',
    description: 'General resonance check.',
    focus: 'Overall Intelligibility',
    steps: {
      English: ["The rainbow is a division of white light into many beautiful colors.", "In the summer they sing a song.", "We go to the zoo on Sunday."]
    },
    layout: 'list',
    note: 'Representative mix of oral and nasal sounds.',
    category: 'resonance'
  },
  oral: {
    id: 'oral',
    title: 'Standard Oral Set',
    description: 'High-pressure check.',
    focus: 'Hypernasality & Emission',
    steps: {
      English: ["Popeye plays baseball.", "Buy baby a bib.", "Take a turtle to the tea party.", "Do it for Daddy.", "Keep the cookies in the kitchen."]
    },
    layout: 'list',
    note: 'Devoid of nasal consonants. Detects hypernasality.',
    category: 'resonance'
  },
  nasal: {
    id: 'nasal',
    title: 'Standard Nasal Set',
    description: 'Hyponasality check.',
    focus: 'Hyponasal Resonance',
    steps: {
      English: ["My mama made lemon jam.", "Many men moon the moon.", "Mom's name is Nanny.", "My mom makes money."]
    },
    layout: 'list',
    note: 'Loaded with /m/ and /n/. Detects hyponasality.',
    category: 'resonance'
  },
  high_pressure: {
    id: 'high_pressure',
    title: 'High-Pressure Words',
    description: 'Nasal Emission check.',
    focus: 'Velo-Pharyngeal Closure',
    steps: {
      English: ["Paper", "Puppy", "Baby", "Bobby", "Cookie", "Cake", "Sister", "Sissy"]
    },
    layout: 'grid',
    note: 'Words requiring tight VP closure.',
    category: 'resonance'
  },
  nasal_words: {
    id: 'nasal_words',
    title: 'Nasal-Only Words',
    description: 'Hyponasality probe.',
    focus: 'Nasal Patency',
    steps: {
      English: ["Mom", "Man", "Moon", "No", "Nine", "None", "Ring", "Long"]
    },
    layout: 'grid',
    note: 'Should be fully resonated in the nose.',
    category: 'resonance'
  },
  spontaneous_res: {
    id: 'spontaneous_res',
    title: 'Spontaneous (Resonance)',
    description: 'Natural speech check.',
    focus: 'Resonance in conversation',
    steps: {
      English: ["Tell me about your favorite food.", "Describe your room at home."]
    },
    layout: 'cards',
    note: 'Listen for consistency of resonance.',
    category: 'resonance'
  },

  // --- PROSODY DOMAIN ---
  scripted_prosody: {
    id: 'scripted_prosody',
    title: 'Scripted Sentences',
    description: 'Statement vs Question.',
    focus: 'Intonation Contours',
    steps: {
      English: ["It is raining.", "Is it raining?", "I like ice cream.", "Do you like ice cream?"]
    },
    layout: 'list',
    note: 'Contrast declarative vs interrogative contours.',
    category: 'prosody'
  },
  conversation: {
    id: 'conversation',
    title: 'Conversation',
    description: 'Spontaneous speech.',
    focus: 'Prosody & Pragmatics',
    steps: {
      English: ["Tell me about your favorite vacation.", "Describe how to make a sandwich."]
    },
    layout: 'cards',
    note: 'Natural speech prosody, rate, and intelligibility.',
    category: 'prosody'
  },
  emotion_prosody: {
    id: 'emotion_prosody',
    title: 'Emotion Task',
    description: 'Affective prosody.',
    focus: 'Emotional Expression',
    steps: {
      English: ["Say 'I am going home' angrily.", "Say 'I am going home' happily.", "Say 'I am going home' sadly."]
    },
    layout: 'cards',
    note: 'Ability to modulate pitch/intensity for emotion.',
    category: 'prosody'
  },
  stress_shift: {
    id: 'stress_shift',
    title: 'Stress-Shift Task',
    description: 'Lexical stress.',
    focus: 'Syllabic Stress',
    steps: {
      English: ["REcord (noun) vs reCORD (verb)", "PREsent (noun) vs preSENT (verb)", "OBject (noun) vs obJECT (verb)"]
    },
    layout: 'list',
    note: 'Check differentiation of noun/verb pairs.',
    category: 'prosody'
  },
  intonation_imitation: {
    id: 'intonation_imitation',
    title: 'Intonation Imitation',
    description: 'Contour matching.',
    focus: 'Pitch Modulation',
    steps: {
      English: ["Copy me: 'Up and Down'", "Copy me: 'Really?'", "Copy me: 'Yes, absolutely.'"]
    },
    layout: 'cards',
    note: 'Capacity to reproduce pitch patterns.',
    category: 'prosody'
  },
  reading_prosody: {
    id: 'reading_prosody',
    title: 'Reading Passage',
    description: 'Connected speech.',
    focus: 'Phrasing and Pausing',
    steps: {
      English: ["Read naturally: 'The north wind and the sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak.'"]
    },
    layout: 'list',
    note: 'Analysis of breath groups and pauses.',
    category: 'prosody'
  },

  // --- FLUENCY DOMAIN ---
  reading_fluency: {
    id: 'reading_fluency',
    title: 'Reading Passage',
    description: 'Standard text.',
    focus: 'Disfluency Rate',
    steps: {
      English: ["There is a young rat named Arthur who could never make up his mind. Whenever his friends asked him if he would like to go out with them, he would only answer, 'I don't know.'"]
    },
    layout: 'list',
    note: 'Standard reading sample (Arthur the Rat).',
    category: 'fluency'
  },
  picture_desc: {
    id: 'picture_desc',
    title: 'Picture Description',
    description: 'Narrative generation.',
    focus: 'Fluency in Monologue',
    steps: {
      English: ["(Look at the scene) Tell me everything that is happening in this picture."]
    },
    layout: 'cards',
    note: 'Often uses "Cookie Theft" picture context.',
    category: 'fluency'
  },
  narrative: {
    id: 'narrative',
    title: 'Narrative Task',
    description: 'Story retell.',
    focus: 'Complex Language Fluency',
    steps: {
      English: ["Tell me the story of your favorite movie or book.", "Tell me what you did yesterday from morning to night."]
    },
    layout: 'cards',
    note: 'Higher cognitive load task for fluency.',
    category: 'fluency'
  },
  automatic_speech: {
    id: 'automatic_speech',
    title: 'Automatic Speech',
    description: 'Low cognitive load.',
    focus: 'Motor Fluency',
    steps: {
      English: ["Count from 1 to 20.", "Say the days of the week.", "Say the months of the year."]
    },
    layout: 'list',
    note: 'Usually more fluent than spontaneous speech.',
    category: 'fluency'
  },

  // --- MOTOR SPEECH / PHONOLOGY DOMAIN ---
  ddk: {
    id: 'ddk',
    title: 'DDK (AMR/SMR)',
    description: 'Motor speech rates.',
    focus: 'Rhythm & Speed',
    steps: {
      English: ["Say /pʌ-pʌ-pʌ/ (Fast as possible)", "Say /tʌ-tʌ-tʌ/ (Fast as possible)", "Say /kʌ-kʌ-kʌ/ (Fast as possible)", "Say /pʌ-tʌ-kʌ/ (Sequence)"]
    },
    layout: 'cards',
    note: 'Assesses speed, regularity, and precision.',
    category: 'phonology'
  },
  amr_smr: {
    id: 'amr_smr',
    title: 'AMR / SMR (Detailed)',
    description: 'Alternating Motion.',
    focus: 'Dysdiadochokinesis',
    steps: {
      English: ["AMR: 'puh-puh-puh'", "AMR: 'tuh-tuh-tuh'", "AMR: 'kuh-kuh-kuh'", "SMR: 'puh-tuh-kuh'"]
    },
    layout: 'list',
    note: 'Detailed breakdown of motor tasks.',
    category: 'phonology'
  },
  non_word: {
    id: 'non_word',
    title: 'Non-word Repetition',
    description: 'Phonological processing.',
    focus: 'Working Memory & Planning',
    steps: {
      English: ["Na-ma", "Bi-di-gi", "Do-re-mi-fa", "Va-sa-na-pa"]
    },
    layout: 'list',
    note: 'Removes semantic lexical support.',
    category: 'phonology'
  },
  multisyllabic: {
    id: 'multisyllabic',
    title: 'Multisyllabic Words',
    description: 'Complex articulation.',
    focus: 'Syllable Integrity',
    steps: {
      English: ["Ambulance", "Hippopotamus", "Specific", "Aluminum", "Statistics"]
    },
    layout: 'list',
    note: 'Challenges motor planning (Apraxia check).',
    category: 'phonology'
  },
  auto_seq: {
    id: 'auto_seq',
    title: 'Automatic Sequences',
    description: 'Motor automation.',
    focus: 'Basic Motor Output',
    steps: {
      English: ["Count 1 to 10", "Days of the Week", "Alphabet A to Z"]
    },
    layout: 'cards',
    note: 'Preserved in severe apraxia/aphasia?',
    category: 'phonology'
  },
  
  // Legacy/Other mappings
  cas_consistency: {
    id: 'cas_consistency',
    title: 'Repetition (CAS)',
    description: 'Check consistency.',
    focus: 'Motor Planning Stability',
    steps: {
      English: ["Say 'Banana' 3 times", "Say 'Popcorn' 3 times", "Say 'Butterfly' 3 times"]
    },
    layout: 'cards',
    note: 'Detects token-to-token variability.',
    category: 'phonology'
  }
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};

const encodeWAV = (samples: Float32Array, sampleRate: number): Blob => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPCM(view, 44, samples);
  return new Blob([view], { type: 'audio/wav' });
};

const downsampleBuffer = (buffer: Float32Array, inputRate: number, outputRate: number): Float32Array => {
  if (outputRate >= inputRate) return buffer;
  const sampleRateRatio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  
  while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
          accum += buffer[i];
          count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

const trimAndDownsample = async (blob: Blob): Promise<Blob> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const threshold = 0.01; 
    
    let start = 0;
    let end = channelData.length;

    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > threshold) {
        start = i;
        break;
      }
    }
    for (let i = channelData.length - 1; i >= 0; i--) {
      if (Math.abs(channelData[i]) > threshold) {
        end = i + 1;
        break;
      }
    }
    const padding = Math.floor(audioBuffer.sampleRate * 0.1); 
    start = Math.max(0, start - padding);
    end = Math.min(channelData.length, end + padding);

    if (end <= start) {
        const downsampledFull = downsampleBuffer(channelData, audioBuffer.sampleRate, 16000);
        return encodeWAV(downsampledFull, 16000);
    }

    const trimmedData = channelData.slice(start, end);
    const TARGET_RATE = 16000;
    const downsampledData = downsampleBuffer(trimmedData, audioBuffer.sampleRate, TARGET_RATE);
    return encodeWAV(downsampledData, TARGET_RATE);
  } catch (e) {
    console.error("Audio processing failed", e);
    return blob; 
  } finally {
    if (audioContext.state !== 'closed') {
      audioContext.close();
    }
  }
};

const MicDistanceGuide = ({ stream }: { stream: MediaStream | null }) => {
    const [level, setLevel] = useState(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    
    useEffect(() => {
      if (!stream) {
        setLevel(0);
        return;
      }
  
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      let active = true;
      const update = () => {
        if (!active) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i=0; i<dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / dataArray.length);
        setLevel(rms);
        requestAnimationFrame(update);
      };
      update();
  
      return () => {
        active = false;
        source.disconnect();
        analyser.disconnect();
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      };
    }, [stream]);
  
    const percentage = Math.min((level / 150) * 100, 100);
    let status = "No Signal";
    let color = "bg-slate-300";
    if (level > 5) {
       if (level < 20) { status = "Move Closer"; color = "bg-amber-400"; }
       else if (level > 100) { status = "Too Close / Loud"; color = "bg-rose-500"; }
       else { status = "Optimal Distance (~15cm)"; color = "bg-emerald-500"; }
    }
  
    return (
      <div className="bg-slate-800 rounded-xl p-4 text-white shadow-lg mt-4 border border-slate-700 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-teal-400" />
              <span className="font-bold text-sm uppercase tracking-wide">Position Guide</span>
            </div>
            <div className="text-xs font-medium opacity-70">Keep ~15cm / 6in distance</div>
          </div>
          <div className="flex items-center justify-center gap-6 mb-4 relative z-10">
              <div className="flex flex-col items-center gap-1 opacity-80">
                  <User size={32} />
                  <span className="text-[10px] uppercase">Mouth</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                 <div className="h-0.5 w-4 bg-slate-600"></div>
                 <span className="text-xs whitespace-nowrap">15cm</span>
                 <div className="h-0.5 w-4 bg-slate-600"></div>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-80">
                  <Smartphone size={32} />
                  <span className="text-[10px] uppercase">Mic</span>
              </div>
          </div>
          <div className="space-y-1 relative z-10">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                 <span>Far</span>
                 <span className="text-emerald-400">Optimal</span>
                 <span>Close</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                 <div className="absolute top-0 bottom-0 left-[20%] right-[30%] bg-emerald-900/30 border-x border-emerald-500/30 z-0"></div>
                 <div className={`h-full transition-all duration-100 ${color}`} style={{ width: `${percentage}%` }}/>
              </div>
              <div className="text-center text-xs font-bold mt-1 h-4">{status}</div>
          </div>
      </div>
    );
};

const CreateTaskModal = ({ onClose, onSave }: { onClose: () => void, onSave: (p: ProtocolDef) => void }) => {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [prompts, setPrompts] = useState("");
  
    const handleSave = () => {
      if (!title || !prompts) return;
      const newProtocol: ProtocolDef = {
         id: `custom-${Date.now()}`,
         title,
         description: desc || "Custom SLP Protocol",
         focus: "Custom Task Analysis",
         steps: prompts.split('\n').filter(s => s.trim().length > 0),
         layout: 'list',
         note: 'Client-specific task script.',
         isCustom: true,
         category: 'General'
      };
      onSave(newProtocol);
      onClose();
    };
  
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
         <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <Edit size={20} className="text-teal-600" />
                 Task Scripting
               </h3>
               <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                 <X size={20} className="text-slate-500" />
               </button>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Task Title</label>
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-slate-900" placeholder="e.g., Client A - /s/ blend list" value={title} onChange={e => setTitle(e.target.value)} />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
                  <input className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 text-sm" placeholder="Clinical goal or focus" value={desc} onChange={e => setDesc(e.target.value)} />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Script / Prompts</label>
                  <p className="text-xs text-slate-500 mb-2">Enter one item per line (words, phrases, or sentences).</p>
                  <textarea className="w-full border border-slate-300 rounded-lg p-3 h-40 focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 font-medium" placeholder={"Spider\nSnake\nSchool\nThe sun is shining."} value={prompts} onChange={e => setPrompts(e.target.value)} />
               </div>
            </div>
            <div className="flex gap-3 mt-8">
               <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
               <button onClick={handleSave} className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-100 transition-colors">Save Task</button>
            </div>
         </div>
      </div>
    );
};

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAnalysisComplete, isProcessing, attemptNumber, customProtocols, onAddProtocol, isOffline, assessmentDomain, initialProtocolId }) => {
  const [activeProtocolId, setActiveProtocolId] = useState<string>('mixed');
  const [demographic, setDemographic] = useState<Demographic>('Adult');
  const [sex, setSex] = useState<BiologicalSex>('Male');
  const [language, setLanguage] = useState<Language>('English');
  const [dialect, setDialect] = useState<string>('US - General'); 
  const [isRecording, setIsRecording] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [observedGroping, setObservedGroping] = useState(false);
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showDialectDropdown, setShowDialectDropdown] = useState(false);
  
  const [visualMode, setVisualMode] = useState<'standard' | 'game'>('standard');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const allProtocols = { ...DEFAULT_PROTOCOLS };
  customProtocols.forEach(p => { allProtocols[p.id] = p; });

  // Update default dialect when language changes
  useEffect(() => {
    if (DIALECT_OPTIONS[language] && DIALECT_OPTIONS[language].length > 0) {
        setDialect(DIALECT_OPTIONS[language][0]);
    }
  }, [language]);

  // Set initial protocol if passed prop
  useEffect(() => {
      if (initialProtocolId && allProtocols[initialProtocolId]) {
          setActiveProtocolId(initialProtocolId);
      }
  }, [initialProtocolId]);

  const activeProtocol = allProtocols[activeProtocolId] || Object.values(allProtocols)[0];

  const [noiseStatus, setNoiseStatus] = useState<'idle' | 'checking' | 'quiet' | 'noisy'>('idle');
  const [noiseLevel, setNoiseLevel] = useState(0);

  const checkEnvironment = async () => {
    setNoiseStatus('checking');
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let sum = 0;
      let count = 0;
      const startTime = Date.now();
      const DURATION = 3000;

      const analyze = () => {
        if (Date.now() - startTime < DURATION) {
           analyser.getByteFrequencyData(dataArray);
           const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
           setNoiseLevel(average);
           sum += average;
           count++;
           requestAnimationFrame(analyze);
        } else {
           source.disconnect();
           analyser.disconnect();
           audioStream.getTracks().forEach(track => track.stop());
           if(audioContext.state !== 'closed') audioContext.close();
           setStream(null);
           const finalAverage = sum / count;
           setNoiseStatus(finalAverage < 15 ? 'quiet' : 'noisy');
           setNoiseLevel(finalAverage);
        }
      };
      analyze();
    } catch (err) {
      console.error(err);
      setNoiseStatus('idle');
      alert("Microphone access required for noise check.");
    }
  };

  const startMicForGuide = async () => {
     try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(audioStream);
     } catch (err) {
        console.error(err);
     }
  };

  const stopMicForGuide = () => {
      if (stream) {
          stream.getTracks().forEach(t => t.stop());
          setStream(null);
      }
  };

  const startRecording = async () => {
    try {
      if (stream) stream.getTracks().forEach(t => t.stop());
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 44100 } 
      });
      setStream(audioStream);
      setBookmarks([]);
      setObservedGroping(false);
      setRecordingStartTime(Date.now());
      
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Use the actual recording MIME type from the recorder, or fallback
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const rawBlob = new Blob(chunksRef.current, { type: mimeType });
        
        if (isOffline) {
            alert("Offline Mode: Analysis queued for later. Audio saved locally.");
            onAnalysisComplete(rawBlob, activeProtocol.title, demographic, sex, language, bookmarks, dialect);
            audioStream.getTracks().forEach(track => track.stop());
            setStream(null);
            return;
        }

        setIsTrimming(true);
        try {
          const processedBlob = await trimAndDownsample(rawBlob);
          onAnalysisComplete(processedBlob, activeProtocol.title, demographic, sex, language, bookmarks, dialect);
        } catch (error) {
          console.error("Audio processing failed:", error);
          // Send original blob if processing fails
          onAnalysisComplete(rawBlob, activeProtocol.title, demographic, sex, language, bookmarks, dialect);
        } finally {
          setIsTrimming(false);
          audioStream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const addBookmark = () => {
    if (isRecording) {
      const timestamp = (Date.now() - recordingStartTime) / 1000;
      setBookmarks(prev => [...prev, timestamp]);
    }
  };

  const renderStimulusContent = () => {
    if (!activeProtocol) return null;
    
    const { steps, layout } = activeProtocol;
    let displaySteps: string[] = [];
    if (Array.isArray(steps)) {
      displaySteps = steps;
    } else {
      displaySteps = steps[language] || steps['English'] || [];
    }

    if (layout === 'grid') {
      return (
        <div className="grid grid-cols-2 gap-4 w-full">
          {displaySteps.map((step, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center font-semibold text-slate-700 shadow-sm">
              {step}
            </div>
          ))}
        </div>
      );
    }

    if (layout === 'cards') {
      return (
        <div className="space-y-4 w-full">
          {displaySteps.map((step, idx) => (
            <div key={idx} className="bg-white border-l-4 border-teal-500 rounded-r-lg shadow-sm p-5 flex items-center gap-4">
              <div className="bg-teal-50 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {idx + 1}
              </div>
              <span className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{step}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-4 w-full">
        {displaySteps.map((step, idx) => (
          <div key={idx} className="flex gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
            <span className="text-slate-300 font-bold text-xl select-none">{idx + 1}.</span>
            <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed font-serif">{step}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full animate-fade-in pb-12">
      {isCreatingTask && <CreateTaskModal onClose={() => setIsCreatingTask(false)} onSave={onAddProtocol} />}

      {/* Header with Adaptive Layout */}
      <div className="w-full max-w-6xl mb-10 px-4">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 relative">
              
              {/* Title & Description */}
              <div className="text-center lg:text-left flex-1 max-w-2xl">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                  {activeProtocol.title}
                </h1>
                <p className="text-slate-500 mt-2 text-lg leading-relaxed">
                   {activeProtocol.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center lg:justify-start">
                     <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                        {activeProtocol.focus}
                     </span>
                     {attemptNumber > 1 && (
                        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                           Attempt #{attemptNumber}
                        </span>
                     )}
                </div>
              </div>

              {/* Controls - Flex Layout (No Overlap) */}
              <div className="relative flex flex-wrap justify-center lg:justify-end items-center gap-3 shrink-0 z-50 pointer-events-auto bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-slate-100 shadow-sm">
                  
                  {/* Language Selector */}
                  <div className="relative z-50">
                      <button 
                        onClick={(e) => { 
                            e.stopPropagation();
                            setShowLanguageDropdown(!showLanguageDropdown); 
                            setShowDialectDropdown(false); 
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 hover:bg-slate-50 shadow-sm transition-all"
                      >
                        <Globe size={16} className="text-indigo-500" />
                        <span>{language}</span>
                        <ChevronDown size={14} className={`opacity-50 transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showLanguageDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowLanguageDropdown(false)}></div>
                          <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 text-left max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                              {Object.keys(DIALECT_OPTIONS).map((lang) => (
                                <button 
                                  key={lang}
                                  onClick={() => {
                                    if (!isRecording) {
                                      setLanguage(lang as Language);
                                      setShowLanguageDropdown(false);
                                    }
                                  }}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${language === lang ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                  disabled={isRecording}
                                >
                                  {lang}
                                </button>
                              ))}
                          </div>
                        </>
                      )}
                  </div>
                  
                  {/* Dialect Selector */}
                  <div className="relative z-40">
                        <button 
                          onClick={(e) => { 
                              e.stopPropagation();
                              setShowDialectDropdown(!showDialectDropdown); 
                              setShowLanguageDropdown(false); 
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 hover:bg-slate-50 shadow-sm min-w-[160px] justify-between transition-all"
                        >
                            <span className="truncate max-w-[140px]">{dialect || 'Select Dialect'}</span>
                            <ChevronDown size={14} className={`opacity-50 transition-transform duration-200 ${showDialectDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showDialectDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowDialectDropdown(false)}></div>
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 text-left max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                {DIALECT_OPTIONS[language]?.map((d) => (
                                    <button 
                                    key={d}
                                    onClick={() => {
                                      if (!isRecording) {
                                        setDialect(d);
                                        setShowDialectDropdown(false);
                                      }
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${dialect === d ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    disabled={isRecording}
                                    >
                                    {d}
                                    </button>
                                ))}
                            </div>
                          </>
                        )}
                  </div>

                  {/* Demographics */}
                  <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
                      <div className="flex bg-slate-100 rounded p-0.5">
                          <button onClick={() => !isRecording && setDemographic('Adult')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${demographic === 'Adult' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} disabled={isRecording}>Adult</button>
                          <button onClick={() => !isRecording && setDemographic('Child')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${demographic === 'Child' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} disabled={isRecording}>Child</button>
                      </div>
                      <div className="w-px bg-slate-200 mx-1"></div>
                      <div className="flex bg-slate-100 rounded p-0.5">
                          <button onClick={() => !isRecording && setSex('Male')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${sex === 'Male' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} disabled={isRecording}>M</button>
                          <button onClick={() => !isRecording && setSex('Female')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${sex === 'Female' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} disabled={isRecording}>F</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Visualizer */}
        <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="flex justify-end mb-2">
                <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                    <button onClick={() => setVisualMode('standard')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${visualMode === 'standard' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><MoveVertical size={14} /> Clinical</button>
                    <button onClick={() => setVisualMode('game')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${visualMode === 'game' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Gamepad2 size={14} /> Fun Mode</button>
                </div>
            </div>

            <div className="w-full h-[320px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative flex flex-col">
                <div className="absolute top-0 left-0 right-0 bg-black/20 backdrop-blur-sm px-4 py-2 flex justify-between items-center z-10 border-b border-white/10">
                    <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : noiseStatus === 'checking' ? 'bg-indigo-500 animate-pulse' : stream ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                        {visualMode === 'game' ? 'Interactive Visualizer' : 'Real-time Spectrogram'}
                    </span>
                    <div className="flex gap-2 items-center">
                        {isOffline && (
                           <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">
                             <WifiOff size={10} /> Offline Mode
                           </span>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 relative bg-slate-900">
                   {visualMode === 'standard' ? <Spectrogram isRecording={!!stream} audioStream={stream} /> : (
                       <div className="w-full h-full p-4 grid grid-cols-2 gap-4">
                          <div className="col-span-2 h-full bg-slate-800 rounded-xl overflow-hidden relative border border-slate-700">
                             {stream ? <PitchRollercoaster stream={stream} /> : <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-bold">Start Mic for Pitch Game</div>}
                          </div>
                       </div>
                   )}
                </div>
                {/* Overlays (Bookmarks/Recording Pill) */}
                {bookmarks.length > 0 && visualMode === 'standard' && (
                    <div className="absolute bottom-14 left-4 right-4 flex gap-1 justify-end pointer-events-none">
                       {bookmarks.map((bm, i) => <div key={i} className="bg-amber-500/80 w-1.5 h-6 rounded-full shadow-sm animate-in slide-in-from-bottom-2"></div>)}
                    </div>
                )}
                {isRecording && visualMode === 'standard' && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                        <span className="inline-block bg-black/50 backdrop-blur-md text-white text-sm px-3 py-1 rounded-full animate-pulse border border-white/10">Recording... Speak Clearly</span>
                    </div>
                )}
            </div>
            
            {stream && (
               <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mb-2">Loudness</span>
                      <div className="h-20 w-full flex justify-center"><LoudnessMeter stream={stream} /></div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mb-2">Resonance</span>
                      <div className="h-20 w-full flex justify-center"><ResonanceGauge stream={stream} /></div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mb-2">Clarity</span>
                      <div className="h-20 w-full flex justify-center items-center"><ClarityRing stream={stream} /></div>
                  </div>
               </div>
            )}

            {/* Room Acoustics & Mic Guide */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wide">
                        <Ear size={18} className="text-indigo-600" /> Room Acoustics
                    </div>
                    {noiseStatus === 'quiet' ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1"><Check size={12} /> Optimal</span> : noiseStatus === 'noisy' ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 flex items-center gap-1"><AlertTriangle size={12} /> High Noise</span> : null}
                </div>
                {noiseStatus === 'idle' ? (
                    <button onClick={checkEnvironment} className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"><Volume2 size={16} /> Check Background Noise</button>
                ) : noiseStatus === 'checking' ? (
                    <div className="space-y-2">
                         <div className="flex justify-between text-xs font-semibold text-slate-500"><span>Measuring...</span><span>{Math.round((noiseLevel / 255) * 100)}%</span></div>
                         <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-100" style={{ width: `${(noiseLevel / 255) * 100}%` }} /></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                         <p className={`text-sm ${noiseStatus === 'quiet' ? 'text-slate-600' : 'text-amber-700 font-medium'}`}>{noiseStatus === 'quiet' ? "Environment is quiet enough for clinical recording." : "Background noise detected. Try to reduce noise or move to a quieter room for best results."}</p>
                         <button onClick={checkEnvironment} className="text-xs text-slate-400 hover:text-slate-600 underline font-medium">Re-check Environment</button>
                    </div>
                )}
            </div>
            
            {!isRecording && noiseStatus !== 'checking' && (
                <div className="flex gap-2">
                  {!stream ? (
                    <button onClick={startMicForGuide} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"><Smartphone size={16} /> Show Mic Guide</button>
                  ) : (
                    <button onClick={stopMicForGuide} className="flex-1 py-3 bg-slate-100 border border-slate-200 text-slate-500 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"><X size={16} /> Hide Mic Guide</button>
                  )}
                </div>
            )}
            {stream && !isRecording && noiseStatus !== 'checking' && <MicDistanceGuide stream={stream} />}
        </div>

        {/* Right: Guided Prompts */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-[500px]">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col h-full overflow-hidden relative">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-slate-400" />
                        <span className="font-bold text-slate-700">{activeProtocol.isCustom ? 'Custom Task' : 'Guided Prompts'}</span>
                    </div>
                    {isRecording && <span className="text-xs font-bold text-rose-500 uppercase tracking-wider animate-pulse">Live</span>}
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
                   <div className="max-w-xl mx-auto">
                        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 font-medium bg-white p-2 rounded-lg border border-slate-100 shadow-sm w-fit">
                            <Play size={14} className="fill-slate-400 text-slate-400" />
                            <span>Read the following items in order:</span>
                        </div>
                        {renderStimulusContent()}
                        <div className="mt-8 text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold border-t border-slate-200 pt-4">End of Protocol</p>
                        </div>
                   </div>
                </div>

                <div className="p-6 bg-white border-t border-slate-100 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    {!isProcessing && !isTrimming ? (
                        !isRecording ? (
                            <button
                                onClick={startRecording}
                                disabled={noiseStatus === 'checking'}
                                className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                                    noiseStatus === 'checking' 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-200'
                                }`}
                            >
                                <Mic size={24} />
                                <span>{isOffline ? "Record Offline" : "Start Recording"}</span>
                            </button>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {activeProtocol.id === 'cas_consistency' && (
                                    <button
                                        onClick={() => setObservedGroping(!observedGroping)}
                                        className={`w-full py-2 rounded-lg font-bold text-sm transition-all border ${observedGroping ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                    >
                                        {observedGroping ? 'Groping Observed (Marked)' : 'Mark Groping Behavior'}
                                    </button>
                                )}
                                <div className="flex gap-3">
                                    <button onClick={addBookmark} className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold py-4 rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-amber-200">
                                        <Flag size={20} className={bookmarks.length > 0 ? "fill-current" : ""} />
                                        <span>Flag Event</span>
                                    </button>
                                    <button onClick={stopRecording} className="flex-[2] bg-rose-500 hover:bg-rose-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-[0.98] animate-pulse flex items-center justify-center gap-3">
                                        <Square size={24} fill="currentColor" />
                                        <span>{isOffline ? "Save to Queue" : "Stop & Analyze"}</span>
                                    </button>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-xl flex items-center justify-center gap-3 cursor-wait">
                            {isTrimming ? <Scissors className="animate-pulse" size={24} /> : <Loader2 className="animate-spin" size={24} />}
                            <span>{isTrimming ? "Processing Audio (Optimizing)..." : "Analyzing with AI..."}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};