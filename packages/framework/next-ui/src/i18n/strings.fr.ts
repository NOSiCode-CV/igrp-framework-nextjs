import type { IGRPChromeStrings } from './strings.js';

export const IGRP_CHROME_STRINGS_FR: IGRPChromeStrings = {
  header: { settings: 'Paramètres' },
  navUser: {
    profile: 'Profil',
    notifications: 'Notifications',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
    unknownUser: 'N/D',
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Tout marquer comme lu',
    empty: 'Aucune notification',
    viewAll: 'Toutes les notifications',
    unreadCount: '{count} non lue(s)',
  },
  modeSwitcher: {
    toggle: 'Changer de thème',
    switchToLight: 'Passer au thème clair',
    switchToDark: 'Passer au thème sombre',
  },
  themeSelector: {
    srLabel: 'Thème',
    triggerPrefix: 'Choisir un thème :',
    triggerShort: 'Thème',
    placeholder: 'Choisir un thème',
    defaultGroup: 'Standard',
    scaledGroup: 'Agrandi',
  },
  commandSearch: {
    trigger: 'Rechercher...',
    placeholder: 'Saisissez une commande ou une recherche...',
    empty: 'Aucun résultat.',
    dialogTitle: 'Palette de commandes',
    dialogDescription: 'Recherchez et exécutez une commande.',
  },
  breadcrumbs: { home: "Page d'accueil", ellipsis: 'Afficher les niveaux restants' },
  appSwitcher: { appCenter: 'Centre des applications', unknown: 'N/D' },
  menus: {
    navAriaLabel: 'Menu principal',
    searchPlaceholder: 'Rechercher dans les menus...',
    searchAriaLabel: 'Rechercher dans les menus',
    clearSearch: 'Effacer la recherche',
    emptyMenus: "Cette application n'a pas de menus.",
    noResults: 'Aucun résultat pour "{query}".',
    resultCountOne: '{count} résultat',
    resultCountOther: '{count} résultats',
    toggleSubmenu: 'Ouvrir ou fermer le sous-menu {name}',
    folderMenu: 'Menu {name}',
    opensInNewTab: "{name} (s'ouvre dans un nouvel onglet)",
  },
  loading: { text: 'Veuillez patienter...' },
  authCarousel: { region: 'À la une', goToSlide: "Aller à l'élément {index}" },
  authForm: { signInError: 'Connexion impossible. Veuillez réessayer.' },
  forbidden: {
    title: 'Accès refusé',
    description: "Vous n'avez pas la permission d'accéder à ce contenu.",
    home: "Retour à la page d'accueil",
  },
  notFound: {
    subtitle: 'Page introuvable',
    description: "Désolé, la page n'a pas été trouvée.",
    home: "Retour à la page d'accueil",
    imageAlt: 'Page introuvable',
  },
  globalError: {
    title: "Une erreur inattendue s'est produite.",
    description:
      "Veuillez réessayer. Si le problème persiste, contactez l'équipe d'assistance en indiquant l'identifiant de référence ci-dessous.",
    reset: 'Réessayer',
    retrying: 'Nouvelle tentative...',
    errorRef: 'Identifiant de référence :',
  },
  segmentError: {
    title: "Une erreur s'est produite dans cette section.",
    description:
      "Réessayez ou revenez à l'accueil. Si le problème persiste, contactez l'équipe d'assistance.",
    home: "Retour à l'accueil",
    reset: 'Réessayer',
    retrying: 'Nouvelle tentative...',
    errorRef: 'Identifiant de référence :',
  },
  errorCodes: {
    IGRP_CONFIG_NOT_INITIALIZED: {
      title: 'Configuration IGRP non initialisée',
      description:
        "Le fichier de configuration de l'application n'a pas été chargé. Contactez l'équipe technique pour vérifier le démarrage du serveur.",
    },
    IGRP_CONFIG_INVALID: {
      title: 'Configuration IGRP invalide',
      description:
        "La configuration de l'application contient des valeurs manquantes ou invalides. Vérifiez le fichier de configuration IGRP et les variables d'environnement.",
    },
    IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: {
      title: 'Gestion des accès non configurée',
      description:
        "L'URL de l'API de gestion des accès n'est pas définie. Définissez la variable d'environnement de l'application ou activez le mode aperçu pour continuer.",
    },
    IGRP_APP_CODE_MISSING: {
      title: "Code de l'application manquant",
      description:
        "L'application n'a pas déclaré son code d'identification. Vérifiez le fichier de configuration IGRP.",
    },
    IGRP_APP_HOME_SLUG_INVALID: {
      title: "URL d'accueil de l'application invalide",
      description:
        'NEXT_PUBLIC_IGRP_APP_HOME_SLUG ne commence pas par "/". Corrigez la variable d\'environnement et redémarrez le serveur.',
    },
    IGRP_AUTH_CONFIG_INVALID: {
      title: "Configuration d'authentification invalide",
      description:
        "Une ou plusieurs variables d'environnement requises par le fournisseur d'authentification sont manquantes ou incorrectes.",
    },
    IGRP_LAYOUT_DATA_FAILED: {
      title: 'Échec du chargement des données de mise en page',
      description:
        "Impossible de charger les menus ou les données de l'utilisateur. Réessayez ; si le problème persiste, contactez l'assistance.",
    },
  },
};
