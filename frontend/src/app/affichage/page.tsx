'use client';

import dynamic from 'next/dynamic';

const AffichageClient = dynamic(() => import('./AffichageClient'), { ssr: false });

export default function PageAffichage() {
  return <AffichageClient />;
}
