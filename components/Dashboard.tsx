import React, { useRef, useState } from 'react';
import { UserProfile, WorkoutPlan } from '../types';
import * as aiService from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { CreateClientModal } from './modals/CreateClientModal';
import { AssessmentModal } from './modals/AssessmentModal';
import { 
  fileToBase64Optimized, 
  optimizeFileForUpload, 
  getMimeType,
  isFileTooLarge,
  formatFileSize
} from '../services/fileProcessingService';
import { generateMultiWeekProgram } from '../services/programmingService';
import { notificationService } from '../services/notificationService';
import { checkFileDuplicate, checkTextDuplicate } from '../utils/fileDuplicateCheck';

interface DashboardProps {
  clients: UserProfile[];
  setClients: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  onSelectClient: (client: UserProfile, mode: 'DASHBOARD' | 'DAILY_CHECK') => void;
  onSetProfile: (profile: UserProfile) => void;
  onSetWorkout: (workout: WorkoutPlan | null) => void;
  onSetViewMode: (mode: 'CLIENT_APP') => void;
  onSetStep: (step: 'DAILY_CHECK' | 'DASHBOARD') => void;
  hasApiKey: boolean;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  clients,
  setClients,
  onSelectClient,
  onSetProfile,
  onSetWorkout,
  onSetViewMode,
  onSetStep,
  hasApiKey,
  isTyping,
  setIsTyping,
  onLogout
}) => {
  const [createClientModalOpen, setCreateClientModalOpen] = useState(false);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [selectedClientForAssessment, setSelectedClientForAssessment] = useState<UserProfile | null>(null);
  const [assessmentText, setAssessmentText] = useState('');
  const [assessmentFile, setAssessmentFile] = useState<File | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientFile, setNewClientFile] = useState<File | null>(null);
  const [newClientText, setNewClientText] = useState('');
  const dashboardFileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const createNewClientProcess = async (name: string, file: File | null, text: string) => {
    setIsTyping(true);
    try {
       // Vérification de doublon AVANT l'analyse complète
       if (file) {
         // Vérifie la taille du fichier
         if (isFileTooLarge(file)) {
           notificationService.error(`Fichier trop volumineux (${formatFileSize(file.size)}). Veuillez utiliser un fichier de moins de 20MB.`);
           setIsTyping(false);
           throw new Error('Fichier trop volumineux');
         }

         // Vérifie si le fichier correspond à un client existant
         const duplicate = await checkFileDuplicate(file, clients);
         if (duplicate) {
           notificationService.error(
             `Ce fichier correspond déjà au client "${duplicate.nom}". ` +
             `Veuillez utiliser un fichier différent ou mettre à jour le client existant.`
           );
           setIsTyping(false);
           throw new Error('Client dupliqué');
         }
       } else if (text.trim()) {
         // Vérifie si le texte correspond à un client existant
         const duplicate = await checkTextDuplicate(text, clients);
         if (duplicate) {
           notificationService.error(
             `Ces données correspondent déjà au client "${duplicate.nom}". ` +
             `Veuillez utiliser des données différentes ou mettre à jour le client existant.`
           );
           setIsTyping(false);
           throw new Error('Client dupliqué');
         }
       }

       let analysis: aiService.AssessmentAnalysis | null = null;
       let rawAssessment = "Saisie manuelle.";

       if (file || text.trim()) {
           let analysisInput: aiService.AssessmentInput;
           if (file) {
               // Optimise et convertit le fichier
               const optimizedFile = await optimizeFileForUpload(file);
               const base64Raw = await fileToBase64Optimized(optimizedFile);
               const base64Data = base64Raw.split(',')[1];
               const mimeType = getMimeType(optimizedFile);
               analysisInput = { inlineData: { data: base64Data, mimeType } };
               rawAssessment = `Fichier: ${file.name}`;
           } else {
               analysisInput = text;
               rawAssessment = text;
           }
           analysis = await aiService.parseMedicalAssessment(analysisInput);
       }

       const finalName = name.trim() || analysis?.detected_name || `SUJET_${Date.now().toString().slice(-4)}`;
       
       const newClient: UserProfile = {
           id: `client_${Date.now()}`,
           nom: finalName.toUpperCase(),
           avatar: `https://ui-avatars.com/api/?name=${finalName}&background=FFD700&color=000&size=200`,
           age: analysis?.detected_age || 30,
           genre: analysis?.detected_genre || 'Non spécifié',
           poids: analysis?.detected_poids || '70',
           taille: analysis?.detected_taille || '175',
           experience: 'Débutant',
           stressLevel: analysis?.stressLevel || 'Moyen',
           sleepQuality: analysis?.sleepQuality || 'Moyenne',
           materiel: 'Standard',
           objectifs: [],
           objectifPrincipal: analysis?.detected_objectif || 'RECONDITIONNEMENT GÉNÉRAL',
           delaiObjectif: '12 SEMAINES',
           blessures_actives: analysis?.blessures_actives || [],
           details_blessures: analysis?.details_blessures || "Profil initialisé sans pathologie majeure.",
           raw_assessment: rawAssessment,
           historique_dates: [],
           historique_volume: [],
           sessionRecords: [],
           personalBests: {},
           exerciseTrends: {},
           activeGoal: {
               label: analysis?.detected_objectif || 'INITIALISATION',
               targetValue: 100,
               startValue: 0,
               currentValue: 0,
               unit: '%',
               deadline: '12 SEMAINES',
               isSafe: true,
               history: []
           },
           dernier_feedback_ia: analysis?.recommendations || "Nouveau sujet créé. En attente de première session."
       };

       // Génère automatiquement un programme de 24 semaines personnalisé
       const program = await generateMultiWeekProgram(newClient, 24, 3);
       newClient.activeProgram = program;

       const newClientsList = StorageService.addClient(newClient);
       setClients(newClientsList);
       return newClient;

    } catch (e) {
       throw e;
    } finally {
       setIsTyping(false);
    }
  };

  const handleCreateClientSubmit = async (name: string, file: File | null, text: string) => {
    if (!name.trim() && !file) {
        notificationService.error("Nom ou Fichier requis.");
        return;
    }
    try {
        await createNewClientProcess(name, file, text);
        setCreateClientModalOpen(false);
        setNewClientName('');
        setNewClientFile(null);
        setNewClientText('');
        notificationService.success("Nouveau sujet intégré avec succès.");
    } catch(e: any) {
        // L'erreur est déjà gérée dans createNewClientProcess avec notificationService
        if (e.message !== 'Client dupliqué' && e.message !== 'Fichier trop volumineux') {
          notificationService.error("Erreur lors de la création du client.");
        }
    }
  };

  const handleDashboardFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasApiKey) {
        notificationService.error("Veuillez d'abord configurer votre clé API.");
        return;
    }
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        // Vérifie la taille avant de commencer
        if (isFileTooLarge(file)) {
            notificationService.error(`Fichier trop volumineux (${formatFileSize(file.size)}). Veuillez utiliser un fichier de moins de 20MB.`);
            e.target.value = '';
            return;
        }
        
        try {
            const newClient = await createNewClientProcess('', file, '');
            onSetProfile(newClient);
            const plan = await aiService.generateWorkout(newClient, 45, "Protocole Initial");
            onSetWorkout(plan);
            onSetViewMode('CLIENT_APP');
            onSetStep('DAILY_CHECK');
            notificationService.success("Client importé avec succès.");
        } catch (err: any) {
            // L'erreur est déjà gérée dans createNewClientProcess avec notificationService
            if (err.message !== 'Client dupliqué' && err.message !== 'Fichier trop volumineux') {
              notificationService.error("Erreur lors de l'import rapide.");
            }
        } finally {
            e.target.value = '';
        }
    }
  };

  const [fileProcessingProgress, setFileProcessingProgress] = useState(0);
  const [fileProcessingStage, setFileProcessingStage] = useState('');

  const handleAnalyzeAssessment = async (text: string, file: File | null) => {
    if (!selectedClientForAssessment || (!text.trim() && !file)) return;
    
    setIsTyping(true);
    setFileProcessingProgress(0);
    setFileProcessingStage('');
    
    try {
      let analysisInput: aiService.AssessmentInput;

      if (file) {
        // Vérifie la taille du fichier
        if (isFileTooLarge(file)) {
          notificationService.error(`Fichier trop volumineux (${formatFileSize(file.size)}). Veuillez utiliser un fichier de moins de 20MB.`);
          setIsTyping(false);
          return;
        }

        setFileProcessingStage('Optimisation du fichier...');
        const optimizedFile = await optimizeFileForUpload(file);
        
        setFileProcessingStage('Conversion en Base64...');
        const base64Raw = await fileToBase64Optimized(optimizedFile, (progress) => {
          setFileProcessingProgress(Math.min(progress, 50));
        });
        
        setFileProcessingStage('Envoi à l'IA...');
        const base64Data = base64Raw.split(',')[1];
        const mimeType = getMimeType(optimizedFile);
        analysisInput = { inlineData: { data: base64Data, mimeType } };
        setFileProcessingProgress(60);
      } else {
        analysisInput = text;
        setFileProcessingProgress(30);
      }

      setFileProcessingStage('Analyse en cours...');
      setFileProcessingProgress(70);
      const analysis = await aiService.parseMedicalAssessment(analysisInput);
      setFileProcessingProgress(100);
      
      const updatedClient: UserProfile = {
        ...selectedClientForAssessment,
        blessures_actives: analysis.blessures_actives,
        details_blessures: analysis.details_blessures,
        stressLevel: analysis.stressLevel,
        sleepQuality: analysis.sleepQuality,
        raw_assessment: file ? `Fichier analysé: ${file.name}` : text,
        dernier_feedback_ia: `Bilan MAJ : ${analysis.recommendations}`
      };

      const newClientsList = StorageService.updateClient(updatedClient);
      setClients(newClientsList);

      setAssessmentModalOpen(false);
      setSelectedClientForAssessment(null);
      setAssessmentText('');
      setAssessmentFile(null);
      setFileProcessingProgress(0);
      setFileProcessingStage('');
      notificationService.success("Bilan Bio-Métrique intégré avec succès.");
    } catch (e) {
      notificationService.error("Échec de l'analyse du bilan.");
    } finally {
      setIsTyping(false);
      setFileProcessingProgress(0);
      setFileProcessingStage('');
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0d0d0d] overflow-hidden">
       <header className="h-24 shrink-0 border-b border-gray-900 flex items-center justify-between px-8 bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-3xl z-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-teal)] flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="font-bebas text-3xl tracking-widest text-white">COMMAND CENTER</h1>
              <p className="text-[9px] font-mono text-gray-500 uppercase">Mode Modérateur • {clients.length} {clients.length === 1 ? 'Client' : 'Clients'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="px-4 py-2 bg-gray-900 text-xs font-mono text-gray-400 hover:text-white hover:bg-gray-800 uppercase rounded-lg transition-all">LOGOUT</button>
       </header>

       <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-20 grid-responsive">
             {/* Carte Nouveau Client (Import Rapide) */}
             <div onClick={() => dashboardFileInputRef.current?.click()} className="hud-card p-8 rounded-3xl bg-gradient-to-br from-[#161616]/80 to-[#0d0d0d] border-2 border-gray-800 border-dashed hover:border-[var(--primary-teal)] cursor-pointer flex flex-col items-center justify-center gap-5 min-h-[320px] group relative overflow-hidden transition-all hover:scale-[1.02]">
                <input type="file" ref={dashboardFileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleDashboardFileSelect} />
                <div className="text-6xl text-gray-600 group-hover:text-[var(--primary-teal)] transition-all group-hover:scale-110">⇪</div>
                <div className="text-center">
                  <h3 className="font-bebas text-3xl text-gray-500 group-hover:text-white transition-all mb-2">IMPORT RAPIDE</h3>
                  <p className="text-[10px] text-gray-600 uppercase">Glisser Bilan ou Clic</p>
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
                  <div className="w-12 h-0.5 bg-gray-800"></div>
                  <button onClick={(e) => { e.stopPropagation(); setCreateClientModalOpen(true); }} className="text-[10px] font-mono text-gray-600 hover:text-[var(--primary-teal)] uppercase transition-all">Ou Création Manuelle</button>
                </div>
             </div>

             {/* Liste des Clients */}
             {clients.map(client => {
               const hasActiveProgram = !!client.activeProgram;
               const programProgress = hasActiveProgram 
                 ? ((client.activeProgram!.currentWeek - 1) * client.activeProgram!.sessionsPerWeek + client.activeProgram!.currentSession) / (client.activeProgram!.duration * client.activeProgram!.sessionsPerWeek) * 100
                 : 0;
               const hasInjuries = client.blessures_actives && client.blessures_actives.length > 0;
               const sleepQuality = client.sleepQuality === 'Excellente' ? '🟢' : client.sleepQuality === 'Moyenne' ? '🟡' : '🔴';
               
               return (
                <div key={client.id} className="hud-card p-6 rounded-3xl bg-gradient-to-br from-[#161616] to-[#0d0d0d] border-2 border-gray-800 hover:border-[var(--primary-teal)] transition-all group hover:scale-[1.02]">
                   <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                         <div className="relative">
                            <img src={client.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-gray-700" />
                            {hasInjuries && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                                <span className="text-[10px]">⚠</span>
                              </div>
                            )}
                         </div>
                         <div className="flex-1">
                            <h3 className="font-bebas text-2xl text-white mb-1">{client.nom}</h3>
                            <div className="flex items-center gap-2 mb-1">
                               <p className="text-[10px] font-mono text-gray-500 uppercase">{client.activeGoal?.currentValue || 0}% Complete</p>
                               <span className="text-xs">{sleepQuality}</span>
                            </div>
                            {hasActiveProgram && (
                              <div className="mt-2">
                                 <div className="flex items-center justify-between mb-1">
                                    <p className="text-[9px] font-mono text-gray-600 uppercase">Programme</p>
                                    <p className="text-[9px] font-mono text-[var(--primary-teal)]">Sem {client.activeProgram!.currentWeek}/{client.activeProgram!.duration}</p>
                                 </div>
                                 <div className="w-full bg-gray-900 rounded-full h-1.5">
                                    <div 
                                       className="bg-[var(--primary-teal)] h-1.5 rounded-full transition-all"
                                       style={{ width: `${programProgress}%` }}
                                    />
                                 </div>
                              </div>
                            )}
                         </div>
                      </div>
                   </div>
                   
                   {client.objectifPrincipal && (
                      <div className="mb-4 p-2 bg-black/40 rounded-lg border border-gray-800">
                         <p className="text-[9px] font-mono text-gray-500 uppercase mb-1">Objectif</p>
                         <p className="text-xs font-bebas text-gray-300">{client.objectifPrincipal}</p>
                      </div>
                   )}
                   
                   {hasInjuries && (
                      <div className="mb-4 p-2 bg-red-900/20 rounded-lg border border-red-800/50">
                         <p className="text-[9px] font-mono text-red-400 uppercase mb-1">Blessures Actives</p>
                         <p className="text-xs text-red-300">{client.blessures_actives.join(', ')}</p>
                      </div>
                   )}
                   
                   <div className="flex gap-2">
                      <button onClick={() => onSelectClient(client, 'DASHBOARD')} className="flex-1 py-3 bg-gray-800 text-white font-bebas rounded-xl hover:bg-[var(--primary-gold)] hover:text-black uppercase text-sm transition-all font-bold">
                         {hasActiveProgram ? 'SUPERVISER' : 'OUVRIR'}
                      </button>
                      <button onClick={() => { setSelectedClientForAssessment(client); setAssessmentModalOpen(true); }} className="w-12 flex items-center justify-center bg-gray-900 border border-gray-700 text-[var(--primary-teal)] rounded-xl hover:bg-[var(--primary-teal)] hover:text-white transition-all font-bold">✚</button>
                   </div>
                </div>
             )})}
          </div>
       </main>

       {/* Modale Création Manuelle (Coach) */}
       {createClientModalOpen && (
         <CreateClientModal
           isOpen={createClientModalOpen}
           onClose={() => {
             setCreateClientModalOpen(false);
             setNewClientName('');
             setNewClientFile(null);
             setNewClientText('');
           }}
           onSubmit={handleCreateClientSubmit}
           isProcessing={isTyping}
         />
       )}

       {/* MODALE ASSESSMENT (UPDATE) */}
       {assessmentModalOpen && selectedClientForAssessment && (
         <AssessmentModal
           client={selectedClientForAssessment}
           isOpen={assessmentModalOpen}
           onClose={() => {
             setAssessmentModalOpen(false);
             setSelectedClientForAssessment(null);
             setAssessmentText('');
             setAssessmentFile(null);
           }}
           onAnalyze={handleAnalyzeAssessment}
           isProcessing={isTyping}
           processingProgress={fileProcessingProgress}
           processingStage={fileProcessingStage}
         />
       )}
    </div>
  );
};

