import type { Metadata } from "next";
import { Cherry_Bomb_One, Quicksand } from "next/font/google";
import "./globals.css";

const cherryBomb = Cherry_Bomb_One({ weight: "400", subsets: ["latin"], variable: "--font-cherry-bomb" });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand" });

export const metadata: Metadata = {
  title: "RMT-Chan",
  description: "MTLE study & focus companion",
};

// Runs before paint so a saved theme and dark mode never flash the defaults.
const themeScript = `try{if(localStorage.palette)document.documentElement.dataset.palette=localStorage.palette;var t=localStorage.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cherryBomb.variable} ${quicksand.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans font-medium antialiased">{children}</body>
    </html>
  );
}
