import type Stripe from 'stripe'

export type AppSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

export function getAppSubscriptionStatus(subscription: Pick<Stripe.Subscription, 'status' | 'cancel_at_period_end'>): AppSubscriptionStatus {
  if (subscription.cancel_at_period_end) return 'canceled'

  switch (subscription.status) {
    case 'trialing':
      return 'trialing'
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
    case 'paused':
    default:
      return 'canceled'
  }
}
