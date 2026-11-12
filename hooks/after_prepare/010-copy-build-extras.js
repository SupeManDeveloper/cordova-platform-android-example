#!/usr/bin/env node
// cordova-android chỉ đọc build-extras.gradle/proguard-rules.pro từ trong
// platforms/android/app/, nhưng thư mục đó bị gitignore và tái tạo lại mỗi
// lần `cordova prepare`/`platform add` — nên copy lại từ 2 file gốc ở root
// (có track trong git) sau mỗi lần prepare để bật minify/shrink cho release.
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const platformAppDir = path.join(projectRoot, 'platforms', 'android', 'app');

if (!fs.existsSync(platformAppDir)) {
    process.exit(0);
}

const files = [
    ['android-build-extras.gradle', 'build-extras.gradle'],
    ['android-proguard-rules.pro', 'proguard-rules.pro'],
];

for (const [src, dest] of files) {
    fs.copyFileSync(
        path.join(projectRoot, src),
        path.join(platformAppDir, dest)
    );
}
