import { lazy } from 'react';

/**
 * Lazy loading des composants lourds pour améliorer les performances
 */

export const WorkoutEditorLazy = lazy(() => 
  import('./WorkoutEditor').then(module => ({ default: module.WorkoutEditor }))
);

export const DashboardLazy = lazy(() => 
  import('./Dashboard').then(module => ({ default: module.Dashboard }))
);





