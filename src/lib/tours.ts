import type { Screen } from '../state/types';

export interface TourStep {
  targetId: string;
  title: string;
  text: string;
}

export const SCREEN_TOURS: Partial<Record<Screen, TourStep[]>> = {
  welcome: [
    {
      targetId: 'tour-timeline',
      title: 'Bienvenue !',
      text: "Ce ruban tout en haut vous montre les 4 étapes du début à la fin. Il vous suit partout : vous ne serez jamais perdu·e.",
    },
    {
      targetId: 'tour-autosave-info',
      title: 'Gardez votre travail',
      text: "Votre inventaire est enregistré tout seul sur cet ordinateur, au fur et à mesure. Il n'y a pas de bouton « Enregistrer » à chercher : vous pouvez fermer l'application et revenir plus tard.",
    },
    {
      targetId: 'tour-start',
      title: "C'est parti !",
      text: "Cliquez sur « Commencer » quand vous êtes prêt·e. Je vous expliquerai chaque écran au fur et à mesure.",
    },
  ],
  rooms: [
    {
      targetId: 'tour-rooms-suggestions',
      title: 'Étape 1 · Vos pièces',
      text: "Touchez une pièce suggérée, ou écrivez la vôtre juste en dessous. Elle s'ajoute à votre liste, et vous cliquez ensuite sur « Ouvrir cette pièce » pour y mettre vos objets.",
    },
  ],
  items: [
    {
      targetId: 'tour-import-area',
      title: 'Étape 2 · Vos photos',
      text: 'Cliquez sur un de ces grands boutons pour ajouter les photos de vos objets : plusieurs à la fois, ou un dossier entier.',
    },
    {
      targetId: 'tour-info-hint',
      title: 'Décrire un objet',
      text: "Sous chaque photo, le bouton « Ajouter les informations » ouvre une fiche : nom, prix, dimensions… Rien n'est obligatoire.",
    },
  ],
  review: [
    {
      targetId: 'tour-review-area',
      title: "Étape 3 · L'aperçu",
      text: 'Cet écran récapitule tout ce que vous avez rassemblé, pièce par pièce, avec la valeur totale estimée. Vous pouvez encore tout modifier.',
    },
  ],
  export: [
    {
      targetId: 'tour-export-summary',
      title: 'Étape 4 · Le PDF',
      text: "Voici la dernière étape : vous voyez l'aperçu du document, puis vous le téléchargez en PDF pour votre assurance. C'est terminé !",
    },
  ],
};

export const FORM_TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-form-name',
    title: "La fiche de l'objet",
    text: "Cette fiche décrit un seul objet. Bonne nouvelle : rien n'est obligatoire. On commence par son nom, par exemple « Canapé en cuir marron ».",
  },
  {
    targetId: 'tour-form-grid',
    title: 'Ses informations utiles',
    text: "Ici, notez ce dont vous vous souvenez : le prix payé, la date d'achat, le magasin, et les dimensions. Laissez vide ce que vous ne savez pas, ce n'est pas grave.",
  },
  {
    targetId: 'tour-form-serie',
    title: 'Le numéro de série',
    text: "Beaucoup d'objets (télé, électroménager…) ont un numéro écrit au dos ou dessous. Il aide l'assurance, mais il est facultatif.",
  },
  {
    targetId: 'tour-form-note',
    title: 'Écrire librement',
    text: "Dans cette case, écrivez tout ce que vous voulez ajouter avec vos propres mots : l'état, la couleur, un souvenir, un cadeau reçu…",
  },
  {
    targetId: 'tour-form-save',
    title: 'Enregistrer la fiche',
    text: 'Quand vous avez fini, appuyez sur « Enregistrer ». Vous pourrez toujours rouvrir cette fiche plus tard pour la compléter.',
  },
];
