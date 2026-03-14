'use client';

import { useEffect, useState, useCallback } from 'react';
import { Typography, Select, DatePicker, Card, Badge, Tag, Spin, Row, Col, Space, Button } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import { obtenirReservations } from '@/lib/api';
import { COULEURS } from '@/theme/theme.config';
import Link from 'next/link';

dayjs.extend(weekOfYear);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.locale('fr');

const { Title, Text } = Typography;

type VueType = 'jour' | 'semaine' | 'mois';

interface Reservation {
  id: number;
  date: string;
  heureDebut: string | null;
  heureFin: string | null;
  estJourneeEntiere: boolean;
  notes: string;
  salle: { id: number; nom: string; etage: { numero: number; nom: string } };
  entreprise: { id: number; nom: string };
}

function formaterEtage(numero: number, nom: string): string {
  if (numero === 0) return `RDC — ${nom}`;
  return `Étage ${numero} — ${nom}`;
}

function formaterCreneau(r: Reservation): string {
  if (r.estJourneeEntiere) return 'Journée entière';
  return `${r.heureDebut?.slice(0, 5)} – ${r.heureFin?.slice(0, 5)}`;
}

// Couleurs distinctes pour les entreprises
const PALETTE = ['#701c45', '#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96'];
const couleurEntreprise = (id: number) => PALETTE[id % PALETTE.length];

export default function PagePublique() {
  const [vue, setVue] = useState<VueType>('semaine');
  const [dateBase, setDateBase] = useState<Dayjs>(dayjs());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [chargement, setChargement] = useState(true);

  const chargerReservations = useCallback(async () => {
    try {
      let debut: string, fin: string;
      if (vue === 'jour') {
        debut = fin = dateBase.format('YYYY-MM-DD');
      } else if (vue === 'semaine') {
        debut = dateBase.startOf('week').format('YYYY-MM-DD');
        fin = dateBase.endOf('week').format('YYYY-MM-DD');
      } else {
        debut = dateBase.startOf('month').format('YYYY-MM-DD');
        fin = dateBase.endOf('month').format('YYYY-MM-DD');
      }
      const { data } = await obtenirReservations(debut, fin);
      setReservations(data);
    } catch {
      // silencieux sur la page publique
    } finally {
      setChargement(false);
    }
  }, [vue, dateBase]);

  useEffect(() => {
    chargerReservations();
    const intervalle = setInterval(chargerReservations, 60_000);
    return () => clearInterval(intervalle);
  }, [chargerReservations]);

  // Grouper par date
  const joursVisibles: Dayjs[] = [];
  if (vue === 'jour') {
    joursVisibles.push(dateBase);
  } else if (vue === 'semaine') {
    const debut = dateBase.startOf('week');
    for (let i = 0; i < 7; i++) joursVisibles.push(debut.add(i, 'day'));
  } else {
    const debut = dateBase.startOf('month');
    const nbJours = dateBase.daysInMonth();
    for (let i = 0; i < nbJours; i++) joursVisibles.push(debut.add(i, 'day'));
  }

  const reservParDate = (date: Dayjs) =>
    reservations.filter((r) => r.date === date.format('YYYY-MM-DD'));

  const naviguer = (direction: -1 | 1) => {
    const unite = vue === 'jour' ? 'day' : vue === 'semaine' ? 'week' : 'month';
    setDateBase((d) => d.add(direction, unite));
  };

  const titreNavigation = () => {
    if (vue === 'jour') return dateBase.format('dddd D MMMM YYYY');
    if (vue === 'semaine') {
      const debut = dateBase.startOf('week');
      const fin = dateBase.endOf('week');
      return `Semaine du ${debut.format('D MMM')} au ${fin.format('D MMM YYYY')}`;
    }
    return dateBase.format('MMMM YYYY');
  };

  return (
    <div style={{ minHeight: '100vh', background: COULEURS.fond, padding: '24px' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ color: COULEURS.primaire, margin: 0 }}>
            Bravia Hôtel — Disponibilité des Salles
          </Title>
          <Text type="secondary">Mise à jour automatique toutes les 60 secondes</Text>
        </div>
        <Link href="/admin/connexion">
          <Button type="default" style={{ borderColor: COULEURS.primaire, color: COULEURS.primaire }}>
            Accès Admin
          </Button>
        </Link>
      </div>

      {/* Contrôles */}
      <Space wrap style={{ marginBottom: 24 }}>
        <Select
          value={vue}
          onChange={setVue}
          options={[
            { value: 'jour', label: 'Vue Jour' },
            { value: 'semaine', label: 'Vue Semaine' },
            { value: 'mois', label: 'Vue Mois' },
          ]}
          style={{ width: 140 }}
        />
        <DatePicker
          value={dateBase}
          onChange={(d) => d && setDateBase(d)}
          picker={vue === 'mois' ? 'month' : vue === 'semaine' ? 'week' : 'date'}
          format={vue === 'mois' ? 'MMMM YYYY' : vue === 'semaine' ? '[Sem.] w YYYY' : 'DD/MM/YYYY'}
          allowClear={false}
        />
        <Button onClick={() => naviguer(-1)}>‹ Précédent</Button>
        <Button onClick={() => setDateBase(dayjs())}>Aujourd'hui</Button>
        <Button onClick={() => naviguer(1)}>Suivant ›</Button>
      </Space>

      {/* Titre période */}
      <Title level={4} style={{ color: COULEURS.texte, marginBottom: 16, textTransform: 'capitalize' }}>
        {titreNavigation()}
      </Title>

      {chargement ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {joursVisibles.map((jour) => {
            const resJour = reservParDate(jour);
            const estAujourdhui = jour.isSame(dayjs(), 'day');
            return (
              <Col
                key={jour.format('YYYY-MM-DD')}
                xs={24}
                sm={vue === 'mois' ? 8 : vue === 'semaine' ? 12 : 24}
                md={vue === 'mois' ? 6 : vue === 'semaine' ? 8 : 24}
                lg={vue === 'semaine' ? 6 : undefined}
              >
                <Card
                  size="small"
                  title={
                    <Space>
                      <CalendarOutlined />
                      <Text strong style={{ color: estAujourdhui ? COULEURS.primaire : COULEURS.texte }}>
                        {jour.format('dddd D MMM')}
                      </Text>
                      {estAujourdhui && <Badge color={COULEURS.primaire} text="Aujourd'hui" />}
                    </Space>
                  }
                  style={{
                    borderColor: estAujourdhui ? COULEURS.primaire : COULEURS.bordure,
                    borderWidth: estAujourdhui ? 2 : 1,
                  }}
                >
                  {resJour.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>Aucune réservation</Text>
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      {resJour
                        .sort((a, b) => {
                          if (a.estJourneeEntiere) return -1;
                          if (b.estJourneeEntiere) return 1;
                          return (a.heureDebut || '').localeCompare(b.heureDebut || '');
                        })
                        .map((r) => (
                          <div
                            key={r.id}
                            style={{
                              background: couleurEntreprise(r.entreprise.id) + '15',
                              border: `1px solid ${couleurEntreprise(r.entreprise.id)}40`,
                              borderLeft: `4px solid ${couleurEntreprise(r.entreprise.id)}`,
                              borderRadius: 6,
                              padding: '8px 10px',
                            }}
                          >
                            <Space wrap size={4}>
                              <Tag color={couleurEntreprise(r.entreprise.id)} style={{ margin: 0 }}>
                                <TeamOutlined /> {r.entreprise.nom}
                              </Tag>
                            </Space>
                            <div style={{ marginTop: 4 }}>
                              <Text style={{ fontSize: 12, display: 'block' }}>
                                <BankOutlined /> {r.salle.nom} — {formaterEtage(r.salle.etage.numero, r.salle.etage.nom)}
                              </Text>
                              <Text style={{ fontSize: 12, color: COULEURS.primaire }}>
                                <ClockCircleOutlined /> {formaterCreneau(r)}
                              </Text>
                            </div>
                          </div>
                        ))}
                    </Space>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
