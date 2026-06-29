import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'IAMED — CRM & ERP Clínico Inteligente',
  description: 'Sistema completo integrado de gestão médica, recepção, faturamento, prontuário eletrônico e CRM de pacientes.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={cn(jetbrainsMono.variable, "font-sans", geist.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var originalFetch = window.fetch;
                  var currentFetch = originalFetch;
                  Object.defineProperty(window, 'fetch', {
                    get: function() { return currentFetch; },
                    set: function(val) { currentFetch = val; },
                    configurable: true,
                    enumerable: true
                  });
                } catch (e) {
                  console.warn("Failed to patch window.fetch getter/setter pattern:", e);
                }
              })();
            `
          }}
        />
      </head>
      <body className="font-sans antialiased text-slate-800 bg-slate-50 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
