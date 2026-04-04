import 'server-only'
import Stripe from 'stripe'
import { getRequiredEnv } from '@/lib/env'

let stripeClient: Stripe | null = null

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient

  const stripeSecretKey = getRequiredEnv('STRIPE_SECRET_KEY')
  if (!stripeSecretKey.startsWith('sk_')) {
    throw new Error('Invalid STRIPE_SECRET_KEY. Expected a Stripe secret key starting with "sk_".')
  }

  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  })

  return stripeClient
}

export const PLANS = {
  monthly: {
    name: 'MindBloom Monthly',
    price: 999,
    get priceId(): string {
      return getRequiredEnv('STRIPE_PRICE_ID')
    },
    interval: 'month' as const,
    trialDays: 7,
    features: [
      'Unlimited AI therapy conversations',
      'Private encrypted journal',
      'DBT & CBT skill library',
      'Guided breathing exercises',
      'Grounding techniques',
      'Interactive worksheets',
      'Mood tracking & insights',
      'Anger management tools',
      'Coping toolkit',
    ],
  },
}
