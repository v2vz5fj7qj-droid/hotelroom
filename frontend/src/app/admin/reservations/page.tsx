'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  App, Card, Table, Button, Modal, Form, Select, DatePicker, TimePicker, Switch,
  Space, Tag, Popconfirm, Typography, Row, Col, Alert, Input, Divider, Tooltip,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, CalendarOutlined, EditOutlined,
  SearchOutlined, ClearOutlined, FilePdfOutlined, FileExcelOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/fr';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  obtenirReservations, creerReservation, modifierReservation, supprimerReservation,
  obtenirSalles, obtenirEntreprises,
} from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function formaterEtage(etage: any): string {
  if (!etage) return '';
  return etage.numero === 0 ? 'RDC' : `Étage ${etage.numero}`;
}

function formaterCreneau(r: any): string {
  if (r.estJourneeEntiere) return 'Journée entière';
  return `${r.heureDebut?.slice(0, 5)} – ${r.heureFin?.slice(0, 5)}`;
}

type EtatTemporel = 'A_VENIR' | 'EN_COURS' | 'PASSEE';

function calculerEtatTemporel(r: any): EtatTemporel {
  const maintenant = dayjs();
  const date = dayjs(r.date);
  if (r.estJourneeEntiere) {
    if (date.isBefore(maintenant, 'day')) return 'PASSEE';
    if (date.isSame(maintenant, 'day')) return 'EN_COURS';
    return 'A_VENIR';
  }
  const debut = dayjs(`${r.date} ${r.heureDebut}`);
  const fin = dayjs(`${r.date} ${r.heureFin}`);
  if (maintenant.isBefore(debut)) return 'A_VENIR';
  if (maintenant.isAfter(fin)) return 'PASSEE';
  return 'EN_COURS';
}

const ETAT_TEMPOREL_CONFIG: Record<EtatTemporel, { label: string; color: string }> = {
  A_VENIR: { label: 'À venir', color: 'blue' },
  EN_COURS: { label: 'En cours', color: 'green' },
  PASSEE: { label: 'Passée', color: 'default' },
};

type StatutReservation = 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'NO_SHOW' | 'REPORTEE';

const STATUT_CONFIG: Record<StatutReservation, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: 'orange' },
  CONFIRMEE: { label: 'Confirmée', color: 'cyan' },
  ANNULEE: { label: 'Annulée', color: 'red' },
  NO_SHOW: { label: 'No-show', color: 'volcano' },
  REPORTEE: { label: 'Reportée', color: 'purple' },
};

function lignesExport(reservations: any[]) {
  return reservations.map((r) => ({
    Date: dayjs(r.date).format('DD/MM/YYYY'),
    Créneau: formaterCreneau(r),
    Salle: r.salle?.nom ?? '',
    Étage: formaterEtage(r.salle?.etage),
    Entreprise: r.entreprise?.nom ?? '',
    Situation: ETAT_TEMPOREL_CONFIG[calculerEtatTemporel(r)].label,
    Statut: STATUT_CONFIG[r.statut as StatutReservation]?.label ?? r.statut,
    Notes: r.notes ?? '',
  }));
}

function PageReservationsInner() {
  const { message } = App.useApp();
  const [reservations, setReservations] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);

  // Formulaire
  const [modalVisible, setModalVisible] = useState(false);
  const [reservationEnEdition, setReservationEnEdition] = useState<any>(null);
  const [etatTemporelEdition, setEtatTemporelEdition] = useState<EtatTemporel | null>(null);
  const [estJourneeEntiere, setEstJourneeEntiere] = useState(false);
  const [erreurForm, setErreurForm] = useState('');
  const [form] = Form.useForm();

  // Filtres
  const [recherche, setRecherche] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState<[Dayjs, Dayjs] | null>(null);
  const [filtreSalle, setFiltreSalle] = useState<number | null>(null);
  const [filtreEntreprise, setFiltreEntreprise] = useState<number | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<string | null>(null);
  const [filtreEtat, setFiltreEtat] = useState<EtatTemporel | null>(null);

  // Export
  const [modalExportVisible, setModalExportVisible] = useState(false);
  const [formatExport, setFormatExport] = useState<'pdf' | 'excel'>('pdf');
  const [periodeExport, setPeriodeExport] = useState<[Dayjs, Dayjs] | null>(null);
  const [formExport] = Form.useForm();

  const utilisateur = obtenirUtilisateurConnecte();
  const peutModifier = utilisateur?.role === 'SUPER_ADMIN' || utilisateur?.role === 'ADMIN';

  const charger = async () => {
    setChargement(true);
    try {
      const [resRes, resSalles, resEntreprises] = await Promise.all([
        obtenirReservations(),
        obtenirSalles(),
        obtenirEntreprises(),
      ]);
      setReservations(resRes.data);
      setSalles(resSalles.data);
      setEntreprises(resEntreprises.data);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  // --- Filtrage ---
  const reservationsFiltrees = useMemo(() => {
    return reservations.filter((r) => {
      if (filtrePeriode) {
        const date = dayjs(r.date);
        if (date.isBefore(filtrePeriode[0], 'day') || date.isAfter(filtrePeriode[1], 'day')) return false;
      }
      if (filtreSalle && r.salle?.id !== filtreSalle) return false;
      if (filtreEntreprise && r.entreprise?.id !== filtreEntreprise) return false;
      if (filtreStatut && r.statut !== filtreStatut) return false;
      if (filtreEtat && calculerEtatTemporel(r) !== filtreEtat) return false;
      if (recherche) {
        const q = recherche.toLowerCase();
        const dans =
          (r.salle?.nom ?? '').toLowerCase().includes(q) ||
          (r.entreprise?.nom ?? '').toLowerCase().includes(q) ||
          (r.notes ?? '').toLowerCase().includes(q);
        if (!dans) return false;
      }
      return true;
    });
  }, [reservations, filtrePeriode, filtreSalle, filtreEntreprise, filtreStatut, filtreEtat, recherche]);

  const reinitialiserFiltres = () => {
    setRecherche('');
    setFiltrePeriode(null);
    setFiltreSalle(null);
    setFiltreEntreprise(null);
    setFiltreStatut(null);
    setFiltreEtat(null);
  };

  const filtresActifs =
    !!recherche || !!filtrePeriode || !!filtreSalle || !!filtreEntreprise || !!filtreStatut || !!filtreEtat;

  // --- Export ---
  const ouvrirExport = (format: 'pdf' | 'excel') => {
    setFormatExport(format);
    setPeriodeExport(null);
    formExport.resetFields();
    setModalExportVisible(true);
  };

  const lancerExport = () => {
    const donnees = periodeExport
      ? reservations.filter((r) => {
          const d = dayjs(r.date);
          return !d.isBefore(periodeExport[0], 'day') && !d.isAfter(periodeExport[1], 'day');
        })
      : reservations;

    const tri = [...donnees].sort((a, b) => a.date.localeCompare(b.date));
    const label = periodeExport
      ? `${periodeExport[0].format('DD-MM-YYYY')}_${periodeExport[1].format('DD-MM-YYYY')}`
      : 'toutes';

    if (formatExport === 'excel') {
      exporterExcel(tri, label);
    } else {
      exporterPDF(tri, label, periodeExport);
    }
    setModalExportVisible(false);
  };

  const exporterExcel = (donnees: any[], label: string) => {
    const lignes = lignesExport(donnees);
    const ws = XLSX.utils.json_to_sheet(lignes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Réservations');
    XLSX.writeFile(wb, `reservations_${label}.xlsx`);
  };

  const exporterPDF = (donnees: any[], label: string, periode: [Dayjs, Dayjs] | null) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.text('Bravia Hôtel — Réservations', 14, 16);
    doc.setFontSize(10);
    const sousTitre = periode
      ? `Période : ${periode[0].format('DD/MM/YYYY')} – ${periode[1].format('DD/MM/YYYY')}`
      : 'Toutes les réservations';
    doc.text(sousTitre, 14, 23);
    doc.text(`Généré le ${dayjs().format('DD/MM/YYYY à HH:mm')}`, 14, 29);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Créneau', 'Salle', 'Étage', 'Entreprise', 'Situation', 'Statut', 'Notes']],
      body: lignesExport(donnees).map((l) => Object.values(l)),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [112, 28, 69] },
      alternateRowStyles: { fillColor: [250, 245, 248] },
    });

    doc.save(`reservations_${label}.pdf`);
  };

  // --- Formulaire ---
  const ouvrirCreation = () => {
    setReservationEnEdition(null);
    setEtatTemporelEdition(null);
    setEstJourneeEntiere(false);
    form.resetFields();
    setErreurForm('');
    setModalVisible(true);
  };

  const ouvrirEdition = (r: any) => {
    setReservationEnEdition(r);
    setEtatTemporelEdition(calculerEtatTemporel(r));
    setEstJourneeEntiere(r.estJourneeEntiere);
    setErreurForm('');
    form.setFieldsValue({
      salleId: r.salle?.id,
      entrepriseId: r.entreprise?.id,
      date: dayjs(r.date),
      notes: r.notes,
      statut: r.statut ?? 'EN_ATTENTE',
      heureDebut: r.heureDebut ? dayjs(`2000-01-01 ${r.heureDebut}`) : undefined,
      heureFin: r.heureFin ? dayjs(`2000-01-01 ${r.heureFin}`) : undefined,
    });
    setModalVisible(true);
  };

  const fermerModal = () => {
    setModalVisible(false);
    setReservationEnEdition(null);
    setEtatTemporelEdition(null);
    form.resetFields();
    setErreurForm('');
    setEstJourneeEntiere(false);
  };

  const soumettre = async (valeurs: any) => {
    setErreurForm('');
    try {
      const estPassee = etatTemporelEdition === 'PASSEE';
      const payload: any = estPassee
        ? { statut: valeurs.statut }
        : {
            salleId: valeurs.salleId,
            entrepriseId: valeurs.entrepriseId,
            date: valeurs.date.format('YYYY-MM-DD'),
            estJourneeEntiere,
            notes: valeurs.notes,
            statut: valeurs.statut,
          };
      if (!estPassee && !estJourneeEntiere) {
        payload.heureDebut = valeurs.heureDebut.format('HH:mm');
        payload.heureFin = valeurs.heureFin.format('HH:mm');
      }

      if (reservationEnEdition) {
        await modifierReservation(reservationEnEdition.id, payload);
        message.success('Réservation modifiée');
      } else {
        await creerReservation(payload);
        message.success('Réservation créée');
      }

      fermerModal();
      charger();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
      setErreurForm(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const supprimer = async (id: number) => {
    await supprimerReservation(id);
    message.success('Réservation supprimée');
    charger();
  };

  const minutesDesactivees = (_hour: number) =>
    Array.from({ length: 60 }, (_, i) => i).filter((m) => m !== 0 && m !== 30);

  const colonnes = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
      sorter: (a: any, b: any) => a.date.localeCompare(b.date),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'Créneau',
      key: 'creneau',
      render: (_: any, r: any) =>
        r.estJourneeEntiere ? <Tag color="blue">Journée entière</Tag>
          : `${r.heureDebut?.slice(0, 5)} – ${r.heureFin?.slice(0, 5)}`,
    },
    {
      title: 'Salle',
      key: 'salle',
      render: (_: any, r: any) => r.salle?.nom,
    },
    {
      title: 'Étage',
      key: 'etage',
      render: (_: any, r: any) => formaterEtage(r.salle?.etage),
    },
    {
      title: 'Entreprise',
      key: 'entreprise',
      render: (_: any, r: any) => <Tag color={COULEURS.primaire}>{r.entreprise?.nom}</Tag>,
    },
    {
      title: 'Situation',
      key: 'etatTemporel',
      render: (_: any, r: any) => {
        const etat = calculerEtatTemporel(r);
        const cfg = ETAT_TEMPOREL_CONFIG[etat];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Statut',
      key: 'statut',
      render: (_: any, r: any) => {
        const statut: StatutReservation = r.statut ?? 'EN_ATTENTE';
        const cfg = STATUT_CONFIG[statut];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    ...(peutModifier ? [{
      title: 'Action',
      key: 'action',
      render: (_: any, r: any) => {
        const etat = calculerEtatTemporel(r);
        return (
          <Space>
            <Tooltip title={etat === 'PASSEE' ? 'Modifier le statut' : 'Modifier'}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => ouvrirEdition(r)}
                style={{ color: COULEURS.primaire }}
              />
            </Tooltip>
            {etat !== 'PASSEE' && (
              <Popconfirm title="Supprimer cette réservation ?" onConfirm={() => supprimer(r.id)} okText="Oui" cancelText="Non">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    }] : []),
  ];

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: COULEURS.primaire }}>
            <CalendarOutlined /> Réservations
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<FileExcelOutlined />} onClick={() => ouvrirExport('excel')} style={{ color: '#217346', borderColor: '#217346' }}>
              Excel
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={() => ouvrirExport('pdf')} style={{ color: '#c0392b', borderColor: '#c0392b' }}>
              PDF
            </Button>
            {peutModifier && (
              <Button type="primary" icon={<PlusOutlined />} onClick={ouvrirCreation}
                style={{ background: COULEURS.primaire }}>
                Nouvelle réservation
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Filtres */}
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
        <Row gutter={[12, 8]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Rechercher salle, entreprise, notes…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={filtrePeriode}
              onChange={(v) => setFiltrePeriode(v as [Dayjs, Dayjs] | null)}
              placeholder={['Date début', 'Date fin']}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="Salle"
              value={filtreSalle}
              onChange={setFiltreSalle}
              allowClear
              options={salles.map((s) => ({ value: s.id, label: s.nom }))}
            />
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="Entreprise"
              value={filtreEntreprise}
              onChange={setFiltreEntreprise}
              allowClear
              options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
            />
          </Col>
          <Col xs={12} sm={8} md={2}>
            <Select
              style={{ width: '100%' }}
              placeholder="Statut"
              value={filtreStatut}
              onChange={setFiltreStatut}
              allowClear
              options={Object.entries(STATUT_CONFIG).map(([v, { label, color }]) => ({
                value: v,
                label: <Tag color={color}>{label}</Tag>,
              }))}
            />
          </Col>
          <Col xs={12} sm={8} md={2}>
            <Select
              style={{ width: '100%' }}
              placeholder="Situation"
              value={filtreEtat}
              onChange={setFiltreEtat}
              allowClear
              options={Object.entries(ETAT_TEMPOREL_CONFIG).map(([v, { label, color }]) => ({
                value: v,
                label: <Tag color={color}>{label}</Tag>,
              }))}
            />
          </Col>
          <Col xs={24} sm={4} md={2}>
            <Button
              icon={<ClearOutlined />}
              onClick={reinitialiserFiltres}
              disabled={!filtresActifs}
              block
            >
              Réinitialiser
            </Button>
          </Col>
        </Row>
        {filtresActifs && (
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
            {reservationsFiltrees.length} résultat{reservationsFiltrees.length !== 1 ? 's' : ''} sur {reservations.length}
          </Text>
        )}
      </Card>

      <Table
        dataSource={reservationsFiltrees}
        columns={colonnes}
        rowKey="id"
        loading={chargement}
        pagination={{ pageSize: 20 }}
        size="small"
      />

      {/* Modal export */}
      <Modal
        title={
          <Space>
            {formatExport === 'pdf' ? <FilePdfOutlined style={{ color: '#c0392b' }} /> : <FileExcelOutlined style={{ color: '#217346' }} />}
            Exporter en {formatExport === 'pdf' ? 'PDF' : 'Excel'}
          </Space>
        }
        open={modalExportVisible}
        onCancel={() => setModalExportVisible(false)}
        onOk={lancerExport}
        okText="Exporter"
        okButtonProps={{ style: { background: COULEURS.primaire } }}
        cancelText="Annuler"
        width={420}
      >
        <Form form={formExport} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Période (optionnel)" help="Laissez vide pour exporter toutes les réservations.">
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={periodeExport}
              onChange={(v) => setPeriodeExport(v as [Dayjs, Dayjs] | null)}
              placeholder={['Date début', 'Date fin']}
              allowClear
            />
          </Form.Item>
          <Divider style={{ margin: '8px 0' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {periodeExport
              ? `${reservations.filter((r) => {
                  const d = dayjs(r.date);
                  return !d.isBefore(periodeExport[0], 'day') && !d.isAfter(periodeExport[1], 'day');
                }).length} réservation(s) dans cette période`
              : `${reservations.length} réservation(s) au total`}
          </Text>
        </Form>
      </Modal>

      {/* Modal formulaire */}
      <Modal
        title={
          etatTemporelEdition === 'PASSEE'
            ? 'Modifier le statut de la réservation'
            : reservationEnEdition ? 'Modifier la réservation' : 'Nouvelle réservation'
        }
        open={modalVisible}
        onCancel={fermerModal}
        footer={null}
        width={520}
      >
        {etatTemporelEdition === 'PASSEE' && (
          <Alert
            message="Réservation passée — seul le statut est modifiable."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {erreurForm && <Alert title={erreurForm} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical" onFinish={soumettre}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salleId" label="Salle" rules={[{ required: etatTemporelEdition !== 'PASSEE', message: 'Requis' }]}>
                <Select
                  placeholder="Choisir une salle"
                  disabled={etatTemporelEdition === 'PASSEE'}
                  options={salles.map((s) => ({
                    value: s.id,
                    label: `${s.nom} (${formaterEtage(s.etage)}) — ${s.capacite} pers.`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="entrepriseId" label="Entreprise" rules={[{ required: etatTemporelEdition !== 'PASSEE', message: 'Requis' }]}>
                <Select
                  placeholder="Choisir une entreprise"
                  disabled={etatTemporelEdition === 'PASSEE'}
                  options={entreprises.map((e) => ({ value: e.id, label: e.nom }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="date" label="Date" rules={[{ required: etatTemporelEdition !== 'PASSEE', message: 'Requis' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabled={etatTemporelEdition === 'PASSEE'} />
          </Form.Item>
          <Form.Item label="Journée entière">
            <Switch checked={estJourneeEntiere} onChange={setEstJourneeEntiere} disabled={etatTemporelEdition === 'PASSEE'} />
          </Form.Item>
          {!estJourneeEntiere && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="heureDebut" label="Heure de début" rules={[{ required: !estJourneeEntiere && etatTemporelEdition !== 'PASSEE', message: 'Requis' }]}>
                  <TimePicker format="HH:mm" minuteStep={30} showNow={false} style={{ width: '100%' }} disabled={etatTemporelEdition === 'PASSEE'} disabledTime={(_date) => ({ disabledMinutes: minutesDesactivees })} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="heureFin" label="Heure de fin" rules={[{ required: !estJourneeEntiere && etatTemporelEdition !== 'PASSEE', message: 'Requis' }]}>
                  <TimePicker format="HH:mm" minuteStep={30} showNow={false} style={{ width: '100%' }} disabled={etatTemporelEdition === 'PASSEE'} disabledTime={(_date) => ({ disabledMinutes: minutesDesactivees })} />
                </Form.Item>
              </Col>
            </Row>
          )}
          <Form.Item name="statut" label="Statut" initialValue="EN_ATTENTE">
            <Select
              options={Object.entries(STATUT_CONFIG)
                .filter(([value]) =>
                  etatTemporelEdition === 'A_VENIR' || (!reservationEnEdition && !etatTemporelEdition)
                    ? value !== 'NO_SHOW'
                    : true
                )
                .map(([value, { label, color }]) => ({
                  value,
                  label: <Tag color={color}>{label}</Tag>,
                }))}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes (optionnel)">
            <Input disabled={etatTemporelEdition === 'PASSEE'} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" style={{ background: COULEURS.primaire }}>
              {reservationEnEdition ? 'Enregistrer' : 'Créer'}
            </Button>
            <Button onClick={fermerModal}>Annuler</Button>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}

export default function PageReservations() {
  return (
    <App>
      <PageReservationsInner />
    </App>
  );
}
