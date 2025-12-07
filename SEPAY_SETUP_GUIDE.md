# 🚀 Hướng dẫn Setup SePay để Demo

## Bước 1: Đăng ký tài khoản SePay

1. Truy cập: https://sepay.vn
2. Đăng ký tài khoản merchant
3. Xác thực email và hoàn tất đăng ký

## Bước 2: Lấy Merchant ID và Secret Key

1. Đăng nhập vào SePay Dashboard
2. Vào phần **Settings** → **API Keys**
3. Copy:
    - **Merchant ID** (hoặc Account ID)
    - **Secret Key** (hoặc API Secret)

## Bước 3: Cấu hình Backend

Mở file `bucket-server/.env` và thêm:

```bash
# SePay Payment Gateway
SEPAY_MERCHANT_ID=your-merchant-id-here
SEPAY_SECRET_KEY=your-secret-key-here
SEPAY_ENV=sandbox
SEPAY_SUCCESS_URL=http://localhost:3001/payment/success
SEPAY_ERROR_URL=http://localhost:3001/payment/error
SEPAY_CANCEL_URL=http://localhost:3001/payment/cancel

# Frontend URL (cho demo mode)
FRONTEND_URL=http://localhost:3001
```

**Lưu ý:**

- Thay `your-merchant-id-here` và `your-secret-key-here` bằng giá trị thật từ SePay
- `SEPAY_ENV=sandbox` để dùng môi trường test
- Đổi thành `SEPAY_ENV=production` khi deploy thật

## Bước 4: Cấu hình Webhook trên SePay Dashboard

1. Vào **Settings** → **Webhooks**
2. Thêm Webhook URL:
    - **Local (dùng ngrok)**: `https://your-ngrok-url.ngrok.io/sepay/webhook`
    - **Production**: `https://your-domain.com/api/sepay/webhook`
3. Chọn events: `payment.success`, `payment.failed`
4. Lưu cấu hình

### Setup ngrok cho local testing:

```bash
# Cài ngrok
brew install ngrok  # macOS
# hoặc tải từ https://ngrok.com

# Chạy ngrok
ngrok http 3000

# Copy URL từ ngrok (ví dụ: https://abc123.ngrok.io)
# Thêm vào SePay webhook: https://abc123.ngrok.io/sepay/webhook
```

## Bước 5: Restart Backend

```bash
cd bucket-server
yarn start:dev
```

## Bước 6: Test Thanh Toán

1. Truy cập: http://localhost:3001/payment
2. Chọn một gói
3. Nhấn "Chọn gói này"
4. Một tab mới sẽ mở ra với trang thanh toán SePay
5. Trong môi trường sandbox, bạn có thể:
    - Dùng thẻ test của SePay
    - Hoặc giả lập thanh toán thành công trên dashboard

## Bước 7: Kiểm tra Kết quả

- Modal sẽ tự động cập nhật khi thanh toán thành công
- Kiểm tra backend logs để xem webhook
- Kiểm tra database: `user_subscriptions` và `transactions`

---

## ⚠️ Nếu chưa có tài khoản SePay

Bạn có 2 lựa chọn:

### Option 1: Dùng Demo Mode (không cần SePay)

Đổi API endpoint trong frontend:

```typescript
// bucket-client/src/modules/payment/payment.api.ts
checkout: async (data: CheckoutRequest): Promise<CheckoutResponse> => {
    const response = await api.post('/subscription/payment-demo/checkout', data);
    return response.data;
},
```

### Option 2: Đăng ký SePay ngay

1. Truy cập: https://sepay.vn/register
2. Điền thông tin doanh nghiệp/cá nhân
3. Xác thực tài khoản
4. Lấy API keys từ dashboard

---

## 🔍 Troubleshooting

### Lỗi: "Merchant ID không hợp lệ"

- Kiểm tra lại `SEPAY_MERCHANT_ID` trong `.env`
- Đảm bảo không có khoảng trắng thừa

### Lỗi: "Signature không hợp lệ"

- Kiểm tra `SEPAY_SECRET_KEY` đúng chưa
- Restart backend sau khi đổi `.env`

### Webhook không được gọi

- Kiểm tra ngrok đang chạy
- Kiểm tra webhook URL trên SePay dashboard
- Xem logs của ngrok: `ngrok http 3000 --log=stdout`

### Lỗi 404 khi mở checkout

- Kiểm tra `SEPAY_ENV` đúng là `sandbox` hoặc `production`
- Xem backend logs để biết checkout URL được generate

---

## 📞 Liên hệ SePay Support

- Website: https://sepay.vn
- Email: support@sepay.vn
- Hotline: (số hotline của SePay)

---

## ✅ Checklist Setup

- [ ] Đã đăng ký tài khoản SePay
- [ ] Đã lấy Merchant ID và Secret Key
- [ ] Đã cấu hình `.env` file
- [ ] Đã setup webhook URL (với ngrok nếu local)
- [ ] Đã restart backend
- [ ] Đã test thanh toán thành công
