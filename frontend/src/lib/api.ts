import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
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

// Hôtels
export const obtenirHotels = () => api.get('/hotels');
export const obtenirHotelParId = (id: number) => api.get(`/hotels/${id}`);
export const obtenirHotelParSlug = (slug: string) => api.get(`/hotels/slug/${slug}`);
export const obtenirStatsHotel = (id: number) => api.get(`/hotels/${id}/statistiques`);
export const creerHotel = (data: any) => api.post('/hotels', data);
export const modifierHotel = (id: number, data: any) => api.patch(`/hotels/${id}`, data);
export const supprimerHotel = (id: number) => api.delete(`/hotels/${id}`);

// Réservations (public — passe hotelId en query param)
export const obtenirReservations = (hotelId?: number, dateDebut?: string, dateFin?: string) =>
  api.get('/reservations', { params: { hotelId, dateDebut, dateFin } });

export const creerReservation = (data: any) => api.post('/reservations', data);
export const modifierReservation = (id: number, data: any) => api.patch(`/reservations/${id}`, data);
export const supprimerReservation = (id: number) => api.delete(`/reservations/${id}`);

// Étages
export const obtenirEtages = (hotelId?: number) => api.get('/etages', { params: hotelId ? { hotelId } : {} });
export const creerEtage = (data: any) => api.post('/etages', data);
export const supprimerEtage = (id: number) => api.delete(`/etages/${id}`);
export const modifierEtage = (id: number, data: any) => api.patch(`/etages/${id}`, data);

// Salles
export const obtenirSalles = (hotelId?: number) => api.get('/salles', { params: hotelId ? { hotelId } : {} });
export const creerSalle = (data: any) => api.post('/salles', data);
export const supprimerSalle = (id: number) => api.delete(`/salles/${id}`);
export const modifierSalle = (id: number, data: any) => api.patch(`/salles/${id}`, data);

// Entreprises
export const obtenirEntreprises = (hotelId?: number) => api.get('/entreprises', { params: hotelId ? { hotelId } : {} });
export const creerEntreprise = (data: any) => api.post('/entreprises', data);
export const supprimerEntreprise = (id: number) => api.delete(`/entreprises/${id}`);
export const modifierEntreprise = (id: number, data: any) => api.patch(`/entreprises/${id}`, data);

// Configuration
export const lireConfigurationAPI = (cle: string, hotelId?: number) =>
  api.get(`/configuration/${cle}`, { params: hotelId ? { hotelId } : {} });
export const sauvegarderConfigurationAPI = (cle: string, valeur: string) =>
  api.put(`/configuration/${cle}`, { valeur });

// Utilisateurs
export const obtenirUtilisateurs = (hotelId?: number) =>
  api.get('/utilisateurs', { params: hotelId ? { hotelId } : {} });
export const creerUtilisateur = (data: any) => api.post('/utilisateurs', data);
export const supprimerUtilisateur = (id: number) => api.delete(`/utilisateurs/${id}`);
export const modifierUtilisateur = (id: number, data: any) => api.patch(`/utilisateurs/${id}`, data);
export const modifierProfil = (data: any) => api.patch('/utilisateurs/moi', data);

export default api;
