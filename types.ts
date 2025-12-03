

export interface OralPressureMetric {
  phoneme: string;
  pressure: number; // 0-100
  status: 'Normal' | 'Weak' | 'Nasal Emission';
}

export interface ArticulationError {
  type: 'Substitution' | 'Distortion' | 'Omission' | 'Compensatory' | 'Nasalization';
  description: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
}

export interface Diadochokinetics {
  amrRate: number; // Syllables/sec (e.g., /pa/ /pa/ /pa/)
  smrRate: number; // Syllables/sec (e.g., /pataka/)
  regularity: number; // 0-100% (Rhythm stability)
  precision: number; // 0-100% (Consonant distinctness)
}

export interface ArticulationErrorDetail {
  target: string;
  actual: string;
  word?: string;
  position: 'Initial' | 'Medial' | 'Final';
  type: 'Substitution' | 'Omission' | 'Distortion' | 'Addition';
  isNasal: boolean; // e.g. /b/ -> /m/
}

export interface WordLengthMetrics {
  monosyllabicAccuracy: number; // 0-100% PCC for single syllable words
  multisyllabicAccuracy: number; // 0-100% PCC for multi-syllable words
  description: string; // e.g., "Accuracy drops significantly with increased length"
}

export interface ArticulationDetailed {
  pcc: number; // Percent Consonants Correct (0-100)
  totalConsonants?: number;
  correctConsonants?: number;
  
  pvc: number; // Percent Vowels Correct (0-100)
  totalVowels?: number;
  correctVowels?: number;

  pressureAccuracy: number; // 0-100% accuracy on Pressure Consonant Subset (/p b t d k g f v s z ʃ tʃ dʒ/)
  
  positionalAccuracy?: {
    initial: number; // 0-100
    medial: number; // 0-100
    final: number; // 0-100
  };

  wordLengthMetrics: WordLengthMetrics;

  intelligibility: number; // 0-100% overall
  errorPattern: {
    substitutions: number;
    omissions: number;
    distortions: number;
    additions: number;
    compensatory: number; // Glottal stops, pharyngeal fricatives
    nasalErrors: number; // Nasal substitutions
  };
  
  detailedErrors: ArticulationErrorDetail[];

  ddkMetrics: Diadochokinetics;
}

export interface PerceptualRatings {
  hypernasality: number; // 0-3
  hyponasality: number; // 0-3
  culDeSac: number; // 0-3
  nasalEmission: number; // 0-3
  oralPressure: number; // 0-3 (0=Normal, 3=Severe Deficit)
}

export interface SlpRatings {
  hypernasality?: number; // Stores raw value based on user's scale preference
  hyponasality?: number;
  prosodyNaturalness?: number; // 1-5
}

export interface NasalEmissionEvent {
  phoneme: string;
  timestamp: number;
  severity: 'Mild' | 'Moderate' | 'Severe';
}

export interface EnergyFrame {
  time: number;
  oral: number; // 0-100
  nasal: number; // 0-100
}

export interface AcousticNasalMetrics {
  lowMidFrequencyRatio: number; // >1.5 indicates Hypernasality
  spectralFlatteningIndex: number; // 0-1 (High = Cul-de-sac/Damping)
  nasalEmissionIndex: number; // 0-1 (High freq turbulence)
  nasalConsonantWeakness: number; // 0-1 (High = Hyponasality)
  nasalResonanceIndex: number; // 0-100 (Composite Score)
  nasalResonanceSeverity: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
  
  nasalEmissionOnFricatives: NasalEmissionEvent[];
  nasalOralEnergyComparison: EnergyFrame[];
}

export interface VoiceQualityMetrics {
  fundamentalFrequency: number; // Hz (Mean F0)
  minPitch: number; // Hz (Min F0)
  maxPitch: number; // Hz (Max F0)
  pitchRange: number; // Hz (Max - Min)
  
  meanIntensity: number; // dB (Relative Mean)
  intensityRange: number; // dB (Dynamic Range)
  intensityStdDev: number; // dB (Stability/Variation)
  
  jitter: number; // %
  shimmer: number; // %
  hnr: number; // dB
  qualityProfile: 'Normal' | 'Breathy' | 'Rough' | 'Strained';
  stabilityScore: number; // 0-100
}

export interface AerodynamicMetrics {
  maxPhonationDuration: number; // seconds
  szRatio: number; // ratio (s duration / z duration)
  sDuration: number; // seconds
  zDuration: number; // seconds
  vitalCapacityEstimation: 'Normal' | 'Reduced' | 'Significantly Reduced';
}

export interface VpdAlert {
  detected: boolean;
  severity: 'Potential' | 'High Risk';
  indicators: string[]; // e.g., ["Hypernasality > 2", "Nasal Emission", "Glottal Stops"]
  recommendation: string;
}

export interface PauseMetrics {
  totalPauses: number;
  averagePauseDuration: number; // seconds
  pausePattern: 'Normal' | 'Frequent/Choppy' | 'Prolonged/Hesitant';
}

export interface ProsodyDetailed {
  pitchContour: { time: number; pitch: number }[]; // For graphing
  speechRate: number; // syllables per second
  wordsPerMinute: number; // WPM
  
  intonationVariation: number; // 0-100
  rhythmScore: number; // 0-100
  
  pauseMetrics: PauseMetrics;
  pitchRangeClassification: 'Restricted' | 'Normal' | 'Excessive'; // Monotone vs Ataxic
  stressAccuracy: number; // 0-100 (Lexical and Sentence stress)
  isScannedSpeech: boolean; // Flag for "Robotic" / Ataxic dysarthria
  
  monotoneSeverity: number; // 0-100 (100 = Completely Flat/Monotone)
  prosodySeverityIndex: number; // 0-100 Composite Score (0=Normal, 100=Severe Dysprosody)
}

export interface FluencyMetrics {
    disfluencyIndex: number; // % of syllables disfluent
    types: {
        blocks: number;
        prolongations: number;
        repetitions: number;
        revisions: number;
        interjections: number;
    };
    secondaryBehaviors: string[]; // e.g. "Eye blinking", "Head nodding"
    speechNaturalness: number; // 1-5 (5=Very Natural)
    rateConsistency: 'Consistent' | 'Variable' | 'Bursts';
    severity: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Profound';
}

export type Demographic = 'Adult' | 'Child';
export type BiologicalSex = 'Male' | 'Female';
export type Language = 'English' | 'Tamil' | 'Malayalam' | 'Bengali' | 'Hindi' | 'Telugu' | 'Kannada';
export type Dialect = string; // e.g. "US - General", "UK - RP", "Chennai Tamil"
export type RatingScaleType = '0-3' | '0-5' | '0-10';
export type AssessmentDomain = 'prosody' | 'articulation' | 'resonance' | 'fluency' | 'voice' | 'phonology';

export type ClinicalImpression = 'Suspected CAS' | 'Suspected Dysarthria' | 'Normal' | 'Inconclusive' | null;

export interface NormsUsed {
  description: string; // e.g., "Adult Male Norms"
  pitchRange: string; // e.g., "85-180 Hz"
  ddkRate: string; // e.g., "5-7 syllables/sec"
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  protocolId: string;
  demographic: Demographic;
  sex: BiologicalSex;
  language: Language;
  dialect?: Dialect; 
  assessmentDomain?: AssessmentDomain; // New field to track which card was clicked
  bookmarks: number[];
  audioUrl?: string; 
  transcript?: string; 
  normsUsed?: NormsUsed;

  perceptualRatings: PerceptualRatings;
  slpRatings?: SlpRatings;
  
  clinicalImpression?: ClinicalImpression;
  acousticNasalMetrics: AcousticNasalMetrics;
  voiceMetrics: VoiceQualityMetrics;
  aerodynamics: AerodynamicMetrics;
  articulation: ArticulationDetailed;
  fluency?: FluencyMetrics; // New field

  nasalance: number; 
  resonanceSeverity: number; 
  
  resonanceSeverityIndex: number; 
  vpdAlert: VpdAlert; 

  resonanceType: 'Normal' | 'Hypernasal' | 'Hyponasal' | 'Cul-de-sac' | 'Mixed';
  prosody: ProsodyDetailed;
  oralPressure: OralPressureMetric[];
  detectedErrors: ArticulationError[];
  summary: string;
}

export interface ClinicProfile {
  id: string;
  name: string;
  code: string; 
  slpName: string;
  email: string;
  logo: string | null;
  // Settings
  preferredRatingScale: RatingScaleType;
  enableCloudBackup: boolean;
  isOfflineMode: boolean; // Manual override or detected
}

export enum AppState {
  LANDING = 'LANDING',
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export type ViewMode = 'SLP' | 'Parent';

export type ProtocolDef = {
  id: string;
  title: string;
  description: string;
  focus: string;
  steps: string[] | Partial<Record<Language, string[]>>;
  layout: 'list' | 'grid' | 'cards';
  note: string;
  isCustom?: boolean;
  category?: AssessmentDomain | 'General'; // Added category for domain filtering
};

export type ProtocolType = 'vowels' | 'words' | 'mixed' | 'oral' | 'nasal' | 'conversation' | 'ddk' | 'mpd' | 'sz_ratio' | string;

export interface TherapyGoal {
  id: string;
  description: string;
  category: 'Resonance' | 'Articulation' | 'Voice' | 'Prosody';
  target: string;
  status: 'Not Started' | 'In Progress' | 'Met' | 'Discontinued';
  startDate: number;
  targetDate?: number;
}

export interface TherapyNote {
  id: string;
  sessionId?: string;
  timestamp: number;
  text: string;
  author: string;
}

export interface ClientDetails {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  goals: TherapyGoal[];
  notes: TherapyNote[];
  nextSessionTasks: string[];
  followUpDate?: number;
  sharedWith: string[]; 
}

export interface RewardBadge {
  id: string;
  title: string;
  icon: string;
  color: string;
}

export interface ConsentRecord {
  id: string;
  timestamp: number;
  clientName: string;
  signatoryName: string;
  relationship: string;
  agreedToRecording: boolean;
  agreedToDataStorage: boolean;
  ipAddress: string;
}