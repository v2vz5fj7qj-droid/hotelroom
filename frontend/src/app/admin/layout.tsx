'use client';

import { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Tag } from 'antd';
import {
  CalendarOutlined,
  HomeOutlined,
  BankOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  BuildOutlined,
  BarChartOutlined,
  DesktopOutlined,
  SettingOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { obtenirUtilisateurConnecte, deconnexion } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

const { Sider, Content, Header } = Layout;

const LABELS_ROLE: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN:  { label: 'Super Admin',   color: 'red' },
  HOTEL_ADMIN:  { label: 'Admin Hôtel',   color: 'blue' },
  HOTEL_VIEWER: { label: 'Observateur',   color: 'default' },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [utilisateur, setUtilisateur] = useState<ReturnType<typeof obtenirUtilisateurConnecte>>(null);

  useEffect(() => {
    const u = obtenirUtilisateurConnecte();
    if (!u) {
      router.push('/admin/connexion');
      return;
    }
    setUtilisateur(u);
  }, [router, pathname]);

  const seDeconnecter = () => {
    deconnexion();
    router.push('/admin/connexion');
  };

  const hotelSlug = utilisateur?.hotel?.slug;
  const affichageUrl = hotelSlug ? `/affichage/${hotelSlug}` : '/affichage';

  const itemsMenu = [
    { key: '/admin/reservations', icon: <CalendarOutlined />, label: <Link href="/admin/reservations">Réservations</Link> },
    { key: '/admin/salles', icon: <HomeOutlined />, label: <Link href="/admin/salles">Salles</Link> },
    { key: '/admin/etages', icon: <BuildOutlined />, label: <Link href="/admin/etages">Étages</Link> },
    { key: '/admin/entreprises', icon: <BankOutlined />, label: <Link href="/admin/entreprises">Entreprises</Link> },
    { key: '/admin/statistiques', icon: <BarChartOutlined />, label: <Link href="/admin/statistiques">Statistiques</Link> },
    { key: '/admin/affichage', icon: <SettingOutlined />, label: <Link href="/admin/affichage">Config. affichage</Link> },
    { key: affichageUrl, icon: <DesktopOutlined />, label: <Link href={affichageUrl} target="_blank">Affichage public</Link> },
    ...(utilisateur?.role === 'SUPER_ADMIN'
      ? [{ key: '/admin/utilisateurs', icon: <TeamOutlined />, label: <Link href="/admin/utilisateurs">Utilisateurs</Link> }]
      : []),
    ...(utilisateur?.role === 'SUPER_ADMIN'
      ? [{ key: '/admin/hotels', icon: <ApartmentOutlined />, label: <Link href="/admin/hotels">Hôtels</Link> }]
      : []),
  ];

  const menuUtilisateur = [
    {
      key: 'profil',
      icon: <UserOutlined />,
      label: <Link href="/admin/profil">Mon profil</Link>,
    },
    { type: 'divider' as const },
    {
      key: 'deconnexion',
      icon: <LogoutOutlined />,
      label: 'Se déconnecter',
      onClick: seDeconnecter,
      danger: true,
    },
  ];

  if (pathname === '/admin/connexion') return <>{children}</>;
  if (!utilisateur) return null;

  const roleInfo = LABELS_ROLE[utilisateur.role] ?? { label: utilisateur.role, color: 'default' };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        style={{ background: COULEURS.primaire }}
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div style={{ padding: '20px 16px 16px', textAlign: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0, fontSize: 16 }}>
            {utilisateur.hotel?.nom ?? 'Hotel Manager'}
          </Typography.Title>
          {utilisateur.hotel && (
            <Typography.Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              Administration
            </Typography.Text>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={itemsMenu}
          style={{
            background: COULEURS.primaire,
            borderRight: 0,
            color: 'rgba(255,255,255,0.85)',
          }}
          theme="dark"
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Link href={affichageUrl} style={{ color: COULEURS.primaire, fontSize: 13 }}>
            ← Vue publique
          </Link>
          <Dropdown menu={{ items: menuUtilisateur }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ background: COULEURS.primaire }}>
                <UserOutlined />
              </Avatar>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                <Typography.Text style={{ fontSize: 13 }}>
                  {utilisateur.prenom} {utilisateur.nom}
                </Typography.Text>
                <Tag color={roleInfo.color} style={{ fontSize: 10, marginTop: 2, padding: '0 4px' }}>
                  {roleInfo.label}
                </Tag>
              </div>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, background: COULEURS.fond }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
