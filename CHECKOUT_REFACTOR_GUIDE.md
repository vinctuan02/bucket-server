# Checkout Flow Refactor Guide

## Overview

The checkout flow has been refactored to properly use the `SePayPgClient` from the `sepay-pg-node` library with environment-based configuration.

## Key Changes

### 1. Environment-Based SePayPgClient Configuration

**Before:**

```typescript
private readonly client = new SePayPgClient({
  env: 'sandbox',
  merchant_id: 'YOUR_MERCHANT_ID',
  secret_key: 'YOUR_MERCHANT_SECRET_KEY',
});
```

**After:**

```typescript
private readonly client: SePayPgClient;

private initializeClient() {
  return new SePayPgClient({
    env: process.env.SEPAY_ENV === 'production' ? 'production' : 'sandbox',
    merchant_id: process.env.SEPAY_MERCHANT_ID || '',
    secret_key: process.env.SEPAY_SECRET_KEY || '',
  });
}

constructor(...) {
  this.client = this.initializeClient();
}
```

- Client is now initialized in constructor with environment variables
- Supports both sandbox and production environments
- Configuration is centralized and secure

### 2. Simplified Checkout Flow

The `initiateCheckout()` method now follows a clean 5-step process:

```
Step 1: Retrieve Plan
  └─ Get plan details (price, duration, storage limit)

Step 2: Create/Find Pending Subscription
  └─ Ensure subscription exists before payment

Step 3: Create Transaction
  └─ Transaction ID becomes order_invoice_number for Sepay

Step 4: Generate Signed Payment Fields
  └─ Use client.checkout.initOneTimePaymentFields() to:
     - Generate form fields
     - Create HMAC-SHA256 signature
     - Get checkout URL

Step 5: Return Checkout Data to Frontend
  └─ Frontend receives:
     - checkoutUrl: Sepay checkout endpoint
     - formData: Pre-signed form fields with signature
     - transactionId: For status polling
     - subscription: Plan details
```

### 3. Direct SePayPgClient Usage

The refactored `initiateCheckout()` now directly uses the client's methods:

```typescript
// Get checkout URL
const checkoutUrl = this.client.checkout.initCheckoutUrl();

// Generate and sign payment fields
const formData = this.client.checkout.initOneTimePaymentFields({
	operation: 'PURCHASE',
	payment_method: 'BANK_TRANSFER',
	order_invoice_number: transaction.id,
	order_amount: Number(plan.price),
	currency: 'VND',
	order_description: `Subscription: ${plan.name}`,
	customer_id: userId,
	success_url: process.env.SEPAY_SUCCESS_URL || '',
	error_url: process.env.SEPAY_ERROR_URL || '',
	cancel_url: process.env.SEPAY_CANCEL_URL || '',
});
```

**Returns:**

- `checkoutUrl`: `https://pay-sandbox.sepay.vn/v1/checkout/init` (or production URL)
- `formData`: Object containing:
    - `merchant`: Merchant ID
    - `operation`: 'PURCHASE'
    - `payment_method`: 'BANK_TRANSFER' or 'NAPAS_BANK_TRANSFER'
    - `order_invoice_number`: Transaction UUID
    - `order_amount`: Payment amount
    - `currency`: 'VND'
    - `order_description`: Payment description
    - `customer_id`: User ID
    - `success_url`: Redirect on success
    - `error_url`: Redirect on error
    - `cancel_url`: Redirect on cancel
    - `signature`: HMAC-SHA256 signature (base64 encoded)

### 4. Available SePayPgClient Methods

**Checkout Class:**

- `initCheckoutUrl()`: Returns checkout endpoint URL
- `initOneTimePaymentFields(fields)`: Generates and signs payment fields
- `signFields(fields)`: Creates HMAC-SHA256 signature

**Order Class:**

- `all(queryParams)`: List all orders
- `retrieve(order_invoice_number)`: Get specific order details
- `voidTransaction(order_invoice_number)`: Void a transaction
- `cancel(order_invoice_number)`: Cancel an order

### 5. Frontend Implementation

Frontend should:

1. Receive checkout response from `/subscription/payment/checkout`
2. Create an HTML form with the `formData` fields
3. Auto-submit the form to `checkoutUrl`
4. Poll `/subscription/payment/status/:transactionId` for payment status

Example:

```typescript
// Frontend receives:
{
  status: 'PENDING',
  transactionId: 'uuid-123',
  checkoutUrl: 'https://pay-sandbox.sepay.vn/v1/checkout/init',
  formData: {
    merchant: 'MERCHANT_ID',
    operation: 'PURCHASE',
    payment_method: 'BANK_TRANSFER',
    order_invoice_number: 'uuid-123',
    order_amount: 100000,
    currency: 'VND',
    order_description: 'Subscription: Premium 100GB',
    customer_id: 'user-123',
    success_url: 'https://app.example.com/success',
    error_url: 'https://app.example.com/error',
    cancel_url: 'https://app.example.com/cancel',
    signature: 'base64-encoded-signature'
  }
}

// Frontend creates form and submits to checkoutUrl
```

## Configuration

Ensure these environment variables are set in `.env`:

```env
SEPAY_ENV=sandbox
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_secret_key
SEPAY_SUCCESS_URL=https://app.example.com/payment/success
SEPAY_ERROR_URL=https://app.example.com/payment/error
SEPAY_CANCEL_URL=https://app.example.com/payment/cancel
```

## Benefits

1. **Environment-Based Configuration**: Secure credential management
2. **Direct Library Usage**: Leverages `sepay-pg-node` methods correctly
3. **Type Safety**: Proper TypeScript types from library definitions
4. **Clean Code**: Removed unnecessary service layer for checkout
5. **Proper Signature Generation**: Uses library's built-in signing
6. **Flexible Environment Support**: Sandbox and production modes
