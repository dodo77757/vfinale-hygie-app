import { UserProfile } from '../types';

/**
 * Service pour générer des rapports PDF
 * Note: Pour une implémentation complète, installer jsPDF: npm install jspdf
 * Pour l'instant, on génère un HTML formaté qui peut être imprimé en PDF
 */
export const ReportService = {
  /**
   * Génère un rapport PDF pour un client individuel
   */
  generateClientReport: (client: UserProfile): void => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rapport Client - ${client.nom}</title>
          <style>
            body {
              font-family: 'Montserrat', Arial, sans-serif;
              color: #181818;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 3px solid #007c89;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #007c89;
              font-size: 28px;
              margin: 0;
              font-weight: bold;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              color: #007c89;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 2px solid #007c89;
              padding-bottom: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              padding: 10px;
              background: #f3efe5;
              border-radius: 5px;
            }
            .info-label {
              font-size: 12px;
              color: #6B7280;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .info-value {
              font-size: 16px;
              color: #181818;
              font-weight: 600;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: #007c89;
              color: white;
              padding: 15px;
              border-radius: 5px;
              text-align: center;
            }
            .stat-label {
              font-size: 11px;
              opacity: 0.9;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .table th, .table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #E5E7EB;
            }
            .table th {
              background: #007c89;
              color: white;
              font-weight: 600;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #E5E7EB;
              text-align: center;
              color: #6B7280;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RAPPORT CLIENT</h1>
            <p style="color: #6B7280; margin: 5px 0;">${client.nom}</p>
            <p style="color: #6B7280; font-size: 12px;">Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div class="section">
            <div class="section-title">Informations Personnelles</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Âge</div>
                <div class="info-value">${client.age} ans</div>
              </div>
              <div class="info-item">
                <div class="info-label">Genre</div>
                <div class="info-value">${client.genre}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Poids</div>
                <div class="info-value">${client.poids} kg</div>
              </div>
              <div class="info-item">
                <div class="info-label">Taille</div>
                <div class="info-value">${client.taille} cm</div>
              </div>
              <div class="info-item">
                <div class="info-label">Expérience</div>
                <div class="info-value">${client.experience}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Niveau de stress</div>
                <div class="info-value">${client.stressLevel}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Qualité du sommeil</div>
                <div class="info-value">${client.sleepQuality}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Matériel</div>
                <div class="info-value">${client.materiel || 'Standard'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Objectifs</div>
            <div class="info-item">
              <div class="info-label">Objectif Principal</div>
              <div class="info-value">${client.objectifPrincipal || 'Non défini'}</div>
            </div>
            ${client.delaiObjectif ? `
            <div class="info-item" style="margin-top: 10px;">
              <div class="info-label">Délai</div>
              <div class="info-value">${client.delaiObjectif}</div>
            </div>
            ` : ''}
            ${client.activeGoal ? `
            <div class="info-item" style="margin-top: 10px;">
              <div class="info-label">Progression</div>
              <div class="info-value">${Math.round(client.activeGoal.currentValue)}%</div>
            </div>
            ` : ''}
          </div>

          ${client.blessures_actives && client.blessures_actives.length > 0 ? `
          <div class="section">
            <div class="section-title">Blessures Actives</div>
            <div class="info-item">
              <div class="info-value">${client.blessures_actives.join(', ')}</div>
            </div>
            ${client.details_blessures ? `
            <p style="margin-top: 10px; color: #6B7280; font-size: 14px;">${client.details_blessures}</p>
            ` : ''}
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Statistiques</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Sessions</div>
                <div class="stat-value">${client.sessionRecords?.length || 0}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Volume Total</div>
                <div class="stat-value">${Math.round((client.historique_volume?.reduce((a, b) => a + b, 0) || 0) / 1000)}k kg</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Progression</div>
                <div class="stat-value">${Math.round(client.activeGoal?.currentValue || 0)}%</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Streak</div>
                <div class="stat-value">${client.currentStreak || 0}</div>
              </div>
            </div>
          </div>

          ${client.sessionRecords && client.sessionRecords.length > 0 ? `
          <div class="section">
            <div class="section-title">Dernières Sessions</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Volume</th>
                  <th>Exercices</th>
                </tr>
              </thead>
              <tbody>
                ${client.sessionRecords.slice(-10).reverse().map(session => `
                  <tr>
                    <td>${new Date(session.date).toLocaleDateString('fr-FR')}</td>
                    <td>${session.tonnage} kg</td>
                    <td>${session.exercices.length} exercices</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${client.activeProgram ? `
          <div class="section">
            <div class="section-title">Programme Actif</div>
            <div class="info-item">
              <div class="info-label">Nom</div>
              <div class="info-value">${client.activeProgram.name}</div>
            </div>
            <div class="info-item" style="margin-top: 10px;">
              <div class="info-label">Progression</div>
              <div class="info-value">Semaine ${client.activeProgram.currentWeek} / ${client.activeProgram.duration}</div>
            </div>
          </div>
          ` : ''}

          ${client.dernier_feedback_ia ? `
          <div class="section">
            <div class="section-title">Dernier Conseil IA</div>
            <p style="color: #181818; font-size: 14px; line-height: 1.6;">${client.dernier_feedback_ia}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Rapport généré par Hygie Sport Santé</p>
            <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
      // Attendre que le contenu soit chargé avant d'imprimer
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  },

  /**
   * Génère un rapport global pour tous les clients
   */
  generateGlobalReport: (clients: UserProfile[]): void => {
    const totalSessions = clients.reduce((sum, c) => sum + (c.sessionRecords?.length || 0), 0);
    const totalVolume = clients.reduce((sum, c) => sum + (c.historique_volume?.reduce((a, b) => a + b, 0) || 0), 0);
    const activeClients = clients.filter(c => {
      const hasRecentSession = c.sessionRecords && c.sessionRecords.length > 0;
      const lastSessionDate = hasRecentSession 
        ? new Date(c.sessionRecords[c.sessionRecords.length - 1].date)
        : null;
      const daysSinceLastSession = lastSessionDate 
        ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;
      return daysSinceLastSession <= 30;
    }).length;
    const clientsWithProgram = clients.filter(c => c.activeProgram).length;

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rapport Global - Hygie</title>
          <style>
            body {
              font-family: 'Montserrat', Arial, sans-serif;
              color: #181818;
              padding: 40px;
              max-width: 1000px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 3px solid #007c89;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #007c89;
              font-size: 32px;
              margin: 0;
              font-weight: bold;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            .stat-card {
              background: #007c89;
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .stat-label {
              font-size: 12px;
              opacity: 0.9;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .stat-value {
              font-size: 32px;
              font-weight: bold;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              color: #007c89;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 2px solid #007c89;
              padding-bottom: 5px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .table th, .table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #E5E7EB;
            }
            .table th {
              background: #007c89;
              color: white;
              font-weight: 600;
            }
            .table tr:hover {
              background: #f3efe5;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #E5E7EB;
              text-align: center;
              color: #6B7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RAPPORT GLOBAL</h1>
            <p style="color: #6B7280; margin: 5px 0;">Hygie Sport Santé</p>
            <p style="color: #6B7280; font-size: 12px;">Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Clients</div>
              <div class="stat-value">${clients.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Sessions</div>
              <div class="stat-value">${totalSessions}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Volume Total</div>
              <div class="stat-value">${Math.round(totalVolume / 1000)}k kg</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Clients Actifs</div>
              <div class="stat-value">${activeClients}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Liste des Clients</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Objectif</th>
                  <th>Sessions</th>
                  <th>Progression</th>
                  <th>Programme</th>
                </tr>
              </thead>
              <tbody>
                ${clients.map(client => `
                  <tr>
                    <td>${client.nom}</td>
                    <td>${client.objectifPrincipal || 'Non défini'}</td>
                    <td>${client.sessionRecords?.length || 0}</td>
                    <td>${Math.round(client.activeGoal?.currentValue || 0)}%</td>
                    <td>${client.activeProgram ? 'Oui' : 'Non'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Rapport généré par Hygie Sport Santé</p>
            <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }
};

