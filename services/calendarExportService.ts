import { UserProfile } from '../types';
import { notificationService } from './notificationService';
import { ReportService } from './reportService';

/**
 * Service pour exporter le calendrier dans différents formats
 */
export const CalendarExportService = {
  /**
   * Exporte le calendrier au format iCal (.ics)
   */
  exportToICal: (clients: UserProfile[]): void => {
    try {
      const allSessions: Array<{
        client: UserProfile;
        session: any;
        type: 'completed' | 'planned';
      }> = [];

      clients.forEach(client => {
        if (client.plannedSessions) {
          client.plannedSessions.forEach(session => {
            allSessions.push({ client, session, type: 'planned' });
          });
        }
        if (client.sessionRecords) {
          client.sessionRecords.forEach(session => {
            allSessions.push({ client, session, type: 'completed' });
          });
        }
      });

      // Générer le contenu iCal
      let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Hygie Sport Santé//Calendar//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ].join('\r\n') + '\r\n';

      allSessions.forEach(({ client, session, type }) => {
        const date = new Date(session.date);
        const startDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const uid = `session-${session.id || Date.now()}-${client.id}@hygie`;
        const summary = `${type === 'planned' ? '📅' : '✅'} ${client.nom}`;
        const description = session.notes || `Session ${type === 'planned' ? 'planifiée' : 'complétée'} pour ${client.nom}`;

        icalContent += [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTART:${startDate}`,
          `DTEND:${endDate}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
          `STATUS:${type === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
          'END:VEVENT'
        ].join('\r\n') + '\r\n';
      });

      icalContent += 'END:VCALENDAR';

      // Télécharger le fichier
      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hygie-calendrier-${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notificationService.success('Calendrier exporté en iCal');
    } catch (error) {
      console.error('Erreur lors de l\'export iCal:', error);
      notificationService.error('Erreur lors de l\'export iCal');
    }
  },

  /**
   * Exporte le calendrier en PDF
   */
  exportToPDF: (clients: UserProfile[], month?: Date): void => {
    try {
      // Utiliser le service de rapport pour générer un PDF du calendrier
      const reportHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Calendrier - ${month ? month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Hygie'}</title>
            <style>
              body {
                font-family: 'Montserrat', Arial, sans-serif;
                color: #181818;
                padding: 40px;
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
              }
              .calendar-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 8px;
                margin-top: 20px;
              }
              .day-header {
                background: #007c89;
                color: white;
                padding: 10px;
                text-align: center;
                font-weight: bold;
                font-size: 12px;
              }
              .day-cell {
                border: 1px solid #E5E7EB;
                padding: 8px;
                min-height: 80px;
                font-size: 11px;
              }
              .session {
                background: #007c89;
                color: white;
                padding: 4px;
                margin: 2px 0;
                border-radius: 3px;
                font-size: 10px;
              }
              .session-planned {
                background: #f3efe5;
                color: #181818;
                border: 1px solid #007c89;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>CALENDRIER DES SESSIONS</h1>
              <p>${month ? month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div class="calendar-grid">
              ${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => 
                `<div class="day-header">${day}</div>`
              ).join('')}
              ${generateCalendarCells(clients, month || new Date())}
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
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      notificationService.error('Erreur lors de l\'export PDF');
    }
  },

  /**
   * Exporte le calendrier en Excel
   */
  exportToExcel: (clients: UserProfile[]): void => {
    try {
      const allSessions: Array<{
        date: string;
        client: string;
        type: string;
        notes?: string;
      }> = [];

      clients.forEach(client => {
        if (client.plannedSessions) {
          client.plannedSessions.forEach(session => {
            allSessions.push({
              date: new Date(session.date).toLocaleDateString('fr-FR'),
              client: client.nom,
              type: 'Planifiée',
              notes: session.notes
            });
          });
        }
        if (client.sessionRecords) {
          client.sessionRecords.forEach(session => {
            allSessions.push({
              date: new Date(session.date).toLocaleDateString('fr-FR'),
              client: client.nom,
              type: 'Complétée',
              notes: session.debrief
            });
          });
        }
      });

      // Trier par date
      allSessions.sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
      });

      // Créer le CSV
      const headers = ['Date', 'Client', 'Type', 'Notes'];
      const rows = allSessions.map(session => [
        session.date,
        session.client,
        session.type,
        session.notes || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hygie-calendrier-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notificationService.success('Calendrier exporté en CSV');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      notificationService.error('Erreur lors de l\'export Excel');
    }
  }
};

function generateCalendarCells(clients: UserProfile[], month: Date): string {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Lundi = 0

  let cells = '';
  
  // Jours du mois précédent
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells += '<div class="day-cell"></div>';
  }

  // Jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    const sessions = getSessionsForDay(clients, date);
    
    cells += `<div class="day-cell">`;
    cells += `<div style="font-weight: bold; margin-bottom: 4px;">${day}</div>`;
    sessions.forEach(session => {
      const className = session.type === 'completed' ? 'session' : 'session session-planned';
      cells += `<div class="${className}">${session.client.nom}</div>`;
    });
    cells += `</div>`;
  }

  // Compléter jusqu'à 42 cellules
  const totalCells = startingDayOfWeek + daysInMonth;
  const remaining = 42 - totalCells;
  for (let i = 0; i < remaining; i++) {
    cells += '<div class="day-cell"></div>';
  }

  return cells;
}

function getSessionsForDay(clients: UserProfile[], date: Date) {
  const sessions: Array<{ client: UserProfile; session: any; type: 'completed' | 'planned' }> = [];
  
  clients.forEach(client => {
    if (client.plannedSessions) {
      client.plannedSessions.forEach(session => {
        const sessionDate = new Date(session.date);
        if (
          sessionDate.getFullYear() === date.getFullYear() &&
          sessionDate.getMonth() === date.getMonth() &&
          sessionDate.getDate() === date.getDate()
        ) {
          sessions.push({ client, session, type: 'planned' });
        }
      });
    }
    if (client.sessionRecords) {
      client.sessionRecords.forEach(session => {
        const sessionDate = new Date(session.date);
        if (
          sessionDate.getFullYear() === date.getFullYear() &&
          sessionDate.getMonth() === date.getMonth() &&
          sessionDate.getDate() === date.getDate()
        ) {
          sessions.push({ client, session, type: 'completed' });
        }
      });
    }
  });

  return sessions;
}

