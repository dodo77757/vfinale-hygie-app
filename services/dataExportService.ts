import { UserProfile } from '../types';
import { notificationService } from './notificationService';
import { ReportService } from './reportService';

/**
 * Service pour l'export et l'import de données clients
 */
export const DataExportService = {
  /**
   * Exporte les clients sélectionnés ou tous les clients en JSON
   */
  exportToJSON: (clients: UserProfile[], selectedIds?: Set<string>): void => {
    try {
      const clientsToExport = selectedIds && selectedIds.size > 0
        ? clients.filter(c => selectedIds.has(c.id))
        : clients;

      if (clientsToExport.length === 0) {
        notificationService.warning('Aucun client à exporter');
        return;
      }

      const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        clientCount: clientsToExport.length,
        clients: clientsToExport
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hygie-clients-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notificationService.success(`${clientsToExport.length} client(s) exporté(s) avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      notificationService.error('Erreur lors de l\'export des données');
    }
  },

  /**
   * Exporte les clients sélectionnés ou tous les clients en CSV
   */
  exportToCSV: (clients: UserProfile[], selectedIds?: Set<string>): void => {
    try {
      const clientsToExport = selectedIds && selectedIds.size > 0
        ? clients.filter(c => selectedIds.has(c.id))
        : clients;

      if (clientsToExport.length === 0) {
        notificationService.warning('Aucun client à exporter');
        return;
      }

      // En-têtes CSV
      const headers = [
        'Nom',
        'Age',
        'Genre',
        'Poids',
        'Taille',
        'Expérience',
        'Objectif Principal',
        'Délai Objectif',
        'Sessions Total',
        'Progression (%)',
        'Dernière Session',
        'Blessures Actives',
        'Qualité Sommeil',
        'Niveau Stress',
        'Matériel'
      ];

      // Conversion des données
      const rows = clientsToExport.map(client => {
        const lastSession = client.sessionRecords && client.sessionRecords.length > 0
          ? client.sessionRecords[client.sessionRecords.length - 1].date
          : 'Jamais';
        
        return [
          client.nom,
          client.age.toString(),
          client.genre,
          client.poids,
          client.taille,
          client.experience,
          client.objectifPrincipal || '',
          client.delaiObjectif || '',
          (client.sessionRecords?.length || 0).toString(),
          (client.activeGoal?.currentValue || 0).toString(),
          lastSession,
          (client.blessures_actives || []).join('; '),
          client.sleepQuality,
          client.stressLevel,
          client.materiel || ''
        ];
      });

      // Création du CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hygie-clients-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notificationService.success(`${clientsToExport.length} client(s) exporté(s) en CSV avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      notificationService.error('Erreur lors de l\'export CSV');
    }
  },

  /**
   * Importe des clients depuis un fichier JSON
   */
  importFromJSON: async (file: File): Promise<UserProfile[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);

          // Vérification de la structure
          if (!data.clients || !Array.isArray(data.clients)) {
            throw new Error('Format de fichier invalide. Le fichier doit contenir un tableau "clients"');
          }

          // Validation et nettoyage des clients
          const importedClients: UserProfile[] = data.clients.map((client: any, index: number) => {
            // Générer un nouvel ID pour éviter les conflits
            const newId = `client_${Date.now()}_${index}`;
            
            return {
              ...client,
              id: newId,
              // S'assurer que les champs obligatoires existent
              nom: client.nom || `Client Importé ${index + 1}`,
              age: client.age || 30,
              genre: client.genre || 'Non spécifié',
              poids: client.poids || '70',
              taille: client.taille || '175',
              experience: client.experience || 'Débutant',
              stressLevel: client.stressLevel || 'Moyen',
              sleepQuality: client.sleepQuality || 'Moyenne',
              materiel: client.materiel || 'Standard',
              objectifs: client.objectifs || [],
              objectifPrincipal: client.objectifPrincipal || 'RECONDITIONNEMENT GÉNÉRAL',
              delaiObjectif: client.delaiObjectif || '12 SEMAINES',
              blessures_actives: client.blessures_actives || [],
              historique_dates: client.historique_dates || [],
              historique_volume: client.historique_volume || [],
              sessionRecords: client.sessionRecords || [],
              personalBests: client.personalBests || {},
              exerciseTrends: client.exerciseTrends || {}
            } as UserProfile;
          });

          notificationService.success(`${importedClients.length} client(s) importé(s) avec succès`);
          resolve(importedClients);
        } catch (error) {
          console.error('Erreur lors de l\'import JSON:', error);
          notificationService.error('Erreur lors de l\'import. Vérifiez le format du fichier.');
          reject(error);
        }
      };

      reader.onerror = () => {
        notificationService.error('Erreur lors de la lecture du fichier');
        reject(new Error('Erreur de lecture du fichier'));
      };

      reader.readAsText(file);
    });
  },

  /**
   * Exporte un rapport PDF pour un client individuel
   */
  exportClientToPDF: (client: UserProfile): void => {
    try {
      ReportService.generateClientReport(client);
      notificationService.success('Rapport PDF généré');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      notificationService.error('Erreur lors de la génération du rapport PDF');
    }
  },

  /**
   * Exporte un rapport PDF global pour tous les clients
   */
  exportGlobalToPDF: (clients: UserProfile[]): void => {
    try {
      ReportService.generateGlobalReport(clients);
      notificationService.success('Rapport global PDF généré');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      notificationService.error('Erreur lors de la génération du rapport PDF');
    }
  }
};



