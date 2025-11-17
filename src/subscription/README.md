# Subscription Module

Complete payment flow implementation supporting multiple payment gateways (Momo, Stripe, PayPal, etc.).

## Features

- ✅ Multi-gateway payment support
- ✅ Webhook-driven payment processing
- ✅ Automatic subscription activation on successful payment
- ✅ Cron job for subscription expiration
- ✅ Idempotent webhook handling
- ✅ Transaction tracking and history

## Architecture

### Entities

1. **Plan** - Subscription plans with pricing and storage limits
2. **UserSubscription** - User's active/inactive subscriptions
3. **Transaction** - Payment transaction records

### Services

1. **PlanService** - Manage subscription plans
2. **SubscriptionService** - Manage user subscriptions
3. **TransactionService** - Handle payment transactions
4. **PaymentService** - Gateway abstraction layer
5. **CronService** - Scheduled tasks (expiration handling)

### Payment Gateways

- **MomoGateway** - Momo payment integration
- **StripeGateway** - Stripe payment integration
- Extensible for PayPal, ZaloPay, etc.

## Payment Flow

```
1. User selects plan → Create Transaction + UserSubscription (pending)
2. Backend creates payment request → Get redirect URL from gateway
3. User completes payment on gateway
4. Gateway sends webhook → Backend updates transaction status
5. If success → Activate subscription, set start/end dates
6. Cron job → Deactivate expired subscriptions hourly
```

## API Endpoints

### Plans

- `POST /subscription/plans` - Create plan (admin)
- `GET /subscription/plans` - List plans
- `GET /subscription/plans/:id` - Get plan details
- `PUT /subscription/plans/:id` - Update plan
- `DELETE /subscription/plans/:id` - Delete plan

### Transactions

- `POST /subscription/transactions` - Create transaction (initiate payment)
- `GET /subscription/transactions` - List user transactions
- `GET /subscription/transactions/:id` - Get transaction details
- `POST /subscription/transactions/:id/create-payment` - Create payment request
- `PUT /subscription/transactions/:id/status` - Update transaction status
- `POST /subscription/transactions/:id/confirm` - Confirm payment
- `POST /subscription/transactions/:id/fail` - Mark as failed

### Subscriptions

- `GET /subscription/subscriptions` - List user subscriptions
- `GET /subscription/subscriptions/active` - Get active subscription

### Webhooks

- `POST /subscription/webhooks/:method` - Handle payment gateway webhook

## Usage Example

### 1. Create a Plan (Admin)

```bash
curl -X POST http://localhost:3000/subscription/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "description": "Professional plan with 100GB storage",
    "storageLimit": 107374182400,
    "price": 99.99,
    "durationDays": 30,
    "isActive": true
  }'
```

### 2. User Initiates Payment

```bash
curl -X POST http://localhost:3000/subscription/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-uuid",
    "paymentMethod": "momo"
  }'
```

Response:

```json
{
	"id": "transaction-uuid",
	"subscriptionId": "subscription-uuid",
	"amount": 99.99,
	"status": "pending",
	"paymentMethod": "momo"
}
```

### 3. Create Payment Request

```bash
curl -X POST http://localhost:3000/subscription/transactions/transaction-uuid/create-payment \
  -H "Authorization: Bearer <token>"
```

Response:

```json
{
	"redirectUrl": "https://payment-gateway.com/pay?token=xxx",
	"expiresAt": "2024-01-01T00:15:00Z"
}
```

### 4. User Completes Payment

User is redirected to payment gateway and completes payment.

### 5. Gateway Sends Webhook

```bash
curl -X POST http://localhost:3000/subscription/webhooks/momo \
  -H "x-signature: <signature>" \
  -H "x-method: momo" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "transaction-uuid",
    "requestId": "gateway-request-id",
    "resultCode": 0,
    "amount": 99.99
  }'
```

## Configuration

### Environment Variables

```env
# Momo Gateway
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

# Stripe Gateway
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Gateway (if implemented)
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
```

## Adding a New Payment Gateway

1. Create gateway class:

```typescript
// src/subscription/services/gateways/paypal.gateway.ts
@Injectable()
export class PayPalGateway extends PaymentGatewayService {
	method = PaymentMethod.PAYPAL;

	async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
		// Implementation
	}

	verifyWebhookSignature(
		payload: Record<string, any>,
		signature: string,
	): boolean {
		// Implementation
	}

	parseWebhookPayload(payload: Record<string, any>): WebhookPayload {
		// Implementation
	}
}
```

2. Register in module:

```typescript
// subscription.module.ts
providers: [
	// ... other providers
	PayPalGateway,
];
```

3. Register gateway in app initialization:

```typescript
paymentService.registerGateway(PaymentMethod.PAYPAL, paypalGateway);
```

## Database Schema

### Plans Table

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  storage_limit BIGINT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  duration_days INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### UserSubscriptions Table

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);
```

### Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  payment_method VARCHAR(50) NOT NULL,
  status ENUM('pending', 'success', 'failed', 'canceled') DEFAULT 'pending',
  transaction_ref VARCHAR(255),
  payment_gateway_id VARCHAR(255),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);
```

## Security Considerations

1. **Webhook Signature Verification** - Always verify webhook signatures
2. **Idempotency** - Webhook handlers are idempotent (safe to call multiple times)
3. **HTTPS Only** - All payment communications use HTTPS
4. **Secret Keys** - Store in environment variables, never in code
5. **Transaction Reference** - Prevents duplicate charges

## Testing

### Unit Tests

```bash
npm run test -- subscription
```

### Integration Tests

```bash
npm run test:e2e -- subscription
```

### Manual Testing

See PAYMENT_FLOW.md for detailed testing instructions.

## Troubleshooting

### Transaction Not Found

- Verify transaction ID is correct
- Check transaction exists in database

### Invalid Webhook Signature

- Verify webhook secret is correct
- Check signature calculation matches gateway

### Payment Gateway Error

- Verify API credentials in environment variables
- Check gateway endpoint is accessible
- Review gateway documentation

## References

- [Momo Developer](https://developers.momo.vn/)
- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Developer](https://developer.paypal.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
