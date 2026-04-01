'use client';

import { useEffect, useState, useCallback } from 'react';
import { obtenirReservations } from '@/lib/api';
import { lireConfigAsync, ConfigAffichage, CONFIG_DEFAUT, GOOGLE_FONTS_URL, injecterGoogleFont, injecterCSS } from '@/lib/configAffichage';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

interface Reservation {
  id: number;
  dateDebut: string;
  dateFin: string;
  heureDebut: string | null;
  heureFin: string | null;
  estJourneeEntiere: boolean;
  notes: string;
  statut: string;
  salle: { id: number; nom: string; etage: { numero: number; nom: string } };
  entreprise: { id: number; nom: string; logoUrl?: string | null; actif?: boolean };
}

function formaterEtage(etage: { numero: number; nom: string }): string {
  return etage.numero === 0 ? 'RDC' : `${etage.numero === 1 ? '1er' : `${etage.numero}ème`} ÉTAGE`;
}

function trierReservations(r: Reservation[]): Reservation[] {
  return [...r].sort((a, b) => {
    if (a.estJourneeEntiere && !b.estJourneeEntiere) return -1;
    if (!a.estJourneeEntiere && b.estJourneeEntiere) return 1;
    return (a.heureDebut ?? '').localeCompare(b.heureDebut ?? '');
  });
}

export default function AffichageClient() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [heure, setHeure] = useState(dayjs());
  const [cfg, setCfg] = useState<ConfigAffichage>(CONFIG_DEFAUT);

  const charger = useCallback(async () => {
    try {
      const aujourd = dayjs().format('YYYY-MM-DD');
      const { data } = await obtenirReservations(undefined, aujourd, aujourd);
      setReservations(data);
    } catch { /* silencieux */ }
  }, []);

  // Lecture config depuis l'API (persistée en base) + écoute localStorage pour mises à jour temps réel
  useEffect(() => {
    const appliquerConfig = (config: ConfigAffichage) => {
      for (const p of config.policesPersonnalisees) {
        if (p.source === 'google' && p.cssUrl) {
          injecterGoogleFont(`gf-${p.id}`, p.cssUrl);
        } else if (p.source === 'fichier' && p.base64) {
          injecterCSS(`ff-${p.id}`, `@font-face { font-family: '${p.label}'; src: url('${p.base64}'); }`);
        }
      }
      setCfg(config);
    };

    // Injecter les polices système Google Fonts via <link> (une seule fois)
    injecterGoogleFont('gf-systeme', GOOGLE_FONTS_URL);

    // Chargement initial depuis l'API
    lireConfigAsync().then(appliquerConfig);

    // Écoute des changements temps réel depuis l'onglet admin
    const onStorage = () => lireConfigAsync().then(appliquerConfig);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setHeure(dayjs()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    charger();
    const poll = setInterval(charger, 30_000);
    return () => clearInterval(poll);
  }, [charger]);

  const triees = trierReservations(
    reservations.filter(
      (r) => r.statut !== 'ANNULEE' && r.statut !== 'REPORTEE' && r.entreprise.actif !== false,
    ),
  );
  const tailleNomVmin = `clamp(28px, ${cfg.tailleNom}vmin, 160px)`;
  const sloganLignes = cfg.texteSlogan.split('\n');

  return (
    <div style={{
      minHeight: '100vh',
      minWidth: '100vw',
      background: cfg.couleurFond,
      fontFamily: cfg.police,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Styles dynamiques — recréés à chaque changement de police */}
      <style key={cfg.police}>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Responsive ── */
        .affichage-wrapper {
          width: 100%;
          max-width: min(780px, 95vw);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 0 clamp(16px, 4vw, 48px);
          position: relative;
          z-index: 1;
        }

        .affichage-date-text {
          font-size: clamp(14px, 2.2vw, 24px);
          font-weight: 700;
          letter-spacing: clamp(1px, 0.3vw, 4px);
          text-transform: uppercase;
          font-family: Arial, sans-serif;
          white-space: nowrap;
          color: ${cfg.couleurDate};
        }

        .affichage-nom-entreprise {
          font-size: ${tailleNomVmin};
          font-weight: 900;
          text-transform: uppercase;
          line-height: 1.05;
          letter-spacing: clamp(1px, 0.3vw, 3px);
          padding: clamp(16px, 3vmin, 36px) 0 clamp(12px, 2.5vmin, 28px);
          word-break: break-word;
          text-align: center;
          color: ${cfg.couleurTitre};
          font-family: ${cfg.police};
        }

        .affichage-salle-label {
          font-size: clamp(10px, 1.2vw, 13px);
          font-weight: 400;
          letter-spacing: clamp(2px, 0.4vw, 5px);
          text-transform: uppercase;
          font-family: Arial, sans-serif;
          color: ${cfg.couleurSalle}99;
          margin-bottom: clamp(2px, 0.4vmin, 5px);
        }

        .affichage-salle-nom {
          font-size: clamp(20px, 3.5vmin, 46px);
          font-weight: 900;
          letter-spacing: clamp(1px, 0.3vw, 4px);
          text-transform: uppercase;
          font-family: Arial, sans-serif;
          color: ${cfg.couleurSalle};
          line-height: 1;
        }

        .affichage-etage-badge {
          display: inline-block;
          background: ${cfg.couleurLignes};
          color: #fff;
          font-size: clamp(11px, 1.6vmin, 18px);
          font-weight: 700;
          letter-spacing: clamp(1px, 0.2vw, 3px);
          text-transform: uppercase;
          font-family: Arial, sans-serif;
          padding: clamp(3px, 0.5vmin, 6px) clamp(10px, 1.5vw, 20px);
          border-radius: 4px;
          margin-top: clamp(6px, 1vmin, 10px);
        }

        .affichage-creneau {
          font-size: clamp(11px, 1.5vmin, 16px);
          font-weight: 600;
          letter-spacing: 1px;
          color: ${cfg.couleurTitre};
          margin-top: clamp(4px, 0.8vmin, 8px);
          font-family: Arial, sans-serif;
        }

        .affichage-ligne {
          height: 2px;
          background: ${cfg.couleurLignes};
          flex: 1;
          min-width: clamp(8px, 2vw, 32px);
        }

        .affichage-footer {
          border-top: 2px solid ${cfg.couleurLignes};
          padding: clamp(12px, 2vmin, 20px) 0 clamp(16px, 3vmin, 32px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: clamp(8px, 2vw, 24px);
          flex-shrink: 0;
        }

        .affichage-slogan {
          text-align: center;
          font-family: Arial, sans-serif;
          font-size: clamp(10px, 1.3vw, 14px);
          letter-spacing: clamp(0.5px, 0.15vw, 1.5px);
          line-height: 1.6;
          color: #1a1a1a;
        }

        .logo-nom {
          font-size: clamp(10px, 1.4vw, 13px);
          font-weight: 700;
          letter-spacing: clamp(1px, 0.3vw, 3px);
          text-transform: uppercase;
          color: ${cfg.couleurTitre};
          font-family: Arial, sans-serif;
          line-height: 1.3;
          text-align: center;
        }

        .logo-cercle {
          width: clamp(28px, 4vmin, 44px);
          height: clamp(28px, 4vmin, 44px);
          border-radius: 50%;
          border: 3px solid ${cfg.couleurTitre};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          position: relative;
        }

        .logo-point {
          width: 38%;
          height: 38%;
          border-radius: 50%;
          background: ${cfg.couleurTitre};
        }

        /* Landscape : augmenter la grille */
        @media (orientation: landscape) and (min-width: 900px) {
          .affichage-wrapper { max-width: min(1100px, 95vw); }
          .affichage-grille { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: clamp(8px, 2vw, 24px); }
          .affichage-grille .affichage-item { border: 2px solid ${cfg.couleurLignes}22; border-radius: 12px; padding: clamp(12px, 2vw, 24px); }
        }
      `}</style>

      {/* Motif pointillé */}
      {cfg.afficherPointilles && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: `radial-gradient(circle, ${cfg.couleurPointilles}20 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
          WebkitMaskImage: `
            radial-gradient(ellipse 38% 42% at 4% 4%, black, transparent),
            radial-gradient(ellipse 38% 42% at 96% 4%, black, transparent),
            radial-gradient(ellipse 38% 42% at 4% 96%, black, transparent),
            radial-gradient(ellipse 38% 42% at 96% 96%, black, transparent)
          `,
          WebkitMaskComposite: 'source-over',
          maskImage: `
            radial-gradient(ellipse 38% 42% at 4% 4%, black, transparent),
            radial-gradient(ellipse 38% 42% at 96% 4%, black, transparent),
            radial-gradient(ellipse 38% 42% at 4% 96%, black, transparent),
            radial-gradient(ellipse 38% 42% at 96% 96%, black, transparent)
          `,
          maskComposite: 'add',
        }} />
      )}

      <div className="affichage-wrapper">

        {/* ── Date ── */}
        <header style={{ paddingTop: 'clamp(24px, 5vmin, 56px)', paddingBottom: 'clamp(8px, 1.5vmin, 16px)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 20px)' }}>
            <div className="affichage-ligne" />
            <span className="affichage-date-text">{heure.format('dddd D MMMM YYYY')}</span>
            <div className="affichage-ligne" />
          </div>
        </header>

        {/* ── Programmes ── */}
        <main style={{ flex: 1, paddingBottom: 'clamp(16px, 3vmin, 40px)' }}>
          {triees.length === 0 ? (
            cfg.imageDefaut ? (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'clamp(16px, 3vmin, 40px) 0',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cfg.imageDefaut}
                  alt="Bravia Hôtel"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '60vh',
                    objectFit: 'contain',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  }}
                />
              </div>
            ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: '40vh', gap: 16, opacity: 0.35,
            }}>
              <div style={{ fontSize: 'clamp(40px, 8vmin, 80px)' }}>📅</div>
              <div style={{
                fontSize: 'clamp(14px, 2.5vmin, 24px)', fontWeight: 600,
                letterSpacing: 2, textTransform: 'uppercase',
                color: cfg.couleurTitre, fontFamily: 'Arial, sans-serif',
              }}>
                Aucun programme aujourd'hui
              </div>
            </div>
            )
          ) : (
            <div className="affichage-grille">
              {triees.map((r) => (
                <div key={r.id} className="affichage-item" style={{ textAlign: 'center' }}>
                  {/* Logo ou nom entreprise */}
                  {r.entreprise.logoUrl
                    ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.entreprise.logoUrl}
                        alt={r.entreprise.nom}
                        style={{
                          maxHeight: tailleNomVmin,
                          maxWidth: '80%',
                          objectFit: 'contain',
                          margin: '0 auto',
                          display: 'block',
                          padding: 'clamp(8px, 1.5vmin, 20px) 0',
                        }}
                      />
                    ) : (
                      <div className="affichage-nom-entreprise">{r.entreprise.nom}</div>
                    )
                  }

                  {/* Bloc salle mis en valeur */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 20px)', marginBottom: 'clamp(6px, 1.2vmin, 14px)' }}>
                    <div className="affichage-ligne" />
                    <div style={{ textAlign: 'center' }}>
                      <div className="affichage-salle-label">Salle</div>
                      <div className="affichage-salle-nom">{r.salle.nom}</div>
                      <div className="affichage-etage-badge">{formaterEtage(r.salle.etage)}</div>
                      {cfg.afficherCreneaux && !r.estJourneeEntiere && (
                        <div className="affichage-creneau">
                          {r.heureDebut?.slice(0, 5)} – {r.heureFin?.slice(0, 5)}
                        </div>
                      )}
                    </div>
                    <div className="affichage-ligne" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="affichage-footer">
          <LogoBravia cfg={cfg} />
          <div className="affichage-slogan">
            {sloganLignes.map((ligne, i) => {
              const mots = ligne.split(' ');
              const dernierMot = mots.pop();
              return (
                <div key={i}>
                  {mots.join(' ')}{mots.length > 0 ? ' ' : ''}
                  <strong>{dernierMot}</strong>
                </div>
              );
            })}
          </div>
          <LogoBravia cfg={cfg} />
        </footer>
      </div>
    </div>
  );
}

function LogoBravia({ cfg }: { readonly cfg: ConfigAffichage }) {
  if (cfg.logoImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={cfg.logoImageUrl} alt="Logo" style={{ height: 'clamp(36px, 6vmin, 64px)', objectFit: 'contain' }} />
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'clamp(56px, 8vmin, 90px)' }}>
      <div className="logo-cercle">
        <div className="logo-point" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div key={deg} style={{
            position: 'absolute', width: 2, height: '28%',
            background: cfg.couleurTitre, borderRadius: 1,
            transformOrigin: '50% 100%',
            transform: `rotate(${deg}deg) translateY(-100%) translateY(-2px)`,
            top: '15%', left: 'calc(50% - 1px)',
          }} />
        ))}
      </div>
      <div className="logo-nom">
        {cfg.logoNom}<br />
        <span style={{ fontWeight: 400, letterSpacing: 1 }}>{cfg.logoSousNom}</span>
      </div>
    </div>
  );
}
