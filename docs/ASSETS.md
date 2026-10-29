# Kiểm kê assets và quy tắc map

## Dữ liệu nguồn

`src/asset-manifest.json` ghi kích thước thực của 38 PNG, sinh bằng `npm run assets:scan`. `src/assets.ts` khai báo đường dẫn animation, frame, điểm đặt chân và vùng cắt. Renderer kiểm tra ảnh tải về khớp manifest.

Các tọa độ dưới đây dùng pixel nguồn, gốc trên trái. Ảnh được phóng bằng nearest-neighbor.

| Bộ ảnh | Frame | Số frame | Điểm đặt chân trong frame |
| --- | --- | --- | --- |
| Player đi trước | 17×17 | 7, xếp dọc | (8.5, 16) |
| Player đi sau/trái/phải | 17×17 | 8, xếp dọc | (8.5, 16) |
| Player idle | 17×17 | 5, xếp dọc | (8.5, 16) |
| Player.png | 17×17 | 1 | (8.5, 16) |
| Warrior trước/sau | 22×22 | 12, xếp dọc | (11, 21) |
| Warrior trái/phải | 22×22 | 8, xếp dọc | (11, 21) |
| Monster bốn hướng | 16×16 | 4 mỗi hướng | (8, 15) |
| BossMonster bốn hướng | 16×16 | 4 mỗi hướng | (8, 15) |
| Torch | 16×16 | 3, xếp dọc | Không áp dụng |
| Torch_left / Torch_right | 32×16 | 3, xếp dọc | Không áp dụng |
| Spike | 16×16 | 4, xếp dọc | Không áp dụng |
| Coin | 16×16 | 6, xếp dọc | Không áp dụng |

Ô logic là 16×16. Player và Warrior có hình lớn hơn ô nhưng chỉ chiếm một ô va chạm. Boss có frame đúng 16×16 và không cần phóng to để phân biệt. Điểm đặt chân được dùng nhất quán giữa các hướng; inspector có khung frame và chấm neo để rà soát.

## Các vùng cắt đã đặt tên

| Vai trò | Ảnh | [x, y, rộng, cao] | Va chạm |
| --- | --- | --- | --- |
| Sàn thường / bụi / nứt | Map_tileset | [16,112,16,16] / [0,112,16,16] / [32,112,16,16] | Đi được |
| Mặt tường | Map_tileset | [16,16,16,16] | Chặn |
| Viền trên | Map_tileset | [0,13,16,3] | Nằm trong ô tường |
| Viền dưới | Map_tileset | [16,41,16,3] | Nằm trong ô tường |
| Viền trái / phải | Map_tileset | [65,17,3,16] / [92,17,3,16] | Nằm trong ô tường |
| Cầu thang thẳng | Map_tileset | [192,112,16,16] | Đi được; chỉ xem ở map mẫu |
| Vòm lớn | Map_tileset | [64,96,48,64] | Chưa tích hợp |
| Thùng | Decorations_tileset | [0,0,16,24] | Dành cho vật cản; chưa đặt trong phòng chiến đấu |
| Đầu lâu | Decorations_tileset | [64,0,16,16] | Trang trí, đi được |
| Đồng xu frame đầu | Coin | [0,0,16,16] | Chưa có cơ chế nhặt |
| Tim đầy | HUD | [0,0,16,16] | Biểu tượng giao diện |
| Kiếm ngang | Weapons_normal_right | [59,80,32,16] | Vùng hình tham chiếu; combat dùng hiệu ứng chém Canvas |

HUD (80×80), Others (64×64), Sheet/DamagedSheet (64×64) và các bộ vũ khí được giữ nguyên. Weapons trái/phải có canvas 100×125, hướng lên 64×80; không chia đều theo kích thước canvas để giả định frame. Chưa gán toàn bộ các mảnh vũ khí vào gameplay mốc 2.

## Quy tắc ghép tường

Bộ tileset gốc chứa nhiều mảng kiến trúc, không có sẵn bộ autotile độc lập cho mọi góc. Bản thử dùng cách ghép mặt tường + dải viền từ chính atlas:

1. Bản đồ logic quyết định ô sàn/tường trước.
2. Với ô tường, bốn ô sàn kề xác định cạnh hở N=1, E=2, S=4, W=8.
3. Hai cạnh hở kề nhau nối thành góc lồi của khối tường. Nếu chỉ có sàn chéo và hai ô kề tương ứng đều là tường, bổ sung góc lõm tại đỉnh đó.
4. Mỗi dải viền nằm trong ô tường, giao nhau ở góc; không thay nguyên tile bằng một mảnh góc khác vai trò. Không xoay hình kiến trúc có bóng đổ để tạo góc.
5. Mọi tổ hợp tám ô lân cận đều có biểu diễn bằng các dải viền. Cột độc lập và tường mỏng dùng cùng quy tắc.
6. Ô ngoài biên được coi là tường để kiểm tra đi lại. Fixture biên cố ý cho sàn chạm mép để kiểm tra renderer, không phải bố cục dungeon cuối cùng.

Giới hạn: vòm cửa lớn, cầu thang chéo và mảng tường rêu không dùng cho ghép tự động hiện tại. Cửa đóng trong map mẫu là hình tạm Canvas, chặn đường; chưa có hành động mở cửa ở mốc 2. Khi thêm dungeon ở mốc 3 cần giữ một vòng tường bao và kiểm tra kết nối sau khi đặt cửa/trang trí.

## Kiểm chứng mốc 1–2

- Build production thành công.
- 14 bài kiểm tra luật game và dữ liệu chạy đạt, bao gồm tất cả 256 tổ hợp ô lân cận và đủ bốn hướng góc lõm/lồi trên bộ fixture.
- Chrome headless đã tải/giải mã đủ 38 ảnh; kiểm tra thao tác qua giao diện gồm input nhanh, key repeat, đi vào tường, tạm dừng/mất focus, chuyển bốn fixture, duyệt 38 assets, preview Boss bốn hướng, thắng/chết và chơi lại. Không ghi nhận lỗi runtime trong lượt QA.
- Đã xem ảnh chụp phòng chiến đấu, bốn map mẫu và preview Boss. Các viền không tráo vai trò trong những bố cục đã kiểm tra.
- Kết quả giao diện: `browser-qa-result.html`. Ảnh: `arena-preview.png`, `lab-*.png`, `boss-preview.png`. `tileset-grid.png` là atlas tham chiếu có đánh lưới 16 px, không dùng để cắt tự động.

Đây là kiểm chứng cho phòng cố định và fixture; chưa kiểm chứng map ngẫu nhiên vì mốc 3 chưa triển khai.
