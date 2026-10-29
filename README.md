# Hầm Ngục Tàn Hỏa

Bản thử roguelike 2D theo lượt, hoàn thành mốc 1 và 2 trong [PLAN.md](PLAN.md). Dùng assets tại `public/assets`, TypeScript, Canvas 2D và Vite.

## Chạy dự án

Khuyến nghị Node.js 22.15 trở lên. Dependency hiện có thể cài bằng `npm install` khi cần.

```sh
npm run dev
npm run build
npm test
```

Trong PowerShell, dùng `npm.cmd` nếu script `npm.ps1` của máy gặp lỗi quyền truy cập.

## Chơi bản thử

- WASD / mũi tên: đi bốn hướng; đi vào địch để đánh 5 sát thương.
- Space / dấu chấm: chờ một lượt. Không hồi máu khi chờ.
- Esc: tạm dừng / tiếp tục; mất focus cũng tạm dừng.
- R: chơi lại sau khi thắng hoặc chết. Có nút bắt đầu lại bất cứ lúc nào.
- Địch chỉ hành động sau một hành động hợp lệ. Đi vào tường không tốn lượt.
- Sinh vật áp sát và cắn; lính canh báo trước đòn quét bằng ô đỏ. Rời vùng đỏ trước hành động kế tiếp để né, rồi tận dụng một lượt hồi sức của hắn.
- Hạ cả hai địch để hoàn thành phòng. Chưa có dungeon ngẫu nhiên, đồ nhặt hoặc boss chiến đấu; các phần đó thuộc mốc sau.

## Công cụ kiểm tra

- Tab **Kiểm tra map**: bốn bố cục cố định gồm góc chữ L/lõm/lồi, hành lang/ngã T/ngã tư, cột/cửa và biên bản đồ.
- Bật lưới, mã ghép tile và lớp va chạm để đối chiếu. Mã cạnh dùng bitmask N/E/S/W; xem chú giải ngay cạnh map.
- Tab **Assets**: xem toàn bộ 38 PNG, vùng cắt được đặt tên, animation nhân vật/boss bốn hướng và điểm đặt chân.
- Có đường dẫn trực tiếp: `/?view=lab&fixture=0` hoặc `/?view=assets&asset=Characters/Monster/BossMonster_walk_front.png`.
- Sau khi thêm/đổi ảnh, chạy `npm run assets:scan` để cập nhật manifest. Chạy lại build và test.

Xem [docs/ASSETS.md](docs/ASSETS.md) để biết tọa độ cắt, giới hạn ghép map và kiểm chứng. Ảnh QA nằm trong `docs/`.

## Kiểm tra

`npm test` chạy các luật game thực tế bằng Node, gồm va chạm, thứ tự lượt, khóa vùng đánh, hồi sức, chết/thắng, đường đi và 256 tổ hợp lân cận của tile. Không cần cài test framework.

`tools/browser-qa.html` là trang QA nội bộ trên dev server: kiểm tra bàn phím, khóa input khi animation, tạm dừng, các tab, chết và chơi lại. `tools/browser-qa.ps1` chạy Chrome headless trên Windows để lưu ảnh và kết quả; cần dev server tại `127.0.0.1:5173` và Chrome ở đường dẫn ghi trong script.
