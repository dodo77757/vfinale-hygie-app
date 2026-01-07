/**
 * Service de traitement de fichiers non-bloquant
 * Utilise requestIdleCallback et chunking pour ne pas bloquer l'UI
 */

import { 
  optimizeFileForUpload, 
  fileToBase64Optimized,
  getMimeType
} from './fileProcessingService';

export interface ProcessingCallbacks {
  onOptimizeStart?: () => void;
  onOptimizeProgress?: (progress: number) => void;
  onOptimizeComplete?: (file: File) => void;
  onBase64Start?: () => void;
  onBase64Progress?: (progress: number) => void;
  onBase64Complete?: (base64: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Traite un fichier de manière non-bloquante
 * Utilise requestIdleCallback pour permettre au navigateur de respirer
 */
export const processFileNonBlocking = async (
  file: File,
  callbacks: ProcessingCallbacks = {}
): Promise<{ optimizedFile: File; base64Data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    // Utilise requestIdleCallback si disponible, sinon setTimeout
    const scheduleWork = (callback: () => void) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback, { timeout: 1000 });
      } else {
        setTimeout(callback, 0);
      }
    };

    scheduleWork(async () => {
      try {
        // Étape 1: Optimisation
        callbacks.onOptimizeStart?.();
        const optimizedFile = await optimizeFileForUpload(file);
        callbacks.onOptimizeComplete?.(optimizedFile);

        // Permet au navigateur de respirer
        await new Promise(resolve => scheduleWork(resolve));

        // Étape 2: Conversion Base64
        callbacks.onBase64Start?.();
        const base64Raw = await fileToBase64Optimized(optimizedFile, (progress) => {
          callbacks.onBase64Progress?.(progress);
        });
        
        const base64Data = base64Raw.split(',')[1];
        const mimeType = getMimeType(optimizedFile);
        
        callbacks.onBase64Complete?.(base64Data);
        resolve({ optimizedFile, base64Data, mimeType });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erreur inconnue');
        callbacks.onError?.(err);
        reject(err);
      }
    });
  });
};

/**
 * Version optimisée qui traite les fichiers en chunks pour les très gros fichiers
 */
export const processFileInChunks = async (
  file: File,
  chunkSize: number = 1024 * 1024, // 1MB par chunk
  callbacks: ProcessingCallbacks = {}
): Promise<{ optimizedFile: File; base64Data: string; mimeType: string }> => {
  // Pour les petits fichiers, utilise la méthode normale
  if (file.size < chunkSize * 2) {
    return processFileNonBlocking(file, callbacks);
  }

  // Pour les gros fichiers, on optimise d'abord puis on convertit
  callbacks.onOptimizeStart?.();
  const optimizedFile = await optimizeFileForUpload(file);
  callbacks.onOptimizeComplete?.(optimizedFile);

  // Si après optimisation le fichier est petit, conversion normale
  if (optimizedFile.size < chunkSize * 2) {
    callbacks.onBase64Start?.();
    const base64Raw = await fileToBase64Optimized(optimizedFile, callbacks.onBase64Progress);
    const base64Data = base64Raw.split(',')[1];
    const mimeType = getMimeType(optimizedFile);
    callbacks.onBase64Complete?.(base64Data);
    return { optimizedFile, base64Data, mimeType };
  }

  // Sinon, conversion normale (le FileReader gère déjà le chunking)
  callbacks.onBase64Start?.();
  const base64Raw = await fileToBase64Optimized(optimizedFile, callbacks.onBase64Progress);
  const base64Data = base64Raw.split(',')[1];
  const mimeType = getMimeType(optimizedFile);
  callbacks.onBase64Complete?.(base64Data);
  return { optimizedFile, base64Data, mimeType };
};

