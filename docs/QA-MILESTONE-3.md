# Kết quả kiểm tra mốc 3

Ngày kiểm tra: 29/10/2026. Kiểm tra trên bản đã tách thư mục `game/world/render/data/ui`.

## Kết quả

- Production build thành công: `npm run build`.
- 26/26 bài test luật game và dữ liệu đạt: `npm test`.
- 47/47 mục QA trình duyệt đạt bằng Chrome headless: `tools/browser-qa.ps1`.
- Không ghi nhận lỗi JavaScript runtime trong lượt QA giao diện.
- Tuyến `tan-hoa-01` hoàn thành bằng 67 hành động bàn phím, có chiến đấu, nhặt Tàn hỏa và tương tác cầu thang; không thay đổi trạng thái game bằng mã QA trong tuyến chơi này.

## Những gì đã kiểm tra

### Map và sprite

- Xem ảnh chụp đầy đủ bốn seed: `tan-hoa-01`, `bridge`, `audit-42`, `TH-f00`.
- Đối chiếu seed mặc định trước/sau bật trang trí, và khi bật sương mù.
- Rà góc lõm/lồi, cửa nối phòng–hành lang, cột, biên và vật thể; không thấy lỗi đảo vai trò tile hoặc vật trang trí chặn đường bắt buộc trong các ảnh đã xem.
- Kiểm tra lại bốn fixture cũ và preview Boss.
- 1.000 seed `audit-0` đến `audit-999` đều qua kiểm tra kết nối, đường tới lối ra, vị trí sinh không trùng, khả năng tiếp cận vật thể và vòng tường bao.

### Luồng chơi trên trình duyệt

- Di chuyển, đánh, chờ; input nhanh/key repeat không gây thừa lượt.
- Va chạm tường và tương tác ngoài cầu thang không tốn lượt.
- Tạm dừng, mất focus, thắng/thua và chơi lại.
- Nhập seed có khoảng trắng, lưu seed vào URL, chơi lại cùng seed và tạo seed mới.
- Chuyển sang map inspector và quay lại không làm tiến lượt.
- Nhặt Tàn hỏa cập nhật HUD từ 5 lên 6 sát thương; chơi lại đặt lại phần thưởng.
- Đi hết tầng rồi nhấn Enter tại cầu thang hiển thị kết thúc đúng.

### Renderer và sương mù

Các bài kiểm tra renderer dùng canvas riêng với dữ liệu mẫu, không can thiệp game đang chơi:

- Không vẽ địch và thanh máu ngoài tầm nhìn.
- Không vẽ vật phẩm ngoài tầm nhìn.
- Thùng chưa khám phá không làm lộ phần sprite nhô vào ô đã nhìn thấy.
- Bẫy đã khám phá nhưng ngoài tầm nhìn không lộ trạng thái hiện tại.
- Pixel vùng chưa khám phá hoàn toàn đục; ô nhìn thấy giữ nguyên hình; ô đã khám phá được làm tối.
- Minimap không tiết lộ cầu thang chưa khám phá.
- Bẫy thu lại, báo trước và kích hoạt có ba hình hiển thị khác nhau.

## Lỗi đã sửa trong lượt kiểm tra

1. Bình hồi máu dùng nhầm sprite xanh. Đổi sang bình đỏ tại `[48,16,16,16]` của `HUD.png`, đồng thời đưa vùng cắt vào asset inspector.
2. Sprite thùng cao hơn ô logic có thể nhô từ ô chưa khám phá sang ô nhìn thấy. Chỉ vẽ thùng đã được khám phá, hoặc khi bật chế độ xem toàn map.

Sau khi sửa đã chạy lại build, 26 bài test và toàn bộ QA trình duyệt; tất cả đạt.

## Bằng chứng

- [Báo cáo QA trình duyệt](browser-qa-result.html)
- [Bắt đầu tầng có sương mù](dungeon-start.png)
- [Seed mặc định có trang trí](dungeon-seed-default.png)
- [Seed mặc định bỏ trang trí](dungeon-seed-bare.png)
- [Seed mặc định có sương mù trong inspector](dungeon-seed-fog.png)
- [Seed bridge](dungeon-seed-bridge.png)
- [Seed audit-42](dungeon-seed-audit42.png)
- [Seed TH-f00](dungeon-seed-thf00.png)
- [Kết quả mô phỏng 20 seed](playtest.json)

## Giới hạn

Kiểm tra ảnh trên một tập seed không chứng minh mọi map tương lai đều đúng về mặt hình ảnh; bộ kiểm tra kết nối và ghép cạnh hỗ trợ phát hiện lỗi cấu trúc trên tập lớn hơn.

20 seed mô phỏng hoàn thành trong 57–143 lượt, nhưng bot biết toàn map. Tuyến bàn phím tự động và Chrome virtual time không đo thời gian suy nghĩ của người chơi. Mốc 3 đã hoàn thành về chức năng và QA; mục tiêu thời lượng khoảng năm phút và độ khó tiếp tục được điều chỉnh bằng phản hồi chơi thực tế.
