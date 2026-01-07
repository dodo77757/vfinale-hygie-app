import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, duration: number, sessionsPerWeek: number) => Promise<void>;
  isProcessing: boolean;
}

export const CreateProgramModal: React.FC<CreateProgramModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing
}) => {
  const [programName, setProgramName] = useState('');
  const [programDuration, setProgramDuration] = useState(4);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);

  const handleSubmit = async () => {
    if (!programName.trim()) {
      return;
    }
    await onSubmit(programName, programDuration, sessionsPerWeek);
    setProgramName('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="NOUVEAU PROGRAMME"
      size="lg"
      closeOnEscape={!isProcessing}
      closeOnBackdrop={!isProcessing}
    >
      <div className="space-y-6">
        <Input
          value={programName}
          onChange={e => setProgramName(e.target.value)}
          placeholder="Nom du programme"
          disabled={isProcessing}
          required
          error={!programName.trim() ? 'Le nom du programme est requis' : undefined}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="number"
              min={1}
              max={12}
              value={programDuration}
              onChange={e => setProgramDuration(parseInt(e.target.value) || 4)}
              label="Durée (semaines)"
              disabled={isProcessing}
            />
          </div>
          <div>
            <Input
              type="number"
              min={1}
              max={7}
              value={sessionsPerWeek}
              onChange={e => setSessionsPerWeek(parseInt(e.target.value) || 3)}
              label="Séances/semaine"
              disabled={isProcessing}
            />
          </div>
        </div>
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
            disabled={isProcessing || !programName.trim()}
            variant="primary"
            fullWidth
            size="lg"
          >
            CRÉER
          </Button>
        </div>
      </div>
    </Modal>
  );
};

