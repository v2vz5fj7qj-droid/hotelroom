import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('utilisateur');
      window.location.href = '/admin/connexion';
    }
    return Promise.reject(error);
  },
);

// Auth
export const connexion = (email: string, motDePasse: string) =>
  api.post('/auth/connexion', { email, motDePasse });

// Réservations (public)
export const obtenirReservations = (dateDebut?: string, dateFin?: string) =>
  api.get('/reservations', { params: { dateDebut, dateFin } });

export const creerReservation = (data: any) => api.post('/reservations', data);
export const modifierReservation = (id: number, data: any) => api.patch(`/reservations/${id}`, data);
export const supprimerReservation = (id: number) => api.delete(`/reservations/${id}`);

// Étages
export const obtenirEtages = () => api.get('/etages');
export const creerEtage = (data: any) => api.post('/etages', data);
export const supprimerEtage = (id: number) => api.delete(`/etages/${id}`);
export const modifierEtage = (id: number, data: any) => api.patch(`/etages/${id}`, data);

// Salles
export const obtenirSalles = () => api.get('/salles');
export const creerSalle = (data: any) => api.post('/salles', data);
export const supprimerSalle = (id: number) => api.delete(`/salles/${id}`);
export const modifierSalle = (id: number, data: any) => api.patch(`/salles/${id}`, data);

// Entreprises
export const obtenirEntreprises = () => api.get('/entreprises');
export const creerEntreprise = (data: any) => api.post('/entreprises', data);
export const supprimerEntreprise = (id: number) => api.delete(`/entreprises/${id}`);
export const modifierEntreprise = (id: number, data: any) => api.patch(`/entreprises/${id}`, data);

// Utilisateurs
export const obtenirUtilisateurs = () => api.get('/utilisateurs');
export const creerUtilisateur = (data: any) => api.post('/utilisateurs', data);
export const supprimerUtilisateur = (id: number) => api.delete(`/utilisateurs/${id}`);
export const modifierUtilisateur = (id: number, data: any) => api.patch(`/utilisateurs/${id}`, data);

export default api;
