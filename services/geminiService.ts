
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
      systemInstruction: `Tu es un assistant médical expert pour coach sportif. 
      Analyse le document fourni (texte, image ou PDF) de manière EXHAUSTIVE et PRÉCISE.
      
      IMPORTANT : Extrais TOUTES les informations disponibles dans le document, même si elles sont implicites.
      
      Informations médicales OBLIGATOIRES :
      - "blessures_actives": Liste COMPLÈTE des zones douloureuses, blessures, pathologies (ex: "Genou Droit", "Lombaires", "Épaule gauche", "Tendinite achilléenne"). Si aucune blessure n'est mentionnée, renvoie un tableau vide [].
      - "details_blessures": Résumé DÉTAILLÉ et technique de toutes les pathologies, blessures, douleurs identifiées. Inclus la localisation, la sévérité, la chronicité si mentionnées.
      - "stressLevel": Estime le niveau de stress (Bas, Moyen, Élevé) selon le ton, les mentions de stress, anxiété, fatigue mentale.
      - "sleepQuality": Estime la qualité du sommeil (Mauvaise, Moyenne, Excellente) selon les mentions de sommeil, récupération, fatigue.
      - "recommendations": Une phrase de conseil personnalisée pour le coach basée sur toutes les informations extraites.

      Données démographiques (extrais si présentes, sinon null) :
      - "detected_name": Le NOM COMPLET du patient/personne. Cherche dans l'en-tête, la signature, ou toute mention de nom. PRIORITÉ ABSOLUE : trouve le nom même s'il est partiellement visible.
      - "detected_age": Age en années (number). Cherche "ans", "âge", "né(e) en", etc.
      - "detected_genre": Homme, Femme, ou Non spécifié. Cherche les pronoms, mentions explicites.
      - "detected_poids": Poids en kg (string). Cherche "kg", "poids", "masse corporelle".
      - "detected_taille": Taille en cm (string). Cherche "cm", "taille", "hauteur".
      - "detected_objectif": Objectif principal déduit (ex: "Perte de poids", "Marathon", "Renforcement musculaire", "Rééducation", "Performance sportive").

      Informations complémentaires (extrais si présentes) :
      - "detected_faiblesses": Liste des faiblesses musculaires mentionnées (ex: "Quadriceps faibles", "Core faible", "Déséquilibre postural"). Si aucune mention, renvoie [].
      - "detected_limitations": Liste des limitations fonctionnelles (ex: "Flexion genou limitée", "Rotation épaule douloureuse", "Endurance réduite"). Si aucune mention, renvoie [].
      - "detected_antecedents": Antécédents médicaux, chirurgicaux, traumatiques mentionnés. Si aucun, renvoie null.
      - "detected_medications": Liste des médicaments mentionnés. Si aucun, renvoie [].
      - "detected_niveau_activite": Niveau d'activité actuel mentionné (ex: "Sédentaire", "Actif", "Sportif régulier", "Athlète"). Si non mentionné, renvoie null.
      - "detected_experience": Expérience sportive mentionnée (ex: "Débutant", "Intermédiaire", "Avancé", "Expert"). Si non mentionné, renvoie null.
      
      RÈGLES IMPORTANTES :
      1. Si le nom est partiellement visible ou ambigu, extrais ce qui est visible et indique-le clairement.
      2. Pour les blessures et faiblesses, sois exhaustif : liste TOUT ce qui est mentionné, même indirectement.
      3. Si une information n'est pas clairement mentionnée, tu peux faire des déductions logiques basées sur le contexte.
      4. Ne laisse AUCUN champ important vide si l'information est disponible dans le document.`,
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
