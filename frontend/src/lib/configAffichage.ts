export interface PolicePersonnalisee {
  id: string;
  label: string;
  famille: string;
  source: 'google' | 'fichier';
  cssUrl?: string;
  base64?: string;
}

export interface ConfigAffichage {
  police: string;
  tailleNom: number;
  couleurTitre: string;
  couleurSalle: string;
  couleurDate: string;
  couleurLignes: string;
  couleurFond: string;
  afficherPointilles: boolean;
  couleurPointilles: string;
  logoNom: string;
  logoSousNom: string;
  logoImageUrl: string;
  texteSlogan: string;
  afficherCreneaux: boolean;
  imageDefaut: string;
  policesPersonnalisees: PolicePersonnalisee[];
}

export const CONFIG_DEFAUT: ConfigAffichage = {
  police: 'Georgia, serif',
  tailleNom: 9,
  couleurTitre: '#1a1a2e',
  couleurSalle: '#1a1a1a',
  couleurDate: '#1a1a2e',
  couleurLignes: '#1a1a2e',
  couleurFond: '#f5f5f5',
  afficherPointilles: true,
  couleurPointilles: '#1a1a2e',
  logoNom: 'MON HÔTEL',
  logoSousNom: '',
  logoImageUrl: '',
  texteSlogan: 'BIENVENUE\nDans notre établissement',
  afficherCreneaux: true,
  imageDefaut: '',
  policesPersonnalisees: [],
};

const CLE_API = 'affichage';
const CLE_LS = 'hotel_manager_affichage_config';
const API_URL = (process.env.NEXT_PUBLIC_API_URL || '/api');

// ── Lecture : API en priorité, localStorage en cache/fallback ────────────────

export async function lireConfigAsync(hotelId?: number): Promise<ConfigAffichage> {
  try {
    const params = hotelId ? `?hotelId=${hotelId}` : '';
    const res = await fetch(`${API_URL}/configuration/${CLE_API}${params}`);
    if (res.ok) {
      const { valeur } = await res.json();
      if (valeur) {
        const config = { ...CONFIG_DEFAUT, ...JSON.parse(valeur) };
        if (typeof window !== 'undefined') {
          localStorage.setItem(`${CLE_LS}_${hotelId ?? 0}`, valeur);
        }
        return config;
      }
    }
  } catch { /* réseau indisponible → fallback */ }

  if (typeof window === 'undefined') return CONFIG_DEFAUT;
  try {
    const raw = localStorage.getItem(`${CLE_LS}_${hotelId ?? 0}`);
    if (raw) return { ...CONFIG_DEFAUT, ...JSON.parse(raw) };
  } catch { /* */ }
  return CONFIG_DEFAUT;
}

export function lireConfig(hotelId?: number): ConfigAffichage {
  if (typeof window === 'undefined') return CONFIG_DEFAUT;
  try {
    const raw = localStorage.getItem(`${CLE_LS}_${hotelId ?? 0}`);
    if (!raw) return CONFIG_DEFAUT;
    return { ...CONFIG_DEFAUT, ...JSON.parse(raw) };
  } catch {
    return CONFIG_DEFAUT;
  }
}

export async function sauvegarderConfigAsync(config: ConfigAffichage, token: string, hotelId?: number): Promise<void> {
  const valeur = JSON.stringify(config);
  const res = await fetch(`${API_URL}/configuration/${CLE_API}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ valeur }),
  });
  if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${CLE_LS}_${hotelId ?? 0}`, valeur);
  }
}

export function sauvegarderConfig(config: ConfigAffichage, hotelId?: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${CLE_LS}_${hotelId ?? 0}`, JSON.stringify(config));
}

export async function reinitialiserConfigAsync(token: string, hotelId?: number): Promise<void> {
  await fetch(`${API_URL}/configuration/${CLE_API}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ valeur: '' }),
  });
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${CLE_LS}_${hotelId ?? 0}`);
  }
}

export function reinitialiserConfig(hotelId?: number): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${CLE_LS}_${hotelId ?? 0}`);
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

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Raleway:wght@400;700;900&family=Oswald:wght@400;700&family=Lato:wght@400;700;900&display=swap';

export function construireGoogleFontsUrl(familles: string[]): string {
  if (familles.length === 0) return '';
  const params = familles
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;700;900`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function injecterCSS(id: string, css: string): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

export function injecterGoogleFont(id: string, url: string): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

// ── Thèmes prédéfinis ────────────────────────────────────────────────────────

export interface ThemePreset {
  id: string;
  nom: string;
  description: string;
  categorie: 'saison' | 'evenement' | 'ambiance';
  emoji: string;
  config: Partial<ConfigAffichage>;
}

export const THEMES_PRESET: ThemePreset[] = [
  {
    id: 'classique-elegant',
    nom: 'Classique Élégant',
    description: 'Bordeaux et crème, intemporel et raffiné.',
    categorie: 'ambiance',
    emoji: '🏨',
    config: {
      couleurFond: '#f0eef0', couleurTitre: '#701c45', couleurSalle: '#1a1a1a',
      couleurDate: '#701c45', couleurLignes: '#701c45', couleurPointilles: '#701c45',
      afficherPointilles: true, police: 'Georgia, serif', tailleNom: 9,
      texteSlogan: 'L\'EXCELLENCE\nAU SERVICE DE VOS ÉVÉNEMENTS',
    },
  },
  {
    id: 'nuit-de-gala',
    nom: 'Nuit de Gala',
    description: 'Fond noir, or et Playfair Display. Pour les soirées de prestige.',
    categorie: 'evenement',
    emoji: '✨',
    config: {
      couleurFond: '#0d0d0d', couleurTitre: '#c9a84c', couleurSalle: '#e8d5a3',
      couleurDate: '#c9a84c', couleurLignes: '#c9a84c', couleurPointilles: '#c9a84c',
      afficherPointilles: true, police: "'Playfair Display', Georgia, serif", tailleNom: 9,
      texteSlogan: 'UNE SOIRÉE\nD\'EXCEPTION',
    },
  },
  {
    id: 'noel-fetes',
    nom: 'Noël & Fêtes',
    description: 'Vert sapin, rouge et or. Idéal pour les événements de fin d\'année.',
    categorie: 'saison',
    emoji: '🎄',
    config: {
      couleurFond: '#1a2e1a', couleurTitre: '#e8c84c', couleurSalle: '#f5f0e0',
      couleurDate: '#c0392b', couleurLignes: '#c0392b', couleurPointilles: '#e8c84c',
      afficherPointilles: true, police: "'Raleway', Arial, sans-serif", tailleNom: 9,
      texteSlogan: 'JOYEUSES FÊTES\nÀ TOUS NOS CLIENTS',
    },
  },
  {
    id: 'ete-tropical',
    nom: 'Été Tropical',
    description: 'Blanc, orange et turquoise. Légèreté estivale.',
    categorie: 'saison',
    emoji: '🌴',
    config: {
      couleurFond: '#fafffe', couleurTitre: '#e67e22', couleurSalle: '#16a085',
      couleurDate: '#e67e22', couleurLignes: '#16a085', couleurPointilles: '#e67e22',
      afficherPointilles: true, police: "'Raleway', Arial, sans-serif", tailleNom: 9,
      texteSlogan: 'BIENVENUE DANS\nVOTRE HAVRE DE PAIX',
    },
  },
  {
    id: 'saint-valentin',
    nom: 'Saint-Valentin',
    description: 'Rose pâle et rouge cerise. Pour les événements romantiques.',
    categorie: 'evenement',
    emoji: '💕',
    config: {
      couleurFond: '#fff0f3', couleurTitre: '#c0392b', couleurSalle: '#922b21',
      couleurDate: '#c0392b', couleurLignes: '#e8a0a8', couleurPointilles: '#e8a0a8',
      afficherPointilles: true, police: "'Montserrat', Arial, sans-serif", tailleNom: 9,
      texteSlogan: 'CHAQUE MOMENT COMPTE\nCHAQUE INSTANT EST PRÉCIEUX',
    },
  },
  {
    id: 'business-pro',
    nom: 'Business Pro',
    description: 'Gris anthracite et bleu acier. Sobre pour les conférences.',
    categorie: 'ambiance',
    emoji: '💼',
    config: {
      couleurFond: '#1c2833', couleurTitre: '#5dade2', couleurSalle: '#aeb6bf',
      couleurDate: '#5dade2', couleurLignes: '#5dade2', couleurPointilles: '#5dade2',
      afficherPointilles: false, police: 'Arial, sans-serif', tailleNom: 9,
      texteSlogan: 'L\'EXCELLENCE\nAU SERVICE DE VOS PROJETS',
    },
  },
  {
    id: 'nature-printaniere',
    nom: 'Nature Printanière',
    description: 'Fond vert très pâle et Lato. Douceur du printemps.',
    categorie: 'saison',
    emoji: '🌿',
    config: {
      couleurFond: '#f0f9f0', couleurTitre: '#1e8449', couleurSalle: '#145a32',
      couleurDate: '#27ae60', couleurLignes: '#27ae60', couleurPointilles: '#82e0aa',
      afficherPointilles: true, police: "'Lato', Arial, sans-serif", tailleNom: 9,
      texteSlogan: 'LA NATURE S\'ÉVEILLE\nNOUS AUSSI',
    },
  },
  {
    id: 'coucher-de-soleil',
    nom: 'Coucher de Soleil',
    description: 'Beige chaud et orange brûlé. Ambiance chaleureuse.',
    categorie: 'ambiance',
    emoji: '🌅',
    config: {
      couleurFond: '#fdf3e3', couleurTitre: '#ca6f1e', couleurSalle: '#784212',
      couleurDate: '#ca6f1e', couleurLignes: '#e59866', couleurPointilles: '#f0b27a',
      afficherPointilles: true, police: "'Oswald', Arial, sans-serif", tailleNom: 9,
      texteSlogan: 'LÀ OÙ CHAQUE INSTANT\nDEVIENT SOUVENIR',
    },
  },
  {
    id: 'minimaliste',
    nom: 'Minimaliste',
    description: 'Blanc pur et noir. Épuré et moderne.',
    categorie: 'ambiance',
    emoji: '⬜',
    config: {
      couleurFond: '#ffffff', couleurTitre: '#111111', couleurSalle: '#333333',
      couleurDate: '#111111', couleurLignes: '#cccccc', couleurPointilles: '#aaaaaa',
      afficherPointilles: false, police: 'Arial, sans-serif', tailleNom: 9,
      texteSlogan: 'PROGRAMME DU JOUR',
    },
  },
  {
    id: 'luxe-dore',
    nom: 'Luxe Doré',
    description: 'Noir profond et or. Prestige absolu.',
    categorie: 'ambiance',
    emoji: '👑',
    config: {
      couleurFond: '#0a0a0a', couleurTitre: '#d4af37', couleurSalle: '#f5e6a3',
      couleurDate: '#d4af37', couleurLignes: '#d4af37', couleurPointilles: '#d4af37',
      afficherPointilles: true, police: "'Playfair Display', Georgia, serif", tailleNom: 9,
      texteSlogan: 'L\'ART DE RECEVOIR\nÀ SON PLUS HAUT NIVEAU',
    },
  },
  {
    id: 'automne',
    nom: 'Automne',
    description: 'Brun chaud et orange rouille. Chaleur automnale.',
    categorie: 'saison',
    emoji: '🍂',
    config: {
      couleurFond: '#fdf0e0', couleurTitre: '#a04000', couleurSalle: '#6e2c00',
      couleurDate: '#d35400', couleurLignes: '#d35400', couleurPointilles: '#e59866',
      afficherPointilles: true, police: "'Raleway', Arial, sans-serif", tailleNom: 9,
      texteSlogan: 'LES COULEURS DE\nL\'HOSPITALITÉ',
    },
  },
  {
    id: 'ciel-azur',
    nom: 'Ciel d\'Azur',
    description: 'Bleu très pâle et bleu marine. Fraîcheur et sérénité.',
    categorie: 'saison',
    emoji: '🌊',
    config: {
      couleurFond: '#eaf4fb', couleurTitre: '#1a5276', couleurSalle: '#21618c',
      couleurDate: '#2980b9', couleurLignes: '#5dade2', couleurPointilles: '#85c1e9',
      afficherPointilles: true, police: "'Montserrat', Arial, sans-serif", tailleNom: 9,
      texteSlogan: 'OÙ LE CIEL\nRENCONTRE L\'HORIZON',
    },
  },
];
