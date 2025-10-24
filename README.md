# 🏥 Hastane Bekçisi - Hospital Guard Game

Web tabanlı bir hastane bekçisi oyunu. Yenidoğan bebekleri izleyin, kritik durumdaki bebekleri kurtarın ve Görkem ile savaşın!

## 🎮 Oyun Hakkında

Bu oyunda bir doktor olarak yenidoğan bebekleri izliyorsunuz. Bebeklerden bazıları rastgele kritik duruma geçer ve onları kurtarmak için hızlı refleks oyunu oynamanız gerekir. Ayrıca ara sıra kapıdan Görkem adında kıdemli doktor gelir ve onunla savaşmanız gerekir.

## 🎯 Oyun Mekanikleri

### Ana Oyun
- **İzleme Modu**: Bebekleri camın arkasından izleyin
- **Kritik Durum**: Bebekler rastgele kritik duruma geçer
- **Kurtarma**: Kritik bebeğe tıklayarak hızlı refleks oyunu başlatın
- **Zaman Sınırı**: 2 dakika boyunca hayatta kalın

### Bebek Kurtarma Mini-Oyunu
- Yeşil hedef alana geldiğinde tıklayın
- Doğru zamanda tıklarsanız bebek kurtarılır
- Yanlış zamanda tıklarsanız oyun biter

### Görkem Savaşı
- Görkem rastgele kapıdan gelir
- Tıbbi aletlerle ona saldırın
- Canını sıfıra indirerek onu yenin
- Her alet farklı hasar verir

## 🛠️ Teknik Özellikler

- **Framework**: Pure HTML5, CSS3, JavaScript
- **Responsive**: Mobil ve masaüstü uyumlu
- **Animasyonlar**: CSS animasyonları ve geçişler
- **Oyun Durumları**: 
  - `START`: Başlangıç ekranı
  - `MONITORING`: Ana izleme modu
  - `BABY_MINIGAME`: Bebek kurtarma oyunu
  - `BOSS_FIGHT`: Görkem savaşı
  - `GAME_OVER`: Oyun bitti

## 🎨 Görsel Özellikler

### Renk Paleti
- **Bebek Bölümü**: Yeşil tonları (sağlık)
- **Doktor Bölümü**: Mor tonları (tıp)
- **Cam Bölücü**: Mavi cam efekti
- **Kritik Durum**: Kırmızı uyarı renkleri

### Animasyonlar
- Bebekler için nabız animasyonu
- Doktor için nefes alma animasyonu
- Kapı açılma animasyonu
- Geri bildirim popup'ları

## 🎮 Nasıl Oynanır

1. **Oyunu Başlat**: "Oyunu Başlat" butonuna tıklayın
2. **Bebekleri İzleyin**: Camın arkasından bebekleri izleyin
3. **Kritik Bebekleri Kurtarın**: Kırmızı olan bebeğe tıklayın ve hızlı refleks oyunu oynayın
4. **Görkem ile Savaşın**: Kapıdan geldiğinde tıbbi aletlerle saldırın
5. **2 Dakika Hayatta Kalın**: Süreyi tamamlayarak kazanın

## 🏆 Puanlama Sistemi

- **Bebek Kurtarma**: +100 puan
- **Görkem Yenme**: +500 puan
- **Zaman Bonusu**: Her saniye +1 puan

## 📱 Responsive Tasarım

- **Masaüstü**: Yan yana bölümler
- **Mobil**: Alt alta bölümler
- **Dokunmatik**: Mobil cihazlarda dokunma desteği

## 🔧 Geliştirme

### Dosya Yapısı
```
/
├── index.html          # Ana HTML dosyası
├── styles.css          # CSS stilleri
├── game.js            # Oyun mantığı
└── README.md          # Bu dosya
```

### Görsel Entegrasyonu
Oyun, aşağıdaki görselleri kullanmak üzere hazırlanmıştır:
- `/images/baby-normal.png` - Normal bebek
- `/images/baby-critical.png` - Kritik bebek
- `/images/doctor.png` - Doktor karakteri
- `/images/gorkem.png` - Görkem karakteri
- `/images/tools/` - Tıbbi aletler klasörü
- `/images/background.png` - Arka plan
- `/images/door.png` - Kapı

## 🎯 Gelecek Özellikler

- Ses efektleri
- Daha fazla bebek türü
- Farklı zorluk seviyeleri
- Liderlik tablosu
- Daha fazla boss karakteri

## 🐛 Bilinen Sorunlar

- Görsel dosyalar henüz entegre edilmedi (placeholder emojiler kullanılıyor)
- Ses efektleri eklenmedi
- Mobil cihazlarda performans optimizasyonu gerekebilir

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

---

**Geliştirici Notu**: Bu oyun, hastane ortamında çalışan sağlık personelinin stresli durumlarını eğlenceli bir şekilde simüle etmek için tasarlanmıştır. Gerçek tıbbi durumlarla ilgisi yoktur.
