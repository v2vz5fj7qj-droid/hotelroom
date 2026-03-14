// Configuration centralisée des couleurs — modifier ici pour changer le thème
export const COULEURS = {
  primaire: '#701c45',       // Bordeaux principal
  accent: '#fbbf24',         // Or/Ambre
  fond: '#fcfbfb',           // Fond crème
  texte: '#1a1a2e',          // Texte principal
  succès: '#52c41a',
  erreur: '#ff4d4f',
  avertissement: '#faad14',
  info: '#1677ff',
  bordure: '#d9d9d9',
  fondCarte: '#ffffff',
};

export const THEME_ANT = {
  token: {
    colorPrimary: COULEURS.primaire,
    colorSuccess: COULEURS.succès,
    colorError: COULEURS.erreur,
    colorWarning: COULEURS.avertissement,
    colorInfo: COULEURS.info,
    colorBgBase: COULEURS.fond,
    borderRadius: 8,
    fontFamily: "'Raleway', sans-serif",
  },
};
