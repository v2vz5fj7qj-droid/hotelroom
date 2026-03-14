'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { THEME_ANT } from '@/theme/theme.config';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={THEME_ANT} locale={frFR}>
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
