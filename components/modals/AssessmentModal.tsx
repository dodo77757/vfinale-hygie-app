import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

interface AssessmentModalProps {
  client: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (text: string, file: File | null) => Promise<void>;
  isProcessing: boolean;
  processingProgress: number;
  processingStage: string;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  client,
  isOpen,
  onClose,
  onAnalyze,
  isProcessing,
  processingProgress,
  processingStage
}) => {
  const [assessmentText, setAssessmentText] = useState('');
  const [assessmentFile, setAssessmentFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!assessmentText.trim() && !assessmentFile) return;
    await onAnalyze(assessmentText, assessmentFile);
    setAssessmentText('');
    setAssessmentFile(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MISE À JOUR BIO-MÉTRIQUE"
      size="lg"
      closeOnEscape={!isProcessing}
      closeOnBackdrop={!isProcessing}
    >
      <div className="space-y-6">
        <p className="text-xs text-gray-400 font-mono">Client: {client.nom}</p>
        <Textarea
          value={assessmentText}
          onChange={e => setAssessmentText(e.target.value)}
          placeholder="Nouvelles données médicales..."
          disabled={isProcessing}
          rows={6}
        />
        <div>
          <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">
            Ou importer un fichier
          </label>
          <input
            type="file"
            onChange={e => setAssessmentFile(e.target.files?.[0] || null)}
            className="text-xs text-gray-400 block w-full bg-black/40 border border-gray-800 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bebas file:bg-[var(--primary-gold)] file:text-black hover:file:bg-amber-500"
            disabled={isProcessing}
            accept="image/*,application/pdf,.pdf"
          />
        </div>
        {isProcessing && (
          <div className="space-y-2">
            <div className="w-full bg-gray-900 rounded-full h-2">
              <div
                className="bg-[var(--primary-teal)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
                role="progressbar"
                aria-valuenow={processingProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">{processingStage}</p>
          </div>
        )}
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
            onClick={handleSubmit}
            disabled={isProcessing || (!assessmentText.trim() && !assessmentFile)}
            variant="primary"
            fullWidth
            size="lg"
          >
            ANALYSER
          </Button>
        </div>
      </div>
    </Modal>
  );
};

