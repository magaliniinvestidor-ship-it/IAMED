import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import HydrationFix from '@/components/HydrationFix';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'IAMED — CRM & ERP Clínico Inteligente',
  description: 'Sistema completo integrado de gestão médica, recepção, faturamento, prontuário eletrônico e CRM de pacientes.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={cn(jetbrainsMono.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="font-sans antialiased text-slate-800 bg-slate-50 min-h-screen" suppressHydrationWarning>
        <HydrationFix />
        {children}
      </body>
    </html>
  );
}
