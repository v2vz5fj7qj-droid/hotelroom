'use client';

import { useEffect, useState } from 'react';
import { App, Card, Form, Input, Button, Divider, Row, Col, Typography, Space, Tag } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { modifierProfil } from '@/lib/api';
import { COULEURS } from '@/theme/theme.config';

const { Title, Text } = Typography;

const LIBELLES_ROLE: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN:  { label: 'Super Admin',   color: 'red' },
  HOTEL_ADMIN:  { label: 'Admin Hôtel',   color: 'blue' },
  HOTEL_VIEWER: { label: 'Observateur',   color: 'default' },
};

function PageProfilInner() {
  const { message } = App.useApp();
  const [utilisateur, setUtilisateur] = useState<ReturnType<typeof obtenirUtilisateurConnecte>>(null);
  const [formInfo] = Form.useForm();
  const [formMdp] = Form.useForm();
  const [chargementInfo, setChargementInfo] = useState(false);
  const [chargementMdp, setChargementMdp] = useState(false);

  useEffect(() => {
    const u = obtenirUtilisateurConnecte();
    setUtilisateur(u);
    if (u) {
      formInfo.setFieldsValue({ prenom: u.prenom, nom: u.nom, email: u.email });
    }
  }, [formInfo]);

  const sauvegarderInfo = async (valeurs: { prenom: string; nom: string; email: string }) => {
    setChargementInfo(true);
    try {
      const { data } = await modifierProfil(valeurs);
      // Mettre à jour le localStorage
      const stocke = localStorage.getItem('utilisateur');
      if (stocke) {
        const u = JSON.parse(stocke);
        localStorage.setItem('utilisateur', JSON.stringify({ ...u, prenom: data.prenom, nom: data.nom, email: data.email }));
        setUtilisateur((prev) => prev ? { ...prev, prenom: data.prenom, nom: data.nom, email: data.email } : prev);
      }
      message.success('Informations mises à jour');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setChargementInfo(false);
    }
  };

  const changerMotDePasse = async (valeurs: { ancienMotDePasse: string; nouveauMotDePasse: string; confirmation: string }) => {
    if (valeurs.nouveauMotDePasse !== valeurs.confirmation) {
      message.error('Les mots de passe ne correspondent pas');
      return;
    }
    setChargementMdp(true);
    try {
      await modifierProfil({
        ancienMotDePasse: valeurs.ancienMotDePasse,
        nouveauMotDePasse: valeurs.nouveauMotDePasse,
      });
      message.success('Mot de passe modifié');
      formMdp.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setChargementMdp(false);
    }
  };

  if (!utilisateur) return null;

  const roleInfo = LIBELLES_ROLE[utilisateur.role] ?? { label: utilisateur.role, color: 'default' };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* En-tête */}
      <Card style={{ marginBottom: 24, borderColor: COULEURS.bordure }}>
        <Space align="center" size={16}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: COULEURS.primaire,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: COULEURS.primaire }}>
              {utilisateur.prenom} {utilisateur.nom}
            </Title>
            <Space size={8} style={{ marginTop: 4 }}>
              <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
              {utilisateur.hotel && (
                <Text type="secondary" style={{ fontSize: 13 }}>{utilisateur.hotel.nom}</Text>
              )}
            </Space>
          </div>
        </Space>
      </Card>

      {/* Informations personnelles */}
      <Card
        title={<Space><UserOutlined style={{ color: COULEURS.primaire }} /><span>Informations personnelles</span></Space>}
        style={{ marginBottom: 24, borderColor: COULEURS.bordure }}
      >
        <Form form={formInfo} layout="vertical" onFinish={sauvegarderInfo}>
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
          <Form.Item
            name="email"
            label="Adresse email"
            rules={[{ required: true, type: 'email', message: 'Email valide requis' }]}
          >
            <Input />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={chargementInfo}
            style={{ background: COULEURS.primaire }}
          >
            Enregistrer
          </Button>
        </Form>
      </Card>

      {/* Changement de mot de passe */}
      <Card
        title={<Space><LockOutlined style={{ color: COULEURS.primaire }} /><span>Changer le mot de passe</span></Space>}
        style={{ borderColor: COULEURS.bordure }}
      >
        <Form form={formMdp} layout="vertical" onFinish={changerMotDePasse}>
          <Form.Item
            name="ancienMotDePasse"
            label="Mot de passe actuel"
            rules={[{ required: true, message: 'Requis' }]}
          >
            <Input.Password />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item
            name="nouveauMotDePasse"
            label="Nouveau mot de passe"
            rules={[{ required: true, min: 6, message: 'Minimum 6 caractères' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmation"
            label="Confirmer le nouveau mot de passe"
            rules={[{ required: true, message: 'Requis' }]}
          >
            <Input.Password />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<LockOutlined />}
            loading={chargementMdp}
            style={{ background: COULEURS.primaire }}
          >
            Changer le mot de passe
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default function PageProfil() {
  return <App><PageProfilInner /></App>;
}
