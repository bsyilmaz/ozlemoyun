# 🏥 Hastane Bekçisi - Hospital Guard Game

Yenidoğan bebekleri izleyin ve onları kurtarın! Bir hastane bekçisi olarak göreviniz bebeklerin durumunu takip etmek ve kritik durumlarda müdahale etmektir.

## 🎮 Oyun Özellikleri

### Ana Oynanış
- **Bebek İzleme**: 4 bebeği aynı anda izleyin
- **Kritik Durumlar**: Bebekler rastgele kritik duruma girebilir
- **Mini Oyunlar**: Bebekleri kurtarmak için 3 farklı mini oyun:
  - ❤️ **Kalp Masajı (CPR)**: Kalbe yeterli sayıda tıklayın
  - 💉 **İğne Yapma**: İğneyi bebeğin doğru yerine sürükleyin
  - 🧠 **Tıbbi Bilgi Testi**: Yenidoğan bakımı hakkında soruları cevaplayın

### Boss Savaşı
- **Görkem ile Mücadele**: Kapıdan giren Görkem'i tıbbi aletlerle yenin
- 6 farklı tıbbi aletle saldırın
- Görkem'i yenerek bonus puan kazanın

## 🎯 Oyun Kuralları

- **Süre**: Masaüstünde 2 dakika, mobilde 90 saniye
- **Bebek Kurtarma**: Her kurtarılan bebek +100 puan
- **Bebek Kaybı**: Her kaybedilen bebek -50 puan
- **Zaman Sınırı**: Kritik bebeklere 8 saniye içinde müdahale edin
- **Oyun Sonu**: 100 bebek kaybedildiğinde veya süre dolduğunda oyun biter

## 🎨 Özellikler

### Mobil Uyumluluk
- ✅ Dokunmatik ekran desteği
- ✅ Mobil için optimize edilmiş zorluk
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
- Vanilla JavaScript (ES6+)
- PWA Desteği (Progressive Web App)

### Dosya Yapısı
```
ozlemoyun/
├── index.html          # Ana HTML dosyası
├── game.js            # Oyun mantığı
├── styles.css         # Stil dosyası
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
1. Projeyi klonlayın veya indirin
2. `index.html` dosyasını bir web tarayıcısında açın
3. Oyunu oynayın!

### Web Sunucusu ile Çalıştırma
```bash
# Python ile basit sunucu (Python 3)
python -m http.server 8000

# Node.js ile basit sunucu (http-server paketi ile)
npx http-server -p 8000
```

Tarayıcınızda `http://localhost:8000` adresine gidin.

## 🎓 Eğitici İçerik

Oyun, yenidoğan bakımı hakkında gerçek tıbbi bilgiler içerir:
- APGAR skorlaması
- Yenidoğan sarılığı
- Fizyolojik değerler
- Temel tıbbi prosedürler
- Prematüre bebek bakımı

## 🏆 İpuçları

1. **Hızlı Reaksiyon**: Kritik bebeklere hızlıca müdahale edin
2. **Bilgi Gücü**: Quiz sorularını öğrenmek sonraki oyunlarda yardımcı olur
3. **Mobil Avantajı**: Mobilde oyun biraz daha kolay
4. **Görkem'e Dikkat**: Görkem'i yenmek büyük bonus verir
5. **Puan Yönetimi**: Kayıp bebekler puanınızı düşürür

## 🔧 Son Düzeltmeler ve İyileştirmeler

### Düzeltilen Hatalar
- ✅ CSS syntax hataları düzeltildi
- ✅ Bellek sızıntılarına neden olan interval'lar temizleniyor
- ✅ Mobil dokunmatik olay optimizasyonları
- ✅ Mini oyun zorluk seviyeleri dengelendi
- ✅ Bebek zaman aşımı süreleri iyileştirildi
- ✅ Quiz popup'larının çoğaltılması önlendi

### Yapılan İyileştirmeler
- ⚡ CPR zorluk seviyesi: 100'den 50'ye (masaüstü) ve 30'a (mobil) düşürüldü
- ⏱️ Kritik bebek müdahale süresi: 5 saniyeden 8 saniyeye çıkarıldı
- 💉 İğne oyunu: Mobilde 2, masaüstünde 3 başarılı enjeksiyon
- 🔄 Kaybedilen bebekler oyunda kalıyor (normal duruma dönüyor)
- 📊 İlerleme çubukları tüm mini oyunlarda gösteriliyor
- 🧹 Oyun yeniden başlatılırken tüm kaynaklar temizleniyor

## 📝 Geliştirici Notları

### Oyun Sınıfı Yapısı
```javascript
HospitalGuardGame
├── Constructor (Oyun ayarları)
├── init() (Başlatma)
├── setupEventListeners() (Olay dinleyicileri)
├── createBabies() (Bebek oluşturma)
├── startGame() (Oyunu başlat)
├── startRandomEvents() (Rastgele olaylar)
├── Mini Oyunlar
│   ├── startCPRGame()
│   ├── startInjectionGame()
│   └── startQuizGame()
├── Boss Savaşı
│   ├── appearGorkem()
│   ├── startBossFight()
│   └── endBossFight()
└── Yardımcı Fonksiyonlar
    ├── updateUI()
    ├── showFeedback()
    └── clearRandomEvents()
```

## 📄 Lisans

Bu proje eğitim amaçlıdır.

## 🤝 Katkıda Bulunma

Oyunu geliştirmek için önerilerinizi paylaşabilirsiniz!

---

**Oyunu geliştiren**: Bayram Selim Yılmaz
**Versiyon**: 1.1.0
**Son Güncelleme**: Ekim 2025
