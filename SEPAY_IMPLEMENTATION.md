# 🎯 Hướng dẫn Triển khai Thanh toán SePay

## Tổng quan 3 Giai đoạn

### I. Khởi tạo Đơn hàng (Frontend → Backend → SePay)

**Luồng xử lý:**

1. Frontend gửi `POST /api/payment/checkout` với `planId`
2. Backend tạo `UserSubscription` (pending) và `Transaction` (pending)
3. Backend gọi SePay API để lấy thông tin thanh toán
4. Backend trả về QR code và nội dung chuyển khoản cho Frontend

### II. Giao dịch Thanh toán (Khách hàng & SePay Sandbox)

**Luồng xử lý:**

1. Frontend hiển thị QR code và nội dung CK
2. Người test truy cập SePay Sandbox
3. Nhập số tiền và nội dung CK chính xác
4. Nhấn "Giả lập Thành công"

### III. Xác nhận Tự động (SePay → Backend)

**Luồng xử lý:**

1. SePay gửi webhook `POST /api/sepay/webhook`
2. Backend xác thực signature
3. Backend cập nhật Transaction → SUCCESS
4. Backend kích hoạt Subscription và cấp storage

---

## 📋 Cấu hình

### 1. Environment Variables

Thêm vào file `.env`:

```bash
# SePay Payment Gateway
SEPAY_API_KEY=your-sepay-api-key
SEPAY_SECRET_KEY=your-sepay-secret-key
SEPAY_TEST_MODE=true
SEPAY_RETURN_URL=http://localhost:3001/payment/success
SEPAY_CANCEL_URL=http://localhost:3001/payment/cancel
```

### 2. Cấu hình Webhook URL trên SePay Dashboard

Đăng nhập vào SePay Dashboard và cấu hình:

- **Webhook URL**: `https://your-domain.com/api/sepay/webhook`
- **Test Mode**: Bật để sử dụng môi trường test

---

## 🔌 API Endpoints

### 1. Khởi tạo Thanh toán

**Endpoint:** `POST /api/payment/checkout`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
	"planId": "uuid-of-plan"
}
```

**Response:**

```json
{
	"status": "pending",
	"transactionId": "uuid-of-transaction",
	"paymentInfo": {
		"qrCodeData": "base64-qr-code-image",
		"description": "NAPTIEN 1a2b3c 50000",
		"bankInfo": {
			"bankName": "Vietcombank",
			"accountNumber": "1234567890",
			"accountName": "CONG TY ABC"
		}
	},
	"subscription": {
		"id": "uuid",
		"planName": "Premium Plan",
		"amount": 50000,
		"durationDays": 30
	}
}
```

### 2. Kiểm tra Trạng thái Thanh toán

**Endpoint:** `GET /api/payment/status/:transactionId`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
	"transactionId": "uuid",
	"status": "success",
	"amount": 50000,
	"paidAt": "2024-01-01T00:00:00.000Z",
	"subscription": {
		"id": "uuid",
		"isActive": true,
		"startDate": "2024-01-01T00:00:00.000Z",
		"endDate": "2024-01-31T00:00:00.000Z"
	}
}
```

### 3. Webhook (SePay → Backend)

**Endpoint:** `POST /api/sepay/webhook`

**Headers:**

```
x-sepay-signature: <signature>
Content-Type: application/json
```

**Request Body:**

```json
{
	"orderId": "uuid-of-transaction",
	"amount": 50000,
	"status": "SUCCESS",
	"transactionId": "sepay-transaction-id"
}
```

**Response:**

```json
{
	"message": "received",
	"data": {
		"message": "Payment processed successfully",
		"subscription": {
			"id": "uuid",
			"isActive": true
		}
	}
}
```

---

## 🧪 Testing với SePay Sandbox

### Bước 1: Khởi tạo Thanh toán

```bash
curl -X POST http://localhost:3000/api/payment/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "YOUR_PLAN_ID"}'
```

### Bước 2: Giả lập Thanh toán

1. Truy cập SePay Sandbox Dashboard
2. Tìm giao dịch với `orderId` từ response
3. Nhập số tiền và nội dung CK chính xác
4. Nhấn "Giả lập Thành công"

### Bước 3: Kiểm tra Kết quả

```bash
curl -X GET http://localhost:3000/api/payment/status/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔒 Bảo mật

### 1. Webhook Signature Verification

- Mọi webhook từ SePay đều được xác thực bằng signature
- Signature được tạo từ `SECRET_KEY` và raw body
- Nếu signature không hợp lệ, webhook sẽ bị từ chối

### 2. Idempotency

- Webhook có thể được gửi nhiều lần
- Backend kiểm tra trạng thái transaction trước khi xử lý
- Tránh duplicate activation

### 3. Public Endpoint

- Webhook endpoint là public (không cần JWT)
- Bảo mật bằng signature verification

---

## 📊 Database Schema

### Transaction

```typescript
{
	id: string(UUID); // Dùng làm orderId
	userId: string;
	subscriptionId: string;
	amount: number;
	currency: string;
	paymentMethod: string;
	status: 'pending' | 'success' | 'failed' | 'canceled';
	transactionRef: string | null;
	paymentGatewayId: string | null; // SePay transaction ID
	paidAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}
```

### UserSubscription

```typescript
{
	id: string(UUID);
	userId: string;
	planId: string;
	startDate: Date | null;
	endDate: Date | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}
```

---

## 🐛 Troubleshooting

### Webhook không được gọi

- Kiểm tra Webhook URL trên SePay Dashboard
- Đảm bảo server có thể truy cập từ internet (dùng ngrok cho local)
- Kiểm tra logs của SePay Dashboard

### Signature verification failed

- Kiểm tra `SEPAY_SECRET_KEY` trong `.env`
- Đảm bảo raw body được preserve (đã cấu hình trong `main.ts`)

### Transaction không được activate

- Kiểm tra logs trong console
- Kiểm tra trạng thái transaction trong database
- Kiểm tra webhook có được gọi thành công không

---

## 📝 Notes

- Trong môi trường test, không có tiền thật được chuyển
- SePay Sandbox cho phép giả lập mọi trạng thái thanh toán
- Webhook URL phải là HTTPS trong production
- Sử dụng ngrok hoặc localtunnel để test webhook ở local
