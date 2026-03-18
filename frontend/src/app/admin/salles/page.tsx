'use client';

import { useEffect, useState } from 'react';
import { App, Card, Table, Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm, Typography, Row, Col, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import { obtenirSalles, creerSalle, supprimerSalle, obtenirEtages } from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

function PageSallesInner() {
  const { message } = App.useApp();
  const [salles, setSalles] = useState<any[]>([]);
  const [etages, setEtages] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const utilisateur = obtenirUtilisateurConnecte();
  const peutModifier = utilisateur?.role === 'SUPER_ADMIN' || utilisateur?.role === 'ADMIN';

  const charger = async () => {
    setChargement(true);
    const [resSalles, resEtages] = await Promise.all([obtenirSalles(), obtenirEtages()]);
    setSalles(resSalles.data);
    setEtages(resEtages.data);
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const soumettre = async (valeurs: any) => {
    try {
      await creerSalle(valeurs);
      message.success('Salle créée');
      setModalVisible(false);
      form.resetFields();
      charger();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const supprimer = async (id: number) => {
    await supprimerSalle(id);
    message.success('Salle supprimée');
    charger();
  };

  const colonnes = [
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    {
      title: 'Étage', key: 'etage',
      render: (_: any, r: any) => r.etage?.numero === 0 ? 'RDC' : `${r.etage?.numero === 1 ? '1er' : `${r.etage?.numero}ème`} Étage — ${r.etage?.nom}`,
    },
    {
      title: 'Capacité', dataIndex: 'capacite', key: 'capacite',
      render: (c: number) => `${c} pers.`,
    },
    {
      title: 'Statut', dataIndex: 'actif', key: 'actif',
      render: (a: boolean) => <Tag color={a ? 'green' : 'red'}>{a ? 'Active' : 'Inactive'}</Tag>,
    },
    ...(peutModifier ? [{
      title: 'Action', key: 'action',
      render: (_: any, r: any) => (
        <Popconfirm title="Supprimer cette salle ?" onConfirm={() => supprimer(r.id)} okText="Oui" cancelText="Non">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}
              style={{ background: COULEURS.primaire }}>
              Ajouter une salle
            </Button>
          </Col>
        )}
      </Row>
      <Table dataSource={salles} columns={colonnes} rowKey="id" loading={chargement} size="small" />
      <Modal title="Nouvelle salle" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={soumettre}>
          <Form.Item name="nom" label="Nom de la salle" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Salle A, Salle de réunion..." />
          </Form.Item>
          <Form.Item name="etageId" label="Étage" rules={[{ required: true, message: 'Requis' }]}>
            <Select placeholder="Choisir un étage" options={etages.map((e) => ({
              value: e.id,
              label: e.numero === 0 ? `RDC — ${e.nom}` : `${e.numero === 1 ? '1er' : `${e.numero}ème`} Étage — ${e.nom}`,
            }))} />
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
    </Card>
  );
}

export default function PageSalles() {
  return <App><PageSallesInner /></App>;
}
