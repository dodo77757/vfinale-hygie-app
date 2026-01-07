import { UserProfile } from '../types';
import * as aiService from '../services/geminiService';
import { 
  fileToBase64Optimized, 
  optimizeFileForUpload, 
  getMimeType,
} from '../services/fileProcessingService';

/**
 * Vérifie si un fichier correspond à un client existant
 * Compare le nom détecté par l'IA avec les noms des clients existants
 * 
 * @param file - Fichier à vérifier
 * @param existingClients - Liste des clients existants
 * @returns Le client correspondant si trouvé, null sinon
 */
export async function checkFileDuplicate(
  file: File,
  existingClients: UserProfile[]
): Promise<UserProfile | null> {
  try {
    // Analyse le fichier pour extraire le nom
    const optimizedFile = await optimizeFileForUpload(file);
    const base64Raw = await fileToBase64Optimized(optimizedFile);
    const base64Data = base64Raw.split(',')[1];
    const mimeType = getMimeType(optimizedFile);
    const analysisInput: aiService.AssessmentInput = { 
      inlineData: { data: base64Data, mimeType } 
    };

    const analysis = await aiService.parseMedicalAssessment(analysisInput);
    const detectedName = analysis.detected_name;

    if (!detectedName) {
      return null; // Pas de nom détecté, on ne peut pas vérifier
    }

    // Normalise le nom pour la comparaison (uppercase, trim)
    const normalizedDetectedName = detectedName.trim().toUpperCase();

    // Cherche un client avec le même nom
    const duplicate = existingClients.find(client => {
      const normalizedClientName = client.nom.trim().toUpperCase();
      return normalizedClientName === normalizedDetectedName;
    });

    return duplicate || null;
  } catch (error) {
    console.error('Erreur lors de la vérification de doublon:', error);
    // En cas d'erreur, on ne bloque pas l'import
    return null;
  }
}

/**
 * Vérifie si un texte correspond à un client existant
 * Compare le nom détecté par l'IA avec les noms des clients existants
 * 
 * @param text - Texte à analyser
 * @param existingClients - Liste des clients existants
 * @returns Le client correspondant si trouvé, null sinon
 */
export async function checkTextDuplicate(
  text: string,
  existingClients: UserProfile[]
): Promise<UserProfile | null> {
  try {
    const analysis = await aiService.parseMedicalAssessment(text);
    const detectedName = analysis.detected_name;

    if (!detectedName) {
      return null;
    }

    const normalizedDetectedName = detectedName.trim().toUpperCase();

    const duplicate = existingClients.find(client => {
      const normalizedClientName = client.nom.trim().toUpperCase();
      return normalizedClientName === normalizedDetectedName;
    });

    return duplicate || null;
  } catch (error) {
    console.error('Erreur lors de la vérification de doublon:', error);
    return null;
  }
}





