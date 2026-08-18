export const metadata = {
  title: 'Etarcos Money Backend',
  description: 'Backend API for Etarcos Money',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
