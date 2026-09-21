import type { Metadata, Viewport } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";

const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "COMICOMANÍA — El movimiento global del humor",
    template: "%s · COMICOMANÍA",
  },
  description:
    "El humor nos mueve. El movimiento global donde el humor conecta talento, audiencia, marcas y oportunidades. Concursos, humoristas, eventos, academia y comunidad.",
  keywords: [
    "humor", "comedia", "humoristas", "comediantes", "stand-up",
    "concursos de comedia", "videos de humor", "eventos de comedia",
    "cursos de comedia", "nuevos talentos", "entretenimiento",
    "humor latino", "comedia latina",
  ],
  openGraph: {
    type: "website",
    siteName: "COMICOMANÍA",
    images: ["/brand/comicomania-og-1200x630.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${archivo.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
