
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkoutPlan, Exercise, PerformanceMetric, ActiveGoal } from "../types";
import { EXERCISE_DB } from "../data/exerciseLibrary";

// "Fonction utilitaire pour nettoyer les balises Markdown (```json) parfois renvoyées par l'IA."
const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// "Interface pour le résultat de l'analyse de faisabilité (Check sécurité)."
export interface FeasibilityResult {
  isSafe: boolean;
  healthScore: number; // 0-100
  healthAssessment: string;
  warning: string;
  alternative: string;
}

// "Interface pour l'analyse de progression après la séance."
export interface GoalAnalysisResult {
  progressIncrement: number; // 0-5% par session typiquement
  isOnTrack: boolean;
  adjustmentAdvice: string;
  currentEstimatedCompletion: number; // 0-100%
}

// "Interface pour le parsing du bilan physiologique ET démographique."
export interface AssessmentAnalysis {
  blessures_actives: string[];
  details_blessures: string;
  stressLevel: 'Bas' | 'Moyen' | 'Élevé';
  sleepQuality: 'Mauvaise' | 'Moyenne' | 'Excellente';
  recommendations: string;
  // "Nouveaux champs détectés pour la création de profil"
  detected_name?: string; // "NOUVEAU : Nom détecté"
  detected_age?: number;
  detected_genre?: string;
  detected_poids?: string;
  detected_taille?: string;
  detected_objectif?: string;
  // "Champs supplémentaires pour informations complètes"
  detected_faiblesses?: string[]; // Faiblesses musculaires détectées
  detected_limitations?: string[]; // Limitations fonctionnelles
  detected_antecedents?: string; // Antécédents médicaux
  detected_medications?: string[]; // Médications en cours
  detected_niveau_activite?: string; // Niveau d'activité actuel
  detected_experience?: string; // Expérience sportive
}

// "Type union pour l'entrée de l'analyse médicale (Texte ou Fichier)"
export type AssessmentInput = string | { inlineData: { data: string; mimeType: string } };

// "Fonction 1: Vérifie si l'objectif est sûr compte tenu des blessures."
export const validateGoalFeasibility = async (profile: UserProfile): Promise<FeasibilityResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Optimisation: Utilisation de Gemini 3 Pro avec un budget de réflexion modéré (2k au lieu de 16k)
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `ANALYSE CRITIQUE BIOMÉCANIQUE ET SANTÉ :
    Objectif : "${profile.objectifPrincipal}"
    Délai : "${profile.delaiObjectif}"
    Blessures signalées : ${profile.blessures_actives.join(', ') || 'Aucune'}
    Détails blessures : ${profile.details_blessures || 'N/A'}
    Profil : ${profile.age} ans, ${profile.genre}, ${profile.poids}kg, niveau ${profile.experience}.
    `,
    config: {
      thinkingConfig: { thinkingBudget: 2048 }, // "Réduit pour accélérer le calcul initial"
      systemInstruction: `Tu es HYGIE, expert en médecine du sport.
      Évalue la viabilité de l'objectif en tenant compte des blessures.
      Si une blessure est active, sois plus conservateur sur le score.
      Si l'objectif aggrave directement une blessure signalée, isSafe doit être false.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isSafe: { type: Type.BOOLEAN },
          healthScore: { type: Type.NUMBER },
          healthAssessment: { type: Type.STRING },
          warning: { type: Type.STRING },
          alternative: { type: Type.STRING }
        },
        required: ["isSafe", "healthScore", "healthAssessment", "warning", "alternative"]
      }
    }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

// "Fonction 2: Analyse la progression vers l'objectif à la fin de la séance."
export const analyzeGoalProgress = async (profile: UserProfile, sessionData: PerformanceMetric[]): Promise<GoalAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Optimisation: Passage à Gemini 3 Flash pour une vitesse maximale sur l'analyse de données
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `ANALYSE DE PROGRESSION :
    Objectif : ${profile.objectifPrincipal}
    Délai Cible : ${profile.delaiObjectif}
    Progression Actuelle : ${profile.activeGoal?.currentValue || 0}%
    Dernière Session : ${JSON.stringify(sessionData)}`,
    config: {
      // Pas de thinkingConfig nécessaire pour Flash ici, c'est du calcul pur
      systemInstruction: `Tu es HYGIE. Analyse si cette session rapproche l'athlète de son objectif.
      Retourne :
      - progressIncrement: l'augmentation du pourcentage de complétion (ex: 2.5).
      - isOnTrack: boolean.
      - adjustmentAdvice: conseil technique si progression lente.
      - currentEstimatedCompletion: nouveau pourcentage total.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          progressIncrement: { type: Type.NUMBER },
          isOnTrack: { type: Type.BOOLEAN },
          adjustmentAdvice: { type: Type.STRING },
          currentEstimatedCompletion: { type: Type.NUMBER }
        },
        required: ["progressIncrement", "isOnTrack", "adjustmentAdvice", "currentEstimatedCompletion"]
      }
    }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

// "Fonction 3: GÉNÉRATION DE LA SÉANCE (Le coeur du système)."
export const generateWorkout = async (
  profile: UserProfile, 
  duration: number, 
  stateOfMind: string,
  additionalContext?: string
): Promise<WorkoutPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const exerciseLibraryContext = EXERCISE_DB.map(e => 
    `- ${e.nom} (Catégorie: ${e.category}). Cible: ${e.target.join(', ')}. Triggers: ${e.triggers.join(', ')}. Tip: ${e.coach_tip}`
  ).join('\n');

  // Optimisation: Gemini 3 Pro pour la qualité du plan, mais budget limité à 4k (vs 16k avant)
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `CONCEPTION DE PROTOCOLE ADAPTÉ :
    Athlète : ${profile.nom}, ${profile.experience}.
    Blessures : ${profile.blessures_actives.join(', ')}.
    Détails Pathologiques : ${profile.details_blessures}.
    Objectif : ${profile.objectifPrincipal}.
    Conseil ajustement précédent : ${profile.dernier_feedback_ia || 'Aucun'}.
    Durée : ${duration} min.
    Focus : ${stateOfMind}
    ${additionalContext ? `\nCONTEXTE SPÉCIFIQUE DU PROGRAMME:\n${additionalContext}` : ''}`,
    config: {
      thinkingConfig: { thinkingBudget: 4096 }, // "Suffisant pour structurer un bon workout sans attendre 30s"
      systemInstruction: `Tu es HYGIE. Génère un WorkoutPlan JSON.
      
      IMPORTANT : Tu as accès à une BIBLIOTHÈQUE D'EXERCICES DE RÉFÉRENCE ci-dessous.
      Tu DOIS prioriser ces exercices si les "Triggers" (déclencheurs) correspondent aux blessures ou détails pathologiques de l'athlète.
      Par exemple, si "Upper Crossed Syndrome" est mentionné, utilise "Face Pulls" ou "Chin Tucks".
      
      BIBLIOTHÈQUE DE RÉFÉRENCE :
      ${exerciseLibraryContext}
      
      Si aucun exercice de la bibliothèque ne convient, tu peux en proposer d'autres standards.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          phrase_lancement: { type: Type.STRING },
          structure: { type: Type.STRING, enum: ["CIRCUIT", "SERIES"] },
          echauffement_dynamique: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { nom: { type: Type.STRING }, instructions: { type: Type.STRING }, duree_secondes: { type: Type.NUMBER } }, required: ["nom", "instructions", "duree_secondes"] } },
          etirements_dynamiques: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { nom: { type: Type.STRING }, instructions: { type: Type.STRING }, duree_secondes: { type: Type.NUMBER } }, required: ["nom", "instructions", "duree_secondes"] } },
          temps_estime: { type: Type.NUMBER },
          liste_exos: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { nom: { type: Type.STRING }, sets: { type: Type.NUMBER }, reps: { type: Type.STRING }, repos: { type: Type.NUMBER }, description: { type: Type.STRING }, coach_tip: { type: Type.STRING }, poids_suggere: { type: Type.STRING } }, required: ["nom", "sets", "reps", "repos", "description"] } },
          etirements: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { nom: { type: Type.STRING }, instructions: { type: Type.STRING }, duree_secondes: { type: Type.NUMBER } }, required: ["nom", "instructions", "duree_secondes"] } }
        },
        required: ["phrase_lancement", "structure", "echauffement_dynamique", "etirements_dynamiques", "temps_estime", "liste_exos", "etirements"]
      }
    }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

// "Fonction 4: Génère un feedback textuel court après la séance."
export const generateSessionFeedback = async (profile: UserProfile, sessionData: PerformanceMetric[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Optimisation: Gemini 3 Flash pour un feedback instantané
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `ANALYSE : ${JSON.stringify(sessionData)}.`,
    config: { 
      // Thinking désactivé ou très bas pour de la génération de texte simple
      systemInstruction: "Tu es HYGIE. Analyse la session et donne des conseils techniques concis, surtout par rapport aux blessures signalées." 
    }
  });
  return response.text || "Analyse terminée.";
};

// "Fonction 5: Remplace un exercice par un autre (Swap) en cas de douleur ou manque de matériel."
export const swapExercise = async (profile: UserProfile, currentExo: Exercise): Promise<Exercise> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const exerciseLibraryContext = EXERCISE_DB.map(e => 
    `- ${e.nom} (Catégorie: ${e.category}). Triggers: ${e.triggers.join(', ')}`
  ).join('\n');

  // Optimisation: Gemini 3 Flash. L'utilisateur attend devant sa machine, la vitesse est CRITIQUE.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Remplaçant sans douleur pour : ${JSON.stringify(currentExo)}. Blessures : ${profile.blessures_actives.join(', ')}`,
    config: {
      systemInstruction: `Trouve une alternative sûre. Utilise la bibliothèque ci-dessous si pertinent : \n${exerciseLibraryContext}`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nom: { type: Type.STRING },
          sets: { type: Type.NUMBER },
          reps: { type: Type.STRING },
          repos: { type: Type.NUMBER },
          description: { type: Type.STRING },
          coach_tip: { type: Type.STRING },
          poids_suggere: { type: Type.STRING }
        },
        required: ["nom", "sets", "reps", "repos", "description"]
      }
    }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

// "Fonction 6: Analyse le texte brut OU un fichier (image/pdf) d'un bilan physiologique."
export const parseMedicalAssessment = async (input: AssessmentInput): Promise<AssessmentAnalysis> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Clé API Gemini non configurée. Veuillez configurer votre clé API dans les paramètres.');
  }
  
  console.log('parseMedicalAssessment appelé avec:', { 
    hasFile: typeof input !== 'string',
    apiKeyPresent: !!apiKey 
  });
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    // "On utilise Gemini 2.0 Flash (plus rapide et stable que exp) pour sa capacité multimodale rapide"
    const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        // "CORRECTION : Si c'est un fichier (objet), on le passe directement car il contient déjà la structure { inlineData: {...} } attendue par le SDK."
        // "Avant, input.inlineData extrayait { data, mimeType } sans la clé inlineData parente, ce qui causait l'erreur 400."
        typeof input === 'string' ? { text: input } : input, 
        { text: "Extrais les informations médicales ET démographiques de ce document pour créer ou mettre à jour un profil athlète." }
      ]
    },
    config: {
      systemInstruction: `Assistant médical expert. Analyse le document et retourne un JSON avec ces champs :

OBLIGATOIRES:
- blessures_actives: string[] (zones douloureuses/blessures, ex: "Genou Droit", "Lombaires")
- details_blessures: string (résumé technique avec localisation, sévérité, chronicité)
- stressLevel: "Bas" | "Moyen" | "Élevé" (selon mentions stress/anxiété/fatigue)
- sleepQuality: "Mauvaise" | "Moyenne" | "Excellente" (selon mentions sommeil/récupération)
- recommendations: string (conseil personnalisé pour le coach)

DÉMOGRAPHIQUES (si présents, sinon null):
- detected_name: string (NOM COMPLET, PRIORITÉ - chercher en-tête/signature)
- detected_age: number (chercher "ans", "âge", "né(e) en")
- detected_genre: "Homme" | "Femme" | "Non spécifié"
- detected_poids: string (kg)
- detected_taille: string (cm)
- detected_objectif: string (ex: "Perte de poids", "Marathon", "Renforcement")

COMPLÉMENTAIRES (si présents, sinon null/[]):
- detected_faiblesses: string[] (ex: "Quadriceps faibles", "Core faible")
- detected_limitations: string[] (ex: "Flexion genou limitée", "Endurance réduite")
- detected_antecedents: string (antécédents médicaux/chirurgicaux)
- detected_medications: string[] (médicaments mentionnés)
- detected_niveau_activite: string (ex: "Sédentaire", "Actif", "Athlète")
- detected_experience: "Débutant" | "Intermédiaire" | "Avancé"

RÈGLES: Sois exhaustif, extrais TOUT ce qui est mentionné. Si info absente, null/[] selon le type.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          blessures_actives: { type: Type.ARRAY, items: { type: Type.STRING } },
          details_blessures: { type: Type.STRING },
          stressLevel: { type: Type.STRING, enum: ["Bas", "Moyen", "Élevé"] },
          sleepQuality: { type: Type.STRING, enum: ["Mauvaise", "Moyenne", "Excellente"] },
          recommendations: { type: Type.STRING },
          detected_name: { type: Type.STRING },
          detected_age: { type: Type.NUMBER },
          detected_genre: { type: Type.STRING },
          detected_poids: { type: Type.STRING },
          detected_taille: { type: Type.STRING },
          detected_objectif: { type: Type.STRING },
          detected_faiblesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          detected_limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
          detected_antecedents: { type: Type.STRING },
          detected_medications: { type: Type.ARRAY, items: { type: Type.STRING } },
          detected_niveau_activite: { type: Type.STRING },
          detected_experience: { type: Type.STRING }
        },
        required: ["blessures_actives", "details_blessures", "stressLevel", "sleepQuality", "recommendations"]
      }
    }
  });
  
    console.log('Réponse de l\'API Gemini reçue');
    const result = JSON.parse(cleanJson(response.text || "{}"));
    console.log('Analyse parsée avec succès');
    return result;
  } catch (error: any) {
    console.error('Erreur dans parseMedicalAssessment:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    throw new Error(`Erreur lors de l'analyse médicale: ${error.message || 'Erreur inconnue'}`);
  }
};
