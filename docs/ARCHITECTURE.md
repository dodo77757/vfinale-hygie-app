# Architecture HYGIE Elite App

## Vue d'ensemble

HYGIE Elite est une application React TypeScript pour le coaching sportif avec intégration IA (Google Gemini). L'application permet aux coaches de gérer des clients et de générer des programmes d'entraînement personnalisés.

## Structure du projet

```
/
├── components/          # Composants React réutilisables
│   ├── modals/         # Modales (Assessment, CreateClient, etc.)
│   └── shared/         # Composants partagés (Background, ProgressBar)
├── hooks/              # Hooks personnalisés React
│   ├── useTimer.ts     # Gestion du timer
│   ├── useProfile.ts   # Gestion du profil utilisateur
│   └── useWorkout.ts   # Logique de séance d'entraînement
├── services/           # Services métier
│   ├── geminiService.ts      # Intégration API Gemini
│   ├── storageService.ts     # Gestion localStorage
│   ├── programmingService.ts  # Génération de programmes
│   ├── weightCalculationService.ts # Calculs de charges
│   ├── fileProcessingService.ts     # Traitement fichiers
│   ├── errorHandler.ts       # Gestion d'erreurs avec retry
│   └── notificationService.ts       # Système de notifications
├── views/              # Vues principales (Login, Dashboard, etc.)
├── utils/              # Utilitaires
│   ├── validation.ts   # Validation Zod
│   └── formatTime.ts   # Formatage temps
├── config/             # Configuration
│   └── env.ts          # Variables d'environnement
└── types.ts            # Types TypeScript
```

## Flux de données

### 1. Authentification et Navigation

```
LoginView → ClientLogin/CoachDashboard → ClientApp
```

- **LoginView** : Écran d'accueil avec choix COACH/CLIENT
- **ClientLogin** : Sélection du profil client
- **CoachDashboard** : Gestion des clients (création, édition, import)
- **ClientApp** : Application principale pour la séance

### 2. Gestion des Clients

```
CoachDashboard → CreateClientModal → StorageService → localStorage
```

- Les clients sont stockés dans `localStorage` via `StorageService`
- Chaque client peut avoir un bilan médical analysé par l'IA
- Les profils incluent : blessures, objectifs, historique, PR

### 3. Génération de Séance

```
DailyCheck → generateProgramWorkout → geminiService → WorkoutPlan
```

- Si un programme actif existe, génère la séance correspondante
- Sinon, crée un programme de 24 semaines automatiquement
- Utilise Gemini 3 Pro pour la génération de workout

### 4. Exécution de Séance

```
WARMUP → WORKOUT → STRETCH → DEBRIEF → FINAL
```

- **WARMUP** : Échauffement dynamique avec timer
- **WORKOUT** : Exercices avec validation de séries
- **STRETCH** : Étirements finaux
- **DEBRIEF** : Feedback IA sur la séance
- **FINAL** : Archivage et sauvegarde

## Services principaux

### StorageService

Gère la persistance des données dans `localStorage` :
- `loadClients()` : Charge tous les clients
- `addClient()` : Ajoute un nouveau client
- `updateClient()` : Met à jour un client (deep merge)
- `clearAllClients()` : Supprime tous les clients

### GeminiService

Intégration avec l'API Google Gemini :
- `generateWorkout()` : Génère un plan d'entraînement
- `parseMedicalAssessment()` : Analyse un bilan médical
- `generateSessionFeedback()` : Génère un feedback post-séance
- `swapExercise()` : Remplace un exercice
- `analyzeGoalProgress()` : Analyse la progression

### ProgrammingService

Gestion des programmes multi-semaines :
- `generateMultiWeekProgram()` : Crée un programme sur N semaines
- `generateProgramWorkout()` : Génère la séance d'une semaine/session
- `markSessionCompleted()` : Marque une séance comme complétée

### WeightCalculationService

Calculs intelligents de charges :
- `calculateSuggestedWeight()` : Suggère un poids basé sur PR/historique
- `findPR()` : Trouve le record personnel pour un exercice
- `updatePR()` : Met à jour le PR si amélioration

## Hooks personnalisés

### useTimer

Gère le timer pour échauffement/étirements :
```typescript
const { countdown, setCountdown, reset } = useTimer({
  initialCountdown: 60,
  onComplete: () => handleNext(),
  isRunning: true,
  mode: 'countdown'
});
```

### useProfile

Gère le profil avec sauvegarde automatique :
```typescript
const { profile, setProfile, updateProfile } = useProfile(initialProfile, {
  autoSaveDelay: 500
});
```

### useWorkout

Logique complète de séance :
```typescript
const {
  workout,
  currentExoIndex,
  currentSet,
  sessionData,
  validateSet,
  initializeWorkout
} = useWorkout({ profile, onProfileUpdate });
```

## Gestion d'erreurs

### ErrorBoundary

Composant React pour capturer les erreurs :
- Affiche un fallback UI en cas d'erreur
- Log les erreurs dans la console
- Permet de recharger l'application

### errorHandler

Service avec retry logic :
- `withRetry()` : Exécute une fonction avec retry automatique
- `apiCallWithRetry()` : Wrapper pour appels API
- Retry conditionnel basé sur le type d'erreur

## Validation

Utilise Zod pour valider les données :
- `validateWorkoutPlan()` : Valide un plan d'entraînement
- `validateUserProfile()` : Valide un profil utilisateur
- `validateFile()` : Valide un fichier uploadé

## Notifications

Système de toast centralisé :
- `notificationService.success()` : Notification de succès
- `notificationService.error()` : Notification d'erreur
- `ToastContainer` : Composant qui affiche les notifications

## Tests

Tests unitaires avec Vitest :
- `__tests__/services/storageService.test.ts`
- `__tests__/services/weightCalculationService.test.ts`

## Configuration

### Variables d'environnement

Fichier `.env.local` requis :
```
GEMINI_API_KEY=your_api_key_here
```

Validation automatique au démarrage via `config/env.ts`.

## Améliorations futures

1. **Routing** : Implémenter React Router pour une navigation plus propre
2. **State Management** : Ajouter Zustand ou Redux pour l'état global
3. **Backend** : Migrer vers une API backend pour la persistance
4. **PWA** : Transformer en Progressive Web App
5. **Offline** : Support offline avec Service Workers





