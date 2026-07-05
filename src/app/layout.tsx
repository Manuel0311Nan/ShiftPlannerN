import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider, Toaster } from "@/shared/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScheduleAI — Horarios laborales automáticos",
  description:
    "Genera horarios laborales óptimos automáticamente: turnos, disponibilidad y restricciones legales en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}
