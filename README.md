# UPTIME — Một ngày làm dev ở VéXịn

Game mô phỏng system design và đời sống dev, phong cách pixel kiểu Stardew Valley, màu phố Hà Nội.

- **Cốt truyện 5 ngày**: từ 30 người dùng đầu tiên đến đêm flash sale. Mỗi ngày dạy một khái niệm: nối dây, load balancer, cache/replica, queue, chịu lỗi (N+1).
- **Chế độ Công ty VéXịn** (chơi mở): nhận hợp đồng, code, tuyển Dev/QA/DevOps, deploy lúc 18:00, trực đêm giữ SLA. Thăng tiến Dev → Senior → Tech Lead → CTO.
- **Mô phỏng thật**: traffic Poisson, key Zipf (cache hit thật), hàng đợi có giới hạn ở mỗi node, ghi tốn DB gấp 3 lần đọc.

## Chạy
Chỉ là một file tĩnh: mở `index.html` trong trình duyệt. Không cần backend; tiến độ lưu trong localStorage.

## Điều khiển
WASD / mũi tên: đi · bấm chuột: đi tới/dùng · E: tương tác · 1–8: chọn đồ · Tab: máy tính (chế độ công ty) · Space: tạm dừng ca trực

## Cấu trúc
- `index.html` — bản build (đã nhúng font VT323/Handjet)
- `src/` — mã nguồn: `shell-sv.html` (giao diện), `ui-sv.js` (thế giới, điều khiển), `company.js` + `company-ui.js` (chế độ công ty); engine mô phỏng nằm trong `index.html` (`<script id="engine">`)
- `archive/` — các phong cách cũ (bảng mạch PCB)
- `PRODUCT.md`, `DESIGN.md` — định hướng sản phẩm và thiết kế
