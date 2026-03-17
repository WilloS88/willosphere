import "./globals.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WilloSphere',
  description: 'WilloSphere',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return(
    <html lang="cs" data-theme="light" >
      <body >
        {children}
      </body>
    </html>
  );
}
