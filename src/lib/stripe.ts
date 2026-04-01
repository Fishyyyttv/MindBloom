import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export const PLANS = {
  monthly: {
    name: 'MindBloom Monthly',
    price: 999, // $9.99 in cents
    priceId: process.env.STRIPE_PRICE_ID!,
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
