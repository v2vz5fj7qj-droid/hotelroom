'use client';

import { useEffect, useState } from 'react';
import { App, Card, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Typography, Row, Col, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { obtenirUtilisateurs, creerUtilisateur, supprimerUtilisateur } from '@/lib/api';
import { COULEURS } from '@/theme/theme.config';

const LIBELLES_ROLE: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'red' },
  ADMIN: { label: 'Admin', color: 'orange' },
  VIEWER: { label: 'Lecteur', color: 'blue' },
};

function PageUtilisateursInner() {
  const { message } = App.useApp();
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const charger = async () => {
    setChargement(true);
    const { data } = await obtenirUtilisateurs();
    setUtilisateurs(data);
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const soumettre = async (valeurs: any) => {
    try {
      await creerUtilisateur(valeurs);
      message.success('Utilisateur créé');
      setModalVisible(false);
      form.resetFields();
      charger();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur');
    }
  };

  const supprimer = async (id: number) => {
    await supprimerUtilisateur(id);
    message.success('Utilisateur supprimé');
    charger();
  };

  const colonnes = [
    { title: 'Prénom', dataIndex: 'prenom', key: 'prenom' },
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Rôle', dataIndex: 'role', key: 'role',
      render: (r: string) => <Tag color={LIBELLES_ROLE[r]?.color}>{LIBELLES_ROLE[r]?.label ?? r}</Tag>,
    },
    {
      title: 'Action', key: 'action',
      render: (_: any, r: any) => (
        <Popconfirm title="Supprimer cet utilisateur ?" onConfirm={() => supprimer(r.id)} okText="Oui" cancelText="Non">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={4} style={{ margin: 0, color: COULEURS.primaire }}>
            <TeamOutlined /> Utilisateurs
          </Typography.Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}
            style={{ background: COULEURS.primaire }}>
            Ajouter un utilisateur
          </Button>
        </Col>
      </Row>
      <Table dataSource={utilisateurs} columns={colonnes} rowKey="id" loading={chargement} size="small" />
      <Modal title="Nouvel utilisateur" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={soumettre}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="prenom" label="Prénom" rules={[{ required: true, message: 'Requis' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Requis' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email valide requis' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="motDePasse" label="Mot de passe" rules={[{ required: true, min: 6, message: 'Min 6 caractères' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Rôle" initialValue="VIEWER">
            <Select options={[
              { value: 'SUPER_ADMIN', label: 'Super Admin' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'VIEWER', label: 'Lecteur' },
            ]} />
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

export default function PageUtilisateurs() {
  return <App><PageUtilisateursInner /></App>;
}
