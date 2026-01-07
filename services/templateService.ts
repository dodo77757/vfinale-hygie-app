import { UserProfile, ProgramTemplate } from '../types';

const STORAGE_KEY_TEMPLATES = 'hygie_client_templates';
const STORAGE_KEY_PROGRAM_TEMPLATES = 'hygie_program_templates';

export interface ClientTemplate {
  id: string;
  name: string;
  description?: string;
  profile: Partial<UserProfile>;
  createdAt: string;
}

/**
 * Service pour gérer les templates de profils clients et programmes
 */
export const TemplateService = {
  /**
   * Crée un template de profil client
   */
  createClientTemplate: (name: string, profile: Partial<UserProfile>, description?: string): ClientTemplate => {
    const template: ClientTemplate = {
      id: `template_${Date.now()}`,
      name,
      description,
      profile,
      createdAt: new Date().toISOString()
    };

    const templates = TemplateService.getClientTemplates();
    templates.push(template);
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    
    return template;
  },

  /**
   * Récupère tous les templates de profils
   */
  getClientTemplates: (): ClientTemplate[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Supprime un template de profil
   */
  deleteClientTemplate: (templateId: string): void => {
    const templates = TemplateService.getClientTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(filtered));
  },

  /**
   * Applique un template à un nouveau client
   */
  applyClientTemplate: (template: ClientTemplate): Partial<UserProfile> => {
    return {
      ...template.profile,
      id: `client_${Date.now()}`,
      nom: template.profile.nom || 'Nouveau Client',
      historique_dates: [],
      historique_volume: [],
      sessionRecords: [],
      personalBests: {},
      exerciseTrends: {}
    };
  },

  /**
   * Crée un template de programme
   */
  createProgramTemplate: (
    name: string,
    duration: number,
    sessionsPerWeek: number,
    description?: string
  ): ProgramTemplate => {
    const template: ProgramTemplate = {
      id: `program_template_${Date.now()}`,
      name,
      duration,
      sessionsPerWeek,
      description,
      createdAt: new Date().toISOString()
    };

    const templates = TemplateService.getProgramTemplates();
    templates.push(template);
    localStorage.setItem(STORAGE_KEY_PROGRAM_TEMPLATES, JSON.stringify(templates));
    
    return template;
  },

  /**
   * Récupère tous les templates de programmes
   */
  getProgramTemplates: (): ProgramTemplate[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROGRAM_TEMPLATES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Supprime un template de programme
   */
  deleteProgramTemplate: (templateId: string): void => {
    const templates = TemplateService.getProgramTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY_PROGRAM_TEMPLATES, JSON.stringify(filtered));
  }
};

