'use client';

import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Select, DatePicker, TimePicker, Switch,
  Space, Tag, Popconfirm, message, Typography, Row, Col, Alert, Input,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import {
  obtenirReservations, creerReservation, supprimerReservation,
  obtenirSalles, obtenirEntreprises,
} from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

const { Title } = Typography;

export default function PageReservations() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [estJourneeEntiere, setEstJourneeEntiere] = useState(false);
  const [erreurForm, setErreurForm] = useState('');
  const [form] = Form.useForm();
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

  const soumettre = async (valeurs: any) => {
    setErreurForm('');
    try {
      const payload: any = {
        salleId: valeurs.salleId,
        entrepriseId: valeurs.entrepriseId,
        date: valeurs.date.format('YYYY-MM-DD'),
        estJourneeEntiere,
        notes: valeurs.notes,
      };
      if (!estJourneeEntiere) {
        payload.heureDebut = valeurs.heureDebut.format('HH:mm');
        payload.heureFin = valeurs.heureFin.format('HH:mm');
      }
      await creerReservation(payload);
      message.success('Réservation créée');
      setModalVisible(false);
      form.resetFields();
      setEstJourneeEntiere(false);
      charger();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de la création';
      setErreurForm(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const supprimer = async (id: number) => {
    await supprimerReservation(id);
    message.success('Réservation supprimée');
    charger();
  };

  // Créneaux de 30 minutes
  const minutesDesactivees = (heure: dayjs.Dayjs | null) => {
    if (!heure) return [];
    return Array.from({ length: 60 }, (_, i) => i).filter((m) => m !== 0 && m !== 30);
  };

  const colonnes = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
      sorter: (a: any, b: any) => a.date.localeCompare(b.date),
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
      render: (_: any, r: any) =>
        r.salle?.etage?.numero === 0 ? 'RDC' : `Étage ${r.salle?.etage?.numero}`,
    },
    {
      title: 'Entreprise',
      key: 'entreprise',
      render: (_: any, r: any) => <Tag color={COULEURS.primaire}>{r.entreprise?.nom}</Tag>,
    },
    ...(peutModifier ? [{
      title: 'Action',
      key: 'action',
      render: (_: any, r: any) => (
        <Popconfirm title="Supprimer cette réservation ?" onConfirm={() => supprimer(r.id)} okText="Oui" cancelText="Non">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
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
        {peutModifier && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}
              style={{ background: COULEURS.primaire }}>
              Nouvelle réservation
            </Button>
          </Col>
        )}
      </Row>

      <Table
        dataSource={reservations}
        columns={colonnes}
        rowKey="id"
        loading={chargement}
        pagination={{ pageSize: 20 }}
        size="small"
      />

      <Modal
        title="Nouvelle réservation"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); setErreurForm(''); setEstJourneeEntiere(false); }}
        footer={null}
        width={520}
      >
        {erreurForm && <Alert message={erreurForm} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical" onFinish={soumettre}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salleId" label="Salle" rules={[{ required: true, message: 'Requis' }]}>
                <Select placeholder="Choisir une salle" options={salles.map((s) => ({
                  value: s.id,
                  label: `${s.nom} (${s.etage?.numero === 0 ? 'RDC' : `Étage ${s.etage?.numero}`}) — ${s.capacite} pers.`,
                }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="entrepriseId" label="Entreprise" rules={[{ required: true, message: 'Requis' }]}>
                <Select placeholder="Choisir une entreprise" options={entreprises.map((e) => ({ value: e.id, label: e.nom }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Requis' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Journée entière">
            <Switch checked={estJourneeEntiere} onChange={setEstJourneeEntiere} />
          </Form.Item>
          {!estJourneeEntiere && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="heureDebut" label="Heure de début" rules={[{ required: true, message: 'Requis' }]}>
                  <TimePicker format="HH:mm" minuteStep={30} showNow={false} style={{ width: '100%' }} disabledTime={() => ({ disabledMinutes: minutesDesactivees })} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="heureFin" label="Heure de fin" rules={[{ required: true, message: 'Requis' }]}>
                  <TimePicker format="HH:mm" minuteStep={30} showNow={false} style={{ width: '100%' }} disabledTime={() => ({ disabledMinutes: minutesDesactivees })} />
                </Form.Item>
              </Col>
            </Row>
          )}
          <Form.Item name="notes" label="Notes (optionnel)">
            <Input />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" style={{ background: COULEURS.primaire }}>Créer</Button>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); setErreurForm(''); setEstJourneeEntiere(false); }}>Annuler</Button>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
