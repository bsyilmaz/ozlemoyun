# 🏥 Hastane Bekçisi - Hospital Guard Game

Yenidoğan bebekleri izleyin ve onları kurtarın! Bir hastane bekçisi olarak göreviniz bebeklerin durumunu takip etmek ve kritik durumlarda müdahale etmektir.

## 🎮 Oyun Özellikleri

### Ana Oynanış
- **Bebek İzleme**: 4 bebeği aynı anda izleyin
- **Kritik Durumlar**: Bebekler rastgele kritik duruma girebilir (8 saniye içinde müdahale edin)
- **Mini Oyunlar**: Bebekleri kurtarmak için 3 farklı mini oyun:
  - ❤️ **Kalp Masajı (CPR)**: Kalbe yeterli sayıda tıklayın (Mobil: 30, Masaüstü: 50)
  - 💉 **İğne Yapma**: İğneyi bebek poposuna sürükleyin (Mobil: 2, Masaüstü: 3 kez)
  - 🧠 **Tıbbi Bilgi Testi**: Yenidoğan bakımı hakkında soruları cevaplayın

### Boss Savaşı
- **Görkem ile Mücadele**: Kapıdan giren Görkem'i tıbbi aletlerle yenin
- 6 farklı tıbbi aletle saldırın
- Görkem'i yenerek +500 bonus puan kazanın

## 🎯 Oyun Kuralları

- **Süre**: 5 dakika (300 saniye)
- **Bebek Kurtarma**: Her kurtarılan bebek +100 puan
- **Bebek Kaybı**: Her kaybedilen bebek -50 puan
- **Zaman Sınırı**: Kritik bebeklere 8 saniye içinde müdahale edin
- **Oyun Sonu**: 100 bebek kaybedildiğinde veya süre dolduğunda oyun biter

## 🎨 Özellikler

### Mobil Uyumluluk
- ✅ Dokunmatik ekran desteği
- ✅ Mobil için optimize edilmiş zorluk (daha kolay hedefler)
- ✅ Responsive tasarım
- ✅ Yatay ve dikey mod desteği

### Görsel Özellikler
- 🏥 Hastane temalı arka plan
- 🎨 Özel karakter grafikleri
- ✨ Animasyonlar ve efektler
- 📊 Gerçek zamanlı istatistikler

## 🛠️ Teknik Bilgiler

### Kullanılan Teknolojiler
- HTML5
- CSS3 (Animasyonlar ve Responsive Tasarım)
- Vanilla JavaScript (ES6+ Class Syntax)
- PWA Desteği (Progressive Web App)

### Dosya Yapısı
```
ozlemoyun/
├── index.html          # Ana HTML dosyası
├── game.js            # Oyun mantığı (Temiz ES6 Class)
├── styles.css         # Stil dosyası (Modüler CSS)
├── manifest.json      # PWA manifest
├── images/            # Oyun görselleri
│   ├── baby-normal.png
│   ├── baby-hurt.png
│   ├── gorkem-normal.png
│   ├── gorkem-hurt-removebg-preview.png
│   ├── ozlem-intern-doktor-removebg-preview.png
│   ├── hospital-room-bg.png
│   ├── kalp.png
│   ├── igne.png
│   └── bebekpoposu.png
└── README.md          # Bu dosya
```

## 🚀 Kurulum ve Çalıştırma

### Yerel Olarak Çalıştırma
1. Projeyi klonlayın:
```bash
git clone https://github.com/yourusername/ozlemoyun.git
cd ozlemoyun
```

2. `index.html` dosyasını bir web tarayıcısında açın

### Web Sunucusu ile Çalıştırma
```bash
# Python ile basit sunucu (Python 3)
python -m http.server 8000

# Node.js ile basit sunucu
npx http-server -p 8000
```

Tarayıcınızda `http://localhost:8000` adresine gidin.

## 🎓 Eğitici İçerik

Oyun, yenidoğan bakımı hakkında gerçek tıbbi bilgiler içerir:
- APGAR skorlaması
- Yenidoğan sarılığı
- Fizyolojik değerler (kalp atış hızı, solunum sayısı)
- Temel tıbbi prosedürler (K vitamini, göz merhemi)
- Prematüre bebek bakımı
- Metabolik tarama (topuk kanı)

## 🏆 İpuçları

1. **Hızlı Reaksiyon**: Kritik bebeklere hızlıca müdahale edin (8 saniye sınırı var)
2. **Bilgi Gücü**: Quiz sorularını öğrenmek sonraki oyunlarda yardımcı olur
3. **Mobil Avantajı**: Mobilde oyun biraz daha kolay (daha düşük hedefler)
4. **Görkem'e Dikkat**: Görkem'i yenmek 500 bonus puan verir
5. **Puan Yönetimi**: Kayıp bebekler puanınızı 50 puan düşürür

## 🔧 Versiyon 2.0 - Temiz Kod

### Yapılan İyileştirmeler
- ✅ Tamamen yeniden yazılmış temiz kod
- ✅ Modern ES6 Class yapısı
- ✅ Tüm timer ve interval'lar düzgün temizleniyor
- ✅ Hata yönetimi eklendi
- ✅ Mobil uyumluluk geliştirildi
- ✅ Performans optimizasyonları
- ✅ Kod organizasyonu ve yorumlar

### Önceki Versiyondaki Sorunlar Çözüldü
- ❌ CSS syntax hataları → ✅ Düzeltildi
- ❌ Bellek sızıntıları → ✅ Tüm kaynaklar düzgün temizleniyor
- ❌ Karmaşık kod yapısı → ✅ Temiz ve anlaşılır kod
- ❌ Tutarsız oyun durumu → ✅ Güvenilir state yönetimi
- ❌ Mini oyun hataları → ✅ Tüm mini oyunlar düzgün çalışıyor

## 📝 Geliştirici Notları

### Oyun Sınıfı Yapısı
```javascript
HospitalGuardGame
├── Constructor (Oyun başlatma ve ayarlar)
├── init() (İlk kurulum)
├── setupEventListeners() (Olay dinleyicileri)
├── createBabies() (Bebek oluşturma)
├── startGame() (Oyunu başlat)
├── startRandomEvents() (Rastgele olaylar)
├── Mini Oyunlar
│   ├── loadCPRGame()
│   ├── loadInjectionGame()
│   └── loadQuizGame()
├── Boss Savaşı
│   ├── appearGorkem()
│   ├── startBossFight()
│   └── endBossFight()
└── Yardımcı Fonksiyonlar
    ├── updateUI()
    ├── showFeedback()
    └── Temizlik fonksiyonları
```

## 🐛 Hata Ayıklama

Oyun konsolda ayrıntılı log mesajları verir. Sorun yaşarsanız:
1. Tarayıcı konsolunu açın (F12)
2. Console sekmesini kontrol edin
3. Hata mesajlarını okuyun

## 📄 Lisans

Bu proje eğitim amaçlıdır.

## 🤝 Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır! Büyük değişiklikler için lütfen önce bir issue açarak ne değiştirmek istediğinizi tartışın.

---

**Geliştiren**: Bayram Selim Yılmaz  
**Versiyon**: 2.0.0 (Temiz Kod)  
**Son Güncelleme**: Ekim 2025  
**Durum**: ✅ Kararlı ve Hatasız
