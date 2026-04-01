'use client';

import { useEffect, useState } from 'react';
import { App, Card, Table, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, Popconfirm, Typography, Row, Col, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, HomeOutlined, ApartmentOutlined, EditOutlined } from '@ant-design/icons';
import { obtenirSalles, creerSalle, supprimerSalle, modifierSalle, obtenirEtages, obtenirHotels } from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

function etageLabel(etage: any): string {
  if (!etage) return '';
  return etage.numero === 0 ? `RDC — ${etage.nom}` : `${etage.numero === 1 ? '1er' : `${etage.numero}ème`} Étage — ${etage.nom}`;
}

function PageSallesInner() {
  const { message } = App.useApp();
  const [salles, setSalles] = useState<any[]>([]);
  const [etages, setEtages] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [filtreHotelId, setFiltreHotelId] = useState<number | undefined>();
  const [etagesForm, setEtagesForm] = useState<any[]>([]);
  const [etagesEdit, setEtagesEdit] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);
  const [chargementEtages, setChargementEtages] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editSalle, setEditSalle] = useState<any>(null);
  const [editHotelId, setEditHotelId] = useState<number | undefined>();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const utilisateur = obtenirUtilisateurConnecte();
  const peutModifier = utilisateur?.role === 'SUPER_ADMIN' || utilisateur?.role === 'HOTEL_ADMIN';
  const estSuperAdmin = utilisateur?.role === 'SUPER_ADMIN';

  const charger = async () => {
    setChargement(true);
    const promises: Promise<any>[] = [obtenirSalles()];
    if (!estSuperAdmin) promises.push(obtenirEtages());
    if (estSuperAdmin) promises.push(obtenirHotels());

    const [resSalles, second] = await Promise.all(promises);
    setSalles(resSalles.data);
    if (!estSuperAdmin) setEtages(second.data);
    if (estSuperAdmin) setHotels(second.data);
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const sallesFiltrees = filtreHotelId
    ? salles.filter((s) => s.etage?.hotelId === filtreHotelId || s.etage?.hotel?.id === filtreHotelId)
    : salles;

  // --- Création ---
  const ouvrirModal = () => {
    form.resetFields();
    setEtagesForm(estSuperAdmin ? [] : etages);
    setModalVisible(true);
  };

  const onHotelChange = async (hotelId: number) => {
    form.setFieldValue('etageId', undefined);
    setEtagesForm([]);
    setChargementEtages(true);
    const { data } = await obtenirEtages(hotelId);
    setEtagesForm(data);
    setChargementEtages(false);
  };

  const soumettre = async (valeurs: any) => {
    try {
      await creerSalle({ nom: valeurs.nom, capacite: valeurs.capacite, etageId: valeurs.etageId });
      message.success('Salle créée');
      setModalVisible(false);
      form.resetFields();
      charger();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  // --- Édition ---
  const ouvrirEdit = async (salle: any) => {
    setEditSalle(salle);
    if (estSuperAdmin) {
      const hotelId = salle.etage?.hotel?.id ?? salle.etage?.hotelId;
      setEditHotelId(hotelId);
      setEtagesEdit([]);
      if (hotelId) {
        const { data } = await obtenirEtages(hotelId);
        setEtagesEdit(data);
      }
      editForm.setFieldsValue({ hotelId, nom: salle.nom, capacite: salle.capacite, etageId: salle.etageId, actif: salle.actif });
    } else {
      setEtagesEdit(etages);
      editForm.setFieldsValue({ nom: salle.nom, capacite: salle.capacite, etageId: salle.etageId, actif: salle.actif });
    }
    setEditVisible(true);
  };

  const onEditHotelChange = async (hotelId: number) => {
    setEditHotelId(hotelId);
    editForm.setFieldValue('etageId', undefined);
    setEtagesEdit([]);
    if (hotelId) {
      const { data } = await obtenirEtages(hotelId);
      setEtagesEdit(data);
    }
  };

  const soumettreEdit = async (valeurs: any) => {
    try {
      await modifierSalle(editSalle.id, {
        nom: valeurs.nom,
        capacite: valeurs.capacite,
        etageId: valeurs.etageId,
        actif: valeurs.actif,
      });
      message.success('Salle modifiée');
      setEditVisible(false);
      charger();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  // --- Toggle actif rapide ---
  const toggleActif = async (id: number, actifActuel: boolean) => {
    try {
      await modifierSalle(id, { actif: !actifActuel });
      charger();
    } catch {
      message.error('Erreur lors du changement de statut');
    }
  };

  // --- Suppression ---
  const supprimer = async (id: number) => {
    try {
      await supprimerSalle(id);
      message.success('Salle supprimée');
      charger();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const colonnes = [
    ...(estSuperAdmin ? [{
      title: 'Hôtel', key: 'hotel',
      render: (_: any, r: any) => (
        <Tag color="geekblue" icon={<ApartmentOutlined />}>
          {r.etage?.hotel?.nom ?? '—'}
        </Tag>
      ),
    }] : []),
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    {
      title: 'Étage', key: 'etage',
      render: (_: any, r: any) => etageLabel(r.etage),
    },
    {
      title: 'Capacité', dataIndex: 'capacite', key: 'capacite',
      render: (c: number) => `${c} pers.`,
    },
    {
      title: 'Statut', dataIndex: 'actif', key: 'actif',
      render: (actif: boolean, r: any) => peutModifier
        ? <Switch checked={actif} size="small" onChange={() => toggleActif(r.id, actif)} />
        : <Tag color={actif ? 'green' : 'red'}>{actif ? 'Active' : 'Inactive'}</Tag>,
    },
    ...(peutModifier ? [{
      title: 'Action', key: 'action',
      render: (_: any, r: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => ouvrirEdit(r)} />
          <Popconfirm title="Supprimer cette salle ?" onConfirm={() => supprimer(r.id)} okText="Oui" cancelText="Non">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={4} style={{ margin: 0, color: COULEURS.primaire }}>
            <HomeOutlined /> Salles
          </Typography.Title>
        </Col>
        {peutModifier && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={ouvrirModal}
              style={{ background: COULEURS.primaire }}>
              Ajouter une salle
            </Button>
          </Col>
        )}
      </Row>

      {estSuperAdmin && (
        <Row style={{ marginBottom: 12 }}>
          <Col xs={24} sm={10}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filtrer par hôtel"
              value={filtreHotelId}
              onChange={setFiltreHotelId}
              options={hotels.map((h) => ({ value: h.id, label: h.nom }))}
              allowClear
              showSearch
              filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Col>
        </Row>
      )}

      <Table dataSource={sallesFiltrees} columns={colonnes} rowKey="id" loading={chargement} size="small" />

      {/* Modal création */}
      <Modal
        title="Nouvelle salle"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={soumettre}>
          {estSuperAdmin && (
            <Form.Item name="hotelId" label="Hôtel" rules={[{ required: true, message: 'Sélectionner un hôtel' }]}>
              <Select
                placeholder="Sélectionner un hôtel"
                options={hotels.map((h) => ({ value: h.id, label: h.nom }))}
                showSearch
                filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                onChange={onHotelChange}
              />
            </Form.Item>
          )}
          <Form.Item name="nom" label="Nom de la salle" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Salle A, Salle de réunion..." />
          </Form.Item>
          <Form.Item name="etageId" label="Étage" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              placeholder={estSuperAdmin ? "Sélectionner un hôtel d'abord" : 'Choisir un étage'}
              loading={chargementEtages}
              disabled={estSuperAdmin && etagesForm.length === 0 && !chargementEtages}
              options={etagesForm.map((e) => ({ value: e.id, label: etageLabel(e) }))}
            />
          </Form.Item>
          <Form.Item name="capacite" label="Capacité (personnes)" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" style={{ background: COULEURS.primaire }}>Créer</Button>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Annuler</Button>
          </Space>
        </Form>
      </Modal>

      {/* Modal édition */}
      <Modal
        title="Modifier la salle"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={soumettreEdit}>
          {estSuperAdmin && (
            <Form.Item name="hotelId" label="Hôtel" rules={[{ required: true, message: 'Sélectionner un hôtel' }]}>
              <Select
                placeholder="Sélectionner un hôtel"
                options={hotels.map((h) => ({ value: h.id, label: h.nom }))}
                showSearch
                filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                onChange={onEditHotelChange}
                value={editHotelId}
              />
            </Form.Item>
          )}
          <Form.Item name="nom" label="Nom de la salle" rules={[{ required: true, message: 'Requis' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="etageId" label="Étage" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              placeholder="Choisir un étage"
              disabled={estSuperAdmin && etagesEdit.length === 0}
              options={etagesEdit.map((e) => ({ value: e.id, label: etageLabel(e) }))}
            />
          </Form.Item>
          <Form.Item name="capacite" label="Capacité (personnes)" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="actif" label="Statut" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" style={{ background: COULEURS.primaire }}>Enregistrer</Button>
            <Button onClick={() => setEditVisible(false)}>Annuler</Button>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}

export default function PageSalles() {
  return <App><PageSallesInner /></App>;
}
