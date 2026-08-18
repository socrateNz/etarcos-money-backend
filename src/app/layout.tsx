export const metadata = {
  title: 'Tacynt Money Backend',
  description: 'Backend API for Tacynt Money',
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
