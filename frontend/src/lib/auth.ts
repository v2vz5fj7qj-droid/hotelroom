export interface UtilisateurConnecte {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
}

export function obtenirUtilisateurConnecte(): UtilisateurConnecte | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('utilisateur');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function estConnecte(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

export function deconnexion() {
  localStorage.removeItem('token');
  localStorage.removeItem('utilisateur');
}

export function aLeDroit(roleUtilisateur: string, rolesAutorises: string[]): boolean {
  return rolesAutorises.includes(roleUtilisateur);
}
