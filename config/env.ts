import { z } from 'zod';

/**
 * Schéma de validation pour les variables d'environnement
 */
const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY est requis'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
});

type Env = z.infer<typeof EnvSchema>;

/**
 * Valide et exporte les variables d'environnement
 */
function validateEnv(): Env {
  try {
    const env = {
      GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '',
      NODE_ENV: (import.meta.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    };

    return EnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(
        `Variables d'environnement manquantes ou invalides: ${missingVars}\n` +
        'Veuillez créer un fichier .env.local avec les variables requises.\n' +
        'Voir .env.example pour un exemple.'
      );
    }
    throw error;
  }
}

/**
 * Variables d'environnement validées
 * Cette fonction lance une erreur au démarrage si les variables sont manquantes
 */
export const env = validateEnv();

/**
 * Vérifie si l'application est en mode développement
 */
export const isDev = env.NODE_ENV === 'development';

/**
 * Vérifie si l'application est en mode production
 */
export const isProd = env.NODE_ENV === 'production';





