'use client';

import { useEffect, useState } from 'react';
import {
  App, Card, Table, Button, Modal, Form, Input, Space,
  Popconfirm, Typography, Row, Col, Upload, Tooltip, Tag, Divider, Switch,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, BankOutlined, EditOutlined,
  UploadOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { obtenirEntreprises, creerEntreprise, supprimerEntreprise, modifierEntreprise } from '@/lib/api';
import { obtenirUtilisateurConnecte } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

const { Text } = Typography;

function PageEntreprisesInner() {
  const { message } = App.useApp();
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [entrepriseEnEdition, setEntrepriseEnEdition] = useState<any | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
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

  const ouvrirCreation = () => {
    setEntrepriseEnEdition(null);
    setLogoPreview('');
    form.resetFields();
    setModalVisible(true);
  };

  const ouvrirEdition = (e: any) => {
    setEntrepriseEnEdition(e);
    setLogoPreview(e.logoUrl || '');
    form.setFieldsValue({
      nom: e.nom,
      telephone: e.telephone,
      email: e.email,
      adresse: e.adresse,
      secteur: e.secteur,
      numeroIFU: e.numeroIFU,
      contactNom: e.contactNom,
      notes: e.notes,
    });
    setModalVisible(true);
  };

  const fermerModal = () => {
    setModalVisible(false);
    setEntrepriseEnEdition(null);
    setLogoPreview('');
    form.resetFields();
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    return false;
  };

  const soumettre = async (valeurs: any) => {
    try {
      const payload = { ...valeurs, logoUrl: logoPreview || null };
      if (entrepriseEnEdition) {
        await modifierEntreprise(entrepriseEnEdition.id, payload);
        message.success('Entreprise mise à jour');
      } else {
        await creerEntreprise(payload);
        message.success('Entreprise créée');
      }
      fermerModal();
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

  const basculerActif = async (r: any) => {
    try {
      await modifierEntreprise(r.id, { actif: !r.actif });
      message.success(r.actif ? 'Entreprise désactivée' : 'Entreprise réactivée');
      charger();
    } catch {
      message.error('Erreur lors de la mise à jour');
    }
  };

  const colonnes = [
    {
      title: 'Entreprise',
      key: 'entreprise',
      render: (_: any, r: any) => (
        <Space>
          {r.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={r.logoUrl} alt="logo" style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 4, border: '1px solid #eee' }} />
            : <div style={{ width: 32, height: 32, borderRadius: 4, background: COULEURS.primaire + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BankOutlined style={{ color: COULEURS.primaire }} />
              </div>
          }
          <div>
            <Text strong>{r.nom}</Text>
            {r.secteur && <div><Text type="secondary" style={{ fontSize: 11 }}>{r.secteur}</Text></div>}
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, r: any) => (
        <Space orientation="vertical" size={0}>
          {r.contactNom && <Text style={{ fontSize: 12 }}><UserOutlined /> {r.contactNom}</Text>}
          {r.telephone && <Text style={{ fontSize: 12 }}><PhoneOutlined /> {r.telephone}</Text>}
          {r.email && <Text style={{ fontSize: 12 }}><MailOutlined /> {r.email}</Text>}
          {!r.contactNom && !r.telephone && !r.email && <Text type="secondary" style={{ fontSize: 11 }}>—</Text>}
        </Space>
      ),
    },
    {
      title: 'Adresse',
      key: 'adresse',
      render: (_: any, r: any) => r.adresse
        ? <Text style={{ fontSize: 12 }}><EnvironmentOutlined /> {r.adresse}</Text>
        : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'IFU / RCCM',
      dataIndex: 'numeroIFU',
      key: 'numeroIFU',
      render: (v: string) => v ? <Tag>{v}</Tag> : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Statut',
      key: 'actif',
      render: (_: any, r: any) => (
        <Tooltip title={r.actif ? 'Cliquer pour désactiver' : 'Cliquer pour réactiver'}>
          <Switch
            checked={r.actif}
            onChange={() => peutModifier && basculerActif(r)}
            disabled={!peutModifier}
            checkedChildren="Actif"
            unCheckedChildren="Inactif"
            style={{ background: r.actif ? COULEURS.primaire : undefined }}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Créé le',
      dataIndex: 'creeLe',
      key: 'creeLe',
      render: (d: string) => new Date(d).toLocaleDateString('fr-FR'),
    },
    ...(peutModifier ? [{
      title: 'Actions',
      key: 'action',
      render: (_: any, r: any) => (
        <Space>
          <Tooltip title="Modifier">
            <Button type="text" icon={<EditOutlined />} onClick={() => ouvrirEdition(r)} />
          </Tooltip>
          <Popconfirm title="Supprimer cette entreprise ?" onConfirm={() => supprimer(r.id)} okText="Oui" cancelText="Non">
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
            <BankOutlined /> Entreprises
          </Typography.Title>
        </Col>
        {peutModifier && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={ouvrirCreation}
              style={{ background: COULEURS.primaire }}>
              Ajouter une entreprise
            </Button>
          </Col>
        )}
      </Row>

      <Table
        dataSource={entreprises}
        columns={colonnes}
        rowKey="id"
        loading={chargement}
        size="small"
        expandable={{
          expandedRowRender: (r) => r.notes
            ? <Text type="secondary" style={{ fontSize: 12 }}>📝 {r.notes}</Text>
            : null,
          rowExpandable: (r) => !!r.notes,
        }}
      />

      <Modal
        title={entrepriseEnEdition ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
        open={modalVisible}
        onCancel={fermerModal}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={soumettre}>

          <Divider  style={{ fontSize: 12, color: COULEURS.primaire }}>Identité</Divider>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="nom" label="Nom de l'entreprise" rules={[{ required: true, message: 'Requis' }]}>
                <Input placeholder="Ex: Acme Corp." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="secteur" label="Secteur d'activité">
                <Input placeholder="Ex: BTP, Finance…" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="numeroIFU" label="N° IFU / RCCM">
                <Input placeholder="Identifiant fiscal" />
              </Form.Item>
            </Col>
          </Row>

          <Divider  style={{ fontSize: 12, color: COULEURS.primaire }}>Coordonnées</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="telephone" label="Téléphone">
                <Input placeholder="+226 XX XX XX XX" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email"
                rules={[{ type: 'email', message: 'Email invalide' }]}>
                <Input placeholder="contact@entreprise.com" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="adresse" label="Adresse">
            <Input placeholder="Rue, ville, pays" prefix={<EnvironmentOutlined />} />
          </Form.Item>

          <Divider  style={{ fontSize: 12, color: COULEURS.primaire }}>Personne de contact</Divider>
          <Form.Item name="contactNom" label="Nom du référent">
            <Input placeholder="Prénom NOM" prefix={<UserOutlined />} />
          </Form.Item>

          <Divider  style={{ fontSize: 12, color: COULEURS.primaire }}>Logo</Divider>
          <Form.Item label="Logo de l'entreprise" help="Affiché sur l'écran public à la place du nom si fourni">
            <Space>
              {logoPreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoPreview} alt="logo" style={{ height: 48, objectFit: 'contain', border: '1px solid #eee', borderRadius: 4, padding: 4 }} />
                : null
              }
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file: UploadFile) => { handleLogoUpload(file as unknown as File); return false; }}
              >
                <Button icon={<UploadOutlined />} size="small">{logoPreview ? 'Changer' : 'Charger une image'}</Button>
              </Upload>
              {logoPreview && (
                <Button size="small" danger onClick={() => setLogoPreview('')}>Supprimer</Button>
              )}
            </Space>
          </Form.Item>

          <Divider  style={{ fontSize: 12, color: COULEURS.primaire }}>Notes</Divider>
          <Form.Item name="notes" label="Commentaires libres">
            <Input.TextArea rows={3} placeholder="Informations complémentaires…" />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" style={{ background: COULEURS.primaire }}>
              {entrepriseEnEdition ? 'Enregistrer' : 'Créer'}
            </Button>
            <Button onClick={fermerModal}>Annuler</Button>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}

export default function PageEntreprises() {
  return <App><PageEntreprisesInner /></App>;
}
