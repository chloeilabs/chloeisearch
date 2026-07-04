import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Search',
  description: 'A Google-style search engine powered by the Brave Search API',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
