/**
 * Wrapper pour browser-image-compression
 * Gère l'import de manière sûre même si le package n'est pas installé
 */

let compressionModule: any = null;
let loadAttempted = false;

/**
 * Charge le module browser-image-compression de manière sûre
 * Retourne null si le module n'est pas disponible
 */
export const loadImageCompression = async (): Promise<any> => {
  if (loadAttempted) {
    return compressionModule;
  }

  loadAttempted = true;

  // Utilise une approche qui évite l'analyse statique de Vite
  try {
    // @ts-ignore - Le package peut ne pas être installé
    const moduleName = 'browser-image-compression';
    const dynamicImport = new Function('moduleName', 'return import(moduleName)');
    const module = await dynamicImport(moduleName);
    compressionModule = module.default || module;
    return compressionModule;
  } catch (error) {
    console.warn(
      'browser-image-compression non disponible. Utilisation du fallback. ' +
      'Installation: npm install browser-image-compression'
    );
    compressionModule = null;
    return null;
  }
};

/**
 * Vérifie si le module de compression est disponible
 */
export const isCompressionAvailable = (): boolean => {
  return compressionModule !== null;
};

