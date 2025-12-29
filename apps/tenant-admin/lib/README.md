# Stripe Integration - Setup Guide

Complete guide for setting up Stripe payment integration in Akademate Tenant Admin.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Stripe Dashboard Setup](#stripe-dashboard-setup)
- [Environment Configuration](#environment-configuration)
- [Creating Products and Prices](#creating-products-and-prices)
- [Webhook Configuration](#webhook-configuration)
- [Testing](#testing)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- A Stripe account ([Sign up here](https://dashboard.stripe.com/register))
- Access to the Stripe Dashboard
- Node.js 18+ installed
- Environment file (.env) set up

---

## Stripe Dashboard Setup

### 1. Get Your API Keys

1. Log into the [Stripe Dashboard](https://dashboard.stripe.com/)
2. Toggle to **Test Mode** (top right corner - should show "Viewing test data")
3. Navigate to **Developers** > **API keys**
4. Copy your keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (click "Reveal test key")

**IMPORTANT:** Never commit your secret key to version control!

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cd apps/tenant-admin
cp .env.example .env
```

### 2. Configure Stripe Keys

Edit `.env` and add your Stripe keys:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here

# Webhook secret (configure after creating webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is accessible in the browser (client-side).

### 3. Verify Configuration

Run this command to verify Stripe is configured:

```typescript
import { isStripeConfigured } from '@/lib/stripe'

if (isStripeConfigured()) {
  console.log('✓ Stripe is properly configured')
} else {
  console.error('✗ Stripe configuration missing')
}
```

---

## Creating Products and Prices

Akademate uses three subscription tiers: **Starter**, **Pro**, and **Enterprise**.

### Default Pricing (from `packages/types/src/billing.ts`)

| Plan       | Monthly Price | Yearly Price |
|------------|---------------|--------------|
| Starter    | €199/mo       | €1,990/yr    |
| Pro        | €299/mo       | €2,990/yr    |
| Enterprise | €599/mo       | €5,990/yr    |

### Create Products in Stripe Dashboard

#### Option A: Using Stripe Dashboard (Recommended for initial setup)

1. Go to **Products** in Stripe Dashboard
2. Click **+ Add product**
3. Create each plan:

**Starter Plan:**
```
Name: Akademate Starter
Description: Perfect for small institutions getting started
Pricing model: Recurring
- Monthly: €199.00 EUR
- Yearly: €1,990.00 EUR (save 17%)
```

**Pro Plan:**
```
Name: Akademate Pro
Description: For growing institutions with advanced needs
Pricing model: Recurring
- Monthly: €299.00 EUR
- Yearly: €2,990.00 EUR (save 17%)
```

**Enterprise Plan:**
```
Name: Akademate Enterprise
Description: Full-featured solution for large institutions
Pricing model: Recurring
- Monthly: €599.00 EUR
- Yearly: €5,990.00 EUR (save 17%)
```

4. After creating each product, copy the **Price IDs** (they look like `price_abc123...`)
5. Update your `.env`:

```env
STRIPE_PRICE_STARTER_MONTHLY=price_1234567890abcdef
STRIPE_PRICE_STARTER_YEARLY=price_0987654321fedcba
STRIPE_PRICE_PRO_MONTHLY=price_1111111111111111
STRIPE_PRICE_PRO_YEARLY=price_2222222222222222
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_3333333333333333
STRIPE_PRICE_ENTERPRISE_YEARLY=price_4444444444444444
```

#### Option B: Using Stripe CLI (for automation)

```bash
# Install Stripe CLI first: https://stripe.com/docs/stripe-cli

# Create Starter Plan
stripe products create \
  --name="Akademate Starter" \
  --description="Perfect for small institutions"

# Create monthly price (use product ID from previous command)
stripe prices create \
  --product=prod_XXXXX \
  --currency=eur \
  --unit-amount=19900 \
  --recurring[interval]=month

# Create yearly price
stripe prices create \
  --product=prod_XXXXX \
  --currency=eur \
  --unit-amount=199000 \
  --recurring[interval]=year

# Repeat for Pro and Enterprise tiers
```

---

## Webhook Configuration

Webhooks allow Stripe to notify your application about events (e.g., successful payment, subscription canceled).

### 1. Create Webhook Endpoint in Stripe Dashboard

1. Go to **Developers** > **Webhooks**
2. Click **+ Add endpoint**
3. Enter your endpoint URL:
   - **Development**: `https://your-dev-domain.com/api/webhooks/stripe`
   - **Production**: `https://your-app.com/api/webhooks/stripe`

4. Select events to listen to:
   - ✓ `customer.subscription.created`
   - ✓ `customer.subscription.updated`
   - ✓ `customer.subscription.deleted`
   - ✓ `customer.subscription.trial_will_end`
   - ✓ `invoice.paid`
   - ✓ `invoice.payment_failed`
   - ✓ `invoice.payment_succeeded`
   - ✓ `checkout.session.completed`
   - ✓ `checkout.session.expired`
   - ✓ `payment_intent.succeeded`
   - ✓ `payment_intent.payment_failed`

5. Click **Add endpoint**
6. Copy the **Signing secret** (looks like `whsec_...`)
7. Add it to your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

### 2. Test Webhooks Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
# Login to Stripe CLI
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will output a webhook signing secret starting with whsec_
# Use this secret for local development
```

### 3. Trigger Test Events

```bash
# Test subscription creation
stripe trigger customer.subscription.created

# Test payment success
stripe trigger invoice.payment_succeeded

# Test payment failure
stripe trigger invoice.payment_failed
```

---

## Testing

### Test Mode vs Live Mode

- **Test Mode**: Use test API keys (`pk_test_...` / `sk_test_...`)
  - No real money is charged
  - Use [test card numbers](https://stripe.com/docs/testing)

- **Live Mode**: Use live API keys (`pk_live_...` / `sk_live_...`)
  - Real money is charged
  - Only use in production

### Test Card Numbers

| Card Number         | Scenario                |
|---------------------|-------------------------|
| `4242 4242 4242 4242` | Successful payment      |
| `4000 0000 0000 9995` | Payment declined        |
| `4000 0000 0000 3220` | 3D Secure required      |

**Expiry**: Any future date (e.g., `12/34`)
**CVC**: Any 3 digits (e.g., `123`)
**ZIP**: Any postal code

### Run Integration Tests

```bash
cd apps/tenant-admin

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

---

## Usage Examples

### Create a Customer

```typescript
import { createStripeCustomer } from '@/lib/stripe'

const customer = await createStripeCustomer(
  '[email protected]',
  {
    name: 'Universidad Example',
    metadata: {
      tenantId: 'tenant_123',
      accountType: 'institution'
    }
  }
)

console.log(`Customer created: ${customer.id}`)
```

### Create a Subscription with Trial

```typescript
import { createSubscription } from '@/lib/stripe'

const subscription = await createSubscription(
  'cus_123456789',
  process.env.STRIPE_PRICE_PRO_MONTHLY!,
  {
    metadata: { tenantId: 'tenant_123' },
    trialDays: 14 // 14-day free trial
  }
)

console.log(`Subscription: ${subscription.id} - Status: ${subscription.status}`)
```

### Create Checkout Session (Payment Flow)

```typescript
import { createCheckoutSession } from '@/lib/stripe'

const session = await createCheckoutSession(
  'cus_123456789',
  process.env.STRIPE_PRICE_STARTER_MONTHLY!,
  'https://yourapp.com/subscription/success',
  'https://yourapp.com/subscription/cancel',
  { tenantId: 'tenant_123' }
)

// Redirect user to session.url
redirect(session.url)
```

### Create Billing Portal Session (Self-Service)

```typescript
import { createBillingPortalSession } from '@/lib/stripe'

const portal = await createBillingPortalSession(
  'cus_123456789',
  'https://yourapp.com/account/billing'
)

// Redirect to portal where customer can:
// - Update payment method
// - View invoices
// - Cancel subscription
redirect(portal.url)
```

### Get Customer Subscriptions

```typescript
import { getSubscriptions } from '@/lib/stripe'

const subscriptions = await getSubscriptions('cus_123456789')

const activeSubscriptions = subscriptions.filter(
  sub => sub.status === 'active'
)

console.log(`Active subscriptions: ${activeSubscriptions.length}`)
```

### Cancel Subscription

```typescript
import { cancelSubscription } from '@/lib/stripe'

// Cancel at end of billing period (recommended)
const subscription = await cancelSubscription('sub_123', false)

// Cancel immediately (customer loses access now)
const subscription = await cancelSubscription('sub_123', true)
```

### Get Invoices

```typescript
import { getInvoices } from '@/lib/stripe'

const invoices = await getInvoices('cus_123456789')

const paidInvoices = invoices.filter(inv => inv.status === 'paid')
console.log(`Paid invoices: ${paidInvoices.length}`)
```

### Handle Webhooks

```typescript
import { constructWebhookEvent } from '@/lib/stripe'
import type { Stripe } from 'stripe'

// In your API route (app/api/webhooks/stripe/route.ts)
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  try {
    const event = constructWebhookEvent(body, signature)

    switch (event.type) {
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription
        // Update database with new subscription
        await db.subscriptions.create({ ... })
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        // Record successful payment
        await db.payments.create({ ... })
        break

      // Handle other events...
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }
}
```

---

## Troubleshooting

### "Stripe is not configured" Error

**Cause**: Missing or invalid `STRIPE_SECRET_KEY`

**Solution**:
1. Check your `.env` file has `STRIPE_SECRET_KEY=sk_test_...`
2. Ensure the key starts with `sk_test_` (test mode) or `sk_live_` (live mode)
3. Restart your development server after changing `.env`

```bash
# Restart dev server
pnpm dev
```

### Webhook Signature Verification Failed

**Cause**: Invalid `STRIPE_WEBHOOK_SECRET` or incorrect payload

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` in `.env` matches the one from Stripe Dashboard
2. For local development, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Ensure webhook endpoint receives **raw body** (not parsed JSON)

### Test Card Not Working

**Cause**: Using real card numbers in test mode or vice versa

**Solution**:
- **Test Mode**: Use [Stripe test cards](https://stripe.com/docs/testing)
- **Live Mode**: Use real payment methods (be careful!)

### Price ID Not Found

**Cause**: Using wrong Price ID or product not created in Stripe

**Solution**:
1. Go to Stripe Dashboard > **Products**
2. Click on your product
3. Copy the Price ID (starts with `price_`)
4. Update your `.env` with correct Price ID

### Customer Already Exists

**Cause**: Trying to create duplicate customer with same email

**Solution**:
```typescript
// Search for existing customer first
const customers = await stripe.customers.list({
  email: '[email protected]',
  limit: 1
})

const customer = customers.data[0] || await createStripeCustomer('[email protected]')
```

---

## Security Best Practices

1. **Never expose secret keys**: Only use `STRIPE_SECRET_KEY` server-side
2. **Always verify webhooks**: Use `constructWebhookEvent()` to validate signatures
3. **Use HTTPS in production**: Stripe requires HTTPS for live mode webhooks
4. **Rotate keys periodically**: Generate new API keys every 6-12 months
5. **Monitor Stripe Dashboard**: Set up alerts for suspicious activity

---

## Production Checklist

Before going live:

- [ ] Switch to **Live Mode** API keys (`pk_live_...` / `sk_live_...`)
- [ ] Create live products and prices in Stripe Dashboard
- [ ] Configure live webhook endpoint with HTTPS
- [ ] Update `.env` with live credentials
- [ ] Enable Stripe Radar (fraud prevention)
- [ ] Set up email notifications for failed payments
- [ ] Configure Billing Portal settings
- [ ] Test payment flow end-to-end with real card
- [ ] Review Stripe compliance requirements (PCI DSS, etc.)
- [ ] Set up monitoring and error tracking

---

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Node.js Library](https://github.com/stripe/stripe-node)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

## Support

For issues with Stripe integration:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Stripe API logs in Dashboard > **Developers** > **Logs**
3. Use Stripe CLI for local debugging: `stripe logs tail`
4. Contact Stripe Support (excellent customer service!)

---

**Last Updated**: December 2024
**Akademate Version**: 1.0.0
**Stripe API Version**: 2024-12-18.acacia
