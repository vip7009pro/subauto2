# Hướng Dẫn Khắc Phục Sự Cố / Troubleshooting Guide

## ✅ Đã Sửa / Fixed Issues

### 1. Lỗi "nodemon is not recognized"
**Nguyên nhân:** Nodemon không được cài đặt globally  
**Giải pháp:** Đã thay đổi script để dùng `npx nodemon` - sẽ tự động tải về khi cần

### 2. Lỗi "Proxy error: Could not proxy request"
**Nguyên nhân:** Backend server không chạy được nên frontend không kết nối được  
**Giải pháp:** Đã sửa script để server có thể start đúng cách

### 3. Lỗi "The token '&&' is not a valid statement separator"
**Nguyên nhân:** PowerShell trên Windows không hỗ trợ `&&` như bash  
**Giải pháp:** Đã đổi sang dùng `&` cho Windows PowerShell

## 🚀 Cách Chạy Đúng

```bash
# Dừng process cũ nếu đang chạy (Ctrl+C)

# Chạy lại
npm start
```

Lần đầu chạy, `npx` sẽ tải nodemon về (khoảng 10-20 giây). Sau đó sẽ thấy:

```
[0] Server running on port 5000
[1] Compiled successfully!
[1] You can now view autosubtitlesapp-client in the browser.
[1]   Local:            http://localhost:3000
```

## 🔍 Kiểm Tra Khi Có Lỗi

### 1. Kiểm tra cả 2 server đã chạy chưa
Bạn phải thấy 2 dòng output:
- `[0]` - Backend server (port 5000)
- `[1]` - Frontend client (port 3000)

### 2. Nếu chỉ thấy frontend chạy
Backend bị lỗi. Kiểm tra:
```bash
# Chạy riêng backend để xem lỗi
cd server
node index.js
```

### 3. Nếu báo lỗi port đã được sử dụng
```bash
# Đổi port trong file .env
PORT=5001
```

### 4. Nếu thiếu dependencies
```bash
# Cài lại tất cả
npm run install-all
```

## 📝 Các Lệnh Hữu Ích

```bash
# Chạy cả 2 (frontend + backend)
npm start

# Chỉ chạy frontend
npm run client

# Chỉ chạy backend
npm run server

# Cài đặt lại dependencies
npm run install-all

# Build cho production
npm run build
```

## ⚠️ Lỗi Thường Gặp

### "Cannot find module '@xenova/transformers'"
```bash
cd server
npm install
```

### "ECONNREFUSED" khi upload video
Backend chưa chạy. Đảm bảo thấy dòng:
```
[0] 🚀 Server running on port 5000
```

### Webpack deprecation warnings
Đây chỉ là warnings, không ảnh hưởng chức năng. Có thể bỏ qua.

### "util._extend API is deprecated"
Đây là warning từ dependencies cũ, không ảnh hưởng. Có thể bỏ qua.

## 🎯 Checklist Trước Khi Chạy

- [ ] Đã cài Node.js v18+
- [ ] Đã chạy `npm run install-all`
- [ ] File `.env` đã tồn tại (copy từ `.env.example`)
- [ ] Port 3000 và 5000 chưa được sử dụng
- [ ] Đang ở thư mục root `G:\NODEJS\subauto2`

## 💡 Tips

1. **Lần đầu chạy** sẽ lâu hơn vì phải tải nodemon
2. **Whisper model** (~40MB) sẽ tải khi generate subtitle lần đầu
3. **Ctrl+C** để dừng cả 2 servers
4. Nếu gặp lỗi lạ, thử **xóa node_modules** và cài lại:
   ```bash
   rmdir /s /q node_modules client\node_modules server\node_modules
   npm run install-all
   ```

## 🆘 Vẫn Gặp Lỗi?

Chạy từng bước để debug:

```bash
# Bước 1: Test backend
cd server
node index.js
# Phải thấy: "Server running on port 5000"

# Bước 2: Test frontend (terminal mới)
cd client
npm start
# Phải thấy: "Compiled successfully!"
```

Nếu cả 2 đều OK riêng lẻ nhưng `npm start` từ root vẫn lỗi, có thể do concurrently. Thử:
```bash
npm install concurrently --save
```
