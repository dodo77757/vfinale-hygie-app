import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

interface SharedNotesProps {
  client: UserProfile;
  onUpdate: (updatedClient: UserProfile) => void;
  onClose?: () => void;
}

interface NoteEntry {
  id: string;
  content: string;
  author: 'moderator' | 'client';
  timestamp: string;
  edited?: boolean;
}

const STORAGE_KEY_PREFIX = 'hygie_shared_notes_';

export const SharedNotes: React.FC<SharedNotesProps> = ({
  client,
  onUpdate,
  onClose
}) => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    loadNotes();
  }, [client.id]);

  const loadNotes = () => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${client.id}`);
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
    }
  };

  const saveNotes = (updatedNotes: NoteEntry[]) => {
    setNotes(updatedNotes);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${client.id}`, JSON.stringify(updatedNotes));
  };

  const addNote = () => {
    if (!newNote.trim()) return;

    const note: NoteEntry = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: newNote.trim(),
      author: 'moderator',
      timestamp: new Date().toISOString()
    };

    const updated = [note, ...notes];
    saveNotes(updated);
    setNewNote('');
    notificationService.success('Note ajoutée');
  };

  const deleteNote = (noteId: string) => {
    if (!window.confirm('Supprimer cette note ?')) return;
    const updated = notes.filter(n => n.id !== noteId);
    saveNotes(updated);
    notificationService.success('Note supprimée');
  };

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bebas text-xl text-[#181818]">Notes Partagées</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        )}
      </div>

      <p className="text-xs text-[#6B7280]">
        Ces notes sont visibles par le client et le modérateur
      </p>

      {/* Formulaire d'ajout */}
      <div className="space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Ajouter une note partagée..."
          rows={3}
          className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] placeholder:text-[#6B7280] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 resize-none"
        />
        <button
          onClick={addNote}
          disabled={!newNote.trim()}
          className="px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ajouter
        </button>
      </div>

      {/* Liste des notes */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280] text-sm">
            Aucune note partagée
          </div>
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              className="p-3 bg-[#f3efe5] rounded-md border border-[#007c89]/20"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#007c89] uppercase">
                    {note.author === 'moderator' ? 'Modérateur' : 'Client'}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    {new Date(note.timestamp).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {note.author === 'moderator' && (
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-[#EF4444] hover:text-[#DC2626] text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-sm text-[#181818] whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

