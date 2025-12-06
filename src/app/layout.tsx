import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kerwel-Snake",
  description: "Kerwel wird zur Schlange und frisst die IGBCE auf!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
