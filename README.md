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