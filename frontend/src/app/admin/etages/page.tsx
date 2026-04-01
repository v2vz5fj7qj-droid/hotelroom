'use client';

import { useEffect, useState } from 'react';
import { App, Card, Table, Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm, Typography, Row, Col, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, BuildOutlined, ApartmentOutlined, EditOutlined } from '@ant-design/icons';
import { obtenirEtages, creerEtage, supprimerEtage, modifierEtage, obtenirHotels } from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

function PageEtagesInner() {
  const { message } = App.useApp();
  const [etages, setEtages] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [filtreHotelId, setFiltreHotelId] = useState<number | undefined>();
  const [chargement, setChargement] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editEtage, setEditEtage] = useState<any>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const utilisateur = obtenirUtilisateurConnecte();
  const peutModifier = utilisateur?.role === 'SUPER_ADMIN' || utilisateur?.role === 'HOTEL_ADMIN';
  const estSuperAdmin = utilisateur?.role === 'SUPER_ADMIN';

  const charger = async () => {
    setChargement(true);
    const [resEtages, resHotels] = await Promise.all([
      obtenirEtages(),
      estSuperAdmin ? obtenirHotels() : Promise.resolve({ data: [] }),
    ]);
    setEtages(resEtages.data);
    setHotels(resHotels.data);
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const etagesFiltres = filtreHotelId
    ? etages.filter((e) => e.hotelId === filtreHotelId)
    : etages;

  const soumettre = async (valeurs: any) => {
    try {
      await creerEtage(valeurs);
      message.success('Étage créé');
      setModalVisible(false);
      form.resetFields();
      charger();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const ouvrirEdit = (etage: any) => {
    setEditEtage(etage);
    editForm.setFieldsValue({ numero: etage.numero, nom: etage.nom });
    setEditVisible(true);
  };

  const soumettreEdit = async (valeurs: any) => {
    try {
      await modifierEtage(editEtage.id, valeurs);
      message.success('Étage modifié');
      setEditVisible(false);
      charger();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const supprimer = async (id: number) => {
    try {
      await supprimerEtage(id);
      message.success('Étage supprimé');
      charger();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const colonnes = [
    ...(estSuperAdmin ? [{
      title: 'Hôtel', key: 'hotel',
      render: (_: any, r: any) => (
        <Tag color="geekblue" icon={<ApartmentOutlined />}>{r.hotel?.nom ?? '—'}</Tag>
      ),
    }] : []),
    { title: 'Numéro', dataIndex: 'numero', key: 'numero', render: (n: number) => n === 0 ? 'RDC (0)' : n },
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    { title: 'Salles', key: 'salles', render: (_: any, r: any) => r.salles?.length ?? 0 },
    ...(peutModifier ? [{
      title: 'Action', key: 'action',
      render: (_: any, r: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => ouvrirEdit(r)} />
          <Popconfirm title="Supprimer cet étage ?" onConfirm={() => supprimer(r.id)} okText="Oui" cancelText="Non">
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
            <BuildOutlined /> Étages
          </Typography.Title>
        </Col>
        {peutModifier && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}
              style={{ background: COULEURS.primaire }}>
              Ajouter un étage
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

      <Table dataSource={etagesFiltres} columns={colonnes} rowKey="id" loading={chargement} size="small" />

      {/* Modal création */}
      <Modal title="Nouvel étage" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={soumettre}>
          {estSuperAdmin && (
            <Form.Item name="hotelId" label="Hôtel" rules={[{ required: true, message: 'Sélectionner un hôtel' }]}>
              <Select
                placeholder="Sélectionner un hôtel"
                options={hotels.map((h) => ({ value: h.id, label: h.nom }))}
                showSearch
                filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          )}
          <Form.Item name="numero" label="Numéro (0 = RDC)" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Rez-de-chaussée, Salle des conférences..." />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" style={{ background: COULEURS.primaire }}>Créer</Button>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Annuler</Button>
          </Space>
        </Form>
      </Modal>

      {/* Modal édition */}
      <Modal title="Modifier l'étage" open={editVisible} onCancel={() => setEditVisible(false)} footer={null}>
        <Form form={editForm} layout="vertical" onFinish={soumettreEdit}>
          <Form.Item name="numero" label="Numéro (0 = RDC)" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Requis' }]}>
            <Input />
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

export default function PageEtages() {
  return <App><PageEtagesInner /></App>;
}
