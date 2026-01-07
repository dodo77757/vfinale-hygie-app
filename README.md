# 🏋️‍♂️ Hygie App - Suivi Sportif & Santé Intelligent

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Clean-green)

**Hygie App** est une solution complète destinée aux coachs sportifs et à leurs clients. Elle permet de gérer les programmes d'entraînement, de suivre les performances en temps réel et d'analyser la progression physique via une interface intuitive.

> 🚧 **Projet en évolution constante** : Refactorisation majeure récente vers une Clean Architecture.

---

## ✨ Fonctionnalités Clés

### 👨‍🏫 Pour les Coachs
* **Tableau de bord centralisé** : Vue d'ensemble de tous les clients.
* **Gestion des profils** : Suivi des données physiologiques (Poids, Taille, Objectifs).
* **Création de programmes** : Planification des séances sur mesure.

### 🏃‍♂️ Pour les Clients
* **Mode "Séance" immersif** : Guidage pas à pas durant l'entraînement.
* **Suivi de performance** : Enregistrement des charges, répétitions et temps de repos.
* **Historique** : Visualisation de la progression au fil du temps.

---

## 🏗 Architecture Technique (Refactoring)

Ce projet a récemment bénéficié d'une refonte technique complète pour passer d'une structure monolithique à une **Clean Architecture** modulaire et maintenable.

### Choix d'Architecture
L'application respecte la séparation des responsabilités (SoC) :

* **Presentation Layer** : Composants React purs, dénués de logique métier complexe.
* **Domain Layer** : Définitions des types (`UserProfile`, `WorkoutPlan`) et règles métier.
* **Application Layer** : Gestion des cas d'usage via des Contexts React.

### Gestion d'État (State Management)
Utilisation de l'API **React Context** pour éviter le "Prop Drilling" et isoler les domaines fonctionnels :

1.  **`AppContext`** : Gère le routing global, l'authentification et les modes de vue (Coach/Client).
2.  **`ClientContext`** : Centralise les opérations CRUD sur les données utilisateurs.
3.  **`WorkoutContext`** : Encapsule toute la logique complexe d'une séance de sport (Timer, validation des séries, état d'avancement).

---

## 📂 Structure du Projet

```bash
src/
├── application/      # Logique métier et cas d'usage
├── domain/           # Entités et Types (Single Source of Truth)
├── infrastructure/   # Services externes (API, Storage)
└── presentation/     # Interface Utilisateur (UI)
    ├── components/   # Composants réutilisables
    ├── contexts/     # Les "Cerveaux" de l'application (State)
    ├── hooks/        # Custom Hooks pour consommer les contexts
    └── layouts/      # Structures de pages