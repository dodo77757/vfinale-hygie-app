import React, { useState, useMemo } from 'react';
import { UserProfile } from '../../../../types';

interface CoachClientsViewProps {
  clients: UserProfile[];
  onClientClick: (client: UserProfile, mode: 'DASHBOARD' | 'DAILY_CHECK') => void;
  onClientEdit: (client: UserProfile) => void;
  onClientAssessment: (client: UserProfile) => void;
  onClientQuickView: (client: UserProfile) => void;
  onClientDuplicate: (client: UserProfile) => void;
  selectedClients: Set<string>;
  onToggleSelect: (clientId: string) => void;
  onBatchExport: () => void;
  onBatchDelete: () => void;
  onCreateClientClick?: () => void;
  onFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type ViewMode = 'list' | 'grid';
type SortBy = 'name' | 'lastSession' | 'progress' | 'created';
type FilterStatus = 'all' | 'active' | 'inactive';

export const CoachClientsView: React.FC<CoachClientsViewProps> = ({
  clients,
  onClientClick,
  onClientEdit,
  onClientAssessment,
  onClientQuickView,
  onClientDuplicate,
  selectedClients,
  onToggleSelect,
  onBatchExport,
  onBatchDelete,
  onCreateClientClick,
  onFileSelect
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterObjective, setFilterObjective] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  // Liste des objectifs et tags uniques
  const uniqueObjectives = useMemo(() => {
    const objectives = new Set<string>();
    clients.forEach(client => {
      if (client.objectifPrincipal) {
        objectives.add(client.objectifPrincipal);
      }
    });
    return Array.from(objectives).sort();
  }, [clients]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    clients.forEach(client => {
      if (client.tags) {
        client.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [clients]);

  // Filtrage et tri
  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client => 
        client.nom.toLowerCase().includes(query) ||
        (client.objectifPrincipal && client.objectifPrincipal.toLowerCase().includes(query))
      );
    }

    // Filtre par objectif
    if (filterObjective !== 'all') {
      filtered = filtered.filter(client => 
        client.objectifPrincipal === filterObjective
      );
    }

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => {
        const hasRecentSession = client.sessionRecords && client.sessionRecords.length > 0;
        const lastSessionDate = hasRecentSession 
          ? new Date(client.sessionRecords[client.sessionRecords.length - 1].date)
          : null;
        const daysSinceLastSession = lastSessionDate 
          ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        
        if (filterStatus === 'active') {
          return daysSinceLastSession <= 30 && (client.activeProgram || hasRecentSession);
        } else {
          return daysSinceLastSession > 30 || (!client.activeProgram && !hasRecentSession);
        }
      });
    }

    // Filtre par tag
    if (filterTag !== 'all') {
      filtered = filtered.filter(client => 
        client.tags && client.tags.includes(filterTag)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nom.localeCompare(b.nom);
        case 'lastSession':
          const aLastSession = a.sessionRecords && a.sessionRecords.length > 0
            ? new Date(a.sessionRecords[a.sessionRecords.length - 1].date).getTime()
            : 0;
          const bLastSession = b.sessionRecords && b.sessionRecords.length > 0
            ? new Date(b.sessionRecords[b.sessionRecords.length - 1].date).getTime()
            : 0;
          return bLastSession - aLastSession;
        case 'progress':
          const aProgress = a.activeGoal?.currentValue || 0;
          const bProgress = b.activeGoal?.currentValue || 0;
          return bProgress - aProgress;
        case 'created':
          return a.id.localeCompare(b.id);
        default:
          return 0;
      }
    });

    return filtered;
  }, [clients, searchQuery, filterObjective, filterStatus, filterTag, sortBy]);

  // Helper pour calculer les infos d'un client
  const getClientInfo = (client: UserProfile) => {
    const sessionCount = client.sessionRecords?.length || 0;
    const lastSession = client.sessionRecords && client.sessionRecords.length > 0
      ? client.sessionRecords[client.sessionRecords.length - 1]
      : null;
    const lastSessionDate = lastSession ? new Date(lastSession.date) : null;
    const daysSinceLastSession = lastSessionDate 
      ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const programProgress = client.activeProgram
      ? ((client.activeProgram.currentWeek - 1) * client.activeProgram.sessionsPerWeek + client.activeProgram.currentSession) / (client.activeProgram.duration * client.activeProgram.sessionsPerWeek) * 100
      : null;
    const hasInjuries = client.blessures_actives && client.blessures_actives.length > 0;
    const hasPainReport = client.lastPainReport && client.lastPainReport.intensity >= 5;
    const isInactive = daysSinceLastSession !== null && daysSinceLastSession > 30;

    return {
      sessionCount,
      lastSessionDate,
      daysSinceLastSession,
      programProgress,
      hasInjuries,
      hasPainReport,
      isInactive,
      programName: client.activeProgram?.name
    };
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Header avec toggle et recherche */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1F2937] mb-3 tracking-tight">Clients</h1>
          <p className="text-base text-[#6B7280] font-normal">
            {filteredAndSortedClients.length} client{filteredAndSortedClients.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Toggle Liste/Grille */}
        <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-[#E5E7EB]/50 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
          <button
            onClick={() => setViewMode('list')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white shadow-md'
                : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9FAFB]'
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white shadow-md'
                : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9FAFB]'
            }`}
          >
            Grille
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8 space-y-4">
        {/* Recherche */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un client..."
              className="w-full bg-[#F9FAFB] border-2 border-[#E5E7EB] rounded-2xl px-4 py-3.5 pl-12 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 transition-all duration-200"
            />
            <span className="absolute left-4 top-3.5 text-[#9CA3AF] text-lg">🔍</span>
          </div>
          {(searchQuery || filterObjective !== 'all' || filterStatus !== 'all' || filterTag !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterObjective('all');
                setFilterStatus('all');
                setFilterTag('all');
              }}
              className="px-5 py-3.5 bg-[#F9FAFB] text-[#6B7280] border-2 border-[#E5E7EB] rounded-2xl text-sm font-semibold hover:bg-white hover:border-[#F97316] hover:text-[#F97316] transition-all duration-200"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterObjective}
            onChange={(e) => setFilterObjective(e.target.value)}
            className="bg-white border-2 border-[#E5E7EB] rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 transition-all duration-200"
          >
            <option value="all">Tous les objectifs</option>
            {uniqueObjectives.map(obj => (
              <option key={obj} value={obj}>{obj}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="bg-white border-2 border-[#E5E7EB] rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 transition-all duration-200"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>

          {uniqueTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-white border-2 border-[#E5E7EB] rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 transition-all duration-200"
            >
              <option value="all">Tous les tags</option>
              {uniqueTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-white border-2 border-[#E5E7EB] rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 transition-all duration-200"
          >
            <option value="name">Trier par nom</option>
            <option value="lastSession">Dernière session</option>
            <option value="progress">Progression</option>
            <option value="created">Date de création</option>
          </select>
        </div>

        {/* Actions en lot */}
        {selectedClients.size > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t border-[#E5E7EB]">
            <span className="px-4 py-2 bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white text-sm font-semibold rounded-full shadow-sm">
              {selectedClients.size} sélectionné{selectedClients.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={onBatchExport}
              className="px-4 py-2 bg-white text-[#F97316] border-2 border-[#F97316] rounded-full text-sm font-semibold hover:bg-gradient-to-r hover:from-[#F97316] hover:to-[#EC4899] hover:text-white hover:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Exporter
            </button>
            <button
              onClick={onBatchDelete}
              className="px-4 py-2 bg-[#EF4444] text-white rounded-full text-sm font-semibold hover:bg-[#DC2626] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Supprimer
            </button>
            <button
              onClick={() => {
                // Clear selection - à implémenter dans le parent
                selectedClients.forEach(id => onToggleSelect(id));
              }}
              className="px-3 py-1.5 bg-white text-[#6B7280] border border-[#E5E7EB] rounded-lg text-xs font-semibold hover:bg-[#F3F4F6] transition-all"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Carte Import Rapide */}
      {onFileSelect && (
        <div className="mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-br from-[#FEF3C7] via-[#FBCFE8] to-[#FDE68A] rounded-3xl border-2 border-dashed border-[#F97316]/50 hover:border-solid hover:shadow-lg transition-all duration-200 cursor-pointer p-8 md:p-10 text-center group"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf,.pdf"
              onChange={onFileSelect}
            />
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">⇪</div>
            <h3 className="text-2xl font-bold text-[#1F2937] mb-2">Import Rapide</h3>
            <p className="text-sm text-[#6B7280] font-normal mb-4">Glisser un bilan PDF ou image, ou cliquer pour sélectionner</p>
            {onCreateClientClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateClientClick();
                }}
                className="text-xs font-semibold text-[#6B7280] hover:text-[#007c89] transition-colors underline"
              >
                Ou création manuelle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Affichage Liste ou Grille */}
      {filteredAndSortedClients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] p-12 md:p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-xl font-bold text-[#1F2937] mb-2">Aucun client trouvé</p>
          <p className="text-sm text-[#6B7280] font-normal">Modifiez vos filtres de recherche</p>
        </div>
      ) : viewMode === 'list' ? (
        /* Mode Liste - Tableau */
        <div className="bg-white rounded-3xl border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedClients.size === filteredAndSortedClients.length && filteredAndSortedClients.length > 0}
                    onChange={(e) => {
                      filteredAndSortedClients.forEach(client => {
                        if (e.target.checked && !selectedClients.has(client.id)) {
                          onToggleSelect(client.id);
                        } else if (!e.target.checked && selectedClients.has(client.id)) {
                          onToggleSelect(client.id);
                        }
                      });
                    }}
                    className="w-4 h-4 cursor-pointer accent-[#007c89]"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Nom</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Programme</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Dernière séance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredAndSortedClients.map((client) => {
                const info = getClientInfo(client);
                return (
                  <tr
                    key={client.id}
                    onClick={() => onClientClick(client, 'DASHBOARD')}
                    className={`hover:bg-[#F9FAFB] cursor-pointer transition-colors ${
                      selectedClients.has(client.id) ? 'bg-[#E0F4F6]' : ''
                    }`}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedClients.has(client.id)}
                        onChange={() => onToggleSelect(client.id)}
                        className="w-4 h-4 cursor-pointer accent-[#007c89]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={client.avatar} alt={client.nom} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-semibold text-[#1F2937]">{client.nom}</p>
                          <p className="text-xs text-[#6B7280]">{client.objectifPrincipal || 'Aucun objectif'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {client.programStatus === 'generating' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-semibold text-[#92400E]">En création...</span>
                        </div>
                      ) : info.programName ? (
                        <span className="text-sm text-[#1F2937] font-medium">{info.programName}</span>
                      ) : (
                        <span className="text-sm text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {info.lastSessionDate ? (
                        <span className={`text-sm font-medium ${
                          info.isInactive ? 'text-[#EF4444]' : 'text-[#1F2937]'
                        }`}>
                          {info.daysSinceLastSession === 0 ? "Aujourd'hui" : 
                           info.daysSinceLastSession === 1 ? "Hier" : 
                           `${info.daysSinceLastSession}j`}
                        </span>
                      ) : (
                        <span className="text-sm text-[#9CA3AF]">Jamais</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {info.hasInjuries && <span className="text-xs">⚠️</span>}
                        {info.hasPainReport && <span className="text-xs">🔴</span>}
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          info.isInactive 
                            ? 'bg-[#FEE2E2] text-[#DC2626]' 
                            : 'bg-[#D1FAE5] text-[#059669]'
                        }`}>
                          {info.isInactive ? 'Inactif' : 'Actif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onClientQuickView(client)}
                          className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-all"
                          title="Vue rapide"
                        >
                          👁
                        </button>
                        <button
                          onClick={() => onClientEdit(client)}
                          className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-all"
                          title="Éditer"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onClientAssessment(client)}
                          className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-all"
                          title="Bilan"
                        >
                          ✚
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Mode Grille - Cards simplifiées */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedClients.map((client) => {
            const info = getClientInfo(client);
            return (
              <div
                key={client.id}
                onClick={() => onClientClick(client, 'DASHBOARD')}
                    className={`group relative p-6 md:p-8 rounded-3xl border border-[#E5E7EB]/50 cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:scale-[1.02] ${
                  selectedClients.has(client.id)
                    ? 'bg-gradient-to-br from-[#FEF3C7] to-white border-[#F97316]'
                    : 'bg-white hover:border-[#F97316]/50'
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedClients.has(client.id)}
                  onChange={() => onToggleSelect(client.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-4 left-4 w-5 h-5 cursor-pointer accent-[#007c89] opacity-0 group-hover:opacity-100 transition-opacity"
                />

                {/* Avatar et Nom */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img src={client.avatar} alt={client.nom} className="w-14 h-14 rounded-xl border-2 border-[#E5E7EB] object-cover" />
                    {info.hasInjuries && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bebas text-xl text-[#1F2937] group-hover:text-[#007c89] transition-colors truncate">
                      {client.nom}
                    </h3>
                    <p className="text-xs text-[#6B7280] truncate">{client.objectifPrincipal || 'Aucun objectif'}</p>
                  </div>
                </div>

                {/* Infos essentielles */}
                <div className="space-y-3">
                  {client.programStatus === 'generating' ? (
                    <div className="flex items-center gap-2 p-2 bg-[#FEF3C7] border border-[#FBBF24] rounded-lg">
                      <div className="w-3 h-3 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-[#92400E]">Programme en création...</span>
                    </div>
                  ) : info.programName ? (
                    <div>
                      <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Programme</p>
                      <p className="text-sm font-medium text-[#1F2937]">{info.programName}</p>
                      {info.programProgress !== null && (
                        <div className="mt-2 w-full bg-[#E5E7EB] rounded-full h-2">
                          <div
                            className="bg-[#007c89] h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(info.programProgress, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 text-xs">
                    {info.lastSessionDate ? (
                      <span className={`px-2 py-1 rounded-md font-semibold ${
                        info.isInactive
                          ? 'bg-[#FEE2E2] text-[#DC2626]'
                          : 'bg-[#D1FAE5] text-[#059669]'
                      }`}>
                        {info.daysSinceLastSession === 0 ? "Aujourd'hui" : 
                         info.daysSinceLastSession === 1 ? "Hier" : 
                         `${info.daysSinceLastSession}j`}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-[#F3F4F6] text-[#6B7280] font-semibold">
                        Jamais
                      </span>
                    )}
                    {info.hasPainReport && (
                      <span className="px-2 py-1 rounded-md bg-[#FEE2E2] text-[#DC2626] font-semibold">
                        Douleur
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClientQuickView(client);
                    }}
                    className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-all"
                    title="Vue rapide"
                  >
                    👁
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClientEdit(client);
                    }}
                    className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-all"
                    title="Éditer"
                  >
                    ✎
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

