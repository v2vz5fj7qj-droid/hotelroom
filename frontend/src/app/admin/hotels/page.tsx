'use client';

import { useEffect, useState } from 'react';
import {
  App, Table, Button, Modal, Form, Input, Switch, Space,
  Typography, Tag, Tooltip, Popconfirm, Card, Row, Col, Statistic,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined,
  TeamOutlined, BuildOutlined, EyeOutlined, CopyOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  obtenirHotels, creerHotel, modifierHotel, supprimerHotel, obtenirStatsHotel,
} from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

const { Title, Text } = Typography;

interface Hotel {
  id: number;
  nom: string;
  slug: string;
  adresse?: string;
  email?: string;
  telephone?: string;
  actif: boolean;
  creeLe: string;
}

interface Stats { nbEtages: number; nbEntreprises: number; nbUtilisateurs: number }

function genererSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function PageHotelsInner() {
  const { message } = App.useApp();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [stats, setStats] = useState<Record<number, Stats>>({});
  const [chargement, setChargement] = useState(false);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [hotelEdite, setHotelEdite] = useState<Hotel | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const u = obtenirUtilisateurConnecte();
    if (u?.role !== 'SUPER_ADMIN') {
      router.replace('/admin/reservations');
      return;
    }
    charger();
  }, [router]);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await obtenirHotels();
      setHotels(data);
      // Charger les stats pour chaque hôtel
      const statsMap: Record<number, Stats> = {};
      await Promise.all(
        data.map(async (h: Hotel) => {
          try {
            const { data: s } = await obtenirStatsHotel(h.id);
            statsMap[h.id] = s;
          } catch { /* silencieux */ }
        }),
      );
      setStats(statsMap);
    } catch {
      message.error('Impossible de charger les hôtels');
    } finally {
      setChargement(false);
    }
  };

  const ouvrir = (hotel?: Hotel) => {
    setHotelEdite(hotel ?? null);
    form.resetFields();
    if (hotel) form.setFieldsValue(hotel);
    setModalOuvert(true);
  };

  const fermer = () => { setModalOuvert(false); setHotelEdite(null); form.resetFields(); };

  const soumettre = async (valeurs: any) => {
    try {
      if (hotelEdite) {
        await modifierHotel(hotelEdite.id, valeurs);
        message.success('Hôtel modifié');
      } else {
        await creerHotel(valeurs);
        message.success('Hôtel créé');
      }
      fermer();
      charger();
    } catch (e: any) {
      message.error(e.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    }
  };

  const supprimer = async (id: number) => {
    try {
      await supprimerHotel(id);
      message.success('Hôtel supprimé');
      charger();
    } catch {
      message.error('Impossible de supprimer cet hôtel');
    }
  };

  const copierSlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    message.success('Slug copié');
  };

  const colonnes = [
    {
      title: 'Hôtel',
      key: 'hotel',
      render: (_: any, h: Hotel) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{h.nom}</div>
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>{h.slug}</Text>
            <Tooltip title="Copier le slug">
              <CopyOutlined
                style={{ fontSize: 11, color: '#aaa', cursor: 'pointer' }}
                onClick={() => copierSlug(h.slug)}
              />
            </Tooltip>
          </Space>
          {h.adresse && <div style={{ fontSize: 12, color: '#888' }}>{h.adresse}</div>}
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, h: Hotel) => (
        <div style={{ fontSize: 12 }}>
          {h.email && <div>{h.email}</div>}
          {h.telephone && <div>{h.telephone}</div>}
        </div>
      ),
    },
    {
      title: 'Statistiques',
      key: 'stats',
      render: (_: any, h: Hotel) => {
        const s = stats[h.id];
        if (!s) return <Text type="secondary">—</Text>;
        return (
          <Space size={16}>
            <Tooltip title="Étages">
              <Space size={4}><BuildOutlined /><span>{s.nbEtages}</span></Space>
            </Tooltip>
            <Tooltip title="Entreprises">
              <Space size={4}><ApartmentOutlined /><span>{s.nbEntreprises}</span></Space>
            </Tooltip>
            <Tooltip title="Utilisateurs">
              <Space size={4}><TeamOutlined /><span>{s.nbUtilisateurs}</span></Space>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'Statut',
      key: 'actif',
      render: (_: any, h: Hotel) => (
        <Tag color={h.actif ? 'green' : 'red'}>{h.actif ? 'Actif' : 'Inactif'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, h: Hotel) => (
        <Space>
          <Tooltip title="Affichage public">
            <Button
              size="small" icon={<EyeOutlined />}
              onClick={() => window.open(`/affichage/${h.slug}`, '_blank')}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button size="small" icon={<EditOutlined />} onClick={() => ouvrir(h)} />
          </Tooltip>
          <Popconfirm
            title={`Supprimer "${h.nom}" ?`}
            description="Toutes les données associées seront perdues."
            onConfirm={() => supprimer(h.id)}
            okText="Supprimer"
            cancelText="Annuler"
            okType="danger"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalHotels = hotels.length;
  const totalActifs = hotels.filter((h) => h.actif).length;

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: COULEURS.primaire }}>
            <ApartmentOutlined /> Gestion des hôtels
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => ouvrir()}
            style={{ background: COULEURS.primaire }}
          >
            Nouvel hôtel
          </Button>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic title="Total hôtels" value={totalHotels} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic title="Actifs" value={totalActifs} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={hotels}
        columns={colonnes}
        rowKey="id"
        loading={chargement}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        title={hotelEdite ? `Modifier — ${hotelEdite.nom}` : 'Créer un hôtel'}
        open={modalOuvert}
        onCancel={fermer}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={soumettre} style={{ marginTop: 16 }}>
          <Form.Item name="nom" label="Nom de l'hôtel" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input
              placeholder="Grand Hôtel Central"
              onChange={(e) => {
                if (!hotelEdite) form.setFieldValue('slug', genererSlug(e.target.value));
              }}
            />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug (identifiant URL)"
            rules={[
              { required: true, message: 'Slug requis' },
              { pattern: /^[a-z0-9-]+$/, message: 'Minuscules, chiffres et tirets uniquement' },
            ]}
            tooltip="Utilisé dans l'URL de l'affichage public : /affichage/votre-slug"
          >
            <Input placeholder="grand-hotel-central" addonBefore="/affichage/" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email invalide' }]}>
                <Input placeholder="contact@hotel.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="telephone" label="Téléphone">
                <Input placeholder="+226 00 00 00 00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="adresse" label="Adresse">
            <Input.TextArea rows={2} placeholder="123 Avenue de la Paix, Ville" />
          </Form.Item>
          {hotelEdite && (
            <Form.Item name="actif" label="Statut" valuePropName="checked">
              <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
            </Form.Item>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button onClick={fermer}>Annuler</Button>
            <Button type="primary" htmlType="submit" style={{ background: COULEURS.primaire }}>
              {hotelEdite ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}

export default function PageHotels() {
  return <App><PageHotelsInner /></App>;
}
