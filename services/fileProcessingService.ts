/**
 * Service optimisé pour le traitement des fichiers (PDF, images, etc.)
 */

/**
 * Convertit un fichier en Base64 de manière optimisée avec feedback progressif
 */
export const fileToBase64Optimized = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
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
      resolve(reader.result as string);
    };

    reader.onerror = error => reject(error);

    // Utilise readAsDataURL pour les petits fichiers, ou readAsArrayBuffer pour les gros
    if (file.size > 5 * 1024 * 1024) { // > 5MB
      // Pour les gros fichiers, on pourrait compresser d'abord
      reader.readAsDataURL(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
};

/**
 * Optimise un fichier avant l'envoi (compression pour images, réduction pour PDFs)
 */
export const optimizeFileForUpload = async (
  file: File,
  maxSize: number = 5 * 1024 * 1024 // 5MB par défaut
): Promise<File> => {
  // Si le fichier est déjà petit, on le retourne tel quel
  if (file.size <= maxSize) {
    return file;
  }

  // Pour les images, on peut compresser
  if (file.type.startsWith('image/')) {
    return compressImage(file, maxSize);
  }

  // Pour les PDFs, on ne peut pas vraiment les compresser côté client
  // Mais on peut informer l'utilisateur ou utiliser une API de compression
  // Pour l'instant, on retourne le fichier tel quel mais on pourrait ajouter une alerte
  if (file.size > 10 * 1024 * 1024) { // > 10MB
    console.warn(`Fichier volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Le traitement peut être plus long.`);
  }

  return file;
};

/**
 * Compresse une image
 */
const compressImage = (file: File, maxSize: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        let quality = 0.9;

        // Réduit la taille si nécessaire
        const maxDimension = 2000;
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


