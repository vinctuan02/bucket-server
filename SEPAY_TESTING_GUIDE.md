# 🧪 Hướng dẫn Test Thanh toán SePay

## Chuẩn bị

### 1. Cấu hình Environment Variables

Thêm vào file `.env`:

```bash
# SePay Payment Gateway
SEPAY_API_KEY=test_api_key_from_sepay
SEPAY_SECRET_KEY=test_secret_key_from_sepay
SEPAY_TEST_MODE=true
SEPAY_RETURN_URL=http://localhost:3001/payment/success
SEPAY_CANCEL_URL=http://localhost:3001/payment/cancel
```

### 2. Khởi động Backend

```bash
cd bucket-server
yarn install
yarn start:dev
```

Backend sẽ chạy tại: `http://localhost:3000`

### 3. Khởi động Frontend

```bash
cd bucket-client
yarn install
yarn dev
```

Frontend sẽ chạy tại: `http://localhost:3001`

### 4. Cấu hình Webhook (cho Local Testing)

Vì webhook cần URL public, bạn cần dùng ngrok hoặc localtunnel:

#### Sử dụng ngrok:

```bash
# Cài đặt ngrok
brew install ngrok  # macOS
# hoặc tải từ https://ngrok.com/download

# Chạy ngrok
ngrok http 3000
```

Ngrok sẽ cung cấp URL public như: `https://abc123.ngrok.io`

#### Cấu hình trên SePay Dashboard:

1. Đăng nhập vào SePay Dashboard
2. Vào phần Settings → Webhooks
3. Thêm Webhook URL: `https://abc123.ngrok.io/sepay/webhook`
4. Lưu cấu hình

---

## 🎯 Test Flow Đầy đủ

### Bước 1: Tạo Plan (nếu chưa có)

```bash
curl -X POST http://localhost:3000/api/plan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Plan",
    "description": "Gói Premium với 50GB dung lượng",
    "storageLimit": 53687091200,
    "price": 50000,
    "durationDays": 30,
    "isActive": true
  }'
```

Response:

```json
{
  "id": "plan-uuid-here",
  "name": "Premium Plan",
  "price": 50000,
  ...
}
```

### Bước 2: Khởi tạo Thanh toán

#### Option A: Sử dụng Frontend UI

1. Truy cập: `http://localhost:3001/payment`
2. Chọn gói muốn mua
3. Nhấn "Chọn gói này"
4. Modal thanh toán sẽ hiển thị QR code và thông tin chuyển khoản

#### Option B: Sử dụng API trực tiếp

```bash
curl -X POST http://localhost:3000/api/payment/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-uuid-here"
  }'
```

Response:

```json
{
	"status": "pending",
	"transactionId": "transaction-uuid-here",
	"paymentInfo": {
		"qrCodeData": "base64-encoded-qr-code",
		"description": "NAPTIEN abc123 50000",
		"bankInfo": {
			"bankName": "Vietcombank",
			"accountNumber": "1234567890",
			"accountName": "CONG TY ABC"
		}
	},
	"subscription": {
		"id": "subscription-uuid",
		"planName": "Premium Plan",
		"amount": 50000,
		"durationDays": 30
	}
}
```

**Lưu lại:**

- `transactionId`: để kiểm tra trạng thái
- `description`: nội dung chuyển khoản (VD: `NAPTIEN abc123 50000`)

### Bước 3: Giả lập Thanh toán trên SePay Sandbox

1. Đăng nhập vào SePay Sandbox Dashboard
2. Vào phần "Test Transactions" hoặc "Sandbox"
3. Tìm giao dịch với `orderId` = `transactionId` từ bước 2
4. Nhập thông tin:
    - **Số tiền**: `50000` (phải khớp chính xác)
    - **Nội dung**: `NAPTIEN abc123 50000` (phải khớp chính xác)
5. Nhấn nút "Giả lập Thành công"

### Bước 4: Kiểm tra Webhook

Sau khi giả lập thành công, SePay sẽ gửi webhook đến backend.

#### Kiểm tra logs của Backend:

```
[PaymentService] Processing webhook for orderId: transaction-uuid-here
[PaymentService] Subscription subscription-uuid activated successfully
[PaymentService] Storage granted: 53687091200 bytes for user user-uuid
```

#### Kiểm tra logs của ngrok (nếu dùng):

```
POST /sepay/webhook    200 OK
```

### Bước 5: Xác nhận Kết quả

#### Option A: Frontend tự động cập nhật

- Modal thanh toán sẽ tự động chuyển sang trạng thái "Thanh toán thành công"
- Sau 2 giây, modal đóng và trang reload

#### Option B: Kiểm tra bằng API

```bash
curl -X GET http://localhost:3000/api/payment/status/transaction-uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:

```json
{
	"transactionId": "transaction-uuid-here",
	"status": "success",
	"amount": 50000,
	"paidAt": "2024-01-01T10:30:00.000Z",
	"subscription": {
		"id": "subscription-uuid",
		"isActive": true,
		"startDate": "2024-01-01T10:30:00.000Z",
		"endDate": "2024-01-31T10:30:00.000Z"
	}
}
```

#### Option C: Kiểm tra Database

```sql
-- Kiểm tra Transaction
SELECT * FROM transactions WHERE id = 'transaction-uuid-here';
-- status phải là 'success'
-- paid_at phải có giá trị
-- payment_gateway_id phải có giá trị từ SePay

-- Kiểm tra UserSubscription
SELECT * FROM user_subscriptions WHERE id = 'subscription-uuid';
-- is_active phải là true
-- start_date và end_date phải có giá trị

-- Kiểm tra User Storage
SELECT * FROM user_storage WHERE user_id = 'user-uuid';
-- bonus_size phải được cộng thêm
```

---

## 🔍 Test Cases

### Test Case 1: Thanh toán thành công

✅ **Expected:**

- Transaction status = `success`
- Subscription isActive = `true`
- User storage được cộng thêm
- Frontend hiển thị "Thanh toán thành công"

### Test Case 2: Webhook với signature không hợp lệ

```bash
curl -X POST http://localhost:3000/api/sepay/webhook \
  -H "x-sepay-signature: invalid-signature" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "transaction-uuid",
    "amount": 50000,
    "status": "SUCCESS",
    "transactionId": "sepay-txn-123"
  }'
```

✅ **Expected:**

- Response: `400 Bad Request`
- Message: "Invalid signature"
- Transaction không được cập nhật

### Test Case 3: Webhook với status khác SUCCESS

```bash
# Giả lập FAILED trên SePay Sandbox
```

✅ **Expected:**

- Webhook được nhận nhưng không xử lý
- Transaction status vẫn là `pending`
- Response: `{ "message": "received" }`

### Test Case 4: Duplicate Webhook

```bash
# Gửi webhook 2 lần với cùng orderId
```

✅ **Expected:**

- Lần 1: Transaction được cập nhật, subscription được kích hoạt
- Lần 2: Không xử lý lại, trả về message "Transaction already processed"
- Không có duplicate storage grant

### Test Case 5: Polling từ Frontend

```bash
# Frontend tự động gọi /payment/status mỗi 3 giây
```

✅ **Expected:**

- Khi status = `pending`: Frontend tiếp tục polling
- Khi status = `success`: Frontend dừng polling và hiển thị thành công
- Khi status = `failed`: Frontend dừng polling và hiển thị lỗi

---

## 🐛 Troubleshooting

### Lỗi: "Missing x-sepay-signature header"

**Nguyên nhân:** Webhook không có signature header
**Giải pháp:** Kiểm tra cấu hình webhook trên SePay Dashboard

### Lỗi: "Invalid signature"

**Nguyên nhân:** SECRET_KEY không khớp hoặc raw body bị thay đổi
**Giải pháp:**

1. Kiểm tra `SEPAY_SECRET_KEY` trong `.env`
2. Đảm bảo raw body được preserve (đã cấu hình trong `main.ts`)

### Lỗi: "Transaction not found"

**Nguyên nhân:** orderId không tồn tại trong database
**Giải pháp:** Kiểm tra lại transactionId từ bước checkout

### Webhook không được gọi

**Nguyên nhân:** URL không public hoặc cấu hình sai
**Giải pháp:**

1. Kiểm tra ngrok đang chạy
2. Kiểm tra webhook URL trên SePay Dashboard
3. Kiểm tra logs của ngrok

### Frontend không tự động cập nhật

**Nguyên nhân:** Polling không hoạt động
**Giải pháp:**

1. Mở DevTools → Network tab
2. Kiểm tra request `/payment/status` có được gọi không
3. Kiểm tra response có đúng không

---

## 📊 Monitoring

### Backend Logs

```bash
# Xem logs real-time
tail -f logs/app.log

# Hoặc xem console output
```

### Database Queries

```sql
-- Xem tất cả transactions pending
SELECT * FROM transactions WHERE status = 'pending' ORDER BY created_at DESC;

-- Xem tất cả transactions success trong 24h
SELECT * FROM transactions
WHERE status = 'success'
AND paid_at > NOW() - INTERVAL '24 hours'
ORDER BY paid_at DESC;

-- Xem subscriptions active
SELECT u.email, s.*, p.name as plan_name
FROM user_subscriptions s
JOIN users u ON s.user_id = u.id
JOIN plans p ON s.plan_id = p.id
WHERE s.is_active = true;
```

### SePay Dashboard

- Xem lịch sử giao dịch
- Xem webhook logs
- Xem test transactions

---

## ✅ Checklist

Trước khi deploy production:

- [ ] Đã test đầy đủ flow thanh toán
- [ ] Đã test webhook với signature hợp lệ/không hợp lệ
- [ ] Đã test duplicate webhook
- [ ] Đã test các trường hợp edge cases
- [ ] Đã kiểm tra logs không có lỗi
- [ ] Đã cấu hình HTTPS cho webhook URL
- [ ] Đã thay `SEPAY_TEST_MODE=false` trong production
- [ ] Đã backup database trước khi deploy
- [ ] Đã setup monitoring và alerting
