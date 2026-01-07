// Import des exercices étendus
import { EXERCISES_EXTENDED } from './exercises_extended';

// "Définition de la structure d'un exercice dans la bibliothèque de référence."
export interface ExerciseDefinition {
  id: string; // "Identifiant unique"
  nom: string;
  category: string;
  target: string[]; // "Muscles ciblés"
  triggers: string[]; // "Codes déclencheurs: Si le profil utilisateur a ce code, cet exercice sera priorisé."
  description: string;
  coach_tip: string;
  poids_suggere?: string;
}

// "Constantes représentant les profils 'Robots' (Pathologies ou Défauts biomécaniques)."
// "Ces codes correspondent à ce que l'IA détecte dans le PDF."
export const ROBOT_PROFILES = {
  UPPER_CROSSED: 'upper_crossed_syndrome', // "Syndrome croisé supérieur (épaules en avant)"
  KNEE_VALGUS: 'knee_valgus', // "Genoux qui rentrent vers l'intérieur"
  WEAK_GLUTES: 'weak_glutes', // "Faiblesse fessiers"
  FORWARD_HEAD: 'forward_head_posture', // "Tête en avant"
  LUMBAR_INSTABILITY: 'lumbar_instability', // "Instabilité du bas du dos"
  ASYMMETRY_LEGS: 'leg_strength_asymmetry', // "Différence de force gauche/droite jambes"
  TIGHT_PECS: 'tight_pecs', // "Pectoraux trop raides"
  LIMITED_SHOULDER: 'limited_overhead_mobility', // "Manque de mobilité épaule"
  GENERAL_STRENGTH: 'general_strength'
};

// base de données des exercices (liste originale)
const EXERCISE_DB_ORIGINAL: ExerciseDefinition[] = [
  // correction posturale haut du corps
  {
    id: "face_pull",
    nom: "Face Pulls (Poulie/Élastique)",
    category: "Correction Posturale",
    target: ["Rhomboïdes", "Coiffe des rotateurs", "Deltoïde postérieur"],
    triggers: [ROBOT_PROFILES.UPPER_CROSSED, "shoulders_internal_rotation", ROBOT_PROFILES.FORWARD_HEAD],
    description: "Tirer la corde vers le visage en rotation externe pour ouvrir la cage thoracique. Coudes hauts.",
    coach_tip: "Imaginez vouloir écraser une noix entre vos omoplates à la fin du mouvement."
  },
  {
    id: "chin_tucks",
    nom: "Chin Tucks (Rétraction Cervicale)",
    category: "Rééducation",
    target: ["Fléchisseurs cervicaux profonds"],
    triggers: [ROBOT_PROFILES.FORWARD_HEAD, ROBOT_PROFILES.UPPER_CROSSED],
    description: "Reculer le menton pour créer un 'double menton' et aligner les vertèbres cervicales.",
    coach_tip: "Gardez le regard à l'horizontale, ne baissez pas la tête."
  },
  {
    id: "door_pec_stretch",
    nom: "Étirement Pectoral Unilatéral",
    category: "Mobilité",
    target: ["Grand Pectoral", "Petit Pectoral"],
    triggers: [ROBOT_PROFILES.UPPER_CROSSED, ROBOT_PROFILES.TIGHT_PECS],
    description: "Bras contre un cadre de porte à 90°, avancer le buste pour étirer l'avant de l'épaule.",
    coach_tip: "Cherchez une tension modérée, pas une douleur."
  },
  
  // --- MEMBRES INFÉRIEURS & STABILITÉ ---
  {
    id: "peterson_step_up",
    nom: "Peterson Step Up",
    category: "Renforcement Unilatéral",
    target: ["Vaste Médial (VMO)", "Quadriceps"],
    triggers: [ROBOT_PROFILES.KNEE_VALGUS, "knee_imbalance", "patellar_tracking"],
    description: "Montée contrôlée sur une petite marche en gardant le genou aligné avec les orteils.",
    coach_tip: "Le genou ne doit absolument pas rentrer vers l'intérieur."
  },
  {
    id: "clamshells",
    nom: "Clamshells (Avec Élastique)",
    category: "Activation",
    target: ["Moyen Fessier"],
    triggers: [ROBOT_PROFILES.KNEE_VALGUS, ROBOT_PROFILES.WEAK_GLUTES],
    description: "Allongé sur le côté, ouvrir le genou vers le plafond sans bouger le bassin.",
    coach_tip: "L'élastique doit être juste au-dessus des genoux."
  },
  {
    id: "bulgarian_split_squat",
    nom: "Split Squat Bulgare",
    category: "Force Unilatérale",
    target: ["Quadriceps", "Fessiers"],
    triggers: [ROBOT_PROFILES.ASYMMETRY_LEGS, ROBOT_PROFILES.GENERAL_STRENGTH],
    description: "Pied arrière surélevé, descendre le genou arrière vers le sol.",
    coach_tip: "Penchez légèrement le buste en avant pour plus de fessiers."
  },

  // --- GAINAGE & TRONC ---
  {
    id: "pallof_press",
    nom: "Pallof Press",
    category: "Anti-Rotation",
    target: ["Obliques", "Transverse"],
    triggers: [ROBOT_PROFILES.LUMBAR_INSTABILITY, "core_weakness", "asymmetry_trunk"],
    description: "Résister à la rotation imposée par un élastique latéral en tendant les bras devant soi.",
    coach_tip: "Votre corps doit rester de marbre, seuls les bras bougent."
  },
  {
    id: "dead_bug",
    nom: "Dead Bug",
    category: "Stabilité Lombraire",
    target: ["Transverse", "Fléchisseurs hanche"],
    triggers: [ROBOT_PROFILES.LUMBAR_INSTABILITY, "anterior_pelvic_tilt"],
    description: "Sur le dos, tendre bras et jambe opposés sans décoller le bas du dos du sol.",
    coach_tip: "Le bas du dos doit rester collé au sol tout le long."
  }
];

// Base de données complète fusionnée (exercices originaux + exercices étendus)
export const EXERCISE_DB: ExerciseDefinition[] = [
  ...EXERCISE_DB_ORIGINAL,
  ...EXERCISES_EXTENDED
];
