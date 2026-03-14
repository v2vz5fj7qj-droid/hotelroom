'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, BankOutlined } from '@ant-design/icons';
import { obtenirEntreprises, creerEntreprise, supprimerEntreprise } from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

export default function PageEntreprises() {
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const utilisateur = obtenirUtilisateurConnecte();
  const peutModifier = utilisateur?.role === 'SUPER_ADMIN' || utilisateur?.role === 'ADMIN';

  const charger = async () => {
    setChargement(true);
    const { data } = await obtenirEntreprises();
    setEntreprises(data);
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const soumettre = async (valeurs: any) => {
    try {
      await creerEntreprise(valeurs);
      message.success('Entreprise créée');
      setModalVisible(false);
      form.resetFields();
      charger();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const supprimer = async (id: number) => {
    await supprimerEntreprise(id);
    message.success('Entreprise supprimée');
    charger();
  };

  const colonnes = [
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    { title: 'Créé le', dataIndex: 'creeLe', key: 'creeLe', render: (d: string) => new Date(d).toLocaleDateString('fr-FR') },
    ...(peutModifier ? [{
      title: 'Action', key: 'action',
      render: (_: any, r: any) => (
        <Popconfirm title="Supprimer cette entreprise ?" onConfirm={() => supprimer(r.id)} okText="Oui" cancelText="Non">
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
            <BankOutlined /> Entreprises
          </Typography.Title>
        </Col>
        {peutModifier && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}
              style={{ background: COULEURS.primaire }}>
              Ajouter une entreprise
            </Button>
          </Col>
        )}
      </Row>
      <Table dataSource={entreprises} columns={colonnes} rowKey="id" loading={chargement} size="small" />
      <Modal title="Nouvelle entreprise" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={soumettre}>
          <Form.Item name="nom" label="Nom de l'entreprise" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Acme Corp." />
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
