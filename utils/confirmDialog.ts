/**
 * Utilitaire pour créer une modale de confirmation personnalisée
 * Remplace window.confirm() pour une meilleure UX
 */

export function confirmAction(
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  if (window.confirm(message)) {
    onConfirm();
  } else {
    onCancel?.();
  }
}

/**
 * Version Promise pour les confirmations asynchrones
 */
export function confirmActionAsync(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmed = window.confirm(message);
    resolve(confirmed);
  });
}





