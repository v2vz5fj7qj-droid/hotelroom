'use client';

import { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  CalendarOutlined,
  HomeOutlined,
  BankOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { obtenirUtilisateurConnecte, deconnexion } from '@/lib/auth';
import { COULEURS } from '@/theme/theme.config';

const { Sider, Content, Header } = Layout;

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
  }, [router]);

  const seDeconnecter = () => {
    deconnexion();
    router.push('/admin/connexion');
  };

  const itemsMenu = [
    { key: '/admin/reservations', icon: <CalendarOutlined />, label: <Link href="/admin/reservations">Réservations</Link> },
    { key: '/admin/salles', icon: <HomeOutlined />, label: <Link href="/admin/salles">Salles</Link> },
    { key: '/admin/etages', icon: <BuildOutlined />, label: <Link href="/admin/etages">Étages</Link> },
    { key: '/admin/entreprises', icon: <BankOutlined />, label: <Link href="/admin/entreprises">Entreprises</Link> },
    ...(utilisateur?.role === 'SUPER_ADMIN'
      ? [{ key: '/admin/utilisateurs', icon: <TeamOutlined />, label: <Link href="/admin/utilisateurs">Utilisateurs</Link> }]
      : []),
  ];

  const menuUtilisateur = [
    {
      key: 'deconnexion',
      icon: <LogoutOutlined />,
      label: 'Se déconnecter',
      onClick: seDeconnecter,
      danger: true,
    },
  ];

  // La page de connexion ne doit pas afficher le layout admin
  if (pathname === '/admin/connexion') return <>{children}</>;

  if (!utilisateur) return null;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        style={{ background: COULEURS.primaire }}
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            Bravia Admin
          </Typography.Title>
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
          <Link href="/" style={{ color: COULEURS.primaire, fontSize: 13 }}>
            ← Vue publique
          </Link>
          <Dropdown menu={{ items: menuUtilisateur }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ background: COULEURS.primaire }}>
                <UserOutlined />
              </Avatar>
              <Typography.Text>
                {utilisateur.prenom} {utilisateur.nom}
              </Typography.Text>
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
