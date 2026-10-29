# Kế hoạch game: Hầm Ngục Tàn Hỏa

Ngày lập: 29/10/2026. Tên game là tên làm việc, có thể thay đổi.

## 1. Mục tiêu

Xây dựng game phiêu lưu roguelike 2D trên trình duyệt, kế thừa cách chơi của dự án `../ascii-roguelike` và sử dụng assets trong `public/assets`.

Giữ trọng tâm chiến thuật theo lượt: người chơi có thời gian quan sát, lựa chọn vị trí và quản lý tài nguyên. Pixel art, animation và hiệu ứng giúp hành động dễ hiểu và có sức nặng.

Mục tiêu trải nghiệm cho bản đầu:

- Một lượt chơi khoảng 15–25 phút; cần kiểm chứng bằng chơi thử.
- Ba tầng hầm ngục, kết thúc bằng một trận boss.
- Bản đồ thay đổi giữa các lượt chơi.
- Chết sẽ mất tiến trình của lượt chơi; có thể bắt đầu lại ngay.
- Ưu tiên bàn phím trên máy tính.

## 2. Bối cảnh và vòng lặp

Người chơi khám phá một pháo đài bị nguyền rủa để tìm nguồn gốc khiến lính canh biến thành kẻ thù. Càng xuống sâu, dấu vết nghi lễ và những sinh vật trong bóng tối càng xuất hiện nhiều.

Vòng lặp: khám phá → quan sát nguy hiểm → chiến đấu → nhặt đồ → chọn nâng cấp → xuống tầng.

Ba tầng dùng chung phong cách hầm ngục nhưng khác cách bố trí và vật trang trí:

1. Khu canh gác: giới thiệu di chuyển, địch áp sát và phần thưởng.
2. Kho ngầm bỏ hoang: thêm bẫy, địch giữ khoảng cách và các tuyến đường lựa chọn.
3. Điện nghi lễ: phối hợp các mối nguy đã học, kết thúc bằng boss.

## 3. Assets hiện có và cách sử dụng

| Nhóm assets | Vai trò đề xuất |
| --- | --- |
| `Characters/Player` | Nhân vật chính, đứng yên và đi bốn hướng |
| `Characters/Monster/Monster_walk_*.png` | Sinh vật áp sát trong hầm ngục |
| `Characters/Monster/BossMonster_walk_*.png` | Boss cuối tầng 3, có bộ sprite đi bốn hướng riêng |
| `Characters/Warrior` | Lính canh và biến thể tinh nhuệ |
| `Map/Map_tileset.png` | Sàn, tường, hành lang, cầu thang |
| `Map/Decorations_tileset.png` | Đồ nội thất, thùng, xương, dây xích, vật trang trí nghi lễ |
| `Map/Torch*.png` | Đuốc và điểm nhấn ánh sáng |
| `Map/Spike.png` | Bẫy gai có báo trước |
| `Weapons/Weapons_*.png` | Vũ khí và các biến thể thường, vàng, tím |
| `Others/HUD.png`, `Others/Others.png` | Biểu tượng chỉ số và vật phẩm |
| `Others/Coin.png` | Tiền và hiệu ứng nhặt tiền |
| `Others/Sheet.png`, `Others/DamagedSheet.png` | Cân nhắc dùng làm nền bảng thông tin sau khi kiểm tra bố cục |

Các vai trò trên là đề xuất thiết kế. Trước khi lập trình renderer cần xác nhận tọa độ cắt sprite, kích thước frame, số frame và điểm đặt chân. Không suy ra kích thước ô chỉ từ tên file.

Chưa thấy bộ animation tấn công riêng trong các file đã kiểm tra. Bản đầu thể hiện đòn đánh bằng chuyển động lao nhẹ, sprite vũ khí, chớp sáng và hiệu ứng trúng đòn.

Bộ Boss Monster mới có bốn spritesheet: `BossMonster_walk_front.png`, `BossMonster_walk_back.png`, `BossMonster_walk_left.png`, `BossMonster_walk_right.png`. Đã xem cả bốn hướng; hình dáng đỏ, có sừng phù hợp vai trò quái vật chủ trì nghi lễ. Giữ nguyên tên file và khai báo đường dẫn chính xác trong bảng sprite. Đây là animation đi; tư thế đứng có thể dùng một frame sau khi kiểm tra. Đòn đánh, trúng đòn và chết cần hiệu ứng bổ sung, không giả định có sẵn animation tương ứng.

Số mẫu nhân vật còn ít: phân biệt địch bằng hành vi, trang bị, biểu tượng và tín hiệu tấn công; màu sắc chỉ là dấu hiệu bổ sung.

## 4. Luật chơi cốt lõi

### Di chuyển và lượt

- Bản đồ dạng lưới, di chuyển bốn hướng.
- Đi vào ô có địch để đánh cận chiến.
- Đi, đánh, chờ, dùng thuốc, đổi trang bị và dùng kỹ năng hợp lệ đều tốn một lượt.
- Mở cửa tốn một lượt; mở túi đồ, đọc thông tin và hướng dẫn không tốn lượt.
- Đi vào tường hoặc yêu cầu hành động không hợp lệ không tốn lượt.
- Chỉ được xuống tầng khi đứng ở lối xuống; tầng mới bắt đầu ở trạng thái chờ người chơi.
- Khi người chơi không hành động, địch và bẫy không tiến lượt. Animation môi trường vẫn chạy.

Trình tự một lượt: kiểm tra hành động → áp dụng hành động người chơi → giải quyết chết và phần thưởng → cập nhật lượt địch/bẫy còn hoạt động → giải quyết sát thương → cập nhật tầm nhìn và trạng thái kết thúc.

Tín hiệu nguy hiểm phải xuất hiện trước khi đòn đánh được kích hoạt, cho người chơi ít nhất một hành động để phản ứng. Khóa đầu vào hoặc dùng hàng đợi giới hạn trong lúc phát animation để tránh thực hiện nhiều lượt ngoài ý muốn.

### Chiến đấu

- Sát thương dễ dự đoán; hiển thị rõ máu và ý định đòn mạnh.
- Chưa cần hệ thống chí mạng, né tránh ngẫu nhiên hoặc nhiều hiệu ứng trạng thái.
- Không tự hồi đầy máu bằng việc chờ vô hạn.
- Hiển thị phạm vi đánh khi chọn kỹ năng hoặc xem vũ khí.

Ví dụ: lính canh đánh dấu ba ô phía trước, người chơi có một lượt để tránh hoặc kết liễu hắn. Bẫy gai gần đó tạo thêm lựa chọn về vị trí.

### Điều khiển dự kiến

| Phím | Hành động |
| --- | --- |
| WASD / mũi tên | Di chuyển hoặc đánh vào địch sát bên |
| Space / dấu chấm | Chờ một lượt |
| E / Enter | Tương tác hoặc xuống tầng khi hợp lệ |
| I | Mở túi đồ |
| 1–3 | Dùng vật phẩm ở ô nhanh |
| Esc | Đóng bảng / tạm dừng |
| ? | Hướng dẫn |

Chốt phím chọn hướng đánh xa khi triển khai giáo; tránh xung đột với thao tác di chuyển.

## 5. Nội dung bản đầu

### Người chơi và trang bị

- Một nhân vật; chỉ số cơ bản: HP, tấn công, phòng thủ, XP và cấp độ.
- Một ô vũ khí, một ô giáp, túi đồ nhỏ và ba ô dùng nhanh.
- Ba kiểu vũ khí, lựa chọn sprite cụ thể sau bước kiểm kê:
  - Kiếm: đánh một mục tiêu sát bên, ổn định.
  - Giáo: đánh thẳng tối đa hai ô, bị tường chặn.
  - Rìu: đánh rộng, đổi lại có lượt hồi sức; phải báo rõ chi phí trước khi dùng.
- Bình hồi máu, tiền và phần thưởng trang bị.
- Tiền dùng ở điểm tiếp tế giữa tầng để mua hồi phục hoặc trang bị; không chỉ dùng làm điểm số.
- Chưa thêm thanh mana nếu chưa có kỹ năng thực sự cần nó.

### Địch

1. Sinh vật áp sát: đuổi theo khi nhìn thấy người chơi, đánh khi sát bên.
2. Lính canh: đòn đánh mạnh có một lượt chuẩn bị và vùng nguy hiểm rõ ràng.
3. Lính giữ khoảng cách: tìm vị trí đánh thẳng, có thể bị chặn đường nhìn.
4. Boss — Thú Vương Tàn Hỏa (tên làm việc): dùng bộ `BossMonster_walk_*` riêng, xuất hiện ở điện nghi lễ tầng 3. Phối hợp áp sát, húc thẳng và đập đất có báo trước; không chỉ tăng máu.

Địch phải tuân theo va chạm, không chồng ô và không biết chính xác vị trí người chơi sau tường nếu chưa phát hiện. Quy định rõ trạng thái tuần tra/chờ, truy đuổi và mất dấu.

### Trận boss: Thú Vương Tàn Hỏa

- Đấu trường là phòng nghi lễ được đặt vào cuối tầng 3, có khoảng trống để né và không sinh thêm quái ngẫu nhiên bên trong.
- Boss có sprite riêng nhưng bản đầu vẫn chiếm một ô logic. Xác nhận điểm đặt chân và phần hình tràn ô khi kiểm kê; hiển thị ô đứng rõ để không gây hiểu nhầm va chạm.
- Khi người chơi bước qua ngưỡng đấu trường, bắt đầu trận và đóng lối ra. Phòng phải đủ tầm nhìn để đọc tín hiệu; chỉ mở màn hình chiến thắng sau khi boss chết và hiệu ứng kết thúc đã hoàn tất.
- Hiển thị tên, thanh máu và trạng thái chuẩn bị/hồi sức của boss.

| Hành động | Báo trước và cách phản ứng |
| --- | --- |
| Áp sát / đánh thường | Mỗi lượt chỉ di chuyển một ô hoặc đánh một lần; không di chuyển rồi đánh ngay trong cùng lượt |
| Húc thẳng | Khóa hướng và đánh dấu đường húc tối đa bốn ô; người chơi có ít nhất một hành động để bước khỏi đường đó. Lượt kế tiếp boss húc tới ô cuối hợp lệ trước vật cản, gây sát thương tối đa một lần rồi hồi sức một lượt |
| Đập đất | Đánh dấu bốn ô kề theo hướng vuông góc; người chơi có ít nhất một hành động để ra khỏi vùng. Kích hoạt ở lượt kế tiếp, sau đó hồi sức một lượt |

Chu trình trạng thái: tiếp cận → chuẩn bị → thực hiện đòn đã khóa → hồi sức → chọn hành động tiếp theo. Không đổi vùng nguy hiểm sau khi người chơi đã phản ứng. Boss chết trong lúc chuẩn bị thì đòn bị hủy.

Ở khoảng 50% HP, chuyển sang giai đoạn cuồng nộ một lần: báo hiệu bằng thông báo và hiệu ứng, không kèm đòn đánh tức thì. Tăng tần suất dùng đòn đặc biệt; vẫn giữ thời gian báo trước và hồi sức. Ngưỡng HP và khoảng cách đòn đánh cần cân bằng bằng chơi thử.

Thể hiện húc bằng animation đi nhanh theo hướng đã khóa; đập đất bằng rung nhẹ, vòng xung kích và hiệu ứng tại các ô bị đánh. Trúng đòn dùng chớp sáng, chết dùng mờ dần. Các hiệu ứng này được dựng bằng renderer, không yêu cầu thêm spritesheet. Chưa thêm triệu hồi hoặc đạn lửa cho bản đầu.

### Khám phá và nâng cấp

- Tầm nhìn bị tường và cửa đóng che khuất.
- Ô chưa khám phá tối; ô đã khám phá hiển thị mờ; không hiển thị vị trí địch hiện tại ngoài tầm nhìn.
- Phòng chiến đấu, kho báu, nơi nghỉ và phòng nghi lễ.
- Gai báo trước một lượt rồi kích hoạt; cả địch và người chơi có thể bị thương.
- Sau tầng 1 và 2, chọn một trong ba nâng cấp: ví dụ tăng sức mạnh sau khi chờ, hồi máu khi hạ địch tinh nhuệ, hoặc nhận chắn khi bước vào phòng mới.
- Đuốc tạo ánh sáng và định hướng; chưa triển khai nhiên liệu.

## 6. Phạm vi chưa làm

- Multiplayer, thế giới mở, nhiệm vụ phân nhánh dài.
- Nhiều class, cây kỹ năng lớn, chế tạo và hệ thống đói/khát.
- Nhiều biome đòi hỏi phong cách đồ họa mới.
- Nâng cấp sức mạnh vĩnh viễn giữa các lượt chơi.
- Điều khiển cảm ứng và hỗ trợ tay cầm.

Chỉ mở rộng sau khi một lượt chơi hoàn chỉnh đã hấp dẫn.

## 7. Hướng triển khai kỹ thuật

Sử dụng bộ khung Vite + TypeScript hiện có. Đề xuất Canvas 2D cho thế giới game, HTML/CSS cho menu, túi đồ và bảng thông tin.

Tách trạng thái và luật game khỏi renderer: animation không quyết định sát thương hoặc số lượt. Tọa độ logic là ô lưới; tọa độ hiển thị có thể nội suy giữa hai ô.

Cấu trúc dự kiến, có thể điều chỉnh khi triển khai:

```text
src/
  main.ts
  game/
    Game.ts
    state.ts
    actions.ts
    turns.ts
  world/
    dungeon.ts
    tiles.ts
    fov.ts
    pathfinding.ts
  entities/
    player.ts
    enemies.ts
  systems/
    combat.ts
    inventory.ts
    progression.ts
  render/
    renderer.ts
    camera.ts
    animations.ts
    assets.ts
  data/
    sprites.ts
    enemies.ts
    items.ts
  ui/
    hud.ts
    inventory.ts
    menus.ts
```

- Bản đồ có seed để tái hiện lỗi và thử cân bằng.
- Tạo bảng định nghĩa sprite tập trung, không rải tọa độ cắt ảnh trong logic game.
- Khai báo sprite Boss Monster độc lập với Monster thường; hỗ trợ điểm đặt chân, kích thước frame và tốc độ animation riêng. Cơ chế boss dùng trạng thái theo lượt, vùng đánh đã khóa và cờ chuyển giai đoạn; không phụ thuộc vào thời lượng animation.
- Vẽ theo lớp: sàn → vật thể thấp → nhân vật theo vị trí chân → vật thể phía trước → hiệu ứng → sương mù.
- Tắt làm mượt ảnh và ưu tiên tỷ lệ phóng nguyên để pixel art rõ nét.
- Rà soát và chuyển phần phù hợp từ `../ascii-roguelike/js/map.js`, `fov.js`, `entities.js`, `game.js`; xây lại renderer và giao diện.
- Có thể tái sử dụng ý tưởng âm thanh tổng hợp từ `../ascii-roguelike/js/audio.js` sau khi kiểm tra cách tích hợp.

### Quy tắc sinh map và ghép tile

1. Sinh bản đồ logic trước: sàn, tường, cửa, lối xuống và vùng ngoài bản đồ. Kiểm tra kết nối trước khi chọn hình ảnh.
2. Chọn tile hiển thị theo vai trò và các ô lân cận: xét bốn hướng chính và bốn hướng chéo để phân biệt mặt tường, đỉnh tường, cạnh thẳng, góc trong (lõm), góc ngoài (lồi) và điểm nối. Quy định cách xử lý ô ngoài biên rõ ràng.
3. Chỉ chọn biến thể ngẫu nhiên trong cùng một vai trò có cạnh ghép tương thích. Không trộn tile góc trong/góc ngoài, mặt tường/đỉnh tường chỉ vì chúng có hình gần giống nhau.
4. Đặt trang trí sau khi ghép map cơ bản; giữ thông thoáng cửa, hành lang, cầu thang và đường đi bắt buộc. Hình ảnh và va chạm phải nhất quán.

Lập bảng ánh xạ từ mẫu lân cận sang sprite thực tế sau khi kiểm kê tileset. Nếu thiếu kiểu nối hoặc góc cần thiết, giới hạn bố cục được sinh hoặc dùng tổ hợp tile đã kiểm tra; không tùy tiện thay bằng tile sai vai trò. Cùng seed và cấu hình phải tái hiện được cả bố cục lẫn biến thể hình ảnh.

Trước khi dùng cho map ngẫu nhiên, dựng map kiểm tra cố định gồm phòng chữ nhật, phòng chữ L, góc lõm/lồi theo bốn hướng, hành lang hẹp, ngã T/ngã tư, cột độc lập, cửa sát góc và mép bản đồ. Các mẫu không được tileset hỗ trợ phải được ghi rõ và loại khỏi bộ sinh.

Thêm chế độ xem kiểm tra có thể bật/tắt lưới, mã tile, loại góc và lớp va chạm. Kiểm tra map khi tắt sương mù để không che lỗi ghép; sau đó kiểm tra lại với sương mù và vật trang trí.

## 8. Các mốc triển khai

### Mốc 1 — Kiểm kê và xem assets

- [x] Xác định kích thước tile, frame và điểm đặt chân.
- [x] Đánh dấu sprite sàn, tường, cửa, cầu thang, vật phẩm và vũ khí.
- [x] Làm màn hình xem sprite/animation để kiểm tra cách cắt ảnh.
- [x] Kiểm tra đủ bốn hướng Boss Monster, frame đứng, điểm đặt chân và độ tràn khỏi ô logic.
- [x] Tạo dữ liệu phân biệt hình trang trí và ô chặn đường.
- [x] Phân loại mặt tường, đỉnh tường, cạnh thẳng, góc trong và góc ngoài; ghi lại các kiểu nối tileset không hỗ trợ.
- [x] Lập bảng quy tắc ghép tile theo ô lân cận và dựng map kiểm tra cố định đủ các mẫu góc/điểm nối.
- [x] Kiểm tra trực quan map mẫu với lưới, mã tile và lớp va chạm trước khi dùng quy tắc cho map ngẫu nhiên.

Hoàn thành khi: assets cần cho bản thử hiển thị đúng, không cắt lệch; chưa đoán frame bằng tên file. Map mẫu ghép đúng các góc và đường viền được hỗ trợ, không có đường nối hở, tráo góc trong/ngoài hoặc hình tường sai với va chạm. Các mẫu chưa hỗ trợ đã có giới hạn sinh map rõ ràng.

### Mốc 2 — Bản thử chiến đấu trong phòng cố định

- [x] Vẽ phòng, nhân vật, tường và va chạm.
- [x] Di chuyển bốn hướng, camera và animation.
- [x] Đi/đánh/chờ, HP, hai hành vi địch và đòn báo trước.
- [x] Chết và chơi lại.

Hoàn thành khi: chơi được trận ngắn; quái chỉ hành động theo lượt; đầu vào nhanh không gây thừa lượt; tín hiệu đòn mạnh cho phép né thực sự.

### Mốc 3 — Một tầng chơi khoảng năm phút

- [ ] Sinh phòng và hành lang bằng seed.
- [ ] Áp dụng quy tắc ghép tile đã kiểm tra; chỉ ngẫu nhiên hóa các biến thể tương thích.
- [ ] Kiểm tra nhiều seed với sương mù tắt để rà góc trong/ngoài, điểm nối và mép bản đồ; kiểm tra lại sau khi đặt trang trí.
- [ ] Tầm nhìn và vùng đã khám phá.
- [ ] Hai loại địch, một bẫy, một phần thưởng và lối ra.
- [ ] Kiểm tra đường đi từ điểm xuất phát đến lối ra.
- [ ] Chơi thử để điều chỉnh nhịp khám phá và chiến đấu.

Hoàn thành khi: một tầng có mở đầu và kết thúc; không sinh thực thể trong tường, trùng ô hoặc ở vị trí không thể tiếp cận; người chơi hiểu nguy hiểm mà không cần giải thích trực tiếp. Các seed được kiểm tra không có tile sai vai trò, góc nối sai hoặc trang trí chặn đường bắt buộc.

Đây là mốc kiểm chứng quan trọng trước khi mở rộng nội dung.

### Mốc 4 — Một lượt chơi hoàn chỉnh

- [ ] Ba tầng với độ khó tăng dần.
- [ ] Ba kiểu vũ khí, thuốc, túi đồ và điểm tiếp tế.
- [ ] XP, cấp độ và lựa chọn nâng cấp giữa tầng.
- [ ] Hành vi địch thứ ba.
- [ ] Tích hợp bốn hướng Boss Monster và đấu trường cuối tầng 3.
- [ ] Boss có trạng thái chuẩn bị, húc, đập đất, hồi sức và chuyển giai đoạn.
- [ ] Thanh máu boss, vùng báo đòn, khóa/mở lối ra và điều kiện chiến thắng.
- [ ] Màn hình thắng/thua, thống kê và bắt đầu lại.

Hoàn thành khi: có thể chơi liên tục từ đầu tới thắng hoặc thua; chuyển tầng giữ đúng nhân vật/trang bị và không mang trạng thái địch cũ sang tầng mới. Mọi đòn đặc biệt của boss có thể né bằng hành động hợp lệ; không có sát thương bất ngờ lúc chuyển giai đoạn hoặc đòn vẫn tiếp tục sau khi boss chết.

### Mốc 5 — Hoàn thiện và cân bằng

- [ ] Hiệu ứng vũ khí, trúng đòn, nhặt đồ và âm thanh.
- [ ] HUD, hướng dẫn ngắn và nhật ký hành động.
- [ ] Phân biệt rõ trang trí, vật tương tác và vật cản.
- [ ] Cân bằng lượng hồi phục, phần thưởng, độ khó và thời lượng.
- [ ] Kiểm tra kích thước màn hình và mất focus khi đang thao tác.

Hoàn thành khi: người mới nhận biết được mục tiêu, cách chơi và nguyên nhân thất bại; đồ họa rõ; không có lỗi chặn tiến trình đã biết.

## 9. Kiểm chứng

- Chạy `npm run build` sau các thay đổi triển khai có liên quan.
- Kiểm tra tự động các luật quan trọng: thứ tự lượt, hành động không hợp lệ, sát thương/chết, đường đi tới lối ra và tái hiện bản đồ bằng seed.
- Kiểm tra nhiều seed để phát hiện bản đồ bị ngắt kết nối và vị trí sinh không hợp lệ.
- Kiểm tra tự động bảng ghép tile bằng các mẫu lân cận có kết quả mong đợi được định nghĩa trước, gồm các hướng của góc trong/góc ngoài, điểm nối và biên bản đồ. Báo lỗi nếu gặp mẫu không được hỗ trợ thay vì âm thầm chọn tile bất kỳ.
- Kiểm tra trực quan map mẫu và một tập seed cố định: không có khe hở, đường viền đứt, mặt tường đảo vào trong/ngoài hoặc vật trang trí che lối đi. Kiểm tra dữ liệu không thay thế kiểm tra hình ảnh; ghi seed, tọa độ ô và mã tile cho lỗi ghép để tái hiện.
- Kiểm tra boss: hướng/vùng đánh không đổi sau báo trước, húc dừng trước tường, sát thương chỉ áp dụng một lần mỗi đòn, chuyển giai đoạn chỉ xảy ra một lần và chết sẽ hủy đòn đang chuẩn bị. Kiểm tra đấu trường luôn tiếp cận được và có ô né hợp lệ khi chọn đòn đặc biệt.
- Chơi thử trực tiếp để kiểm tra animation, tầm nhìn, tín hiệu nguy hiểm, đầu vào và nhịp độ; build thành công không thay thế bước này.
- Khi gặp lỗi bản đồ hoặc cân bằng, ghi seed, tầng và chuỗi hành động để tái hiện.

## 10. Thứ tự ưu tiên

1. Đúng luật lượt và cảm giác di chuyển/đánh.
2. Nguy hiểm dễ đọc, lựa chọn vị trí có ý nghĩa.
3. Một tầng ngắn chơi vui và ổn định.
4. Hoàn thành vòng chơi ba tầng.
5. Trau chuốt hình ảnh, âm thanh và mở rộng nội dung.

Các số liệu về thời lượng, chỉ số và số lượng vật phẩm là mục tiêu ban đầu; chốt bằng kết quả chơi thử. Mốc 1 và 2 đã có bản triển khai; các mốc 3–5 chưa thực hiện.

## 11. Trạng thái triển khai mốc 1–2

Đã hoàn thành bản thử phòng chiến đấu, hai hành vi địch, camera/animation, HP, thắng/thua và chơi lại. Có thư viện 38 PNG cùng preview Boss bốn hướng; bốn map kiểm tra có lớp lưới, mã ghép và va chạm. Tường được ghép từ mặt và dải viền theo tám ô lân cận; cửa trong map mẫu là hình tạm Canvas. Đã xoá counter, logo, ảnh hero, icon và favicon mẫu Vite.

Kiểm chứng: build production thành công, 14 bài test luật game/dữ liệu chạy đạt và QA giao diện Chrome headless chạy đạt. Chi tiết kích thước frame, vùng cắt, giới hạn tileset và ảnh kiểm chứng ở [docs/ASSETS.md](docs/ASSETS.md); hướng dẫn chạy ở [README.md](README.md). Dungeon ngẫu nhiên, nhặt đồ và boss chiến đấu thuộc các mốc sau.
