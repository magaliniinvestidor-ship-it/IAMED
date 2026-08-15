import type { Metadata } from 'next';
import VerifyClient from './VerifyClient';

export const metadata: Metadata = {
  title: 'IAMED — Verificação de Receita',
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d = '' } = await searchParams;
  return <VerifyClient payload={d} />;
}