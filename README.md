# VERSIONS
- Android 13.0.0
- Gradle 9
- Gradle 8.13
- Java 17
- Panda game example
# COMMANDS

`cordova platform add android`
`cordova clean android`
`cordova build android`
`cordova run android`

Lỗi ads ko hiển thị và lỗi ko tìm thấy plugin admob trên cordova:

thì thêm vào config.xml :
<platform name="android">
    <preference name="PLAY_SERVICES_VERSION" default="23.2.0" />
    <preference name="AndroidXEnabled" value="true" />
    <preference name="GradlePluginKotlinEnabled" value="true" />

Tạo keystore:

keytool -genkey -v -keystore release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias release 

cordova build android --release jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \ -keystore release-key.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk release zipalign -v 4 app-release-unsigned.apk app-release.apk 

apksigner verify --verbose --print-certs app-release.apk

jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \ -keystore release-key.keystore \ platforms/android/app/build/outputs/bundle/release/app-release.aab release

cordova build android --release

jarsigner -verify -verbose -certs platforms/android/app/build/outputs/bundle/release/app-release.aab 

passphare:: Superman

