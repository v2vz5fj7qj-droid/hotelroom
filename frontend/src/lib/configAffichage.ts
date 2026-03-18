export interface PolicePersonnalisee {
  id: string;           // identifiant unique
  label: string;        // nom affiché
  famille: string;      // valeur CSS font-family
  source: 'google' | 'fichier';
  cssUrl?: string;      // URL @import pour Google Fonts
  base64?: string;      // data URL pour fichier uploadé
}

export interface ConfigAffichage {
  // Typographie
  police: string;
  tailleNom: number;
  couleurTitre: string;
  couleurSalle: string;
  couleurDate: string;
  couleurLignes: string;

  // Arrière-plan
  couleurFond: string;
  afficherPointilles: boolean;
  couleurPointilles: string;

  // Logo
  logoNom: string;
  logoSousNom: string;
  logoImageUrl: string;

  // Footer
  texteSlogan: string;

  // Contenu
  afficherCreneaux: boolean;

  // Image par défaut (jours sans programme)
  imageDefaut: string;

  // Polices personnalisées
  policesPersonnalisees: PolicePersonnalisee[];
}

export const CONFIG_DEFAUT: ConfigAffichage = {
  police: 'Georgia, serif',
  tailleNom: 9,
  couleurTitre: '#701c45',
  couleurSalle: '#1a1a1a',
  couleurDate: '#701c45',
  couleurLignes: '#701c45',
  couleurFond: '#f0eef0',
  afficherPointilles: true,
  couleurPointilles: '#701c45',
  logoNom: 'BRAVIA',
  logoSousNom: 'HÔTEL',
  logoImageUrl: '',
  texteSlogan: 'VOUS AIMERIEZ DÉPOSER\nVOS VALISES CHEZ NOUS',
  afficherCreneaux: true,
  imageDefaut: '',
  policesPersonnalisees: [],
};

const CLE_API = 'affichage';
const CLE_LS = 'bravia_affichage_config';
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

// ── Lecture : API en priorité, localStorage en cache/fallback ────────────────

export async function lireConfigAsync(): Promise<ConfigAffichage> {
  try {
    const res = await fetch(`${API_URL}/configuration/${CLE_API}`);
    if (res.ok) {
      const { valeur } = await res.json();
      if (valeur) {
        const config = { ...CONFIG_DEFAUT, ...JSON.parse(valeur) };
        // Mettre à jour le cache local
        if (typeof window !== 'undefined') {
          localStorage.setItem(CLE_LS, valeur);
        }
        return config;
      }
    }
  } catch { /* réseau indisponible → fallback */ }

  // Fallback localStorage
  if (typeof window === 'undefined') return CONFIG_DEFAUT;
  try {
    const raw = localStorage.getItem(CLE_LS);
    if (raw) return { ...CONFIG_DEFAUT, ...JSON.parse(raw) };
  } catch { /* */ }
  return CONFIG_DEFAUT;
}

// Lecture synchrone depuis le cache local uniquement (pour l'initialisation d'état)
export function lireConfig(): ConfigAffichage {
  if (typeof window === 'undefined') return CONFIG_DEFAUT;
  try {
    const raw = localStorage.getItem(CLE_LS);
    if (!raw) return CONFIG_DEFAUT;
    return { ...CONFIG_DEFAUT, ...JSON.parse(raw) };
  } catch {
    return CONFIG_DEFAUT;
  }
}

// ── Sauvegarde : API + cache local ──────────────────────────────────────────

export async function sauvegarderConfigAsync(config: ConfigAffichage, token: string): Promise<void> {
  const valeur = JSON.stringify(config);
  // Sauvegarder en base via l'API
  const res = await fetch(`${API_URL}/configuration/${CLE_API}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ valeur }),
  });
  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status}`);
  }
  // Mettre à jour le cache local
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLE_LS, valeur);
  }
}

// Compatibilité : sauvegarde locale uniquement (utilisée pour l'aperçu temps réel)
export function sauvegarderConfig(config: ConfigAffichage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLE_LS, JSON.stringify(config));
}

export async function reinitialiserConfigAsync(token: string): Promise<void> {
  await fetch(`${API_URL}/configuration/${CLE_API}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ valeur: '' }),
  });
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CLE_LS);
  }
}

export function reinitialiserConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CLE_LS);
}

export const POLICES_SYSTEME = [
  { value: 'Georgia, serif',                    label: 'Georgia' },
  { value: "'Times New Roman', serif",           label: 'Times New Roman' },
  { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display' },
  { value: 'Arial, sans-serif',                  label: 'Arial' },
  { value: "'Montserrat', Arial, sans-serif",    label: 'Montserrat' },
  { value: "'Raleway', Arial, sans-serif",       label: 'Raleway' },
  { value: "'Oswald', Arial, sans-serif",        label: 'Oswald' },
  { value: "'Lato', Arial, sans-serif",          label: 'Lato' },
];

// URL de base pour charger les polices Google utilisées dans POLICES_SYSTEME
export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Raleway:wght@400;700;900&family=Oswald:wght@400;700&family=Lato:wght@400;700;900&display=swap';

// Construit l'URL Google Fonts pour une liste de familles
export function construireGoogleFontsUrl(familles: string[]): string {
  if (familles.length === 0) return '';
  const params = familles
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;700;900`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

// Injecte une feuille de style dans le <head> si pas déjà présente
export function injecterCSS(id: string, css: string): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

// Injecte un lien Google Fonts dans le <head>
export function injecterGoogleFont(id: string, url: string): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}
