import { describe, it, expect } from 'vitest';
import {
  extractReps,
  extractWeight,
  calculateSuggestedWeight,
  findPR,
} from '../../services/weightCalculationService';
import { UserProfile, Exercise } from '../../types';

describe('weightCalculationService', () => {
  describe('extractReps', () => {
    it('should extract number from rep string', () => {
      expect(extractReps('10-12')).toBe(10);
      expect(extractReps('8')).toBe(8);
      expect(extractReps('15 reps')).toBe(15);
    });

    it('should return 1 for failure/max strings', () => {
      expect(extractReps('Echec')).toBe(1);
      expect(extractReps('Max')).toBe(1);
    });

    it('should return 1 for empty string', () => {
      expect(extractReps('')).toBe(1);
    });
  });

  describe('extractWeight', () => {
    it('should extract weight from string', () => {
      expect(extractWeight('50kg')).toBe(50);
      expect(extractWeight('50 kg')).toBe(50);
      expect(extractWeight('75.5kg')).toBe(75.5);
    });

    it('should return 0 for invalid input', () => {
      expect(extractWeight('')).toBe(0);
      expect(extractWeight(undefined)).toBe(0);
    });
  });

  describe('findPR', () => {
    const mockProfile: UserProfile = {
      id: '1',
      nom: 'Test',
      age: 30,
      genre: 'Homme',
      poids: '70',
      taille: '175',
      experience: 'Intermédiaire',
      stressLevel: 'Moyen',
      sleepQuality: 'Moyenne',
      materiel: 'Standard',
      objectifs: [],
      objectifPrincipal: 'Test',
      delaiObjectif: '12 SEMAINES',
      blessures_actives: [],
      historique_dates: [],
      historique_volume: [],
      sessionRecords: [],
      personalBests: {
        'Squat': {
          weight: 100,
          reps: 5,
          date: '2024-01-01',
        },
      },
      exerciseTrends: {},
    };

    it('should find PR from personalBests', () => {
      const pr = findPR(mockProfile, 'Squat');
      expect(pr).not.toBeNull();
      expect(pr?.weight).toBe(100);
      expect(pr?.reps).toBe(5);
    });

    it('should return null for non-existent exercise', () => {
      const pr = findPR(mockProfile, 'Deadlift');
      expect(pr).toBeNull();
    });
  });

  describe('calculateSuggestedWeight', () => {
    const mockProfile: UserProfile = {
      id: '1',
      nom: 'Test',
      age: 30,
      genre: 'Homme',
      poids: '70',
      taille: '175',
      experience: 'Intermédiaire',
      stressLevel: 'Moyen',
      sleepQuality: 'Moyenne',
      materiel: 'Standard',
      objectifs: [],
      objectifPrincipal: 'Test',
      delaiObjectif: '12 SEMAINES',
      blessures_actives: [],
      historique_dates: [],
      historique_volume: [],
      sessionRecords: [],
      personalBests: {
        'Squat': {
          weight: 100,
          reps: 5,
          date: '2024-01-01',
        },
      },
      exerciseTrends: {},
    };

    it('should calculate weight based on PR', () => {
      const exercise: Exercise = {
        nom: 'Squat',
        sets: 3,
        reps: '10',
        repos: 60,
        description: 'Test',
      };

      const weight = calculateSuggestedWeight(mockProfile, exercise, 10);
      expect(weight).toBeGreaterThan(0);
      expect(weight % 2.5).toBe(0); // Should be rounded to 2.5kg
    });

    it('should use body weight estimation for beginners without PR', () => {
      const beginnerProfile: UserProfile = {
        ...mockProfile,
        experience: 'Débutant',
        personalBests: {},
      };

      const exercise: Exercise = {
        nom: 'New Exercise',
        sets: 3,
        reps: '10',
        repos: 60,
        description: 'Test',
      };

      const weight = calculateSuggestedWeight(beginnerProfile, exercise, 10);
      expect(weight).toBeGreaterThan(0);
    });
  });
});





