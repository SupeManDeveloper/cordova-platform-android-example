#!/usr/bin/env node
// cordova-android 15.1.0 (xem node_modules/cordova-android/lib/prepare.js,
// manifest.setVersionName()/.setVersionCode()) đáng lẽ tự đồng bộ
// version/android-versionCode từ config.xml vào AndroidManifest.xml mỗi lần
// prepare, nhưng trong project này nó không cập nhật (giữ nguyên giá trị cũ
// dù config.xml đã đổi) — chưa rõ nguyên nhân chính xác (nghi do tương tác
// với edit-config tuỳ biến trong config.xml), chỉ xác nhận được hiện tượng.
// Ép đọc version/android-versionCode từ config.xml rồi ghi thẳng vào
// AndroidManifest.xml đã generate, để không bao giờ build nhầm version cũ.
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const manifestPath = path.join(
    projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'
);

if (!fs.existsSync(manifestPath)) {
    process.exit(0);
}

const configXml = fs.readFileSync(path.join(projectRoot, 'config.xml'), 'utf-8');
const widgetMatch = configXml.match(/<widget\b[^>]*>/);
const versionMatch = widgetMatch?.[0].match(/\bversion="([^"]+)"/);
const versionCodeMatch = widgetMatch?.[0].match(/\bandroid-versionCode="([^"]+)"/);

if (!versionMatch || !versionCodeMatch) {
    console.error('⚠️  Không đọc được version/android-versionCode từ config.xml, bỏ qua fix.');
    process.exit(0);
}

const version = versionMatch[1];
const versionCode = versionCodeMatch[1];

let manifest = fs.readFileSync(manifestPath, 'utf-8');
manifest = manifest.replace(
    /android:versionCode="[^"]*" android:versionName="[^"]*"/,
    `android:versionCode="${versionCode}" android:versionName="${version}"`
);
fs.writeFileSync(manifestPath, manifest);
