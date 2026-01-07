/**
 * Service optimisé pour le traitement des fichiers (PDF, images, etc.)
 * 
 * IMPORTANT: Installer browser-image-compression avec:
 * npm install browser-image-compression
 */

import { loadImageCompression } from './imageCompressionWrapper';

/**
 * Convertit un fichier en Base64 de manière optimisée avec feedback progressif
 * Gère correctement les PDFs et les images
 */
export const fileToBase64Optimized = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Vérification que le fichier est valide
    if (!file || file.size === 0) {
      reject(new Error('Fichier vide ou invalide'));
      return;
    }

    const reader = new FileReader();
    const fileSize = file.size;
    let loaded = 0;

    // Écoute les événements de progression
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        loaded = e.loaded;
        const progress = Math.round((loaded / fileSize) * 100);
        onProgress(progress);
      }
    };

    reader.onload = () => {
      if (onProgress) onProgress(100);
      const result = reader.result as string;
      if (!result) {
        reject(new Error('Échec de la conversion en Base64'));
        return;
      }
      resolve(result);
    };

    reader.onerror = (error) => {
      console.error('Erreur FileReader:', error);
      reject(new Error(`Erreur lors de la lecture du fichier: ${file.name}`));
    };

    // Utilise readAsDataURL pour tous les fichiers (PDFs et images)
    // Cette méthode fonctionne pour tous les types de fichiers
    reader.readAsDataURL(file);
  });
};

/**
 * Optimise un fichier avant l'envoi (compression agressive pour images, pas de modification pour PDFs)
 */
export const optimizeFileForUpload = async (
  file: File,
  maxSize: number = 0.8 * 1024 * 1024 // 800KB par défaut (compression agressive)
): Promise<File> => {
  // Vérification explicite pour les PDFs - PRIORITÉ ABSOLUE
  // Vérifie le type MIME et l'extension du fichier
  // NOTE: Certains navigateurs ne détectent pas correctement le type MIME des PDFs
  // On vérifie donc aussi l'extension et on peut même lire les premiers bytes si nécessaire
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  const isPDF = fileType === 'application/pdf' || 
                fileType === 'application/x-pdf' ||
                fileType === 'pdf' ||
                fileName.endsWith('.pdf');
  
  console.log(`[optimizeFileForUpload] Analyse du fichier:`, {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    isPDF: isPDF
  });
  
  if (isPDF) {
    console.log(`[optimizeFileForUpload] ✅ Fichier PDF détecté: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) - Retour immédiat sans compression`);
    if (file.size > 10 * 1024 * 1024) { // > 10MB
      console.warn(`⚠️ Fichier PDF volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Le traitement peut être plus long.`);
    }
    // Retourne immédiatement le fichier PDF SANS aucune modification
    return file;
  }

  // Pour les images UNIQUEMENT, compression systématique AVANT la conversion en Base64
  // (même si l'image est déjà petite, on la compresse pour optimiser l'envoi à l'IA)
  // IMPORTANT: Ne compresser QUE les fichiers dont le type commence par 'image/'
  if (file.type && file.type.startsWith('image/')) {
    // Charger browser-image-compression si disponible
    const compressionLib = await loadImageCompression();
    
    // Si browser-image-compression est disponible, l'utiliser
    if (compressionLib) {
      try {
        const options = {
          maxSizeMB: 0.8, // Maximum 800KB
          maxWidthOrHeight: 1920, // Dimension maximale
          useWebWorker: true, // Utilise un Web Worker pour ne pas figer l'interface
          fileType: file.type, // Conserve le type MIME original
          initialQuality: 0.8, // Qualité initiale (sera ajustée automatiquement pour atteindre maxSizeMB)
        };

        const compressedFile = await compressionLib(file, options);
        
        console.log(`Image compressée: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        return compressedFile;
      } catch (error) {
        console.error('Erreur lors de la compression de l\'image avec browser-image-compression:', error);
        // Fallback vers la méthode basique en cas d'erreur
        return compressImageFallback(file, maxSize);
      }
    } else {
      // Fallback si browser-image-compression n'est pas disponible
      console.log('Utilisation du fallback de compression (browser-image-compression non installé)');
      return compressImageFallback(file, maxSize);
    }
  }

  // Pour les autres types de fichiers, on retourne tel quel
  return file;
};

/**
 * Fallback de compression d'image (utilisé si browser-image-compression n'est pas disponible)
 */
const compressImageFallback = (file: File, maxSize: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        let quality = 0.7;

        // Réduit la taille si nécessaire (max 1920px comme demandé)
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Essaie différentes qualités jusqu'à obtenir la taille souhaitée
        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Échec de la compression'));
                return;
              }

              if (blob.size <= maxSize || q <= 0.3) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                tryCompress(q - 0.1);
              }
            },
            file.type,
            q
          );
        };

        tryCompress(quality);
      };
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsDataURL(file);
  });
};

/**
 * Extrait le type MIME correct pour l'API Gemini
 */
export const getMimeType = (file: File): string => {
  // Gemini supporte ces types
  const supportedTypes: Record<string, string> = {
    'application/pdf': 'application/pdf',
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp',
    'image/gif': 'image/gif'
  };

  return supportedTypes[file.type] || file.type || 'application/octet-stream';
};

/**
 * Vérifie si un fichier est trop volumineux
 */
export const isFileTooLarge = (file: File, maxSize: number = 20 * 1024 * 1024): boolean => {
  return file.size > maxSize;
};

/**
 * Formate la taille d'un fichier pour l'affichage
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};


