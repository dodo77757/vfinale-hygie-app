import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, file: File | null, text: string) => Promise<void>;
  isProcessing: boolean;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing
}) => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientFile, setNewClientFile] = useState<File | null>(null);
  const [newClientText, setNewClientText] = useState('');

  const handleSubmit = async () => {
    if (!newClientName.trim() && !newClientFile) {
      return;
    }
    await onSubmit(newClientName, newClientFile, newClientText);
    setNewClientName('');
    setNewClientFile(null);
    setNewClientText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="NOUVEAU SUJET"
      size="lg"
      closeOnEscape={!isProcessing}
      closeOnBackdrop={!isProcessing}
    >
      <div className="space-y-6">
        <Input
          value={newClientName}
          onChange={e => setNewClientName(e.target.value)}
          placeholder="Nom du sujet"
          disabled={isProcessing}
          helperText="Laissez vide si vous importez un fichier"
        />
        <Textarea
          value={newClientText}
          onChange={e => setNewClientText(e.target.value)}
          placeholder="Données médicales brutes..."
          disabled={isProcessing}
          rows={4}
        />
        <div>
          <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">
            Ou importer un fichier
          </label>
          <input
            type="file"
            onChange={e => setNewClientFile(e.target.files?.[0] || null)}
            className="text-xs text-gray-400 block w-full bg-black/40 border border-gray-800 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bebas file:bg-[var(--primary-gold)] file:text-black hover:file:bg-amber-500"
            disabled={isProcessing}
            accept="image/*,application/pdf,.pdf"
          />
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
            disabled={isProcessing || (!newClientName.trim() && !newClientFile)}
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

