import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Demographic, Language, BiologicalSex, AssessmentDomain } from "../types";

// --- PROMPT DEFINITIONS ---

const PROMPTS = {
  prosody: `
    The user clicked the PROSODY card.
    You must analyze ONLY prosody parameters and show ONLY prosody results, ignoring all other domains completely.

    Analyze ONLY:
    - Pitch contour
    - Pitch variability
    - Stress pattern accuracy
    - Rhyme and pausing pattern
    - Rate of speech
    - Prosody Severity Index (PSI)

    Your output must contain only:
    - Parameter-wise rating
    - Deviations observed
    - Clinical interpretation
    - Impact on intelligibility
    - Prosody-specific recommendations

    ✔ Output ONLY Prosody. Show nothing from any other domain.
    Set all non-prosody numeric metrics to 0 or null in the JSON response.
  `,
  articulation: `
    The user clicked the ARTICULATION card.
    You must analyze ONLY articulation parameters and show ONLY articulation results, ignoring all other domains.

    Analyze ONLY:
    - PCC (Percent Consonants Correct)
    - Pressure consonant accuracy
    - Substitutions (articulatory level)
    - Omissions
    - Distortions
    - Additions
    - Stimulability (articulation accuracy)

    Your output must contain only:
    - Articulation error pattern summary
    - Quantitative articulation accuracy
    - Severity classification
    - Motor/articulatory interpretation
    - Articulation-specific treatment recommendations

    ✔ Output ONLY Articulation. Show nothing from any other domain.
    Set all non-articulation numeric metrics to 0 or null in the JSON response.
  `,
  phonology: `
    The user clicked the PHONOLOGY card.
    You must analyze ONLY phonological parameters and show ONLY phonology results, ignoring all other domains.

    Analyze ONLY:
    - PVC (Percent Vowels Correct, phonological level)
    - Place-Manner-Voicing (PMV) error patterns
    - Phonological processes observed
    - Pattern consistency
    - Rule-governed substitutions
    - Phonemic contrasts

    Your output must contain only:
    - Phonological error pattern analysis
    - Quantitative phonological measures
    - Active phonological processes
    - Severity classification
    - Phonology-specific remediation recommendations

    ✔ Output ONLY Phonology. Show nothing from any other domain.
    Set all non-phonology numeric metrics (like voice, resonance, fluency) to 0 or null in the JSON response.
  `,
  resonance: `
    The user clicked the RESONANCE card.
    You must analyze ONLY resonance parameters and show ONLY resonance results, ignoring all other domains.

    Analyze ONLY:
    - Hypernasality
    - Hyponasality
    - Nasal emission
    - Cul-de-sac resonance
    - Oral airflow vs nasal airflow
    - Nasal Resonance Index
    - Oral–nasal sentence comparison

    Your output must contain only:
    - Resonance ratings
    - Physiological interpretation
    - Severity classification
    - Differential indicators (VPI, VPD, mislearning)
    - Resonance-specific recommendations

    ✔ Output ONLY Resonance. Show nothing else.
    Set all non-resonance numeric metrics to 0 or null in the JSON response.
  `,
  fluency: `
    The user clicked the FLUENCY card.
    You must analyze ONLY fluency parameters and show ONLY fluency results, ignoring all other domains.

    Analyze ONLY:
    - Frequency of disfluencies
    - Types of disfluencies
    - Secondary behaviours
    - Speech naturalness
    - Rate consistency
    - Fluency severity

    Your output must contain only:
    - Disfluency index
    - Behavioural observations
    - Severity rating
    - Functional impact
    - Fluency-specific recommendations

    ✔ Output ONLY Fluency. Show nothing from any other domain.
    Set all non-fluency numeric metrics to 0 or null in the JSON response.
  `,
  voice: `
    The user clicked the VOICE card.
    You must analyze ONLY voice parameters and show ONLY voice results, ignoring all other domains.

    Analyze ONLY:
    - Pitch
    - Loudness
    - Voice quality
    - Phonation stability
    - Maximum phonation time
    - Vocal effort
    - Phonatory–resonatory balance

    Your output must contain only:
    - Acoustic/perceptual findings
    - Deviations observed
    - Severity rating
    - Probable contributors
    - Voice-specific recommendations

    ✔ Output ONLY Voice. Show nothing from other domains.
    Set all non-voice numeric metrics to 0 or null in the JSON response.
  `,
  default: `
    Analyze the audio sample to provide a comprehensive clinical assessment across all domains (Resonance, Articulation, Voice, Prosody, Fluency).
    Provide all metrics defined in the schema.
  `
};

const getDomainSpecificPrompt = (domain?: AssessmentDomain): string => {
  if (!domain) return PROMPTS.default;
  if (domain === 'articulation') return PROMPTS.articulation;
  if (domain === 'phonology') return PROMPTS.phonology;
  return PROMPTS[domain] || PROMPTS.default;
};

// --- SCHEMA DEFINITION ---
// Removed "required" fields to allow flexibility for domain-specific responses

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    perceptualRatings: {
      type: Type.OBJECT,
      properties: {
        hypernasality: { type: Type.NUMBER },
        hyponasality: { type: Type.NUMBER },
        culDeSac: { type: Type.NUMBER },
        nasalEmission: { type: Type.NUMBER },
        oralPressure: { type: Type.NUMBER },
      }
    },
    acousticNasalMetrics: {
      type: Type.OBJECT,
      properties: {
        lowMidFrequencyRatio: { type: Type.NUMBER },
        spectralFlatteningIndex: { type: Type.NUMBER },
        nasalEmissionIndex: { type: Type.NUMBER },
        nasalConsonantWeakness: { type: Type.NUMBER },
        nasalResonanceIndex: { type: Type.NUMBER },
        nasalResonanceSeverity: { type: Type.STRING, enum: ["Normal", "Mild", "Moderate", "Severe"] },
        nasalEmissionOnFricatives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phoneme: { type: Type.STRING },
              timestamp: { type: Type.NUMBER },
              severity: { type: Type.STRING, enum: ["Mild", "Moderate", "Severe"] }
            }
          }
        },
        nasalOralEnergyComparison: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.NUMBER },
              oral: { type: Type.NUMBER },
              nasal: { type: Type.NUMBER }
            }
          }
        }
      }
    },
    voiceMetrics: {
      type: Type.OBJECT,
      properties: {
        fundamentalFrequency: { type: Type.NUMBER },
        minPitch: { type: Type.NUMBER },
        maxPitch: { type: Type.NUMBER },
        pitchRange: { type: Type.NUMBER },
        meanIntensity: { type: Type.NUMBER },
        intensityRange: { type: Type.NUMBER },
        intensityStdDev: { type: Type.NUMBER },
        jitter: { type: Type.NUMBER },
        shimmer: { type: Type.NUMBER },
        hnr: { type: Type.NUMBER },
        qualityProfile: { type: Type.STRING, enum: ["Normal", "Breathy", "Rough", "Strained"] },
        stabilityScore: { type: Type.NUMBER }
      }
    },
    aerodynamics: {
      type: Type.OBJECT,
      properties: {
        maxPhonationDuration: { type: Type.NUMBER },
        szRatio: { type: Type.NUMBER },
        sDuration: { type: Type.NUMBER },
        zDuration: { type: Type.NUMBER },
        vitalCapacityEstimation: { type: Type.STRING, enum: ["Normal", "Reduced", "Significantly Reduced"] }
      }
    },
    articulation: {
      type: Type.OBJECT,
      properties: {
        pcc: { type: Type.NUMBER },
        pvc: { type: Type.NUMBER },
        pressureAccuracy: { type: Type.NUMBER },
        intelligibility: { type: Type.NUMBER },
        errorPattern: {
          type: Type.OBJECT,
          properties: {
            substitutions: { type: Type.NUMBER },
            omissions: { type: Type.NUMBER },
            distortions: { type: Type.NUMBER },
            additions: { type: Type.NUMBER },
            compensatory: { type: Type.NUMBER },
            nasalErrors: { type: Type.NUMBER }
          }
        },
        wordLengthMetrics: {
          type: Type.OBJECT,
          properties: {
            monosyllabicAccuracy: { type: Type.NUMBER },
            multisyllabicAccuracy: { type: Type.NUMBER },
            description: { type: Type.STRING }
          }
        },
        detailedErrors: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: {
                target: { type: Type.STRING },
                actual: { type: Type.STRING },
                position: { type: Type.STRING },
                type: { type: Type.STRING },
                isNasal: { type: Type.BOOLEAN }
             }
          }
        },
        ddkMetrics: {
            type: Type.OBJECT,
            properties: {
                amrRate: { type: Type.NUMBER },
                smrRate: { type: Type.NUMBER },
                regularity: { type: Type.NUMBER },
                precision: { type: Type.NUMBER }
            }
        }
      }
    },
    fluency: {
        type: Type.OBJECT,
        properties: {
            disfluencyIndex: { type: Type.NUMBER },
            types: {
                type: Type.OBJECT,
                properties: {
                    blocks: { type: Type.NUMBER },
                    prolongations: { type: Type.NUMBER },
                    repetitions: { type: Type.NUMBER },
                    revisions: { type: Type.NUMBER },
                    interjections: { type: Type.NUMBER }
                }
            },
            secondaryBehaviors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            speechNaturalness: { type: Type.NUMBER },
            rateConsistency: { type: Type.STRING, enum: ["Consistent", "Variable", "Bursts"] },
            severity: { type: Type.STRING, enum: ["Normal", "Mild", "Moderate", "Severe", "Profound"] }
        }
    },
    prosody: {
      type: Type.OBJECT,
      properties: {
        speechRate: { type: Type.NUMBER },
        wordsPerMinute: { type: Type.NUMBER },
        intonationVariation: { type: Type.NUMBER },
        rhythmScore: { type: Type.NUMBER },
        stressAccuracy: { type: Type.NUMBER },
        isScannedSpeech: { type: Type.BOOLEAN },
        monotoneSeverity: { type: Type.NUMBER },
        prosodySeverityIndex: { type: Type.NUMBER },
        pitchRangeClassification: { type: Type.STRING, enum: ["Restricted", "Normal", "Excessive"] },
        pitchContour: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    time: { type: Type.NUMBER },
                    pitch: { type: Type.NUMBER }
                }
            }
        },
        pauseMetrics: {
            type: Type.OBJECT,
            properties: {
                totalPauses: { type: Type.NUMBER },
                averagePauseDuration: { type: Type.NUMBER },
                pausePattern: { type: Type.STRING }
            }
        }
      }
    },
    nasalance: { type: Type.NUMBER },
    resonanceSeverity: { type: Type.NUMBER },
    resonanceSeverityIndex: { type: Type.NUMBER },
    resonanceType: { type: Type.STRING, enum: ["Normal", "Hypernasal", "Hyponasal", "Cul-de-sac", "Mixed"] },
    vpdAlert: {
        type: Type.OBJECT,
        properties: {
            detected: { type: Type.BOOLEAN },
            severity: { type: Type.STRING },
            indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
        }
    },
    summary: { type: Type.STRING },
    normsUsed: {
        type: Type.OBJECT,
        properties: {
            description: { type: Type.STRING },
            pitchRange: { type: Type.STRING },
            ddkRate: { type: Type.STRING }
        }
    }
  }
};

// --- API CLIENT ---

export const analyzeAudio = async (
  audioBase64: string, 
  mimeType: string, 
  taskContext: string,
  demographic: Demographic,
  language: Language,
  bookmarks: number[],
  sex: BiologicalSex,
  assessmentDomain?: AssessmentDomain,
  transcript?: string
): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
      console.error("API_KEY is missing from environment.");
      throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const domainPrompt = getDomainSpecificPrompt(assessmentDomain);
  
  const systemInstruction = `
    You are an expert Speech-Language Pathologist (SLP) AI specialized in Auditory-Perceptual and Acoustic Analysis.
    
    **ASSESSMENT CONTEXT:**
    - Domain: ${assessmentDomain ? assessmentDomain.toUpperCase() : 'COMPREHENSIVE'}
    - Demographic: ${demographic} (${sex})
    - Language: ${language}
    - Task: ${taskContext}
    - Transcript Target: "${transcript || 'Not provided'}"
    - Bookmarked Events at: ${bookmarks.join(', ')}s (Analyze these segments closely).

    ${domainPrompt}

    **GENERAL INSTRUCTIONS (Apply if consistent with Domain rules):**
    1. **Normative Analysis:** Compare findings against ${demographic} ${sex} norms for pitch, DDK rates, and formant structures.
    2. **Acoustic Simulation:** Estimate values (Jitter, Shimmer, HNR, Formants) from the audio signal as a Virtual Signal Processor.
    3. **Schema Compliance:** Fill the JSON schema as completely as possible for the target domain.
       - If a domain is IGNORED (due to the prompts above), return 0, null, or empty arrays for those specific fields.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: mimeType, data: audioBase64 } },
        { text: `Analyze this audio. ${transcript ? `The user is saying: "${transcript}"` : ''}` }
      ]
    },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const jsonText = response.text || "{}";
  let result: Partial<AnalysisResult> = {};
  
  try {
    result = JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Invalid AI Response");
  }

  // Hydrate with client-side metadata
  return {
    ...result,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    protocolId: taskContext,
    demographic,
    sex,
    language,
    bookmarks,
    assessmentDomain,
    transcript,
    perceptualRatings: result.perceptualRatings || { 
        hypernasality: 0, hyponasality: 0, culDeSac: 0, nasalEmission: 0, oralPressure: 0 
    },
    acousticNasalMetrics: result.acousticNasalMetrics || {
        lowMidFrequencyRatio: 0, spectralFlatteningIndex: 0, nasalEmissionIndex: 0, 
        nasalConsonantWeakness: 0, nasalResonanceIndex: 0, nasalResonanceSeverity: 'Normal',
        nasalEmissionOnFricatives: [], nasalOralEnergyComparison: []
    },
    voiceMetrics: result.voiceMetrics || {
        fundamentalFrequency: 0, minPitch: 0, maxPitch: 0, pitchRange: 0,
        meanIntensity: 0, intensityRange: 0, intensityStdDev: 0,
        jitter: 0, shimmer: 0, hnr: 0, qualityProfile: 'Normal', stabilityScore: 0
    },
    aerodynamics: result.aerodynamics || {
        maxPhonationDuration: 0, szRatio: 0, sDuration: 0, zDuration: 0, vitalCapacityEstimation: 'Normal'
    },
    articulation: result.articulation || {
        pcc: 0, pvc: 0, pressureAccuracy: 0, intelligibility: 100,
        errorPattern: { substitutions: 0, omissions: 0, distortions: 0, additions: 0, compensatory: 0, nasalErrors: 0 },
        detailedErrors: [], wordLengthMetrics: { monosyllabicAccuracy: 0, multisyllabicAccuracy: 0, description: '' },
        ddkMetrics: { amrRate: 0, smrRate: 0, regularity: 0, precision: 0 }
    },
    prosody: result.prosody || {
        speechRate: 0, wordsPerMinute: 0, intonationVariation: 0, rhythmScore: 0, stressAccuracy: 0,
        isScannedSpeech: false, monotoneSeverity: 0, prosodySeverityIndex: 0, pitchRangeClassification: 'Normal',
        pitchContour: [], pauseMetrics: { totalPauses: 0, averagePauseDuration: 0, pausePattern: 'Normal' }
    },
    fluency: result.fluency || {
        disfluencyIndex: 0, types: { blocks: 0, prolongations: 0, repetitions: 0, revisions: 0, interjections: 0 },
        secondaryBehaviors: [], speechNaturalness: 5, rateConsistency: 'Consistent', severity: 'Normal'
    },
    nasalance: result.nasalance || 0,
    resonanceSeverity: result.resonanceSeverity || 0,
    resonanceSeverityIndex: result.resonanceSeverityIndex || 0,
    resonanceType: result.resonanceType || 'Normal',
    vpdAlert: result.vpdAlert || { detected: false, severity: 'Potential', indicators: [], recommendation: '' },
    summary: result.summary || "No summary generated.",
    oralPressure: [],
    detectedErrors: []
  } as AnalysisResult;
};

export const generateReferenceAudio = async (text: string, sex: BiologicalSex, language: Language): Promise<string | null> => {
    return null; 
};