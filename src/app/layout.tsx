import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AWS Cost Alert | Stop AWS bill shock before it happens',
  description: 'Enterprise-grade AWS cost monitoring, anomaly detection, and automated remediation for modern engineering teams. Get Slack alerts instantly.',
  keywords: ['AWS cost', 'cloud monitoring', 'anomaly detection', 'AWS billing', 'FinOps'],
  openGraph: {
    type: 'website',
    title: 'AWS Cost Alert | Cloud Cost Optimization',
    description: 'Real-time anomaly detection, intelligent forecasting, and automated cost optimization delivered straight to your Slack channel.',
    siteName: 'AWS Cost Alert',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AWS Cost Alert | Stop AWS bill shock',
    description: 'Real-time anomaly detection, intelligent forecasting, and automated cost optimization delivered straight to your Slack channel.',
  },
}

import { Shell } from '@/components/layout/Shell'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth();
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-background text-foreground antialiased`}>
          {userId ? <Shell>{children}</Shell> : children}
        </body>
      </html>
    </ClerkProvider>
  )
}
