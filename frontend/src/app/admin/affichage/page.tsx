'use client';

import { useEffect, useState, useRef } from 'react';
import {
  App, Card, Row, Col, Select, Slider, Switch, Input, Button,
  Space, Typography, Divider, Upload, Tooltip, Popconfirm, Tag,
} from 'antd';
import {
  DesktopOutlined, SaveOutlined, UndoOutlined, EyeOutlined,
  UploadOutlined, DeleteOutlined, PlusOutlined, FontColorsOutlined, BgColorsOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { HexColorPicker } from 'react-colorful';
import {
  lireConfigAsync, sauvegarderConfig, sauvegarderConfigAsync,
  reinitialiserConfigAsync, reinitialiserConfig,
  ConfigAffichage, CONFIG_DEFAUT, POLICES_SYSTEME, PolicePersonnalisee,
  injecterGoogleFont, injecterCSS, construireGoogleFontsUrl,
  THEMES_PRESET, ThemePreset,
} from '@/lib/configAffichage';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

const { Title, Text } = Typography;

// ── Composants utilitaires définis HORS du composant principal ────────────────
// (évite la recréation de types à chaque render, ce qui forcerait un démontage)

function Section({ titre, children }: { titre: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Divider style={{ color: COULEURS.primaire, borderColor: COULEURS.primaire + '40', marginBottom: 16 }}>
        <Text strong style={{ color: COULEURS.primaire, fontSize: 13 }}>{titre}</Text>
      </Divider>
      {children}
    </div>
  );
}

function LigneConfig({ label, children, aide }: { label: string; children: React.ReactNode; aide?: string }) {
  return (
    <Row align="middle" style={{ marginBottom: 16 }} gutter={16}>
      <Col span={10}>
        <Text style={{ fontSize: 13 }}>{label}</Text>
        {aide && <div><Text type="secondary" style={{ fontSize: 11 }}>{aide}</Text></div>}
      </Col>
      <Col span={14}>{children}</Col>
    </Row>
  );
}

/** Sélecteur de couleur avec palette clic-et-glisser */
function ChoixCouleur({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ouvert]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div
        onClick={() => setOuvert((o) => !o)}
        style={{
          width: 36, height: 32, borderRadius: 6,
          background: value, border: '1px solid #d9d9d9', cursor: 'pointer',
          boxShadow: ouvert ? `0 0 0 2px ${COULEURS.primaire}40` : undefined,
          flexShrink: 0,
        }}
      />
      <Input
        value={value}
        onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v); }}
        style={{ width: 96, fontFamily: 'monospace', fontSize: 13 }}
        maxLength={7}
      />
      {ouvert && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          zIndex: 1000, background: '#fff', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)', padding: 12,
        }}>
          <HexColorPicker color={value} onChange={onChange} />
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <Input
              value={value}
              onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v); }}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, textAlign: 'center' }}
              maxLength={7}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const LABEL_CATEGORIE: Record<ThemePreset['categorie'], { label: string; color: string }> = {
  saison:    { label: 'Saison',     color: 'green' },
  evenement: { label: 'Événement',  color: 'purple' },
  ambiance:  { label: 'Ambiance',   color: 'blue' },
};

function CarteTheme({
  theme,
  actif,
  onAppliquer,
}: {
  theme: ThemePreset;
  actif: boolean;
  onAppliquer: (t: ThemePreset) => void;
}) {
  const c = theme.config;
  const cat = LABEL_CATEGORIE[theme.categorie];
  return (
    <div
      onClick={() => onAppliquer(theme)}
      style={{
        cursor: 'pointer',
        borderRadius: 10,
        border: actif ? `2px solid ${COULEURS.primaire}` : '2px solid transparent',
        boxShadow: actif
          ? `0 0 0 2px ${COULEURS.primaire}40, 0 2px 12px rgba(0,0,0,0.10)`
          : '0 1px 6px rgba(0,0,0,0.08)',
        background: c.couleurFond ?? '#fff',
        overflow: 'hidden',
        transition: 'box-shadow 0.18s, border 0.18s',
        userSelect: 'none',
      }}
    >
      {/* Bande de couleurs */}
      <div style={{ display: 'flex', height: 8 }}>
        <div style={{ flex: 1, background: c.couleurTitre ?? '#701c45' }} />
        <div style={{ flex: 1, background: c.couleurLignes ?? '#701c45' }} />
        <div style={{ flex: 1, background: c.couleurSalle ?? '#1a1a1a' }} />
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>{theme.emoji}</span>
          <span style={{
            fontWeight: 700, fontSize: 13,
            color: c.couleurTitre ?? '#701c45',
            fontFamily: c.police ?? 'Georgia, serif',
            flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {theme.nom}
          </span>
          {actif && <Tag color={COULEURS.primaire} style={{ fontSize: 10, marginRight: 0 }}>Actif</Tag>}
        </div>
        <Tag color={cat.color} style={{ fontSize: 10, marginBottom: 6 }}>{cat.label}</Tag>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>{theme.description}</div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

function PageConfigAffichageInner() {
  const { message } = App.useApp();
  const [cfg, setCfg] = useState<ConfigAffichage>(CONFIG_DEFAUT);
  const [modifie, setModifie] = useState(false);
  const [themeActifId, setThemeActifId] = useState<string | null>(null);
  const [filtreCategorie, setFiltreCategorie] = useState<string>('tous');
  const previewRef = useRef<Window | null>(null);
  const [nomGoogleFont, setNomGoogleFont] = useState('');
  const [chargementFont, setChargementFont] = useState(false);

  useEffect(() => {
    const u = obtenirUtilisateurConnecte();
    lireConfigAsync(u?.hotelId ?? undefined).then((config) => {
      setCfg(config);
      for (const p of config.policesPersonnalisees) {
        if (p.source === 'google' && p.cssUrl) {
          injecterGoogleFont(`gf-${p.id}`, p.cssUrl);
        } else if (p.source === 'fichier' && p.base64) {
          injecterCSS(`ff-${p.id}`, `@font-face { font-family: '${p.label}'; src: url('${p.base64}'); }`);
        }
      }
    });
  }, []);

  const maj = (champ: keyof ConfigAffichage, valeur: any) => {
    setCfg((prev) => ({ ...prev, [champ]: valeur }));
    setThemeActifId(null);
    setModifie(true);
  };

  const appliquerTheme = (theme: ThemePreset) => {
    setCfg((prev) => ({ ...prev, ...theme.config }));
    setThemeActifId(theme.id);
    setModifie(true);
  };

  const enregistrer = async () => {
    const u = obtenirUtilisateurConnecte();
    const token = localStorage.getItem('token') || '';
    try {
      await sauvegarderConfigAsync(cfg, token, u?.hotelId ?? undefined);
      setModifie(false);
      message.success('Configuration enregistrée');
    } catch {
      message.error('Erreur lors de la sauvegarde');
    }
  };

  const reinitialiser = async () => {
    const u = obtenirUtilisateurConnecte();
    const token = localStorage.getItem('token') || '';
    try {
      await reinitialiserConfigAsync(token, u?.hotelId ?? undefined);
      reinitialiserConfig(u?.hotelId ?? undefined);
      setCfg(CONFIG_DEFAUT);
      setModifie(false);
      message.success('Configuration réinitialisée');
    } catch {
      message.error('Erreur lors de la réinitialisation');
    }
  };

  const ouvrir = () => {
    const u = obtenirUtilisateurConnecte();
    const slug = u?.hotel?.slug;
    sauvegarderConfig(cfg, u?.hotelId ?? undefined);
    previewRef.current = window.open(slug ? `/affichage/${slug}` : '/affichage', '_blank') ?? null;
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => maj('logoImageUrl', e.target?.result as string);
    reader.readAsDataURL(file);
    return false;
  };

  const ajouterGoogleFont = () => {
    const nom = nomGoogleFont.trim();
    if (!nom) return;
    if (cfg.policesPersonnalisees.some((p) => p.label.toLowerCase() === nom.toLowerCase())) {
      message.warning('Cette police est déjà dans la liste');
      return;
    }
    setChargementFont(true);
    const id = `gf-${Date.now()}`;
    const cssUrl = construireGoogleFontsUrl([nom]);
    injecterGoogleFont(id, cssUrl);
    setTimeout(() => {
      const nouvelle: PolicePersonnalisee = {
        id, label: nom, famille: `'${nom}', sans-serif`, source: 'google', cssUrl,
      };
      setCfg((prev) => ({
        ...prev,
        policesPersonnalisees: [...prev.policesPersonnalisees, nouvelle],
      }));
      setModifie(true);
      setNomGoogleFont('');
      setChargementFont(false);
      message.success(`Police « ${nom} » ajoutée`);
    }, 800);
  };

  const ajouterFichierFont = (file: File) => {
    const nom = file.name.replace(/\.[^.]+$/, '');
    const id = `ff-${Date.now()}`;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      injecterCSS(id, `@font-face { font-family: '${nom}'; src: url('${base64}'); }`);
      const nouvelle: PolicePersonnalisee = {
        id, label: nom, famille: `'${nom}', sans-serif`, source: 'fichier', base64,
      };
      setCfg((prev) => ({
        ...prev,
        policesPersonnalisees: [...prev.policesPersonnalisees, nouvelle],
      }));
      setModifie(true);
      message.success(`Police « ${nom} » chargée`);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const supprimerPolice = (id: string) => {
    const police = cfg.policesPersonnalisees.find((p) => p.id === id);
    setCfg((prev) => {
      const nouvelleListe = prev.policesPersonnalisees.filter((p) => p.id !== id);
      const nouvellePolice = police && prev.police === police.famille
        ? POLICES_SYSTEME[0].value
        : prev.police;
      return { ...prev, policesPersonnalisees: nouvelleListe, police: nouvellePolice };
    });
    setModifie(true);
  };

  const optionsPolice = [
    {
      label: 'Polices système',
      options: POLICES_SYSTEME.map((p) => ({
        value: p.value,
        label: <span style={{ fontFamily: p.value }}>{p.label}</span>,
      })),
    },
    ...(cfg.policesPersonnalisees.length > 0
      ? [{
          label: 'Polices personnalisées',
          options: cfg.policesPersonnalisees.map((p) => ({
            value: p.famille,
            label: <span style={{ fontFamily: p.famille }}>{p.label}</span>,
          })),
        }]
      : []),
  ];

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: COULEURS.primaire }}>
            <DesktopOutlined /> Configuration de l'affichage public
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<EyeOutlined />} onClick={ouvrir}>Aperçu</Button>
            <Popconfirm
              title="Remettre tous les réglages par défaut ?"
              onConfirm={reinitialiser}
              okText="Réinitialiser"
              cancelText="Annuler"
            >
              <Button icon={<UndoOutlined />}>Réinitialiser</Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={enregistrer}
              style={{ background: COULEURS.primaire }}
              disabled={!modifie}
            >
              Enregistrer
            </Button>
          </Space>
        </Col>
      </Row>

      {modifie && (
        <div style={{
          background: '#fffbe6', border: '1px solid #ffe58f',
          borderRadius: 8, padding: '8px 16px', marginBottom: 20, fontSize: 13,
        }}>
          Modifications non enregistrées — cliquez sur <strong>Enregistrer</strong> pour appliquer sur l'écran.
        </div>
      )}

      {/* ── Sélecteur de thèmes ── */}
      <Section titre={<span><BgColorsOutlined /> Thèmes prédéfinis</span>}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Filtrer :</Text>
          {[
            { value: 'tous', label: 'Tous' },
            { value: 'saison', label: '🍂 Saisons' },
            { value: 'evenement', label: '✨ Événements' },
            { value: 'ambiance', label: '💼 Ambiances' },
          ].map((f) => (
            <Tag
              key={f.value}
              color={filtreCategorie === f.value ? COULEURS.primaire : undefined}
              style={{ cursor: 'pointer', userSelect: 'none', fontSize: 12 }}
              onClick={() => setFiltreCategorie(f.value)}
            >
              {f.label}
            </Tag>
          ))}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {THEMES_PRESET
            .filter((t) => filtreCategorie === 'tous' || t.categorie === filtreCategorie)
            .map((theme) => (
              <CarteTheme
                key={theme.id}
                theme={theme}
                actif={themeActifId === theme.id}
                onAppliquer={appliquerTheme}
              />
            ))}
        </div>
        <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
          Cliquez sur un thème pour l'appliquer. Vous pouvez ensuite affiner les couleurs et la police manuellement.
        </Text>
      </Section>

      <Row gutter={32}>
        {/* ── Colonne gauche ── */}
        <Col xs={24} lg={12}>

          <Section titre="Typographie">
            <LigneConfig label="Police de caractères">
              <Select
                style={{ width: '100%' }}
                value={cfg.police}
                onChange={(v) => maj('police', v)}
                options={optionsPolice}
              />
            </LigneConfig>
            <LigneConfig
              label="Taille du nom d'entreprise"
              aide="Ajustez selon le nombre de programmes affichés"
            >
              <Slider
                min={4} max={16} step={0.5}
                value={cfg.tailleNom}
                onChange={(v) => maj('tailleNom', v)}
                marks={{ 4: 'Petit', 9: 'Normal', 14: 'Grand', 16: 'Très grand' }}
                tooltip={{ formatter: (v) => `${v}vmin` }}
              />
            </LigneConfig>
          </Section>

          <Section titre="Polices personnalisées">
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                <FontColorsOutlined /> Google Fonts
              </Text>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Ex : Roboto, Poppins, Nunito…"
                  value={nomGoogleFont}
                  onChange={(e) => setNomGoogleFont(e.target.value)}
                  onPressEnter={ajouterGoogleFont}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={ajouterGoogleFont}
                  loading={chargementFont}
                  type="primary"
                  style={{ background: COULEURS.primaire }}
                >
                  Ajouter
                </Button>
              </Space.Compact>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Saisissez le nom exact de la police sur Google Fonts
              </Text>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                <UploadOutlined /> Fichier de police (TTF / OTF / WOFF / WOFF2)
              </Text>
              <Upload
                accept=".ttf,.otf,.woff,.woff2"
                showUploadList={false}
                beforeUpload={(file: UploadFile) => { ajouterFichierFont(file as unknown as File); return false; }}
              >
                <Button icon={<UploadOutlined />} size="small">Charger un fichier</Button>
              </Upload>
            </div>

            {cfg.policesPersonnalisees.length > 0 && (
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
                {cfg.policesPersonnalisees.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 12px', fontSize: 13,
                      borderTop: i > 0 ? '1px solid #f0f0f0' : undefined,
                      background: '#fff',
                    }}
                  >
                    <span>
                      <span style={{ fontFamily: p.famille }}>{p.label}</span>
                      <Tag
                        color={p.source === 'google' ? 'blue' : 'green'}
                        style={{ marginLeft: 8, fontSize: 10 }}
                      >
                        {p.source === 'google' ? 'Google' : 'Fichier'}
                      </Tag>
                    </span>
                    <Tooltip title="Supprimer cette police">
                      <Button
                        type="text" danger size="small" icon={<DeleteOutlined />}
                        onClick={() => supprimerPolice(p.id)}
                      />
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section titre="Couleurs des textes">
            <LigneConfig label="Nom de l'entreprise">
              <ChoixCouleur value={cfg.couleurTitre} onChange={(v) => maj('couleurTitre', v)} />
            </LigneConfig>
            <LigneConfig label="Salle / Étage">
              <ChoixCouleur value={cfg.couleurSalle} onChange={(v) => maj('couleurSalle', v)} />
            </LigneConfig>
            <LigneConfig label="Date du jour">
              <ChoixCouleur value={cfg.couleurDate} onChange={(v) => maj('couleurDate', v)} />
            </LigneConfig>
            <LigneConfig label="Lignes séparatrices">
              <ChoixCouleur value={cfg.couleurLignes} onChange={(v) => maj('couleurLignes', v)} />
            </LigneConfig>
          </Section>

        </Col>

        {/* ── Colonne droite ── */}
        <Col xs={24} lg={12}>

          <Section titre="Arrière-plan">
            <LigneConfig label="Couleur de fond">
              <ChoixCouleur value={cfg.couleurFond} onChange={(v) => maj('couleurFond', v)} />
            </LigneConfig>
            <LigneConfig label="Motif pointillé">
              <Switch
                checked={cfg.afficherPointilles}
                onChange={(v) => maj('afficherPointilles', v)}
              />
            </LigneConfig>
            {cfg.afficherPointilles && (
              <LigneConfig label="Couleur des pointillés">
                <ChoixCouleur value={cfg.couleurPointilles} onChange={(v) => maj('couleurPointilles', v)} />
              </LigneConfig>
            )}
          </Section>

          <Section titre="Logo">
            <LigneConfig label="Image du logo" aide="Remplace le logo texte si fourni">
              <Space style={{ width: '100%' }}>
                {cfg.logoImageUrl ? (
                  <Space>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cfg.logoImageUrl}
                      alt="logo"
                      style={{ height: 48, objectFit: 'contain', border: '1px solid #eee', borderRadius: 4, padding: 4 }}
                    />
                    <Tooltip title="Supprimer l'image">
                      <Button
                        type="text" danger size="small" icon={<DeleteOutlined />}
                        onClick={() => maj('logoImageUrl', '')}
                      />
                    </Tooltip>
                  </Space>
                ) : (
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file: UploadFile) => { handleLogoUpload(file as unknown as File); return false; }}
                  >
                    <Button icon={<UploadOutlined />} size="small">Charger une image</Button>
                  </Upload>
                )}
              </Space>
            </LigneConfig>
            <LigneConfig label="Nom (logo texte)">
              <Input
                value={cfg.logoNom}
                onChange={(e) => maj('logoNom', e.target.value)}
                placeholder="BRAVIA"
              />
            </LigneConfig>
            <LigneConfig label="Sous-nom (logo texte)">
              <Input
                value={cfg.logoSousNom}
                onChange={(e) => maj('logoSousNom', e.target.value)}
                placeholder="HÔTEL"
              />
            </LigneConfig>
          </Section>

          <Section titre="Footer & contenu">
            <LigneConfig label="Slogan" aide="Utilisez Entrée pour un saut de ligne">
              <Input.TextArea
                value={cfg.texteSlogan}
                onChange={(e) => maj('texteSlogan', e.target.value)}
                rows={2}
              />
            </LigneConfig>
            <LigneConfig label="Afficher les créneaux horaires">
              <Switch
                checked={cfg.afficherCreneaux}
                onChange={(v) => maj('afficherCreneaux', v)}
              />
            </LigneConfig>
          </Section>

          <Section titre="Image jour sans programme">
            <LigneConfig
              label="Image de substitution"
              aide="Affichée sur l'écran public quand aucun programme n'est prévu ce jour"
            >
              <Space style={{ width: '100%' }}>
                {cfg.imageDefaut ? (
                  <Space>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cfg.imageDefaut}
                      alt="image par défaut"
                      style={{
                        height: 64, objectFit: 'cover',
                        border: '1px solid #eee', borderRadius: 4,
                        maxWidth: 160,
                      }}
                    />
                    <Tooltip title="Supprimer l'image">
                      <Button
                        type="text" danger size="small" icon={<DeleteOutlined />}
                        onClick={() => maj('imageDefaut', '')}
                      />
                    </Tooltip>
                  </Space>
                ) : (
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file: UploadFile) => {
                      const reader = new FileReader();
                      reader.onload = (e) => maj('imageDefaut', e.target?.result as string);
                      reader.readAsDataURL(file as unknown as File);
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />} size="small">Charger une image</Button>
                  </Upload>
                )}
              </Space>
            </LigneConfig>
          </Section>

        </Col>
      </Row>

      <Divider />
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Cliquez sur <strong>Aperçu</strong> pour voir le rendu dans un nouvel onglet.
          Les modifications sont appliquées sur l'écran après <strong>Enregistrer</strong>.
        </Text>
      </div>
    </Card>
  );
}

export default function PageConfigAffichage() {
  return <App><PageConfigAffichageInner /></App>;
}
