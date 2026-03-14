'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { connexion } from '@/lib/api';
import { COULEURS } from '@/theme/theme.config';

const { Title } = Typography;

export default function PageConnexion() {
  const router = useRouter();
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const soumettre = async (valeurs: { email: string; motDePasse: string }) => {
    setErreur('');
    setChargement(true);
    try {
      const { data } = await connexion(valeurs.email, valeurs.motDePasse);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
      router.push('/admin/reservations');
    } catch {
      setErreur('Email ou mot de passe invalide');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COULEURS.fond,
      }}
    >
      <Card style={{ width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ color: COULEURS.primaire, margin: 0 }}>
            Bravia Hôtel
          </Title>
          <Typography.Text type="secondary">Interface d'administration</Typography.Text>
        </div>

        {erreur && <Alert message={erreur} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={soumettre}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email requis' }]}>
            <Input prefix={<UserOutlined />} placeholder="admin@bravia.com" />
          </Form.Item>
          <Form.Item name="motDePasse" label="Mot de passe" rules={[{ required: true, message: 'Mot de passe requis' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={chargement}
            block
            style={{ background: COULEURS.primaire, borderColor: COULEURS.primaire }}
          >
            Se connecter
          </Button>
        </Form>
      </Card>
    </div>
  );
}
