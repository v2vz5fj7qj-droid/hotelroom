'use client';

import dynamic from 'next/dynamic';
import { use } from 'react';

const AffichageClient = dynamic(() => import('./AffichageClient'), { ssr: false });

export default function PageAffichage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <AffichageClient slug={slug} />;
}
