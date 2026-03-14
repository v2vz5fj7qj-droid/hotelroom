'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm, message, Typography, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, BuildOutlined } from '@ant-design/icons';
import { obtenirEtages, creerEtage, supprimerEtage } from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

export default function PageEtages() {
  const [etages, setEtages] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const utilisateur = obtenirUtilisateurConnecte();
  const peutModifier = utilisateur?.role === 'SUPER_ADMIN' || utilisateur?.role === 'ADMIN';

  const charger = async () => {
    setChargement(true);
    const { data } = await obtenirEtages();
    setEtages(data);
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

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

  const supprimer = async (id: number) => {
    await supprimerEtage(id);
    message.success('Étage supprimé');
    charger();
  };

  const colonnes = [
    { title: 'Numéro', dataIndex: 'numero', key: 'numero', render: (n: number) => n === 0 ? 'RDC (0)' : n },
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    { title: 'Salles', key: 'salles', render: (_: any, r: any) => r.salles?.length ?? 0 },
    ...(peutModifier ? [{
      title: 'Action', key: 'action',
      render: (_: any, r: any) => (
        <Popconfirm title="Supprimer cet étage ?" onConfirm={() => supprimer(r.id)} okText="Oui" cancelText="Non">
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
      <Table dataSource={etages} columns={colonnes} rowKey="id" loading={chargement} size="small" />
      <Modal title="Nouvel étage" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={soumettre}>
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
    </Card>
  );
}
