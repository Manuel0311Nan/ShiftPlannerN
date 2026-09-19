import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider, Toaster } from "@/shared/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Tipografía de marca (manual de identidad): geométrica, solo para
// titulares y wordmark. El cuerpo de texto sigue en Inter.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EonLab — El tiempo de tu equipo, bien planificado",
  description:
    "EonLab genera horarios laborales óptimos automáticamente: turnos, disponibilidad y restricciones legales en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
