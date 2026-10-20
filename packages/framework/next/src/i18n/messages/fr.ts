import type { IGRPFrameworkMessages } from './pt.js';

export const IGRP_MESSAGES_FR: IGRPFrameworkMessages = {
  common: {
    actions: {
      backHome: "Retour à l'accueil",
      retry: 'Réessayer',
      retrying: 'Nouvelle tentative...',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Enregistrer',
      close: 'Fermer',
      search: 'Rechercher',
      loading: 'Chargement...',
      loadingApp: 'Chargement de {name}...',
    },
    notAvailable: 'N/D',
    yes: 'Oui',
    no: 'Non',
  },
  i18n: {
    localeSwitcher: {
      label: 'Langue',
      changeError: 'Impossible de changer la langue. Veuillez réessayer.',
    },
  },
  errors: {
    errorRef: 'Identifiant de référence :',
    unexpected: {
      title: "Une erreur inattendue s'est produite.",
      description:
        "Veuillez réessayer. Si le problème persiste, contactez l'équipe d'assistance en indiquant l'identifiant de référence ci-dessous.",
    },
    auth: {
      title: "L'authentification n'a pas pu être finalisée.",
      description:
        "Vérifiez la configuration du fournisseur d'authentification et les variables d'environnement. Si le problème persiste, contactez l'assistance.",
    },
    status: {
      '401': 'Connexion requise',
      '403': 'Accès refusé',
      '404': 'Page introuvable',
      '500': 'Erreur interne',
      '503': 'Service indisponible',
      fallback: "Une erreur s'est produite",
    },
  },
};
