'use client';

import { WidgetLayout } from '@nitrostack/widgets';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ backgroundColor: '#000000', colorScheme: 'dark' }}>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#000000', color: '#f8fafc' }}>
        <WidgetLayout>{children}</WidgetLayout>
      </body>
    </html>
  );
}
