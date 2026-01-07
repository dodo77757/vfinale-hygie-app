/**
 * Service de gestion d'erreurs avec retry logic
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    // Retry sur erreurs réseau ou timeout
    return (
      error?.code === 'NETWORK_ERROR' ||
      error?.code === 'TIMEOUT' ||
      error?.status >= 500 ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout')
    );
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exécute une fonction avec retry automatique
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Ne pas retry si c'est la dernière tentative ou si la condition de retry n'est pas remplie
      if (attempt === opts.maxRetries || !opts.retryCondition(error)) {
        throw error;
      }

      // Attendre avant de réessayer (exponential backoff)
      const delay = opts.retryDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Wrapper pour les appels API avec retry
 */
export async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return withRetry(apiCall, options);
}

/**
 * Gère les erreurs de manière centralisée
 */
export function handleError(error: any, context?: string): void {
  const errorMessage = error?.message || 'Une erreur inattendue est survenue';
  const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;

  console.error(fullMessage, error);

  // Ici on pourrait envoyer à un service de logging
  // logError(fullMessage, error, context);
}





