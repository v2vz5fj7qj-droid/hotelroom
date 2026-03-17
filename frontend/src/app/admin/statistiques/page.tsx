'use client';

import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Select, DatePicker, Button, Table, Tag,
  Typography, Statistic, Empty, Space, Divider,
} from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  BarChartOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import { obtenirReservations, obtenirEntreprises } from '@/lib/api';
import { COULEURS } from '@/theme/theme.config';

dayjs.locale('fr');

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Entreprise {
  id: number;
  nom: string;
}

interface Reservation {
  id: number;
  date: string;
  estJourneeEntiere: boolean;
  heureDebut?: string;
  heureFin?: string;
  notes?: string;
  salle: { id: number; nom: string; etage: { numero: number } };
  entreprise: { id: number; nom: string };
}

const formatHeures = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
};

const etageLabel = (numero: number) => (numero === 0 ? 'RDC' : `Etage ${numero}`);

export default function PageStatistiques() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [entrepriseId, setEntrepriseId] = useState<number | undefined>();
  const [periode, setPeriode] = useState<[Dayjs, Dayjs] | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [chargement, setChargement] = useState(false);
  const [rechercheLancee, setRechercheLancee] = useState(false);

  useEffect(() => {
    obtenirEntreprises().then(({ data }) => setEntreprises(data));
  }, []);

  const rechercher = async () => {
    if (!entrepriseId || !periode) return;
    setChargement(true);
    setRechercheLancee(true);
    try {
      const dateDebut = periode[0].format('YYYY-MM-DD');
      const dateFin = periode[1].format('YYYY-MM-DD');
      const { data } = await obtenirReservations(dateDebut, dateFin);
      const filtre = (data as Reservation[]).filter(
        (r) => r.entreprise.id === entrepriseId,
      );
      setReservations(filtre);
    } finally {
      setChargement(false);
    }
  };

  const exporterPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const entrepriseNom = entreprises.find((e) => e.id === entrepriseId)?.nom ?? '';
    const dateDebut = periode![0].format('DD/MM/YYYY');
    const dateFin = periode![1].format('DD/MM/YYYY');

    // En-tête
    doc.setFillColor(112, 28, 69); // COULEURS.primaire
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Bravia Hotel Manager', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport de reservations', 14, 22);

    // Infos client & periode
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(entrepriseNom, 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Periode : du ${dateDebut} au ${dateFin}`, 14, 50);
    doc.text(`Genere le : ${dayjs().format('DD/MM/YYYY a HH:mm')}`, 14, 56);

    // Statistiques
    const heuresTotal = reservations
      .filter((r) => !r.estJourneeEntiere && r.heureDebut && r.heureFin)
      .reduce((acc, r) => {
        const debut = dayjs(`2000-01-01 ${r.heureDebut}`);
        const fin = dayjs(`2000-01-01 ${r.heureFin}`);
        return acc + fin.diff(debut, 'minute');
      }, 0);

    const journeesEntieres = reservations.filter((r) => r.estJourneeEntiere).length;
    const sallesUtilisees = new Set(reservations.map((r) => r.salle.id)).size;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Synthese', 14, 68);

    const stats = [
      ['Total reservations', String(reservations.length)],
      ['Journees entieres', String(journeesEntieres)],
      ['Reservations horaires', String(reservations.length - journeesEntieres)],
      ['Duree totale (horaires)', heuresTotal > 0 ? formatHeures(heuresTotal) : '—'],
      ['Salles utilisees', String(sallesUtilisees)],
    ];

    autoTable(doc, {
      startY: 72,
      head: [],
      body: stats,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { textColor: [100, 100, 100], cellWidth: 70 },
        1: { textColor: [30, 30, 30], fontStyle: 'bold' },
      },
    });

    // Tableau des réservations
    const finalY = (doc as any).lastAutoTable?.finalY ?? 110;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Detail des reservations', 14, finalY + 10);

    const lignes = [...reservations]
      .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
      .map((r) => [
        dayjs(r.date).format('DD/MM/YYYY'),
        r.salle.nom,
        etageLabel(r.salle.etage.numero),
        r.estJourneeEntiere
          ? 'Journee entiere'
          : `${r.heureDebut} - ${r.heureFin}`,
        r.estJourneeEntiere || !r.heureDebut || !r.heureFin
          ? '—'
          : formatHeures(
              dayjs(`2000-01-01 ${r.heureFin}`).diff(
                dayjs(`2000-01-01 ${r.heureDebut}`),
                'minute',
              ),
            ),
        r.notes ?? '—',
      ]);

    autoTable(doc, {
      startY: finalY + 14,
      head: [['Date', 'Salle', 'Etage', 'Creneau', 'Duree', 'Notes']],
      body: lignes,
      theme: 'striped',
      headStyles: { fillColor: [112, 28, 69], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [252, 245, 249] },
    });

    // Pied de page sur chaque page
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Page ${i} / ${totalPages}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8,
        { align: 'center' },
      );
    }

    doc.save(`reservations_${entrepriseNom.replace(/\s+/g, '_')}_${dateDebut.replace(/\//g, '-')}_${dateFin.replace(/\//g, '-')}.pdf`);
  };

  // Calcul des statistiques
  const totalReservations = reservations.length;
  const journeesEntieres = reservations.filter((r) => r.estJourneeEntiere).length;

  const heuresTotal = reservations
    .filter((r) => !r.estJourneeEntiere && r.heureDebut && r.heureFin)
    .reduce((acc, r) => {
      const debut = dayjs(`2000-01-01 ${r.heureDebut}`);
      const fin = dayjs(`2000-01-01 ${r.heureFin}`);
      return acc + fin.diff(debut, 'minute');
    }, 0);

  const sallesUtilisees = new Set(reservations.map((r) => r.salle.id)).size;

  const entrepriseSelectionnee = entreprises.find((e) => e.id === entrepriseId);

  const colonnes = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => dayjs(d).format('dddd DD MMMM YYYY'),
      sorter: (a: Reservation, b: Reservation) =>
        dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'Salle',
      key: 'salle',
      render: (_: unknown, r: Reservation) => (
        <Space>
          <HomeOutlined style={{ color: COULEURS.primaire }} />
          <span>{r.salle.nom}</span>
          <Tag color="default">{etageLabel(r.salle.etage.numero)}</Tag>
        </Space>
      ),
    },
    {
      title: 'Créneau',
      key: 'creneau',
      render: (_: unknown, r: Reservation) =>
        r.estJourneeEntiere ? (
          <Tag color="blue" icon={<CalendarOutlined />}>Journée entière</Tag>
        ) : (
          <Tag color="geekblue" icon={<ClockCircleOutlined />}>
            {r.heureDebut} – {r.heureFin}
          </Tag>
        ),
    },
    {
      title: 'Durée',
      key: 'duree',
      render: (_: unknown, r: Reservation) => {
        if (r.estJourneeEntiere) return <Text type="secondary">—</Text>;
        if (!r.heureDebut || !r.heureFin) return <Text type="secondary">—</Text>;
        const min = dayjs(`2000-01-01 ${r.heureFin}`).diff(
          dayjs(`2000-01-01 ${r.heureDebut}`),
          'minute',
        );
        return <Text>{formatHeures(min)}</Text>;
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (n: string) => n || <Text type="secondary">—</Text>,
    },
  ];

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined style={{ color: COULEURS.primaire }} />
          <span>Statistiques par client</span>
        </Space>
      }
    >
      {/* Filtres */}
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary">Entreprise</Text>
          </div>
          <Select
            style={{ width: '100%' }}
            placeholder="Sélectionner un client"
            value={entrepriseId}
            onChange={setEntrepriseId}
            options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
            showSearch
            filterOption={(input, opt) =>
              (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Col>
        <Col xs={24} sm={10}>
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary">Période</Text>
          </div>
          <RangePicker
            style={{ width: '100%' }}
            value={periode}
            onChange={(dates) => setPeriode(dates as [Dayjs, Dayjs] | null)}
            format="DD/MM/YYYY"
            placeholder={['Date de début', 'Date de fin']}
          />
        </Col>
        <Col xs={24} sm={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={rechercher}
            loading={chargement}
            disabled={!entrepriseId || !periode}
            style={{ background: COULEURS.primaire, width: '100%', marginTop: 24 }}
          >
            Rechercher
          </Button>
        </Col>
      </Row>

      {/* Résultats */}
      {rechercheLancee && (
        <>
          <Divider />

          {/* En-tête résultats + bouton export */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            {entrepriseSelectionnee && periode && (
              <div>
                <Title level={5} style={{ margin: 0, color: COULEURS.primaire }}>
                  {entrepriseSelectionnee.nom}
                </Title>
                <Text type="secondary">
                  Du {periode[0].format('DD/MM/YYYY')} au {periode[1].format('DD/MM/YYYY')}
                </Text>
              </div>
            )}
            {reservations.length > 0 && (
              <Button
                icon={<FilePdfOutlined />}
                onClick={exporterPDF}
                style={{ borderColor: COULEURS.primaire, color: COULEURS.primaire }}
              >
                Exporter PDF
              </Button>
            )}
          </div>

          {/* Cartes statistiques */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ textAlign: 'center', borderColor: COULEURS.bordure }}>
                <Statistic
                  title="Réservations"
                  value={totalReservations}
                  styles={{ content: { color: COULEURS.primaire } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ textAlign: 'center', borderColor: COULEURS.bordure }}>
                <Statistic
                  title="Journées entières"
                  value={journeesEntieres}
                  styles={{ content: { color: '#1677ff' } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ textAlign: 'center', borderColor: COULEURS.bordure }}>
                <Statistic
                  title="Durée totale (horaires)"
                  value={heuresTotal > 0 ? formatHeures(heuresTotal) : '—'}
                  styles={{ content: { color: COULEURS.accent, fontSize: 20 } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ textAlign: 'center', borderColor: COULEURS.bordure }}>
                <Statistic
                  title="Salles utilisées"
                  value={sallesUtilisees}
                  styles={{ content: { color: COULEURS.succès } }}
                />
              </Card>
            </Col>
          </Row>

          {/* Tableau */}
          {reservations.length === 0 ? (
            <Empty description="Aucune réservation trouvée pour cette période" />
          ) : (
            <Table
              dataSource={reservations}
              columns={colonnes}
              rowKey="id"
              loading={chargement}
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: false }}
            />
          )}
        </>
      )}
    </Card>
  );
}
