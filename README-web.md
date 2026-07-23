# Lật Hình Cổ Tích — Web build

Game lật thẻ ghép cặp (memory / flip-match) chạy trên trình duyệt, **tiếng Việt**,
phong cách **cổ tích dân gian** (đỏ son + vàng kim, nền sơn mài sẫm).
Chỉ chế độ **Lượt đi (moves)**, **50 màn**, xếp hạng **1–3 ⭐** mỗi màn.

> Bản này được rút gọn từ game Cordova/Android gốc "Flip Dominion".
> Ghi chú build **Android** nằm ở [`README.md`](README.md) — file này chỉ nói về **web**.

---

## 1. Các file HTML trong `www/`

| File | Vai trò | Ghi chú |
|------|---------|---------|
| **`index_simple.html`** | **Bản web đơn giản (ĐANG PHÁT TRIỂN)** — nguồn của bản release | Sửa ở đây |
| `index_web.html` | Bản web đầy đủ (còn shop/tower/…); tiền thân của bản simple | Tham khảo |
| `index_v1.html` | Bản Cordova/Android hiện hành | Đừng đụng khi làm web |
| `index.html` | Bản cũ (stale, 207KB) | Không dùng |

Tất cả là **1 file HTML tự chứa** (HTML + CSS + JS thuần, không framework, không build step).
Trạng thái lưu bằng `localStorage`.

---

## 2. Chạy thử tại máy

```bash
python3 -m http.server 8090 --directory www
# mở http://localhost:8090/index_simple.html
```

> ⚠️ Tránh cổng **8080** — máy này đang có 1 app Laravel chiếm (mọi path trả về trang chủ của nó).
> Service worker/PWA chỉ hoạt động trên **localhost** hoặc **HTTPS**.

---

## 3. Đóng gói & deploy web

```bash
./build-web.sh        # tạo thư mục dist/ (static site sẵn sàng upload)
python3 -m http.server 8091 --directory dist   # xem thử bản release
```

`build-web.sh` lấy `index_simple.html` làm **`index.html`**, copy PWA files
(`manifest.webmanifest`, `sw.js`, `icon.svg`) và **chỉ** 5 file audio thật sự dùng
(bỏ `bg-game.png` ~2 MB không dùng, bỏ các `index_*.html` khác).

Deploy `dist/` lên bất kỳ host tĩnh nào (Netlify / Vercel / GitHub Pages / S3 / nginx).
**Nên phục vụ qua HTTPS** để PWA (cài đặt + offline) và mở khoá autoplay audio hoạt động.

Phụ thuộc ngoài duy nhất: **Google Fonts** (Cinzel Decorative + Quicksand). Cần internet
lần đầu; muốn offline hoàn toàn thì self-host font (xem Roadmap).

### 3a. Đóng gói zip

```bash
./package-web.sh     # build-web.sh + nén → lhct-web.zip (file ở top-level)
```

`lhct-web.zip` chứa `index.html`, `assets/`, `manifest.webmanifest`, `sw.js`, `icon.svg`
ở **gốc** (không lồng `dist/`), tiện thả thẳng vào **AWS Amplify Hosting** (kéo-thả zip,
có HTTPS sẵn — cách nhanh nhất) hoặc lưu làm artifact CI.

### 3b. Đẩy lên AWS S3 (+ CloudFront cho HTTPS)

> S3 **không** giải nén zip — deploy là **upload các file** (dùng `aws s3 sync`).
> Website endpoint của S3 chỉ có **HTTP** → PWA/service worker cần **HTTPS**, nên đặt
> **CloudFront** (kèm chứng chỉ ACM) trước bucket.

```bash
aws configure                        # 1 lần: nhập Access Key/Secret/region
./build-web.sh                       # bảo đảm dist/ mới nhất
./deploy-s3.sh my-bucket             # sync + đặt Content-Type/Cache-Control đúng
./deploy-s3.sh my-bucket E123CFDIST  # (tuỳ chọn) kèm invalidate CloudFront
```

`deploy-s3.sh` tự xử lý:
- Asset (audio/icon) → `Cache-Control: public,max-age=31536000,immutable`.
- `index.html` / `sw.js` / `manifest.webmanifest` → `no-cache` (để deploy mới hiện ngay;
  `.webmanifest` được set MIME `application/manifest+json` vì awscli không tự đoán).
- `--delete` để xoá file thừa trên bucket.

Bật static hosting + để `index.html` làm index document; CloudFront trỏ origin vào bucket.

---

## 4. Tính năng hiện có

- Lật thẻ · ghép cặp giống nhau (**mỗi hình đúng 2 lần** — memory cổ điển).
- Chỉ chế độ **moves**: mỗi lần thử tốn 1 lượt; hết lượt = thua.
- **50 màn**, mở khoá tuần tự; sao 1–3 theo số lượt dư (>10% = 2⭐, >30% = 3⭐).
- Màn: Menu · Chơi · Chọn màn (2 trang) · Cách chơi · Cài đặt (SFX/nhạc/âm lượng) ·
  Thắng (sao + thống kê) · Thua · **Chúc mừng** sau màn 50.
- Âm thanh: click/match/complete + 2 nhạc nền. Rung đã gỡ (web không rung).
- PWA: cài được, chơi offline (sau lần mở đầu).

---

## 5. Bản đồ code (tìm theo chuỗi — số dòng sẽ đổi)

Toàn bộ logic nằm trong object `G` (trong `<script>` lớn của `index_simple.html`).

| Chức năng | Tìm chuỗi |
|-----------|-----------|
| Bảng 50 màn (grid `g`, match `n`, giới hạn lượt `ml`, bộ emoji `e`, tên `l`) | `const LV = [` |
| Số màn kịch bản | `const SCRIPTED` |
| Bộ emoji theo nhóm | `const EM = {` |
| Lấy cấu hình màn | `getLv(i)` |
| Ngân sách lượt | `calcMM()` |
| **Sinh thẻ (memory cổ điển, mỗi hình 2 lần)** | `Classic memory game` trong `build()` |
| Xử lý chạm/ghép/combo | `onTap(` |
| Thắng (sao, không coin) | `onWin()` |
| Thua (moves) | `onLose()` |
| Sang màn kế / chặn ở màn 50 | `nxtLv()` |
| Màn chúc mừng | `showDone()` |
| Khoá chế độ = moves | `selM(m)` |
| Chọn màn (50 màn/2 trang) | `renderLvPage()` |
| Cờ web | `WEB_FREE_REWARDS`, `ENABLE_ADS` |

---

## 6. Design system (FOLK THEME)

Một **lớp CSS duy nhất** đặt cuối `<style>` là "nguồn chân lý" giao diện — tìm:
`FOLK FAIRY-TALE THEME`.

- **Token màu** ở `:root`: `--bg #1b100a`, `--card #2c1a11`, `--gold #f0c24b`,
  `--red #d6392e`, `--text #f6ecd6`, `--dim`, và bộ `--tile-bk-*` (mặt lưng thẻ).
  Các biến "cầu vồng" cũ (`--cyan/--pink/--green/--purple`) đã remap sang tông ấm.
- **Nút** 3 vai trò: `.btn.b1`/`.startMainBtn` = vàng kim (CTA) · `.btn.b3` = đỏ son ·
  `.btn.b2`/back/hàng dưới = mặt gỗ sẫm.
- **Card/panel** dùng chung 1 mặt nền ấm + viền vàng.
- **Thẻ bài**: mặt úp = sơn mài đỏ + khung + sao ✺ vàng (có lấp lánh nhẹ);
  mặt lật = nâu ấm, đang chọn = vàng, đã ghép = đỏ son.
- **Header** phẳng, title Quicksand vàng.

Muốn đổi tông màu: sửa token ở `:root` trong lớp FOLK + vài chỗ hardcode trong lớp đó.

---

## 7. Ngôn ngữ (i18n)

- Toàn bộ text hiển thị đã **Việt hoá** (kể cả 50 tên màn).
- ⚠️ **Cinzel Decorative KHÔNG có glyph tiếng Việt** → các tiêu đề (tên game, màn
  thắng/thua, "Màn N") đã chuyển sang **Quicksand** (hỗ trợ tiếng Việt) trong lớp FOLK.
  Nếu thêm tiêu đề mới, đừng dùng Cinzel cho chữ có dấu.
- ⚠️ Khi dịch hàng loạt bằng script, **dùng Python** (`open(...,encoding='utf-8')`),
  **KHÔNG dùng `perl -CSD`** với chuỗi non-ASCII (gây mojibake). Mojibake lỡ tạo ra có
  thể sửa bằng `s.encode('latin1').decode('utf8')`.

---

## 8. Điểm cần biết / nợ kỹ thuật

- **Dead-code JS/HTML đã dọn (2026-07-23)**: đã xoá hẳn các màn Shop / Tower / Theme /
  IAP / Piggy + booster/mana bar + ~40 method chết + toàn bộ khối AdMob (`deviceready`,
  flags, ad units). Kiểm chứng bằng script reachability: **0 lời gọi tới method không tồn
  tại**, DOM chỉ còn `setVibToggle` (đã guard). File ~320KB → ~238KB.
- **Còn lại — CSS chết**: phần CSS của các hệ thống đã xoá (theme `body.th-*`, shop,
  tower, piggy, booster, mana, coin…) vẫn nằm trong `<style>`. Xoá CSS **không gây lỗi
  runtime** nhưng dễ vô ý bỏ nhầm class dùng-động (JS ghép class như `ec-<cat>`, `mt3`,
  `sel-moves`, `star-anim s1`…). → nên dọn **khi mở trình duyệt để mắt kiểm tra**, không
  nên tự động xoá mù.
- Vài field/hằng data (`bst`, `mana`, `MANA_MAX`, `BM`, `tw`…) được giữ vì còn được
  tham chiếu ở nhánh **không bao giờ chạy** trong `build()/renderTiles()` (vô hại).
- An toàn khi sửa: sau khi xoá code, chạy lại 2 script kiểm tra (undefined-method-call +
  missing-DOM-id) như đã dùng — nằm trong lịch sử phát triển / hỏi lại để lấy.

---

## 9. Roadmap / TODO

- [x] **Dọn dead-code JS/HTML** (Shop/Tower/Theme/IAP/Piggy/Booster/ads) — ĐÃ XONG 2026-07-23.
- [ ] **Dọn CSS chết** còn lại (mở trình duyệt kiểm tra thị giác song song).
- [ ] **Art cổ tích** (thay emoji/CSS bằng ảnh): mặt lưng thẻ, bộ biểu tượng, nền, icon PWA, `og:image` 1200×630. (Đã có bộ prompt tạo ảnh — hỏi để lấy lại.)
- [ ] **Icon PWA dạng PNG** 192/512 + maskable (hiện dùng `icon.svg`).
- [ ] **Self-host font** (Quicksand + 1 font trang trí Việt hoá) để offline hoàn toàn, bỏ phụ thuộc Google Fonts.
- [ ] Thêm màn / tinh chỉnh độ khó; đa dạng nhóm emoji theo màn.
- [ ] Nén / tối ưu nhạc nền (mỗi file ~1.3MB); cân nhắc lazy-load.
- [ ] (Tuỳ chọn) analytics, chia sẻ điểm, bảng xếp hạng.

---

## 10. Cấu trúc thư mục web

```
www/
  index_simple.html      ← nguồn (sửa ở đây)
  manifest.webmanifest   ← PWA manifest
  sw.js                  ← service worker (offline)
  icon.svg               ← icon PWA/favicon (folk ✺)
  assets/
    click.mp3 matched.mp3 completed.mp3 BGM1.mp3 BGM2.mp3   ← DÙNG
    bg-game.png                                             ← KHÔNG dùng (bỏ khi deploy)
build-web.sh             ← đóng gói → dist/
dist/                    ← output deploy (do build-web.sh tạo)
```
