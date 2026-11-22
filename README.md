# Satranç 2 — Şah'ın Savunması

Expo projesi, klasördeki HTML oyununu Android ve iOS üzerinde WebView içinde açar. Tailwind CSS, Three.js ve Google Fonts kaynakları internet üzerinden yüklenir.

## Kurulum ve önizleme

Node.js 22.13 veya üzeriyle proje klasöründe çalıştırın.

```powershell
npm install
npx expo start
```

## Android çıktısı

Expo hesabınızla oturum açın. İlk derlemede EAS, projeyi hesabınıza bağlamanızı ve Android imzalama anahtarını ayarlamanızı isteyebilir.

```powershell
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

Telefona kurulabilen APK, derleme tamamlanınca EAS bağlantısından indirilir. Google Play için `--profile production` seçeneği AAB üretir.

Yeni proje için uygulama kimliği `pikserax.satranc2` olarak ayarlandı. Oyun daha önce yayımlandıysa ilk derlemeden önce `app.json` dosyasına mevcut uygulama kimliğini girin.

## iOS App Store çıktısı

`appstore` profili, iPhone için App Store dağıtımına uygun imzalı bir IPA derler. EAS derleme sırasında iOS derleme numarasını artırır. Sürüm numarası `app.json` içindeki `expo.version` alanından yönetilir.

İlk derleme için Expo hesabıyla oturum açın. EAS istendiğinde Apple Developer Program üyeliği olan ekibinizi seçin ve dağıtım imzalama bilgilerini ayarlayın.

```powershell
npx eas-cli login
npx eas-cli build --platform ios --profile appstore
```

Oluşan IPA'yı EAS derleme sayfasından indirebilirsiniz. App Store Connect'te aynı bundle ID ile uygulama kaydını oluşturduktan sonra, derlemeyi TestFlight'a yüklemek için aşağıdaki komutu çalıştırın ve listeden ilgili iOS derlemesini seçin.

```powershell
npx eas-cli submit --platform ios --profile appstore
```

Fiziksel bir iPhone'da 3D görünümü, dokunmatik kontrolleri ve oyunu kapatıp açtıktan sonra kayıtların korunmasını doğrulayın. Mağaza bilgileri ve ekran görüntüleri App Store Connect'te tamamlanır. App Review gönderimi de App Store Connect üzerinden yapılır.
