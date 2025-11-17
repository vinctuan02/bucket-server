# Payment Flow Documentation

## Overview

This module implements a complete payment flow following industry standards (Stripe, PayPal, Momo). The flow is webhook-driven and supports multiple payment gateways.

## Architecture

```
User → Frontend → Backend → Payment Gateway
                    ↓
                Database (Transaction + Subscription)
                    ↓
                Payment Gateway → Webhook → Backend
                    ↓
                Update Transaction & Subscription
```

## Step-by-Step Flow

### Step 1: User Initiates Payment

**Endpoint:** `POST /subscription/transactions`

**Request:**

```json
{
	"planId": "uuid",
	"paymentMethod": "momo" // or "visa", "zalopay", "bank_transfer"
}
```

**Backend Actions:**

1. Validate plan exists
2. Create `UserSubscription` with `isActive = false`
3. Create `Transaction` with `status = PENDING`
4. Return transaction details

**Response:**

```json
{
	"id": "transaction-uuid",
	"userId": "user-uuid",
	"subscriptionId": "subscription-uuid",
	"amount": 100000,
	"currency": "VND",
	"paymentMethod": "momo",
	"status": "pending",
	"transactionRef": null,
	"paymentGatewayId": null,
	"paidAt": null,
	"createdAt": "2024-01-01T00:00:00Z",
	"updatedAt": "2024-01-01T00:00:00Z"
}
```

### Step 2: Create Payment Request

**Endpoint:** `POST /subscription/transactions/:id/create-payment`

**Backend Actions:**

1. Get transaction details
2. Call payment gateway to create payment
3. Receive `paymentGatewayId` and `redirectUrl`
4. Save `paymentGatewayId` to transaction
5. Return redirect URL to frontend

**Response:**

```json
{
	"redirectUrl": "https://payment-gateway.com/pay?token=xxx",
	"expiresAt": "2024-01-01T00:15:00Z"
}
```

### Step 3: User Completes Payment

User is redirected to payment gateway and completes payment.

### Step 4: Payment Gateway Sends Webhook

**Endpoint:** `POST /subscription/webhooks/:method`

**Headers:**

```
x-signature: <gateway-signature>
x-method: momo
```

**Payload (varies by gateway):**

```json
{
	"orderId": "transaction-uuid",
	"requestId": "gateway-request-id",
	"resultCode": 0,
	"amount": 100000,
	"message": "Success"
}
```

**Backend Actions:**

1. Verify webhook signature
2. Parse webhook payload
3. Find transaction by reference
4. Update transaction status
5. If status = SUCCESS:
    - Activate subscription
    - Set `startDate = NOW()`
    - Set `endDate = NOW() + plan.durationDays`
    - Set `isActive = true`

### Step 5: Return Result to Frontend

Frontend polls transaction status or receives real-time update via WebSocket.

## Database Schema

### Plans

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  storage_limit BIGINT,
  price DECIMAL(12, 2),
  duration_days INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### UserSubscriptions

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Transactions

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID NOT NULL,
  amount DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'VND',
  payment_method VARCHAR(50),
  status ENUM('pending', 'success', 'failed', 'canceled'),
  transaction_ref VARCHAR(255),
  payment_gateway_id VARCHAR(255),
  paid_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Payment Gateway Integration

### Adding a New Gateway

1. Create a new gateway class extending `PaymentGatewayService`:

```typescript
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

2. Register in `subscription.module.ts`:

```typescript
providers: [
	// ... other providers
	PayPalGateway,
];
```

3. Register gateway in `PaymentService` (in app initialization):

```typescript
paymentService.registerGateway(PaymentMethod.PAYPAL, paypalGateway);
```

## Cron Jobs

### Deactivate Expired Subscriptions

Runs every 1 hour to deactivate subscriptions that have passed their `endDate`.

```typescript
@Cron(CronExpression.EVERY_HOUR)
async handleExpiredSubscriptions(): Promise<void> {
  const count = await this.subscriptionService.deactivateExpiredSubscriptions();
  this.logger.log(`Deactivated ${count} expired subscriptions`);
}
```

## Error Handling

### Transaction Not Found

- Status: 404
- Message: "Transaction not found"

### Invalid Payment Method

- Status: 400
- Message: "Invalid payment method"

### Invalid Webhook Signature

- Status: 400
- Message: "Invalid webhook signature"

### Payment Gateway Error

- Status: 500
- Message: "Failed to create [Gateway] payment"

## Security Considerations

1. **Webhook Signature Verification**: Always verify webhook signatures to prevent unauthorized updates
2. **Idempotency**: Webhook handlers should be idempotent (safe to call multiple times)
3. **Transaction Reference**: Use transaction reference to prevent duplicate charges
4. **HTTPS Only**: All payment gateway communications must use HTTPS
5. **Secret Keys**: Store gateway secret keys in environment variables, never in code

## Environment Variables

```env
# Momo
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (if implemented)
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
```

## Testing

### Create Transaction

```bash
curl -X POST http://localhost:3000/subscription/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-uuid",
    "paymentMethod": "momo"
  }'
```

### Get Transaction

```bash
curl -X GET http://localhost:3000/subscription/transactions/transaction-uuid \
  -H "Authorization: Bearer <token>"
```

### Simulate Webhook

```bash
curl -X POST http://localhost:3000/subscription/webhooks/momo \
  -H "x-signature: <signature>" \
  -H "x-method: momo" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "transaction-uuid",
    "requestId": "gateway-request-id",
    "resultCode": 0,
    "amount": 100000
  }'
```

## References

- [Stripe Documentation](https://stripe.com/docs)
- [Momo Developer](https://developers.momo.vn/)
- [PayPal Developer](https://developer.paypal.com/)
