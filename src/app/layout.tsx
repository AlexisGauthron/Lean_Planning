import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Rooms — Academic Sanctuary",
  description: "Trouvez et réservez des salles disponibles sur tous les campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased" style={{ background: "var(--surface)" }}>
        {children}
      </body>
    </html>
  );
}
