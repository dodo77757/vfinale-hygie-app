import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';

interface CalendarSearchProps {
  clients: UserProfile[];
  onResultClick: (session: any, client: UserProfile) => void;
  onClose?: () => void;
}

export const CalendarSearch: React.FC<CalendarSearchProps> = ({
  clients,
  onResultClick,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('hygie_calendar_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Rechercher dans toutes les sessions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: Array<{
      client: UserProfile;
      session: any;
      type: 'completed' | 'planned';
      matchType: 'client' | 'notes' | 'date';
    }> = [];

    clients.forEach(client => {
      // Recherche par nom de client
      if (client.nom.toLowerCase().includes(query)) {
        if (client.plannedSessions) {
          client.plannedSessions.forEach(session => {
            results.push({ client, session, type: 'planned', matchType: 'client' });
          });
        }
        if (client.sessionRecords) {
          client.sessionRecords.forEach(session => {
            results.push({ client, session, type: 'completed', matchType: 'client' });
          });
        }
      }

      // Recherche par notes
      if (client.plannedSessions) {
        client.plannedSessions.forEach(session => {
          if (session.notes && session.notes.toLowerCase().includes(query)) {
            results.push({ client, session, type: 'planned', matchType: 'notes' });
          }
        });
      }

      // Recherche par date
      const searchDate = parseDate(query);
      if (searchDate) {
        if (client.plannedSessions) {
          client.plannedSessions.forEach(session => {
            const sessionDate = new Date(session.date);
            if (
              sessionDate.getFullYear() === searchDate.getFullYear() &&
              sessionDate.getMonth() === searchDate.getMonth() &&
              sessionDate.getDate() === searchDate.getDate()
            ) {
              results.push({ client, session, type: 'planned', matchType: 'date' });
            }
          });
        }
        if (client.sessionRecords) {
          client.sessionRecords.forEach(session => {
            const sessionDate = new Date(session.date);
            if (
              sessionDate.getFullYear() === searchDate.getFullYear() &&
              sessionDate.getMonth() === searchDate.getMonth() &&
              sessionDate.getDate() === searchDate.getDate()
            ) {
              results.push({ client, session, type: 'completed', matchType: 'date' });
            }
          });
        }
      }
    });

    // Dédupliquer et trier
    const uniqueResults = results.filter((result, index, self) =>
      index === self.findIndex(r =>
        r.client.id === result.client.id &&
        r.session.id === result.session.id &&
        r.type === result.type
      )
    );

    return uniqueResults.sort((a, b) => {
      const dateA = new Date(a.session.date).getTime();
      const dateB = new Date(b.session.date).getTime();
      return dateB - dateA;
    });
  }, [searchQuery, clients]);

  const parseDate = (query: string): Date | null => {
    // Formats supportés: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const patterns = [
      /(\d{2})\/(\d{2})\/(\d{4})/,
      /(\d{2})-(\d{2})-(\d{4})/,
      /(\d{2})\.(\d{2})\.(\d{4})/
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        return new Date(year, month, day);
      }
    }

    return null;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !recentSearches.includes(query.trim())) {
      const newRecent = [query.trim(), ...recentSearches.slice(0, 9)];
      setRecentSearches(newRecent);
      localStorage.setItem('hygie_calendar_recent_searches', JSON.stringify(newRecent));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      onResultClick(searchResults[0].session, searchResults[0].client);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bebas text-xl text-[#181818]">Recherche Rapide</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Rechercher par client, date (DD/MM/YYYY), notes..."
          className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-3 pl-11 text-sm text-[#181818] placeholder:text-[#6B7280] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
        />
        <span className="absolute left-4 top-3.5 text-[#007c89] text-lg">🔍</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-3.5 text-[#6B7280] hover:text-[#181818]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Résultats */}
      {searchQuery.trim() && (
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280] text-sm">
              Aucun résultat trouvé
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((result, idx) => {
                const sessionDate = new Date(result.session.date);
                return (
                  <div
                    key={idx}
                    onClick={() => onResultClick(result.session, result.client)}
                    className="p-3 bg-[#f3efe5] rounded-md border border-[#007c89]/20 hover:bg-[#e0f4f6] cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#181818]">{result.client.nom}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          result.type === 'completed'
                            ? 'bg-[#007c89] text-white'
                            : 'bg-[#f3efe5] text-[#181818] border border-[#007c89]/30'
                        }`}
                      >
                        {result.type === 'completed' ? 'Complétée' : 'Planifiée'}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      {sessionDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    {result.session.notes && (
                      <div className="text-xs text-[#6B7280] mt-1 truncate">
                        {result.session.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recherches récentes */}
      {!searchQuery.trim() && recentSearches.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-[#181818] mb-2">
            Recherches récentes
          </label>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(search)}
                className="px-3 py-1 bg-[#f3efe5] text-[#181818] rounded-md text-xs font-semibold hover:bg-[#007c89] hover:text-white transition-all border border-[#007c89]/30"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Raccourcis */}
      <div className="pt-4 border-t border-[#007c89]/20">
        <p className="text-xs text-[#6B7280] mb-2">Raccourcis clavier:</p>
        <div className="text-xs text-[#6B7280] space-y-1">
          <div>• <kbd className="px-1 py-0.5 bg-[#f3efe5] rounded">Ctrl+K</kbd> - Ouvrir la recherche</div>
          <div>• <kbd className="px-1 py-0.5 bg-[#f3efe5] rounded">Entrée</kbd> - Ouvrir le premier résultat</div>
          <div>• <kbd className="px-1 py-0.5 bg-[#f3efe5] rounded">Échap</kbd> - Fermer</div>
        </div>
      </div>
    </div>
  );
};

