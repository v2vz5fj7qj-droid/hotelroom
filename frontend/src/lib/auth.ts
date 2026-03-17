export interface UtilisateurConnecte {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
}

function tokenEstExpire(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function obtenirUtilisateurConnecte(): UtilisateurConnecte | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token || tokenEstExpire(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
    return null;
  }
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
  const token = localStorage.getItem('token');
  if (!token || tokenEstExpire(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
    return false;
  }
  return true;
}

export function deconnexion() {
  localStorage.removeItem('token');
  localStorage.removeItem('utilisateur');
}

export function aLeDroit(roleUtilisateur: string, rolesAutorises: string[]): boolean {
  return rolesAutorises.includes(roleUtilisateur);
}
