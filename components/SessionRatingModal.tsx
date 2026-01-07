import React, { useState } from 'react';
import { SessionRating } from '../types';

interface SessionRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rating: SessionRating) => void;
}

export const SessionRatingModal: React.FC<SessionRatingModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [difficulty, setDifficulty] = useState(3);
  const [satisfaction, setSatisfaction] = useState(3);
  const [pain, setPain] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const rating: SessionRating = {
      date: new Date().toISOString(),
      difficulty,
      satisfaction,
      pain,
      comment: comment.trim() || undefined
    };
    onSave(rating);
    // Reset
    setDifficulty(3);
    setSatisfaction(3);
    setPain(0);
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bebas text-gray-800 uppercase mb-6">Évaluer la Séance</h2>

          <div className="space-y-6">
            {/* Difficulté */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulté: {difficulty}/5
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setDifficulty(value)}
                    className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                      difficulty === value
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Satisfaction */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Satisfaction: {satisfaction}/5
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSatisfaction(value)}
                    className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                      satisfaction === value
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Douleur */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Douleur ressentie: {pain}/10
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={pain}
                onChange={(e) => setPain(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comment s'est passée votre séance ?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all"
          >
            Passer
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-teal-500 text-white rounded-full font-semibold hover:bg-teal-600 transition-all shadow-md hover:shadow-lg"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};


