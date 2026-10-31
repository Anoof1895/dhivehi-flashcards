import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ދިވެހި ބަސްކޮށާރު | Modern Dhivehi & Bilingual Study Studio",
  description:
    "Fast, ad-free Dhivehi & Bilingual Flashcard Studio with authentic Faruma typography, 3D interactive cards, Quizlet importer/exporter, Learn quiz mode, timed Match mini-game, and A4 print sheets.",
  keywords: [
    "Dhivehi",
    "Thaana",
    "Faruma",
    "Baskoshaaru",
    "Flashcards",
    "Quizlet alternative",
    "Maldives",
  ],
  authors: [{ name: "Dhivehi Study Studio" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090B10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var theme = localStorage.getItem('dhivehi_flashcards_theme_v1');
                if (theme === 'light') {
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.documentElement.removeAttribute('data-theme');
                }
              } catch(e) {}
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-app text-fg selection:bg-accent/25 selection:text-accent-soft">
        {children}
      </body>
    </html>
  );
}
