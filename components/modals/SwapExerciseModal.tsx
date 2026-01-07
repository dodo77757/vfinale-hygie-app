import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SwapExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export const SwapExerciseModal: React.FC<SwapExerciseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="REMPLACER EXERCICE ?"
      size="sm"
      closeOnEscape={!isProcessing}
      closeOnBackdrop={!isProcessing}
    >
      <div className="text-center space-y-6">
        <p className="text-gray-400 text-xs font-mono">
          L'IA va chercher une alternative compatible avec vos blessures.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={onClose}
            disabled={isProcessing}
            variant="secondary"
            fullWidth
          >
            ANNULER
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing}
            variant="primary"
            fullWidth
            size="lg"
          >
            CONFIRMER
          </Button>
        </div>
      </div>
    </Modal>
  );
};

