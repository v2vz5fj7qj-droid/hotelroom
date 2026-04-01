'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card, Row, Col, Select, DatePicker, Button, Table, Tag,
  Typography, Statistic, Empty, Space, Divider, Tabs, Progress,
} from 'antd';
import {
  SearchOutlined, CalendarOutlined, ClockCircleOutlined,
  HomeOutlined, BarChartOutlined, FilePdfOutlined, ApartmentOutlined,
  BankOutlined, TrophyOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import { obtenirReservations, obtenirEntreprises, obtenirHotels, obtenirSalles } from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

dayjs.locale('fr');

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Reservation {
  id: number;
  dateDebut: string;
  dateFin: string;
  estJourneeEntiere: boolean;
  heureDebut?: string;
  heureFin?: string;
  notes?: string;
  salle: { id: number; nom: string; etage: { numero: number; nom: string } };
  entreprise: { id: number; nom: string };
}

interface Entreprise { id: number; nom: string }
interface Hotel { id: number; nom: string }

const formatHeures = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
};

const etageLabel = (numero: number) =>
  numero === 0 ? 'RDC' : `${numero === 1 ? '1er' : `${numero}ème`} Étage`;

const dureeMinutes = (r: Reservation): number => {
  if (r.estJourneeEntiere || !r.heureDebut || !r.heureFin) return 0;
  return dayjs(`2000-01-01 ${r.heureFin}`).diff(dayjs(`2000-01-01 ${r.heureDebut}`), 'minute');
};

export default function PageStatistiques() {
  const utilisateur = obtenirUtilisateurConnecte();
  const estSuperAdmin = utilisateur?.role === 'SUPER_ADMIN';

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [hotelId, setHotelId] = useState<number | undefined>(
    !estSuperAdmin ? utilisateur?.hotelId : undefined,
  );
  const [periode, setPeriode] = useState<[Dayjs, Dayjs] | null>(null);
  const [onglet, setOnglet] = useState<string>(estSuperAdmin ? 'hotel' : 'analyse');

  // --- Onglet Hôtel ---
  const [reservationsHotel, setReservationsHotel] = useState<Reservation[]>([]);
  const [chargementHotel, setChargementHotel] = useState(false);
  const [rechercheHotelLancee, setRechercheHotelLancee] = useState(false);

  // --- Onglet Par salle (HOTEL_ADMIN) ---
  const [salles, setSalles] = useState<any[]>([]);
  const [salleId, setSalleId] = useState<number | undefined>();
  const [reservationsSalle, setReservationsSalle] = useState<Reservation[]>([]);
  const [chargementSalle, setChargementSalle] = useState(false);
  const [rechercheSalleLancee, setRechercheSalleLancee] = useState(false);

  // --- Onglet Entreprise ---
  const [entrepriseId, setEntrepriseId] = useState<number | undefined>();
  const [reservationsEntreprise, setReservationsEntreprise] = useState<Reservation[]>([]);
  const [chargementEntreprise, setChargementEntreprise] = useState(false);
  const [rechercheEntrepriseLancee, setRechercheEntrepriseLancee] = useState(false);

  useEffect(() => {
    if (estSuperAdmin) obtenirHotels().then(({ data }) => setHotels(data));
    if (!estSuperAdmin) obtenirSalles().then(({ data }) => setSalles(data));
    obtenirEntreprises(hotelId).then(({ data }) => setEntreprises(data));
  }, [hotelId]);

  // Quand l'hôtel change, réinitialiser les résultats et le select entreprise
  const onHotelChange = (val: number | undefined) => {
    setHotelId(val);
    setEntrepriseId(undefined);
    setSalleId(undefined);
    setReservationsHotel([]);
    setReservationsEntreprise([]);
    setReservationsSalle([]);
    setRechercheHotelLancee(false);
    setRechercheEntrepriseLancee(false);
    setRechercheSalleLancee(false);
  };

  // --- Recherche par salle (HOTEL_ADMIN) ---
  const rechercherParSalle = async () => {
    if (!salleId || !periode) return;
    setChargementSalle(true);
    setRechercheSalleLancee(true);
    try {
      const { data } = await obtenirReservations(
        hotelId,
        periode[0].format('YYYY-MM-DD'),
        periode[1].format('YYYY-MM-DD'),
      );
      setReservationsSalle((data as Reservation[]).filter((r) => r.salle.id === salleId));
    } finally {
      setChargementSalle(false);
    }
  };

  // --- Recherche par hôtel ---
  const rechercherHotel = async () => {
    if (!periode) return;
    setChargementHotel(true);
    setRechercheHotelLancee(true);
    try {
      const { data } = await obtenirReservations(
        hotelId,
        periode[0].format('YYYY-MM-DD'),
        periode[1].format('YYYY-MM-DD'),
      );
      setReservationsHotel(data as Reservation[]);
    } finally {
      setChargementHotel(false);
    }
  };

  // --- Recherche par entreprise ---
  const rechercherEntreprise = async () => {
    if (!entrepriseId || !periode) return;
    setChargementEntreprise(true);
    setRechercheEntrepriseLancee(true);
    try {
      const { data } = await obtenirReservations(
        hotelId,
        periode[0].format('YYYY-MM-DD'),
        periode[1].format('YYYY-MM-DD'),
      );
      setReservationsEntreprise(
        (data as Reservation[]).filter((r) => r.entreprise.id === entrepriseId),
      );
    } finally {
      setChargementEntreprise(false);
    }
  };

  // --- Stats hôtel ---
  const statsHotel = useMemo(() => {
    const total = reservationsHotel.length;
    const journeesEntieres = reservationsHotel.filter((r) => r.estJourneeEntiere).length;
    const heuresTotal = reservationsHotel.reduce((acc, r) => acc + dureeMinutes(r), 0);
    const sallesUniques = new Set(reservationsHotel.map((r) => r.salle.id)).size;
    const clientsUniques = new Set(reservationsHotel.map((r) => r.entreprise.id)).size;

    // Top salles
    const parSalle: Record<number, { nom: string; etage: number; etageNom: string; nb: number; minutes: number }> = {};
    reservationsHotel.forEach((r) => {
      if (!parSalle[r.salle.id]) {
        parSalle[r.salle.id] = { nom: r.salle.nom, etage: r.salle.etage.numero, etageNom: r.salle.etage.nom, nb: 0, minutes: 0 };
      }
      parSalle[r.salle.id].nb++;
      parSalle[r.salle.id].minutes += dureeMinutes(r);
    });
    const totalJours = periode ? periode[1].diff(periode[0], 'day') + 1 : null;
    const topSalles = Object.entries(parSalle)
      .map(([id, v]) => {
        const pct = total > 0 ? Math.round((v.nb / total) * 100) : 0;
        let taux: number | null = null;
        if (totalJours && totalJours > 0) {
          const resSalle = reservationsHotel.filter((r) => r.salle.id === +id);
          const datesOccupees = new Set<string>();
          resSalle.forEach((r) => {
            let d = dayjs(r.dateDebut);
            const fin = dayjs(r.dateFin);
            while (!d.isAfter(fin)) { datesOccupees.add(d.format('YYYY-MM-DD')); d = d.add(1, 'day'); }
          });
          taux = Math.round((datesOccupees.size / totalJours) * 100);
        }
        return { id: +id, ...v, pct, taux };
      })
      .sort((a, b) => b.nb - a.nb);

    // Top clients
    const parClient: Record<number, { nom: string; nb: number; journeesEntieres: number; minutes: number }> = {};
    reservationsHotel.forEach((r) => {
      if (!parClient[r.entreprise.id]) {
        parClient[r.entreprise.id] = { nom: r.entreprise.nom, nb: 0, journeesEntieres: 0, minutes: 0 };
      }
      parClient[r.entreprise.id].nb++;
      if (r.estJourneeEntiere) parClient[r.entreprise.id].journeesEntieres++;
      parClient[r.entreprise.id].minutes += dureeMinutes(r);
    });
    const topClients = Object.entries(parClient)
      .map(([id, v]) => ({ id: +id, ...v, pct: total > 0 ? Math.round((v.nb / total) * 100) : 0 }))
      .sort((a, b) => b.nb - a.nb);

    return { total, journeesEntieres, heuresTotal, sallesUniques, clientsUniques, topSalles, topClients };
  }, [reservationsHotel, periode]);

  // --- Stats par salle (HOTEL_ADMIN) ---
  const statsSalle = useMemo(() => {
    const total = reservationsSalle.length;
    const journeesEntieres = reservationsSalle.filter((r) => r.estJourneeEntiere).length;
    const heuresTotal = reservationsSalle.reduce((acc, r) => acc + dureeMinutes(r), 0);
    const parClient: Record<number, { nom: string; nb: number }> = {};
    reservationsSalle.forEach((r) => {
      if (!parClient[r.entreprise.id]) parClient[r.entreprise.id] = { nom: r.entreprise.nom, nb: 0 };
      parClient[r.entreprise.id].nb++;
    });
    const clientPrincipal = Object.values(parClient).sort((a, b) => b.nb - a.nb)[0];
    return { total, journeesEntieres, heuresTotal, clientPrincipal };
  }, [reservationsSalle]);

  // --- Stats entreprise ---
  const statsEntreprise = useMemo(() => {
    const total = reservationsEntreprise.length;
    const journeesEntieres = reservationsEntreprise.filter((r) => r.estJourneeEntiere).length;
    const heuresTotal = reservationsEntreprise.reduce((acc, r) => acc + dureeMinutes(r), 0);
    const sallesUniques = new Set(reservationsEntreprise.map((r) => r.salle.id)).size;
    return { total, journeesEntieres, heuresTotal, sallesUniques };
  }, [reservationsEntreprise]);

  // --- Export PDF hôtel ---
  const exporterPDFHotel = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const hotelNom = hotels.find((h) => h.id === hotelId)?.nom ?? 'Hôtel';
    const dateDebut = periode![0].format('DD/MM/YYYY');
    const dateFin = periode![1].format('DD/MM/YYYY');

    doc.setFillColor(112, 28, 69);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Bravia Hotel Manager', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport statistiques hotel', 14, 22);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(hotelNom, 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Periode : du ${dateDebut} au ${dateFin}`, 14, 50);
    doc.text(`Genere le : ${dayjs().format('DD/MM/YYYY a HH:mm')}`, 14, 56);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Synthese', 14, 68);

    autoTable(doc, {
      startY: 72,
      head: [],
      body: [
        ['Total reservations', String(statsHotel.total)],
        ['Journees entieres', String(statsHotel.journeesEntieres)],
        ['Reservations horaires', String(statsHotel.total - statsHotel.journeesEntieres)],
        ['Duree totale (horaires)', statsHotel.heuresTotal > 0 ? formatHeures(statsHotel.heuresTotal) : '—'],
        ['Salles utilisees', String(statsHotel.sallesUniques)],
        ['Clients distincts', String(statsHotel.clientsUniques)],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { textColor: [100, 100, 100], cellWidth: 70 }, 1: { textColor: [30, 30, 30], fontStyle: 'bold' } },
    });

    const y1 = (doc as any).lastAutoTable?.finalY ?? 110;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Top salles', 14, y1 + 10);
    autoTable(doc, {
      startY: y1 + 14,
      head: [['Salle', 'Etage', 'Reservations', 'Duree']],
      body: statsHotel.topSalles.map((s) => [s.nom, etageLabel(s.etage), String(s.nb), s.minutes > 0 ? formatHeures(s.minutes) : '—']),
      theme: 'striped',
      headStyles: { fillColor: [112, 28, 69], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });

    const y2 = (doc as any).lastAutoTable?.finalY ?? 160;
    doc.setFont('helvetica', 'bold');
    doc.text('Portefeuille clients', 14, y2 + 10);
    autoTable(doc, {
      startY: y2 + 14,
      head: [['Entreprise', 'Reservations', 'Journees entieres', 'Duree']],
      body: statsHotel.topClients.map((c) => [c.nom, String(c.nb), String(c.journeesEntieres), c.minutes > 0 ? formatHeures(c.minutes) : '—']),
      theme: 'striped',
      headStyles: { fillColor: [112, 28, 69], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(`Page ${i} / ${totalPages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 8, { align: 'center' });
    }
    doc.save(`stats_hotel_${hotelNom.replace(/\s+/g, '_')}_${dateDebut.replace(/\//g, '-')}.pdf`);
  };

  // --- Export PDF entreprise ---
  const exporterPDFEntreprise = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const entrepriseNom = entreprises.find((e) => e.id === entrepriseId)?.nom ?? '';
    const dateDebut = periode![0].format('DD/MM/YYYY');
    const dateFin = periode![1].format('DD/MM/YYYY');

    doc.setFillColor(112, 28, 69);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Bravia Hotel Manager', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport de reservations', 14, 22);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(entrepriseNom, 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Periode : du ${dateDebut} au ${dateFin}`, 14, 50);
    doc.text(`Genere le : ${dayjs().format('DD/MM/YYYY a HH:mm')}`, 14, 56);

    autoTable(doc, {
      startY: 72,
      head: [],
      body: [
        ['Total reservations', String(statsEntreprise.total)],
        ['Journees entieres', String(statsEntreprise.journeesEntieres)],
        ['Reservations horaires', String(statsEntreprise.total - statsEntreprise.journeesEntieres)],
        ['Duree totale (horaires)', statsEntreprise.heuresTotal > 0 ? formatHeures(statsEntreprise.heuresTotal) : '—'],
        ['Salles utilisees', String(statsEntreprise.sallesUniques)],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { textColor: [100, 100, 100], cellWidth: 70 }, 1: { textColor: [30, 30, 30], fontStyle: 'bold' } },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 110;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Detail des reservations', 14, finalY + 10);

    const lignes = [...reservationsEntreprise]
      .sort((a, b) => dayjs(a.dateDebut).unix() - dayjs(b.dateDebut).unix())
      .map((r) => [
        r.dateDebut === r.dateFin
          ? dayjs(r.dateDebut).format('DD/MM/YYYY')
          : `${dayjs(r.dateDebut).format('DD/MM/YY')} → ${dayjs(r.dateFin).format('DD/MM/YY')}`,
        r.salle.nom,
        etageLabel(r.salle.etage.numero),
        r.estJourneeEntiere ? 'Journee entiere' : `${r.heureDebut} - ${r.heureFin}`,
        dureeMinutes(r) > 0 ? formatHeures(dureeMinutes(r)) : '—',
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

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(`Page ${i} / ${totalPages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 8, { align: 'center' });
    }
    doc.save(`reservations_${entrepriseNom.replace(/\s+/g, '_')}_${dateDebut.replace(/\//g, '-')}.pdf`);
  };

  // Colonnes tableau top salles
  const colonnesTopSalles = [
    {
      title: '#', key: 'rang',
      render: (_: any, __: any, i: number) => (
        i === 0 ? <TrophyOutlined style={{ color: '#f5a623' }} /> :
        i === 1 ? <TrophyOutlined style={{ color: '#9b9b9b' }} /> :
        i === 2 ? <TrophyOutlined style={{ color: '#c47c2e' }} /> :
        <Text type="secondary">{i + 1}</Text>
      ),
      width: 40,
    },
    { title: 'Salle', dataIndex: 'nom', key: 'nom', render: (v: string) => <Text strong>{v}</Text> },
    {
      title: 'Étage', key: 'etage',
      render: (_: any, r: any) => <Tag>{etageLabel(r.etage)}</Tag>,
    },
    { title: 'Réservations', dataIndex: 'nb', key: 'nb', sorter: (a: any, b: any) => b.nb - a.nb },
    {
      title: 'Durée totale', key: 'minutes',
      render: (_: any, r: any) => r.minutes > 0 ? formatHeures(r.minutes) : <Text type="secondary">—</Text>,
    },
    {
      title: '% du total', key: 'pct',
      render: (_: any, r: any) => (
        <Space>
          <Progress percent={r.pct} size="small" style={{ width: 80 }} strokeColor={COULEURS.primaire} showInfo={false} />
          <Text style={{ fontSize: 11 }}>{r.pct}%</Text>
        </Space>
      ),
    },
    ...(!estSuperAdmin ? [{
      title: "Taux d'occupation",
      key: 'taux',
      render: (_: any, r: any) => r.taux !== null && r.taux !== undefined ? (
        <Space>
          <Progress percent={r.taux} size="small" style={{ width: 80 }} strokeColor="#52c41a" showInfo={false} />
          <Text style={{ fontSize: 11 }}>{r.taux}%</Text>
        </Space>
      ) : <Text type="secondary">—</Text>,
    }] : []),
  ];

  // Colonnes tableau top clients
  const colonnesTopClients = [
    {
      title: '#', key: 'rang',
      render: (_: any, __: any, i: number) => (
        i === 0 ? <TrophyOutlined style={{ color: '#f5a623' }} /> :
        i === 1 ? <TrophyOutlined style={{ color: '#9b9b9b' }} /> :
        i === 2 ? <TrophyOutlined style={{ color: '#c47c2e' }} /> :
        <Text type="secondary">{i + 1}</Text>
      ),
      width: 40,
    },
    {
      title: 'Entreprise', dataIndex: 'nom', key: 'nom',
      render: (v: string) => <Space><BankOutlined style={{ color: COULEURS.primaire }} /><Text strong>{v}</Text></Space>,
    },
    { title: 'Réservations', dataIndex: 'nb', key: 'nb', sorter: (a: any, b: any) => b.nb - a.nb },
    {
      title: 'Journées entières', dataIndex: 'journeesEntieres', key: 'journeesEntieres',
      render: (v: number) => v > 0 ? <Tag color="blue">{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Durée totale', key: 'minutes',
      render: (_: any, r: any) => r.minutes > 0 ? formatHeures(r.minutes) : <Text type="secondary">—</Text>,
    },
    {
      title: '% du total', key: 'pct',
      render: (_: any, r: any) => (
        <Space>
          <Progress percent={r.pct} size="small" style={{ width: 80 }} strokeColor={COULEURS.primaire} showInfo={false} />
          <Text style={{ fontSize: 11 }}>{r.pct}%</Text>
        </Space>
      ),
    },
  ];

  // Colonnes tableau réservations entreprise
  const colonnesEntreprise = [
    {
      title: 'Période', key: 'date',
      render: (_: any, r: Reservation) =>
        r.dateDebut === r.dateFin
          ? dayjs(r.dateDebut).format('dddd DD MMMM YYYY')
          : `${dayjs(r.dateDebut).format('DD/MM/YYYY')} → ${dayjs(r.dateFin).format('DD/MM/YYYY')}`,
      sorter: (a: Reservation, b: Reservation) => dayjs(a.dateDebut).unix() - dayjs(b.dateDebut).unix(),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'Salle', key: 'salle',
      render: (_: any, r: Reservation) => (
        <Space>
          <HomeOutlined style={{ color: COULEURS.primaire }} />
          <span>{r.salle.nom}</span>
          <Tag color="default">{etageLabel(r.salle.etage.numero)}</Tag>
        </Space>
      ),
    },
    {
      title: 'Créneau', key: 'creneau',
      render: (_: any, r: Reservation) =>
        r.estJourneeEntiere ? (
          <Tag color="blue" icon={<CalendarOutlined />}>Journée entière</Tag>
        ) : (
          <Tag color="geekblue" icon={<ClockCircleOutlined />}>{r.heureDebut} – {r.heureFin}</Tag>
        ),
    },
    {
      title: 'Durée', key: 'duree',
      render: (_: any, r: Reservation) => {
        const min = dureeMinutes(r);
        return min > 0 ? <Text>{formatHeures(min)}</Text> : <Text type="secondary">—</Text>;
      },
    },
    { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (n: string) => n || <Text type="secondary">—</Text> },
  ];

  // Filtres communs
  const filtresCommuns = (
    <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
      {estSuperAdmin && (
        <Col xs={24} sm={8}>
          <div style={{ marginBottom: 4 }}><Text type="secondary">Hôtel</Text></div>
          <Select
            style={{ width: '100%' }}
            placeholder="Tous les hôtels"
            value={hotelId}
            onChange={onHotelChange}
            options={hotels.map((h) => ({ value: h.id, label: h.nom }))}
            allowClear
            showSearch
            filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          />
        </Col>
      )}
      <Col xs={24} sm={estSuperAdmin ? 10 : 14}>
        <div style={{ marginBottom: 4 }}><Text type="secondary">Période</Text></div>
        <RangePicker
          style={{ width: '100%' }}
          value={periode}
          onChange={(dates) => setPeriode(dates as [Dayjs, Dayjs] | null)}
          format="DD/MM/YYYY"
          placeholder={['Date de début', 'Date de fin']}
        />
      </Col>
    </Row>
  );

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined style={{ color: COULEURS.primaire }} />
          <span>Statistiques</span>
        </Space>
      }
    >
      {filtresCommuns}

      <Tabs
        activeKey={onglet}
        onChange={setOnglet}
        items={[
          // ---- Onglet SUPER_ADMIN uniquement : Par hôtel ----
          ...(estSuperAdmin ? [{
            key: 'hotel',
            label: <Space><ApartmentOutlined />Par hôtel</Space>,
            children: (
              <>
                {/* Bouton recherche */}
                <Row style={{ marginBottom: 16 }}>
                  <Col>
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={rechercherHotel}
                      loading={chargementHotel}
                      disabled={!periode}
                      style={{ background: COULEURS.primaire }}
                    >
                      Analyser
                    </Button>
                  </Col>
                </Row>

                {rechercheHotelLancee && (
                  <>
                    {/* En-tête résultats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div>
                        {hotelId && hotels.length > 0 && (
                          <Title level={5} style={{ margin: 0, color: COULEURS.primaire }}>
                            <ApartmentOutlined /> {hotels.find((h) => h.id === hotelId)?.nom ?? 'Hôtel'}
                          </Title>
                        )}
                        {periode && (
                          <Text type="secondary">
                            Du {periode[0].format('DD/MM/YYYY')} au {periode[1].format('DD/MM/YYYY')}
                          </Text>
                        )}
                      </div>
                      {statsHotel.total > 0 && (
                        <Button
                          icon={<FilePdfOutlined />}
                          onClick={exporterPDFHotel}
                          style={{ borderColor: COULEURS.primaire, color: COULEURS.primaire }}
                        >
                          Exporter PDF
                        </Button>
                      )}
                    </div>

                    {/* Cartes stats */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                      {[
                        { title: 'Réservations', value: statsHotel.total, color: COULEURS.primaire },
                        { title: 'Journées entières', value: statsHotel.journeesEntieres, color: '#1677ff' },
                        {
                          title: 'Durée totale',
                          value: statsHotel.heuresTotal > 0 ? formatHeures(statsHotel.heuresTotal) : '—',
                          color: COULEURS.accent,
                          fontSize: 20,
                        },
                        { title: 'Salles utilisées', value: statsHotel.sallesUniques, color: '#52c41a' },
                        { title: 'Clients distincts', value: statsHotel.clientsUniques, color: '#722ed1' },
                      ].map((s) => (
                        <Col xs={12} sm={8} md={4} key={s.title}>
                          <Card size="small" style={{ textAlign: 'center', borderColor: COULEURS.bordure }}>
                            <Statistic
                              title={s.title}
                              value={s.value}
                              styles={{ content: { color: s.color, fontSize: (s as any).fontSize } }}
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {statsHotel.total === 0 ? (
                      <Empty description="Aucune réservation pour cette période" />
                    ) : (
                      <>
                        <Divider orientation="left">
                          <Space><HomeOutlined style={{ color: COULEURS.primaire }} /><Text strong>Top salles</Text></Space>
                        </Divider>
                        <Table
                          dataSource={statsHotel.topSalles}
                          columns={colonnesTopSalles}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          style={{ marginBottom: 24 }}
                        />

                        <Divider orientation="left">
                          <Space><BankOutlined style={{ color: COULEURS.primaire }} /><Text strong>Portefeuille clients</Text></Space>
                        </Divider>
                        <Table
                          dataSource={statsHotel.topClients}
                          columns={colonnesTopClients}
                          rowKey="id"
                          size="small"
                          pagination={{ pageSize: 10, showSizeChanger: false }}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            ),
          }] : [
            // ---- Onglet HOTEL_ADMIN : Analyse globale ----
            {
              key: 'analyse',
              label: <Space><BarChartOutlined />Analyse</Space>,
              children: (
                <>
                  <Row style={{ marginBottom: 16 }}>
                    <Col>
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={rechercherHotel}
                        loading={chargementHotel}
                        disabled={!periode}
                        style={{ background: COULEURS.primaire }}
                      >
                        Analyser
                      </Button>
                    </Col>
                  </Row>

                  {rechercheHotelLancee && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                          {periode && (
                            <Text type="secondary">
                              Du {periode[0].format('DD/MM/YYYY')} au {periode[1].format('DD/MM/YYYY')}
                            </Text>
                          )}
                        </div>
                        {statsHotel.total > 0 && (
                          <Button icon={<FilePdfOutlined />} onClick={exporterPDFHotel} style={{ borderColor: COULEURS.primaire, color: COULEURS.primaire }}>
                            Exporter PDF
                          </Button>
                        )}
                      </div>

                      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        {[
                          { title: 'Réservations', value: statsHotel.total, color: COULEURS.primaire },
                          { title: 'Journées entières', value: statsHotel.journeesEntieres, color: '#1677ff' },
                          { title: 'Durée totale', value: statsHotel.heuresTotal > 0 ? formatHeures(statsHotel.heuresTotal) : '—', color: COULEURS.accent, fontSize: 20 },
                          { title: 'Salles utilisées', value: statsHotel.sallesUniques, color: '#52c41a' },
                          { title: 'Clients distincts', value: statsHotel.clientsUniques, color: '#722ed1' },
                        ].map((s) => (
                          <Col xs={12} sm={8} md={4} key={s.title}>
                            <Card size="small" style={{ textAlign: 'center', borderColor: COULEURS.bordure }}>
                              <Statistic title={s.title} value={s.value} styles={{ content: { color: s.color, fontSize: (s as any).fontSize } }} />
                            </Card>
                          </Col>
                        ))}
                      </Row>

                      {statsHotel.total === 0 ? (
                        <Empty description="Aucune réservation pour cette période" />
                      ) : (
                        <>
                          <Divider orientation="left">
                            <Space><HomeOutlined style={{ color: COULEURS.primaire }} /><Text strong>Salles — Utilisation et taux d'occupation</Text></Space>
                          </Divider>
                          <Table dataSource={statsHotel.topSalles} columns={colonnesTopSalles} rowKey="id" size="small" pagination={false} style={{ marginBottom: 24 }} />

                          <Divider orientation="left">
                            <Space><BankOutlined style={{ color: COULEURS.primaire }} /><Text strong>Portefeuille clients</Text></Space>
                          </Divider>
                          <Table dataSource={statsHotel.topClients} columns={colonnesTopClients} rowKey="id" size="small" pagination={{ pageSize: 10, showSizeChanger: false }} />
                        </>
                      )}
                    </>
                  )}
                </>
              ),
            },
            // ---- Onglet HOTEL_ADMIN : Par salle ----
            {
              key: 'salle',
              label: <Space><HomeOutlined />Par salle</Space>,
              children: (
                <>
                  <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={10}>
                      <div style={{ marginBottom: 4 }}><Text type="secondary">Salle</Text></div>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Sélectionner une salle"
                        value={salleId}
                        onChange={setSalleId}
                        options={salles.map((s) => ({ value: s.id, label: `${s.nom}${s.etage?.nom ? ` — ${s.etage.nom}` : ''}` }))}
                        showSearch
                        filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                      />
                    </Col>
                    <Col xs={24} sm={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={rechercherParSalle}
                        loading={chargementSalle}
                        disabled={!salleId || !periode}
                        style={{ background: COULEURS.primaire, width: '100%', marginTop: 24 }}
                      >
                        Rechercher
                      </Button>
                    </Col>
                  </Row>

                  {rechercheSalleLancee && (
                    <>
                      <Divider />
                      <div style={{ marginBottom: 20 }}>
                        <Title level={5} style={{ margin: 0, color: COULEURS.primaire }}>
                          <HomeOutlined /> {salles.find((s) => s.id === salleId)?.nom}
                        </Title>
                        {periode && (
                          <Text type="secondary">Du {periode[0].format('DD/MM/YYYY')} au {periode[1].format('DD/MM/YYYY')}</Text>
                        )}
                      </div>

                      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        {[
                          { title: 'Réservations', value: statsSalle.total, color: COULEURS.primaire },
                          { title: 'Journées entières', value: statsSalle.journeesEntieres, color: '#1677ff' },
                          { title: 'Durée totale', value: statsSalle.heuresTotal > 0 ? formatHeures(statsSalle.heuresTotal) : '—', color: COULEURS.accent, fontSize: 20 },
                          { title: 'Client principal', value: statsSalle.clientPrincipal?.nom ?? '—', color: '#722ed1', fontSize: 14 },
                        ].map((s) => (
                          <Col xs={12} sm={6} key={s.title}>
                            <Card size="small" style={{ textAlign: 'center', borderColor: COULEURS.bordure }}>
                              <Statistic title={s.title} value={s.value} styles={{ content: { color: s.color, fontSize: (s as any).fontSize } }} />
                            </Card>
                          </Col>
                        ))}
                      </Row>

                      {reservationsSalle.length === 0 ? (
                        <Empty description="Aucune réservation pour cette salle sur cette période" />
                      ) : (
                        <>
                          <Divider orientation="left">
                            <Space><CalendarOutlined style={{ color: COULEURS.primaire }} /><Text strong>Détail des réservations</Text></Space>
                          </Divider>
                          <Table
                            dataSource={reservationsSalle}
                            columns={[
                              {
                                title: 'Période', key: 'date',
                                render: (_: any, r: Reservation) =>
                                  r.dateDebut === r.dateFin
                                    ? dayjs(r.dateDebut).format('dddd DD MMMM YYYY')
                                    : `${dayjs(r.dateDebut).format('DD/MM/YYYY')} → ${dayjs(r.dateFin).format('DD/MM/YYYY')}`,
                                sorter: (a: Reservation, b: Reservation) => dayjs(a.dateDebut).unix() - dayjs(b.dateDebut).unix(),
                                defaultSortOrder: 'ascend' as const,
                              },
                              {
                                title: 'Entreprise', key: 'entreprise',
                                render: (_: any, r: Reservation) => (
                                  <Space><BankOutlined style={{ color: COULEURS.primaire }} /><span>{r.entreprise.nom}</span></Space>
                                ),
                              },
                              {
                                title: 'Créneau', key: 'creneau',
                                render: (_: any, r: Reservation) =>
                                  r.estJourneeEntiere
                                    ? <Tag color="blue" icon={<CalendarOutlined />}>Journée entière</Tag>
                                    : <Tag color="geekblue" icon={<ClockCircleOutlined />}>{r.heureDebut} – {r.heureFin}</Tag>,
                              },
                              {
                                title: 'Durée', key: 'duree',
                                render: (_: any, r: Reservation) => {
                                  const min = dureeMinutes(r);
                                  return min > 0 ? <Text>{formatHeures(min)}</Text> : <Text type="secondary">—</Text>;
                                },
                              },
                              { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (n: string) => n || <Text type="secondary">—</Text> },
                            ]}
                            rowKey="id"
                            loading={chargementSalle}
                            size="small"
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                          />
                        </>
                      )}
                    </>
                  )}
                </>
              ),
            },
          ]),
          {
            key: 'entreprise',
            label: <Space><BankOutlined />Par entreprise</Space>,
            children: (
              <>
                {/* Sélecteur entreprise + bouton */}
                <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={10}>
                    <div style={{ marginBottom: 4 }}><Text type="secondary">Entreprise cliente</Text></div>
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
                  <Col xs={24} sm={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={rechercherEntreprise}
                      loading={chargementEntreprise}
                      disabled={!entrepriseId || !periode}
                      style={{ background: COULEURS.primaire, width: '100%', marginTop: 24 }}
                    >
                      Rechercher
                    </Button>
                  </Col>
                </Row>

                {rechercheEntrepriseLancee && (
                  <>
                    <Divider />

                    {/* En-tête + export */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                      <div>
                        <Title level={5} style={{ margin: 0, color: COULEURS.primaire }}>
                          {entreprises.find((e) => e.id === entrepriseId)?.nom}
                        </Title>
                        {periode && (
                          <Text type="secondary">
                            Du {periode[0].format('DD/MM/YYYY')} au {periode[1].format('DD/MM/YYYY')}
                          </Text>
                        )}
                      </div>
                      {reservationsEntreprise.length > 0 && (
                        <Button
                          icon={<FilePdfOutlined />}
                          onClick={exporterPDFEntreprise}
                          style={{ borderColor: COULEURS.primaire, color: COULEURS.primaire }}
                        >
                          Exporter PDF
                        </Button>
                      )}
                    </div>

                    {/* Cartes stats */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                      {[
                        { title: 'Réservations', value: statsEntreprise.total, color: COULEURS.primaire },
                        { title: 'Journées entières', value: statsEntreprise.journeesEntieres, color: '#1677ff' },
                        {
                          title: 'Durée totale',
                          value: statsEntreprise.heuresTotal > 0 ? formatHeures(statsEntreprise.heuresTotal) : '—',
                          color: COULEURS.accent,
                          fontSize: 20,
                        },
                        { title: 'Salles utilisées', value: statsEntreprise.sallesUniques, color: '#52c41a' },
                      ].map((s) => (
                        <Col xs={12} sm={6} key={s.title}>
                          <Card size="small" style={{ textAlign: 'center', borderColor: COULEURS.bordure }}>
                            <Statistic
                              title={s.title}
                              value={s.value}
                              styles={{ content: { color: s.color, fontSize: (s as any).fontSize } }}
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {reservationsEntreprise.length === 0 ? (
                      <Empty description="Aucune réservation trouvée pour cette période" />
                    ) : (
                      <Table
                        dataSource={reservationsEntreprise}
                        columns={colonnesEntreprise}
                        rowKey="id"
                        loading={chargementEntreprise}
                        size="small"
                        pagination={{ pageSize: 10, showSizeChanger: false }}
                      />
                    )}
                  </>
                )}
              </>
            ),
          },
        ]}
      />
    </Card>
  );
}
