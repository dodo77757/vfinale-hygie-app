import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';

interface AdvancedSearchProps {
  clients: UserProfile[];
  onSearch: (filteredClients: UserProfile[]) => void;
  onClose?: () => void;
}

interface SearchCriteria {
  name?: string;
  objective?: string;
  injury?: string;
  tag?: string;
  minAge?: number;
  maxAge?: number;
  minSessions?: number;
  maxSessions?: number;
  minProgress?: number;
  maxProgress?: number;
  hasProgram?: boolean;
  dateFrom?: string;
  dateTo?: string;
  operator: 'AND' | 'OR';
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  clients,
  onSearch,
  onClose
}) => {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    operator: 'AND'
  });
  const [savedSearches, setSavedSearches] = useState<Array<{ name: string; criteria: SearchCriteria }>>(() => {
    const saved = localStorage.getItem('hygie_saved_searches');
    return saved ? JSON.parse(saved) : [];
  });

  const uniqueObjectives = useMemo(() => {
    const objectives = new Set<string>();
    clients.forEach(c => {
      if (c.objectifPrincipal) objectives.add(c.objectifPrincipal);
    });
    return Array.from(objectives).sort();
  }, [clients]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    clients.forEach(c => {
      if (c.tags) c.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [clients]);

  const uniqueInjuries = useMemo(() => {
    const injuries = new Set<string>();
    clients.forEach(c => {
      if (c.blessures_actives) c.blessures_actives.forEach(injury => injuries.add(injury));
    });
    return Array.from(injuries).sort();
  }, [clients]);

  const applySearch = () => {
    const filtered = clients.filter(client => {
      const matches: boolean[] = [];

      // Nom
      if (criteria.name) {
        const nameMatch = client.nom.toLowerCase().includes(criteria.name.toLowerCase());
        matches.push(nameMatch);
      }

      // Objectif
      if (criteria.objective) {
        const objectiveMatch = client.objectifPrincipal === criteria.objective;
        matches.push(objectiveMatch);
      }

      // Blessure
      if (criteria.injury) {
        const injuryMatch = client.blessures_actives?.includes(criteria.injury) || false;
        matches.push(injuryMatch);
      }

      // Tag
      if (criteria.tag) {
        const tagMatch = client.tags?.includes(criteria.tag) || false;
        matches.push(tagMatch);
      }

      // Âge
      if (criteria.minAge !== undefined) {
        matches.push(client.age >= criteria.minAge);
      }
      if (criteria.maxAge !== undefined) {
        matches.push(client.age <= criteria.maxAge);
      }

      // Sessions
      const sessionCount = client.sessionRecords?.length || 0;
      if (criteria.minSessions !== undefined) {
        matches.push(sessionCount >= criteria.minSessions);
      }
      if (criteria.maxSessions !== undefined) {
        matches.push(sessionCount <= criteria.maxSessions);
      }

      // Progression
      const progress = client.activeGoal?.currentValue || 0;
      if (criteria.minProgress !== undefined) {
        matches.push(progress >= criteria.minProgress);
      }
      if (criteria.maxProgress !== undefined) {
        matches.push(progress <= criteria.maxProgress);
      }

      // Programme actif
      if (criteria.hasProgram !== undefined) {
        matches.push(!!client.activeProgram === criteria.hasProgram);
      }

      // Date dernière session
      if (criteria.dateFrom || criteria.dateTo) {
        const lastSession = client.sessionRecords && client.sessionRecords.length > 0
          ? new Date(client.sessionRecords[client.sessionRecords.length - 1].date)
          : null;
        
        if (criteria.dateFrom && lastSession) {
          matches.push(lastSession >= new Date(criteria.dateFrom));
        }
        if (criteria.dateTo && lastSession) {
          matches.push(lastSession <= new Date(criteria.dateTo));
        }
        if ((criteria.dateFrom || criteria.dateTo) && !lastSession) {
          matches.push(false);
        }
      }

      // Appliquer l'opérateur
      if (matches.length === 0) return true; // Aucun critère = tous les clients
      
      if (criteria.operator === 'AND') {
        return matches.every(m => m);
      } else {
        return matches.some(m => m);
      }
    });

    onSearch(filtered);
  };

  const resetSearch = () => {
    setCriteria({ operator: 'AND' });
    onSearch(clients);
  };

  const saveSearch = () => {
    const searchName = prompt('Nom de la recherche sauvegardée:');
    if (!searchName) return;

    const newSavedSearches = [...savedSearches, { name: searchName, criteria }];
    setSavedSearches(newSavedSearches);
    localStorage.setItem('hygie_saved_searches', JSON.stringify(newSavedSearches));
  };

  const loadSearch = (savedCriteria: SearchCriteria) => {
    setCriteria(savedCriteria);
  };

  const deleteSavedSearch = (index: number) => {
    const newSavedSearches = savedSearches.filter((_, i) => i !== index);
    setSavedSearches(newSavedSearches);
    localStorage.setItem('hygie_saved_searches', JSON.stringify(newSavedSearches));
  };

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bebas text-xl text-[#181818]">Recherche avancée</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Opérateur logique */}
      <div>
        <label className="block text-sm font-semibold text-[#181818] mb-2">
          Opérateur logique
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={criteria.operator === 'AND'}
              onChange={() => setCriteria({ ...criteria, operator: 'AND' })}
              className="text-[#007c89]"
            />
            <span className="text-sm text-[#181818]">ET (tous les critères)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={criteria.operator === 'OR'}
              onChange={() => setCriteria({ ...criteria, operator: 'OR' })}
              className="text-[#007c89]"
            />
            <span className="text-sm text-[#181818]">OU (au moins un critère)</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Nom
          </label>
          <input
            type="text"
            value={criteria.name || ''}
            onChange={(e) => setCriteria({ ...criteria, name: e.target.value || undefined })}
            placeholder="Rechercher par nom..."
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
        </div>

        {/* Objectif */}
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Objectif
          </label>
          <select
            value={criteria.objective || ''}
            onChange={(e) => setCriteria({ ...criteria, objective: e.target.value || undefined })}
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          >
            <option value="">Tous les objectifs</option>
            {uniqueObjectives.map(obj => (
              <option key={obj} value={obj}>{obj}</option>
            ))}
          </select>
        </div>

        {/* Blessure */}
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Blessure active
          </label>
          <select
            value={criteria.injury || ''}
            onChange={(e) => setCriteria({ ...criteria, injury: e.target.value || undefined })}
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          >
            <option value="">Toutes les blessures</option>
            {uniqueInjuries.map(injury => (
              <option key={injury} value={injury}>{injury}</option>
            ))}
          </select>
        </div>

        {/* Tag */}
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Tag
          </label>
          <select
            value={criteria.tag || ''}
            onChange={(e) => setCriteria({ ...criteria, tag: e.target.value || undefined })}
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          >
            <option value="">Tous les tags</option>
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Âge min/max */}
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Âge (min)
          </label>
          <input
            type="number"
            value={criteria.minAge || ''}
            onChange={(e) => setCriteria({ ...criteria, minAge: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Âge minimum"
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Âge (max)
          </label>
          <input
            type="number"
            value={criteria.maxAge || ''}
            onChange={(e) => setCriteria({ ...criteria, maxAge: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Âge maximum"
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
        </div>

        {/* Sessions min/max */}
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Sessions (min)
          </label>
          <input
            type="number"
            value={criteria.minSessions || ''}
            onChange={(e) => setCriteria({ ...criteria, minSessions: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Nombre minimum"
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Sessions (max)
          </label>
          <input
            type="number"
            value={criteria.maxSessions || ''}
            onChange={(e) => setCriteria({ ...criteria, maxSessions: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Nombre maximum"
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
        </div>

        {/* Progression min/max */}
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Progression % (min)
          </label>
          <input
            type="number"
            value={criteria.minProgress || ''}
            onChange={(e) => setCriteria({ ...criteria, minProgress: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="0"
            min="0"
            max="100"
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Progression % (max)
          </label>
          <input
            type="number"
            value={criteria.maxProgress || ''}
            onChange={(e) => setCriteria({ ...criteria, maxProgress: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="100"
            min="0"
            max="100"
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
        </div>

        {/* Programme actif */}
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Programme actif
          </label>
          <select
            value={criteria.hasProgram === undefined ? '' : criteria.hasProgram ? 'yes' : 'no'}
            onChange={(e) => setCriteria({ ...criteria, hasProgram: e.target.value === '' ? undefined : e.target.value === 'yes' })}
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          >
            <option value="">Tous</option>
            <option value="yes">Avec programme</option>
            <option value="no">Sans programme</option>
          </select>
        </div>

        {/* Date dernière session */}
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Date dernière session (depuis)
          </label>
          <input
            type="date"
            value={criteria.dateFrom || ''}
            onChange={(e) => setCriteria({ ...criteria, dateFrom: e.target.value || undefined })}
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-2">
            Date dernière session (jusqu'à)
          </label>
          <input
            type="date"
            value={criteria.dateTo || ''}
            onChange={(e) => setCriteria({ ...criteria, dateTo: e.target.value || undefined })}
            className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#007c89]/20">
        <button
          onClick={applySearch}
          className="px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all"
        >
          Rechercher
        </button>
        <button
          onClick={resetSearch}
          className="px-4 py-2 bg-white text-[#181818] border border-[#007c89]/30 rounded-md text-sm font-semibold hover:bg-[#f3efe5] transition-all"
        >
          Réinitialiser
        </button>
        <button
          onClick={saveSearch}
          className="px-4 py-2 bg-white text-[#007c89] border border-[#007c89]/30 rounded-md text-sm font-semibold hover:bg-[#007c89] hover:text-white transition-all"
        >
          Sauvegarder
        </button>
      </div>

      {/* Recherches sauvegardées */}
      {savedSearches.length > 0 && (
        <div className="pt-4 border-t border-[#007c89]/20">
          <h4 className="text-sm font-semibold text-[#181818] mb-3">Recherches sauvegardées</h4>
          <div className="space-y-2">
            {savedSearches.map((saved, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-[#f3efe5] rounded-md">
                <button
                  onClick={() => loadSearch(saved.criteria)}
                  className="text-sm text-[#007c89] hover:text-[#006a75] font-medium"
                >
                  {saved.name}
                </button>
                <button
                  onClick={() => deleteSavedSearch(index)}
                  className="text-[#EF4444] hover:text-[#DC2626] text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

