// Sound Manager
class SoundManager {
    constructor() {
        this.sounds = {
            backgroundMusic: new Audio('sounds/retro-arcade-game-music-297305.mp3'),
            babyCry: new Audio('sounds/baby-cry.mp3'),
            babyHeal: new Audio('sounds/baby-heal.mp3'),
            bossMusic: new Audio('sounds/boss_music.mp3'),
            heartBeat: new Audio('sounds/heart-beat.mp3'),
            injectionFailed: new Audio('sounds/injection-failed.mp3'),
            injectionSuccess: new Audio('sounds/injection-succes.mp3'),
            buttonClick: new Audio('sounds/keyboard-click-327728.mp3'),
            toolHit: new Audio('sounds/knife-throw-2-88028.mp3'),
            quizCorrect: new Audio('sounds/quiz-correct.mp3'),
            quizWrong: new Audio('sounds/quiz-wrong.mp3')
        };
        
        // Looping music
        this.sounds.backgroundMusic.loop = true;
        this.sounds.bossMusic.loop = true;
        this.sounds.heartBeat.loop = true;
        
        // Volume ayarları
        this.sounds.backgroundMusic.volume = 0.15;
        this.sounds.bossMusic.volume = 0.3;
        this.sounds.heartBeat.volume = 0.4;
        this.sounds.babyCry.volume = 0.5;
        this.sounds.babyHeal.volume = 0.6;
        this.sounds.buttonClick.volume = 0.3;
        this.sounds.toolHit.volume = 0.5;
        this.sounds.injectionSuccess.volume = 0.5;
        this.sounds.injectionFailed.volume = 0.4;
        this.sounds.quizCorrect.volume = 0.6;
        this.sounds.quizWrong.volume = 0.5;
        
        this.muted = false;
    }
    
    play(soundName) {
        if (this.muted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    pause(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
        }
    }
    
    resume(soundName) {
        if (this.muted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.play().catch(e => console.log('Sound resume failed:', e));
        }
    }
    
    stop(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }
    
    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }
    
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopAll();
        }
        return this.muted;
    }
}

// Hospital Guard Game - Clean Version
class HospitalGuardGame {
    constructor() {
        // Sound Manager
        this.soundManager = new SoundManager();
        
        // Game states
        this.gameState = 'START'; // START, MONITORING, BABY_MINIGAME, BOSS_FIGHT, GAME_OVER
        
        // Game data
        this.babies = [];
        this.score = 0;
        this.savedCount = 0;
        this.lostCount = 0;
        this.gameTime = 0;
        this.bossHealth = 100;
        this.gorkemAppeared = false;
        this.currentCriticalBaby = null;
        this.currentMiniGameType = null;
        this.lastMiniGameType = null;
        this.sameGameCount = 0;
        this.lastCriticalTime = 0;
        this.criticalBabies = [];
        
        // Timers and intervals
        this.gameTimer = null;
        this.rescueTimer = null;
        this.criticalCheckInterval = null;
        this.gorkemCheckInterval = null;
        this.autoFailTimeout = null;
        
        // Mini-game data
        this.cprClicks = 0;
        this.cprTarget = 50;
        this.injectionClicks = 0;
        this.injectionTarget = 7; // 7 farklı yere iğne (hem mobil hem desktop)
        
        // Game settings
        this.maxBabies = 4;
        this.criticalChance = 0.2;
        this.gorkemChance = 0.3;
        this.gameDuration = 300; // 5 minutes
        this.criticalTimeout = 8000; // 8 seconds to respond
        
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            this.cprTarget = 30; // Mobilde daha kolay CPR
        }
        
        this.init();
    }

    init() {
        console.log('Initializing game...');
        this.setupEventListeners();
        this.createBabies();
        this.updateUI();
        this.preventZoom();
    }
    
    preventZoom() {
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    setupEventListeners() {
        // Start button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }
        
        // Sound toggle button
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                const muted = this.soundManager.toggleMute();
                soundToggle.textContent = muted ? '🔇' : '🔊';
                soundToggle.classList.toggle('muted', muted);
                soundToggle.title = muted ? 'Sesi Aç' : 'Sesi Kapat';
            });
        }

        // Baby clicks (event delegation)
        const babiesContainer = document.getElementById('babies-container');
        if (babiesContainer) {
            babiesContainer.addEventListener('click', (e) => {
                const babyElement = e.target.closest('.baby');
                if (babyElement && this.gameState === 'MONITORING') {
                    this.handleBabyClick(babyElement);
                }
            });
        }

        // Tool buttons (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tool-btn') && this.gameState === 'BOSS_FIGHT') {
                this.handleToolClick(e.target);
            }
        });
    }

    createBabies() {
        const container = document.getElementById('babies-container');
        if (!container) return;
        
        container.innerHTML = '';
        this.babies = [];

        for (let i = 0; i < this.maxBabies; i++) {
            const baby = {
                id: i,
                state: 'normal',
                element: null
            };
            
            const babyElement = document.createElement('div');
            babyElement.className = 'baby normal';
            babyElement.id = `baby-${i}`;
            babyElement.innerHTML = `
                <div class="baby-sprite"></div>
                <div class="baby-status">İyi</div>
            `;
            
            container.appendChild(babyElement);
            baby.element = babyElement;
            this.babies.push(baby);
        }
        
        console.log(`Created ${this.babies.length} babies`);
    }

    startGame() {
        console.log('Starting game...');
        this.soundManager.play('buttonClick');
        this.soundManager.play('backgroundMusic');
        this.gameState = 'MONITORING';
        document.getElementById('start-screen').style.display = 'none';
        
        // İlk kritik için 5 saniye bekle
        this.lastCriticalTime = Date.now() - 7000; // 5 saniye sonra ilk bebek gelebilir
        
        this.startGameTimer();
        this.startRandomEvents();
        this.updateUI();
    }

    startGameTimer() {
        this.gameTime = 0;
        this.gameTimer = setInterval(() => {
            this.gameTime++;
            this.updateTimer();
            
            if (this.gameTime >= this.gameDuration) {
                this.endGame(true);
            }
        }, 1000);
    }

    startRandomEvents() {
        // Check for critical babies every second
        this.criticalCheckInterval = setInterval(() => {
            if (this.gameState === 'MONITORING') {
                const currentTime = Date.now();
                const timeSinceLastCritical = (currentTime - this.lastCriticalTime) / 1000;
                
                // En az 12 saniye geçmeli ve maksimum 3 kritik bebek olabilir
                if (timeSinceLastCritical >= 12 && this.criticalBabies.length < 3) {
                    if (Math.random() < this.criticalChance) {
                        this.makeRandomBabyCritical();
                    }
                }
            }
        }, 1000);
        
        // Görkem artık bebek kaybında geliyor (random yerine)
    }

    makeRandomBabyCritical() {
        const normalBabies = this.babies.filter(baby => baby.state === 'normal');
        if (normalBabies.length === 0) return;
        
        const randomBaby = normalBabies[Math.floor(Math.random() * normalBabies.length)];
        this.setBabyState(randomBaby.id, 'critical');
        
        // Kritik bebekleri listele
        if (!this.criticalBabies.includes(randomBaby.id)) {
            this.criticalBabies.push(randomBaby.id);
        }
        
        // Son kritik zamanı güncelle
        this.lastCriticalTime = Date.now();
        
        // Bebek ağlama sesi (sadece boss fight değilse)
        if (this.gameState === 'MONITORING') {
            this.soundManager.play('babyCry');
        }
        
        // Bebek için timeout başlat (mini game sırasında duracak)
        randomBaby.criticalStartTime = Date.now();
        randomBaby.remainingTime = this.criticalTimeout;
        
        this.startBabyCriticalTimer(randomBaby.id);
    }
    
    startBabyCriticalTimer(babyId) {
        const baby = this.babies[babyId];
        if (!baby) return;
        
        baby.criticalTimer = setInterval(() => {
            if (this.gameState === 'MONITORING') {
                baby.remainingTime -= 100;
                
                if (baby.remainingTime <= 0 && baby.state === 'critical') {
                    clearInterval(baby.criticalTimer);
                    this.loseBaby(babyId);
                }
            }
            // Mini game sırasında süre donuyor, MONITORING'e dönünce devam ediyor
        }, 100);
    }

    setBabyState(babyId, state) {
        const baby = this.babies[babyId];
        if (!baby) return;

        baby.state = state;
        const element = baby.element;
        
        element.classList.remove('normal', 'critical', 'saved');
        element.classList.add(state);
        
        const statusElement = element.querySelector('.baby-status');
        const statusTexts = {
            'normal': 'İyi',
            'critical': 'Kritik!',
            'saved': 'Kurtarıldı'
        };
        statusElement.textContent = statusTexts[state] || 'İyi';
    }

    handleBabyClick(babyElement) {
        const babyId = parseInt(babyElement.id.split('-')[1]);
        const baby = this.babies[babyId];
        
        if (baby && baby.state === 'critical' && this.gameState === 'MONITORING') {
            // Timer'ı durdur (mini game sırasında donacak)
            if (baby.criticalTimer) {
                clearInterval(baby.criticalTimer);
            }
            this.startBabyRescueGame(babyId);
        }
    }

    startBabyRescueGame(babyId) {
        this.gameState = 'BABY_MINIGAME';
        this.currentCriticalBaby = babyId;
        
        // Arka plan müziğini duraklat
        this.soundManager.pause('backgroundMusic');
        
        // Random mini-game (üst üste en fazla 2 kez aynı oyun)
        const types = ['cpr', 'injection', 'quiz'];
        
        // Eğer son oyun 2 kez üst üste aynıysa, farklı oyun seç
        if (this.sameGameCount >= 2) {
            const availableTypes = types.filter(t => t !== this.lastMiniGameType);
            this.currentMiniGameType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        } else {
            this.currentMiniGameType = types[Math.floor(Math.random() * types.length)];
        }
        
        // Oyun tekrar sayacını güncelle
        if (this.currentMiniGameType === this.lastMiniGameType) {
            this.sameGameCount++;
        } else {
            this.sameGameCount = 1;
        }
        this.lastMiniGameType = this.currentMiniGameType;
        
        console.log('Selected mini game:', this.currentMiniGameType, 'Count:', this.sameGameCount);
        
        // Show overlay
        document.getElementById('game-overlay').style.display = 'flex';
        document.getElementById('baby-rescue-game').style.display = 'block';
        document.getElementById('boss-fight-game').style.display = 'none';
        
        // Load specific mini-game
        this.loadMiniGame();
    }
    
    loadMiniGame() {
        const rescueContent = document.getElementById('rescue-content');
        
        console.log('Loading mini game:', this.currentMiniGameType);
        
        if (this.currentMiniGameType === 'cpr') {
            this.soundManager.play('heartBeat'); // Kalp atışı loop
            this.loadCPRGame(rescueContent);
        } else if (this.currentMiniGameType === 'injection') {
            console.log('Loading injection game...');
            this.loadInjectionGame(rescueContent);
        } else if (this.currentMiniGameType === 'quiz') {
            this.loadQuizGame(rescueContent);
        }
    }
    
    loadCPRGame(container) {
        this.cprClicks = 0;
        
        container.innerHTML = `
            <div class="rescue-header">❤️ Kalp Masajı (CPR)!</div>
            <div class="rescue-instructions">Kalbe hızlıca ${this.cprTarget} kez tıklayın!</div>
            <div id="cpr-game" style="padding: 20px;">
                <div id="heart-clickable" style="width: 100%; max-width: 350px; height: 350px; margin: 0 auto; 
                     background-image: url('images/kalp.png'); background-size: contain; 
                     background-repeat: no-repeat; background-position: center; position: relative;
                     cursor: pointer; transition: transform 0.1s ease;">
                    <div id="cpr-counter" style="position: absolute; top: 50%; left: 50%; 
                         transform: translate(-50%, -50%); font-size: 48px; font-weight: bold; 
                         color: #f44336; text-shadow: 2px 2px 4px rgba(0,0,0,0.7); 
                         background: rgba(255,255,255,0.9); padding: 15px 25px; border-radius: 15px;
                         pointer-events: none;">
                        ${this.cprClicks}/${this.cprTarget}
                    </div>
                </div>
            </div>
        `;
        
        const heartClickable = document.getElementById('heart-clickable');
        
        const handleClick = () => {
                this.cprClicks++;
            const counter = document.getElementById('cpr-counter');
            if (counter) {
                counter.textContent = `${this.cprClicks}/${this.cprTarget}`;
            }
                
                // Visual feedback
            heartClickable.style.transform = 'scale(0.95)';
                setTimeout(() => {
                heartClickable.style.transform = 'scale(1)';
                }, 100);
                
                if (this.cprClicks >= this.cprTarget) {
                clearInterval(this.rescueTimer);
                setTimeout(() => {
                    this.endBabyRescueGame(true);
                }, 300);
                }
            };
            
        heartClickable.addEventListener('click', handleClick);
        heartClickable.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleClick();
        });
        
        // Timer - 5 saniye
        let timeLeft = 5;
        this.rescueTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0 || this.cprClicks >= this.cprTarget) {
                clearInterval(this.rescueTimer);
                this.endBabyRescueGame(this.cprClicks >= this.cprTarget);
            }
        }, 1000);
    }
    
    handleCPRClick() {
        if (this.gameState !== 'BABY_MINIGAME') return;
        
        this.cprClicks++;
        const counter = document.getElementById('cpr-counter');
        if (counter) {
            counter.textContent = `${this.cprClicks}/${this.cprTarget}`;
        }
        
                if (this.cprClicks >= this.cprTarget) {
            if (this.rescueTimer) {
                clearInterval(this.rescueTimer);
            }
                    this.endBabyRescueGame(true);
        }
    }
    
    loadInjectionGame(container) {
        this.injectionClicks = 0;
        
        container.innerHTML = `
            <div class="rescue-header">💉 İğne Yapma!</div>
            <div class="rescue-instructions">Yeşil alanlara ${this.injectionTarget} kez iğne yap!</div>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 25px; padding: 30px;">
                <div id="injection-counter" style="font-size: 48px; font-weight: bold; 
                     color: #4CAF50; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
                        ${this.injectionClicks}/${this.injectionTarget}
                    </div>
                <div id="baby-butt-clickable" style="width: 350px; height: 350px; 
                     background-image: url('images/bebekpoposu.png'); background-size: contain; 
                     background-repeat: no-repeat; background-position: center; 
                     position: relative; cursor: crosshair;">
                    <div id="injection-zone" style="position: absolute; width: 60px; height: 60px; 
                         background: rgba(76, 175, 80, 0.5); border: 3px dashed #4CAF50; 
                         border-radius: 50%; animation: pulseZone 1.5s infinite;
                         display: flex; align-items: center; justify-content: center;
                         font-size: 30px; user-select: none; pointer-events: none;
                         transition: all 0.3s ease;">
                        💉
                    </div>
                </div>
                <div style="font-size: 18px; color: #666; text-align: center; font-weight: 600;
                     background: rgba(76, 175, 80, 0.1); padding: 15px 25px; border-radius: 12px;
                     border: 2px solid #4CAF50;">
                    🎯 Hareket eden yeşil alana tıkla!
                </div>
            </div>
        `;
        
        const babyButt = document.getElementById('baby-butt-clickable');
        const zone = document.getElementById('injection-zone');
        
        // İlk pozisyonu ayarla
        this.moveInjectionZoneToRandomPosition(zone);
        
        const handleClick = (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            
            // Tıklanan pozisyon
            const rect = babyButt.getBoundingClientRect();
            let clickX, clickY;
            
            if (e.type === 'touchend' && e.changedTouches) {
                clickX = e.changedTouches[0].clientX;
                clickY = e.changedTouches[0].clientY;
            } else {
                clickX = e.clientX;
                clickY = e.clientY;
            }
            
            const relativeX = clickX - rect.left;
            const relativeY = clickY - rect.top;
            
            // Zone pozisyonu (merkez)
            const zoneRect = zone.getBoundingClientRect();
            const zoneCenterX = zoneRect.left + zoneRect.width / 2 - rect.left;
            const zoneCenterY = zoneRect.top + zoneRect.height / 2 - rect.top;
            
            // Mesafe hesapla
            const distance = Math.sqrt(
                Math.pow(relativeX - zoneCenterX, 2) + 
                Math.pow(relativeY - zoneCenterY, 2)
            );
            
            // Hedef yarıçapı (30px)
            if (distance <= 30) {
                // Başarılı iğne!
                this.injectionClicks++;
                this.soundManager.play('injectionSuccess');
                
                const counter = document.getElementById('injection-counter');
                if (counter) {
                counter.textContent = `${this.injectionClicks}/${this.injectionTarget}`;
                }
                
                // Success feedback
                zone.style.background = 'rgba(76, 175, 80, 0.9)';
                zone.innerHTML = '✅';
                zone.style.transform = 'scale(1.3)';
                
                setTimeout(() => {
                    zone.style.background = 'rgba(76, 175, 80, 0.5)';
                    zone.innerHTML = '💉';
                    zone.style.transform = 'scale(1)';
                    
                    // Yeni pozisyona taşı
                    if (this.injectionClicks < this.injectionTarget) {
                        this.moveInjectionZoneToRandomPosition(zone);
                    }
                }, 400);
                
                if (this.injectionClicks >= this.injectionTarget) {
                    clearInterval(this.rescueTimer);
                    setTimeout(() => {
                    this.endBabyRescueGame(true);
                    }, 600);
                }
            } else {
                // Iskaladın!
                this.soundManager.play('injectionFailed');
                zone.style.background = 'rgba(244, 67, 54, 0.5)';
                zone.innerHTML = '❌';
                setTimeout(() => {
                    zone.style.background = 'rgba(76, 175, 80, 0.5)';
                    zone.innerHTML = '💉';
                }, 300);
            }
        };
        
        babyButt.addEventListener('click', handleClick);
        babyButt.addEventListener('touchend', handleClick, { passive: false });
        
        // Timer - daha uzun süre (20 saniye)
        let timeLeft = 20;
        this.rescueTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0 || this.injectionClicks >= this.injectionTarget) {
                clearInterval(this.rescueTimer);
                this.endBabyRescueGame(this.injectionClicks >= this.injectionTarget);
            }
        }, 1000);
    }
    
    moveInjectionZoneToRandomPosition(zone) {
        // Rastgele pozisyon belirle (kenarlardan biraz içeride)
        const margin = 50; // px
        const maxX = 350 - 60 - margin;
        const maxY = 350 - 60 - margin;
        
        const randomX = Math.random() * maxX + margin;
        const randomY = Math.random() * maxY + margin;
        
        zone.style.left = randomX + 'px';
        zone.style.top = randomY + 'px';
        zone.style.transform = 'scale(1)';
    }

    setupInjectionDragDrop() {
        const syringe = document.getElementById('syringe');
        const injectionZone = document.getElementById('injection-zone');
        
        if (!syringe || !injectionZone) return;
        
        let isDragging = false;
        let startX, startY;
        let initialLeft, initialTop;
        
        // Get initial position
        const syringeParent = syringe.parentElement;
        const parentRect = syringeParent.getBoundingClientRect();
        
        // Mouse events for desktop
        syringe.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            syringe.style.cursor = 'grabbing';
            syringe.style.position = 'fixed';
            syringe.style.zIndex = '1000';
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = syringe.getBoundingClientRect();
            syringe.style.left = rect.left + 'px';
            syringe.style.top = rect.top + 'px';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const rect = syringe.getBoundingClientRect();
            syringe.style.left = (rect.left + deltaX) + 'px';
            syringe.style.top = (rect.top + deltaY) + 'px';
            
            startX = e.clientX;
            startY = e.clientY;
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            syringe.style.cursor = 'grab';
            
            this.checkInjectionCollision(syringe, injectionZone);
            
            // Reset position
            syringe.style.position = 'relative';
            syringe.style.left = '0';
            syringe.style.top = '0';
            syringe.style.zIndex = '10';
        });
        
        // Touch events for mobile - IMPROVED
        syringe.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            syringe.style.position = 'fixed';
            syringe.style.zIndex = '1000';
            
            const rect = syringe.getBoundingClientRect();
            syringe.style.left = rect.left + 'px';
            syringe.style.top = rect.top + 'px';
            
            // Visual feedback
            syringe.style.transform = 'scale(1.1)';
            syringe.style.opacity = '0.8';
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            
            const rect = syringe.getBoundingClientRect();
            syringe.style.left = (rect.left + deltaX) + 'px';
            syringe.style.top = (rect.top + deltaY) + 'px';
            
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            isDragging = false;
            
            // Reset visual feedback
            syringe.style.transform = 'scale(1)';
            syringe.style.opacity = '1';
            
            this.checkInjectionCollision(syringe, injectionZone);
            
            // Reset position
            syringe.style.position = 'relative';
            syringe.style.left = '0';
            syringe.style.top = '0';
            syringe.style.zIndex = '10';
        }, { passive: false });
    }
            
    checkInjectionCollision(syringe, injectionZone) {
            const syringeRect = syringe.getBoundingClientRect();
            const zoneRect = injectionZone.getBoundingClientRect();
            
        // Check collision with more tolerance for mobile
        const tolerance = this.isMobile ? 20 : 10;
        
        if (syringeRect.left < (zoneRect.right + tolerance) &&
            (syringeRect.right - tolerance) > zoneRect.left &&
            syringeRect.top < (zoneRect.bottom + tolerance) &&
            (syringeRect.bottom - tolerance) > zoneRect.top) {
            
                this.injectionClicks++;
            const counter = document.getElementById('injection-counter');
            if (counter) {
                counter.textContent = `${this.injectionClicks}/${this.injectionTarget}`;
            }
                
                // Visual feedback
                injectionZone.style.background = 'rgba(76, 175, 80, 0.8)';
            injectionZone.style.transform = 'translate(-50%, -50%) scale(1.2)';
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.textContent = '✅ Başarılı!';
            successMsg.style.cssText = `
                position: fixed;
                top: 30%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #4CAF50;
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                font-size: 20px;
                font-weight: bold;
                z-index: 5000;
                animation: fadeOut 1s forwards;
            `;
            document.body.appendChild(successMsg);
            
                setTimeout(() => {
                injectionZone.style.background = 'rgba(76, 175, 80, 0.3)';
                    injectionZone.style.transform = 'translate(-50%, -50%) scale(1)';
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
                }, 500);
                
                if (this.injectionClicks >= this.injectionTarget) {
                if (this.rescueTimer) {
                    clearInterval(this.rescueTimer);
                }
                setTimeout(() => {
                    this.endBabyRescueGame(true);
                }, 500);
                }
            } else {
            // Show miss feedback
            const missMsg = document.createElement('div');
            missMsg.textContent = '❌ Kaçırdın!';
            missMsg.style.cssText = `
                position: fixed;
                top: 30%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #f44336;
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                font-size: 18px;
                font-weight: bold;
                z-index: 5000;
                animation: fadeOut 0.8s forwards;
            `;
            document.body.appendChild(missMsg);
            
            setTimeout(() => {
                if (missMsg.parentNode) {
                    missMsg.parentNode.removeChild(missMsg);
                }
            }, 800);
        }
    }
    
    loadQuizGame(container) {
        const questions = [
            { q: "Yenidoğanın normal kalp atış hızı aralığı nedir?", options: ["80-100 atım/dakika", "180-200 atım/dakika", "120-160 atım/dakika"], correct: 2 },
            { q: "Yenidoğanın normal solunum sayısı aralığı nedir?", options: ["12-20 nefes/dakika", "30-60 nefes/dakika", "70-90 nefes/dakika"], correct: 1 },
            { q: "APGAR skoru ne zaman bakılır?", options: ["1. ve 5. dakikalarda", "1. ve 5. saatlerde", "1. ve 5. günlerde"], correct: 0 },
            { q: "APGAR'daki 'A' (Appearance) neyi ifade eder?", options: ["Aktivite (Kas tonusu)", "Ağlama (Refleks)", "Renk (Cilt rengi)"], correct: 2 },
            { q: "APGAR'daki 'G' (Grimace) neyi ifade eder?", options: ["Gestasyon (Gebelik haftası)", "Refleks uyarılabilirlik", "Glukoz (Kan şekeri)"], correct: 1 },
            { q: "Yenidoğan canlandırmasında (NRP) ilk adım nedir?", options: ["Göğüs basısı", "Pozitif basınçlı ventilasyon (PBV)", "Isıtma, kurulama, pozisyon verme ve stimülasyon"], correct: 2 },
            { q: "NRP'de kalp hızı < 100 ve bebek apneikse ilk ne yapılır?", options: ["Adrenalin verilir", "Pozitif basınçlı ventilasyon (PBV) başlanır", "Göğüs kompresyonu başlanır"], correct: 1 },
            { q: "NRP'de etkili PBV'ye rağmen kalp hızı < 60 ise ne yapılır?", options: ["Sadece O2 verilir", "Göğüs kompresyonu başlanır (ve PBV devam eder)", "Sadece ısıtılır"], correct: 1 },
            { q: "Doğumda her bebeğe neden K vitamini yapılır?", options: ["Sarılığı daha hızlı atlatması için", "Yenidoğanın hemorajik (kanamalı) hastalığını önlemek için", "Bağışıklık sistemini güçlendirmek için"], correct: 1 },
            { q: "Doğumda göze uygulanan antibiyotikli merhemin amacı nedir?", options: ["Bebeğin göz renginin netleşmesi için", "Görme yeteneğini keskinleştirmek için", "Doğum kanalından bulaşabilecek enfeksiyonlara bağlı göz iltihabını önlemek"], correct: 2 },
            { q: "Bebeğin ilk kakasına ne ad verilir ve rengi nedir?", options: ["Kolostrum. Beyaz ve köpüklüdür.", "Sürfaktan. Sarı ve suludur.", "Mekonyum. Koyu yeşil-siyah ve yapışkandır."], correct: 2 },
            { q: "Yenidoğanda fizyolojik sarılık genellikle kaçıncı gün başlar?", options: ["Doğar doğmaz ilk 1 saat içinde", "Doğumdan 24 saat sonra (Genellikle 2. veya 3. gün)", "Genellikle 10. günden sonra"], correct: 1 },
            { q: "İlk 24 saat içinde başlayan sarılığa ne denir?", options: ["Anne sütü sarılığı", "Fizyolojik sarılık", "Patolojik sarılık"], correct: 2 },
            { q: "Yenidoğan sarılığının temel tedavisi nedir?", options: ["Fototerapi (ışık tedavisi)", "Antibiyotik tedavisi", "Şekerli su verilmesi"], correct: 0 },
            { q: "Yetersiz anne sütü alımına bağlı ilk hafta gelişen sarılığa ne denir?", options: ["Anne sütü sarılığı", "Emzirme sarılığı (Yetersiz beslenme sarılığı)", "Biliyer atrezi"], correct: 1 },
            { q: "Anne sütündeki bir madde nedeniyle uzayan (2-3. haftada başlayan) sarılığa ne denir?", options: ["Anne sütü sarılığı", "Emzirme sarılığı", "Patolojik sarılık"], correct: 0 },
            { q: "Diyabetik annelerin bebeklerinde en sık görülen metabolik sorun nedir?", options: ["Hiperglisemi (yüksek kan şekeri)", "Hipoglisemi (düşük kan şekeri)", "Hiperkalsemi (yüksek kalsiyum)"], correct: 1 },
            { q: "Yenidoğanda hipoglisemi sınırı genellikle kaç mg/dL kabul edilir?", options: ["< 40-45 mg/dL", "< 70 mg/dL", "< 100 mg/dL"], correct: 0 },
            { q: "Yenidoğanlar ilk birkaç günde doğum ağırlıklarının yaklaşık yüzde kaçını kaybedebilir?", options: ["%25'ine kadar", "%10'una kadar", "%1'ine kadar"], correct: 1 },
            { q: "Bebeğin kaybettiği doğum kilosunu ne zaman geri alması beklenir?", options: ["İlk 48 saat içinde", "Yaklaşık 1 aylıkken", "Genellikle 10-14. günde"], correct: 2 },
            { q: "Yenidoğanda ani ses veya düşme hissine karşı kollarını iki yana açıp geri topladığı refleks nedir?", options: ["Moro refleksi", "Emme refleksi", "Babinski refleksi"], correct: 0 },
            { q: "Bebeğin yanağına dokunulduğunda başını o yöne çevirip ağzını açması hangi reflekstir?", options: ["Yakalama (Grasping) refleksi", "Arama (Rooting) refleksi", "Tonik boyun refleksi"], correct: 1 },
            { q: "Ayak tabanı topuktan parmağa doğru çizildiğinde baş parmağın yukarı kalkması hangi reflekstir?", options: ["Babinski refleksi", "Palmar yakalama", "Adımlama refleksi"], correct: 0 },
            { q: "Bebeğin sırtüstü yatarken başını bir yöne çevirdiğinde o taraftaki kol ve bacağın düzleşmesi?", options: ["Asimetrik tonik boyun refleksi", "Simetrik tonik boyun refleksi", "Moro refleksi"], correct: 0 },
            { q: "Doğumda sütür hatlarını geçen, kafa derisindeki ödeme ne denir?", options: ["Sefal hematom", "Kaput suksedaneum", "Subgaleal kanama"], correct: 1 },
            { q: "Doğumda sütür hatlarını geçmeyen, kemik zarı altı kanamaya ne denir?", options: ["Kaput suksedaneum", "Sefal hematom", "Epidural hematom"], correct: 1 },
            { q: "Yenidoğanda burun ve yanaklarda görülen küçük, beyaz, keratin dolu kistlere ne denir?", options: ["Akne neonatorum", "Milia", "Seboreik dermatit"], correct: 1 },
            { q: "Yenidoğanda sık görülen, pire ısırığı gibi ortası beyaz/sarı, etrafı kırmızı döküntü?", options: ["Eritema toksikum neonatorum", "Milia", "Püstüler melanozis"], correct: 0 },
            { q: "Genellikle sakral bölgede (kuyruk sokumu) görülen mavi-gri renkli leke?", options: ["Mongol lekesi", "Hemanjiom", "Nevüs"], correct: 0 },
            { q: "Avuç içinde tek çizgi (Simian line) hangi sendromun tipik bulgularındandır?", options: ["Turner Sendromu", "Down Sendromu (Trizomi 21)", "Marfan Sendromu"], correct: 1 },
            { q: "Topuk kanı (Guthrie testi) ideal olarak ne zaman alınır?", options: ["Doğumdan hemen sonra", "Genellikle 3-5. günler arasında (en az 48 saat beslendikten sonra)", "Bebek 1 aylık olduğunda"], correct: 1 },
            { q: "Topuk kanında taranan en bilinen iki metabolik/hormonal hastalık nedir?", options: ["Diyabet ve Astım", "Fenilketonüri (PKU) ve Konjenital Hipotiroidi", "Suçiçeği ve Kabakulak"], correct: 1 },
            { q: "Kritik konjenital kalp hastalığı (KKH) taraması nasıl yapılır?", options: ["EKG çekilerek", "Akciğer filmi ile", "Sağ el ve ayaktan pulse oksimetre ile saturasyon ölçümü"], correct: 2 },
            { q: "Gelişimsel kalça displazisi (GKD) taramasında kullanılan fizik muayene manevraları nelerdir?", options: ["Moro ve Arama", "Ortolani ve Barlow", "Babinski ve Yakalama"], correct: 1 },
            { q: "Doğumda (hastanede) yapılan aşı hangisidir?", options: ["KKK (Kızamık, Kızamıkçık, Kabakulak)", "Hepatit B (1. Doz)", "Verem (BCG)"], correct: 1 },
            { q: "Bebeğe 1. ayın sonunda yapılması gereken aşı hangisidir?", options: ["Hepatit B (2. Doz)", "KKK (1. Doz)", "DaBT (Difteri-Boğmaca-Tetanoz)"], correct: 0 },
            { q: "Türkiye'de BCG (Verem) aşısı genellikle ne zaman yapılır?", options: ["1 yaşında", "Sadece riskli bebeklere", "2. ayın sonunda"], correct: 2 },
            { q: "Bir bebeğin başını desteksiz dik tutabilmesi (baş kontrolü) genellikle kaçıncı ayda tamamlanır?", options: ["1. ay", "3-4. ay", "6. ay"], correct: 1 },
            { q: "Doğumdan sonraki ilk birkaç gün gelen, antikor açısından zengin, sarımsı süte ne denir?", options: ["Geçiş sütü", "Olgun süt", "Kolostrum"], correct: 2 },
            { q: "Göbek kordonu genellikle ne zaman düşer?", options: ["2-3 gün içinde", "1-3 hafta içinde", "2 ay sonra"], correct: 1 },
            { q: "Prematüre bebeklerde solunum sıkıntısına (RDS) yol açan, akciğerde eksik olan madde nedir?", options: ["Bilirubin", "Hemoglobin", "Sürfaktan"], correct: 2 },
            { q: "Yenidoğanın geçici takipnesi (TTN) nedir?", options: ["Akciğer enfeksiyonuna bağlı ateşli hastalık", "Akciğerlerde kalan fetal sıvının yavaş emilmesine bağlı hızlı solunum", "Kalp kapakçığında oluşan geçici bir üfürüm"], correct: 1 },
            { q: "Kaçıncı gebelik haftasından önce doğan bebeklere prematüre denir?", options: ["37. haftadan önce", "40. haftadan önce", "32. haftadan önce"], correct: 0 },
            { q: "42. gebelik haftasından sonra doğan bebeğe ne denir?", options: ["Post-term (Sürmatür)", "Miadında (Term)", "İntrauterin"], correct: 0 },
            { q: "Erken başlangıçlı yenidoğan sepsisinde (ilk 72 saat) en sık etken olan iki bakteri nedir?", options: ["S. pneumoniae, H. influenzae", "Stafilokok, Listeria", "Grup B Streptokok (GBS) ve E. coli"], correct: 2 },
            { q: "Gri bebek sendromu hangi antibiyotiğin yenidoğanda yüksek doz kullanımına bağlıdır?", options: ["Ampisilin", "Gentamisin", "Kloramfenikol"], correct: 2 },
            { q: "Fototerapi alan bebekte görülebilen, bronz renkli cilt yan etkisi nedir?", options: ["Bronz bebek sendromu", "Mavi bebek sendromu", "Gri bebek sendromu"], correct: 0 },
            { q: "Anne Rh(-), bebek Rh(+) ise kan uyuşmazlığını önlemek için kime, ne yapılır?", options: ["Bebeğe Anti-D immünglobulin", "Anneye Anti-D immünglobulin (RhoGAM)", "Anneye K vitamini"], correct: 1 },
            { q: "Göbek kordonunun geç düşmesi (örn. >3 hafta) hangi nadir hastalığı düşündürebilir?", options: ["Lökosit adezyon defekti (LAD)", "Fenilketonüri", "Kistik fibrozis"], correct: 0 },
            { q: "Ter testinin tanı koydurduğu, akciğer ve pankreası etkileyen genetik hastalık?", options: ["Kistik fibrozis", "Çölyak hastalığı", "Hipotiroidi"], correct: 0 },
            { q: "6 ay - 2 yaş arası çocuklarda kaba, havlar tarzda öksürük ve inspiratuar stridor ile seyreden viral enfeksiyon nedir?", options: ["Bronşiolit", "Krup (Laringotrakeobronşit)", "Pnömoni (Zatürre)"], correct: 1 },
            { q: "Özellikle 2 yaş altı çocuklarda hışıltı ve solunum sıkıntısı yapan, en sık etkeni RSV olan akciğer enfeksiyonu?", options: ["Bronşiolit", "Astım", "Epiglottit"], correct: 0 },
            { q: "Çocuklarda orta kulak iltihabının (Akut Otitis Media) en sık bakteriyel etkeni nedir?", options: ["Streptococcus pyogenes", "Streptococcus pneumoniae (Pneumokok)", "Staphylococcus aureus"], correct: 1 },
            { q: "Yüksek ateşin ardından ateş düşünce vücutta başlayan makülopapüler döküntü (6. hastalık)?", options: ["Kızamıkçık", "Roseola infantum (HHV-6)", "El-Ayak-Ağız hastalığı"], correct: 1 },
            { q: "Yanaklarda tokat atılmış görünüm yaratan döküntünün (5. hastalık) etkeni nedir?", options: ["Parvovirus B19", "Rubella virusu", "Coxsackievirus"], correct: 0 },
            { q: "Yenidoğanda ağızda salya akıntısı ve beslenirken morarma varsa ilk akla ne gelmelidir?", options: ["Trizomi 21", "Özofagus atrezisi (Yemek borusunun tıkalı olması)", "Yarık damak"], correct: 1 },
            { q: "Göbek kordonunda normalde kaç arter ve kaç ven bulunur?", options: ["1 arter, 1 ven", "2 arter, 1 ven", "2 arter, 2 ven"], correct: 1 },
            { q: "Yenidoğanda dehidratasyonun en güvenilir klinik bulgusu nedir?", options: ["Bıngıldağın çökük olması", "Kilo kaybı (Tartı kaybı)", "Ağlarken gözyaşı olmaması"], correct: 1 },
            { q: "Solunum sıkıntısı olan, özellikle alt ekstremitelerde nabızların zayıf alındığı bir yenidoğanda ne düşünülmelidir?", options: ["Aort koarktasyonu", "Patent duktus arteriozus (PDA)", "Ventriküler septal defekt (VSD)"], correct: 0 },
            { q: "3 aylık bir bebekte demir eksikliği anemisi beklenir mi?", options: ["Evet, en sık görülen anemidir", "Hayır, bebeğin depo demiri genellikle 4-6. aya kadar yeter", "Sadece anne vejetaryense beklenir"], correct: 1 }
        ];
        
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        container.innerHTML = `
            <div class="rescue-header">🧠 Tıbbi Bilgi Testi!</div>
            <div class="rescue-instructions">${randomQuestion.q}</div>
            <div id="quiz-options" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                ${randomQuestion.options.map((opt, idx) => 
                    `<button class="quiz-option" data-answer="${idx}" 
                      style="padding: 15px; border: 3px solid #2196F3; background: white; 
                      border-radius: 12px; cursor: pointer; font-size: 15px; font-weight: 500;">
                        ${opt}
                    </button>`
                    ).join('')}
            </div>
        `;
        
        const options = container.querySelectorAll('.quiz-option');
        let answered = false;
        
        options.forEach((option, idx) => {
            option.addEventListener('click', (e) => {
                if (answered) return; // Prevent multiple answers
                answered = true;
                
                const selectedAnswer = parseInt(e.target.dataset.answer);
                const isCorrect = selectedAnswer === randomQuestion.correct;
                
                // Disable all options
                options.forEach(opt => {
                    opt.style.pointerEvents = 'none';
                    opt.style.opacity = '0.6';
                });
                
                // Show correct answer in green
                options[randomQuestion.correct].style.background = '#4CAF50';
                options[randomQuestion.correct].style.color = 'white';
                options[randomQuestion.correct].style.border = '3px solid #2E7D32';
                options[randomQuestion.correct].style.fontWeight = 'bold';
                options[randomQuestion.correct].style.opacity = '1';
                
                // Add checkmark to correct answer
                options[randomQuestion.correct].innerHTML = '✅ ' + options[randomQuestion.correct].textContent;
                
                // If selected answer is wrong, show it in red
                if (!isCorrect) {
                    e.target.style.background = '#f44336';
                    e.target.style.color = 'white';
                    e.target.style.border = '3px solid #C62828';
                    e.target.style.opacity = '1';
                    e.target.innerHTML = '❌ ' + e.target.textContent;
                }
                
                // Ses efekti
                this.soundManager.play(isCorrect ? 'quizCorrect' : 'quizWrong');
                
                // Show feedback message
                const feedbackMsg = document.createElement('div');
                feedbackMsg.textContent = isCorrect ? 
                    '🎉 Doğru! Tebrikler!' : 
                    '❌ Yanlış! Doğru cevap yeşil ile işaretlendi.';
                feedbackMsg.style.cssText = `
                    position: fixed;
                    top: 20%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: ${isCorrect ? '#4CAF50' : '#f44336'};
                    color: white;
                    padding: 15px 25px;
                    border-radius: 10px;
                    font-size: 18px;
                    font-weight: bold;
                    z-index: 5000;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                `;
                container.appendChild(feedbackMsg);
                
                // Clear timer
                if (this.rescueTimer) {
                    clearInterval(this.rescueTimer);
                }
                
                // Wait 3 seconds to let player see the correct answer, then end game
                setTimeout(() => {
                    if (feedbackMsg.parentNode) {
                        feedbackMsg.parentNode.removeChild(feedbackMsg);
                    }
                this.endBabyRescueGame(isCorrect);
                }, 3000);
            });
        });
        
        // Timer
        let timeLeft = 30;
        this.rescueTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0 && !answered) {
                clearInterval(this.rescueTimer);
                this.endBabyRescueGame(false);
            }
        }, 1000);
    }

    endBabyRescueGame(success) {
        // Clear timers
        if (this.rescueTimer) {
            clearInterval(this.rescueTimer);
            this.rescueTimer = null;
        }
        
        // Stop mini game sounds
        this.soundManager.stop('heartBeat');
        
        // Arka plan müziğini devam ettir
        this.soundManager.resume('backgroundMusic');
        
        if (success) {
            this.soundManager.play('babyHeal');
            this.setBabyState(this.currentCriticalBaby, 'saved');
            this.savedCount++;
            this.score += 100;
            
            // Kritik listeden çıkar
            const index = this.criticalBabies.indexOf(this.currentCriticalBaby);
            if (index > -1) {
                this.criticalBabies.splice(index, 1);
            }
            
            const savedBabyId = this.currentCriticalBaby;
            setTimeout(() => {
                this.setBabyState(savedBabyId, 'normal');
            }, 3000);
            
            this.showFeedback('Bebek kurtarıldı! +100 puan', 'success');
            
            this.currentCriticalBaby = null;
        } else {
            // Başarısız mini oyun - bebek kaybedildi
            const lostBabyId = this.currentCriticalBaby;
            this.currentCriticalBaby = null;
            
            // Kritik listeden çıkar
            const index = this.criticalBabies.indexOf(lostBabyId);
            if (index > -1) {
                this.criticalBabies.splice(index, 1);
            }
            
            // loseBaby'yi çağır (Görkem gelecek)
            this.lostCount++;
            if (lostBabyId !== null) {
                const baby = this.babies[lostBabyId];
                if (baby && baby.criticalTimer) {
                    clearInterval(baby.criticalTimer);
                }
                this.setBabyState(lostBabyId, 'normal');
            }
            
            this.showFeedback(`Bebek kaybedildi! (${this.lostCount}/100)`, 'error');
            
            if (this.lostCount >= 100) {
                // Hide rescue game first
                document.getElementById('game-overlay').style.display = 'none';
                document.getElementById('baby-rescue-game').style.display = 'none';
                this.endGame(false);
                return;
            }
            
            this.score = Math.max(0, this.score - 50);
            
            // Görkem her bebek kaybında geliyor!
            const shouldCallGorkem = !this.gorkemAppeared;
            
            // Hide rescue game
            document.getElementById('game-overlay').style.display = 'none';
            document.getElementById('baby-rescue-game').style.display = 'none';
            
            this.gameState = 'MONITORING';
            this.updateUI();
            
            if (shouldCallGorkem) {
                setTimeout(() => {
                    if (!this.gorkemAppeared && this.gameState === 'MONITORING') {
                        this.appearGorkem();
                    }
                }, 2000);
            }
            return;
        }
        
        this.currentCriticalBaby = null;
        
        // Hide rescue game
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('baby-rescue-game').style.display = 'none';
        
        this.gameState = 'MONITORING';
        this.updateUI();
    }

    loseBaby(babyId) {
        this.lostCount++;
        
        const lostBabyId = babyId !== undefined ? babyId : this.currentCriticalBaby;
        
        if (lostBabyId !== null) {
            const baby = this.babies[lostBabyId];
            if (baby && baby.criticalTimer) {
                clearInterval(baby.criticalTimer);
            }
            this.setBabyState(lostBabyId, 'normal');
            
            // Kritik listeden çıkar
            const index = this.criticalBabies.indexOf(lostBabyId);
            if (index > -1) {
                this.criticalBabies.splice(index, 1);
            }
        }
        
        this.showFeedback(`Bebek kaybedildi! (${this.lostCount}/100)`, 'error');
        
        if (this.lostCount >= 100) {
            this.endGame(false);
            return;
        }
        
        this.score = Math.max(0, this.score - 50);
        this.updateUI();
        
        // Görkem her bebek kaybında geliyor!
        if (!this.gorkemAppeared && this.gameState === 'MONITORING') {
        setTimeout(() => {
                if (!this.gorkemAppeared && this.gameState === 'MONITORING') {
                    this.appearGorkem();
                }
            }, 2000); // 2 saniye sonra Görkem gelir
        }
    }
    
    appearGorkem() {
        this.gorkemAppeared = true;
        
        this.showFeedback('⚠️ Görkem geldi! Hazır ol!', 'error');
        
        setTimeout(() => {
            this.startBossFight();
        }, 1000);
    }

    startBossFight() {
        this.gameState = 'BOSS_FIGHT';
        this.bossHealth = 100;
        
        // Arka plan müziğini duraklat ve boss müziği başlat
        this.soundManager.pause('backgroundMusic');
        this.soundManager.stop('babyCry'); // Bebek ağlama sesini kes
        this.soundManager.play('bossMusic');
        
            document.getElementById('game-overlay').style.display = 'flex';
            document.getElementById('boss-fight-game').style.display = 'block';
            document.getElementById('baby-rescue-game').style.display = 'none';
            
        // Rastgele komik Görkem mesajı
        this.setRandomGorkemMessage();

        this.updateBossHealth();
    }
    
    setRandomGorkemMessage() {
        const messages = [
            '"Benimle kahve içer misin? ☕"',
            '"Kıbrıstan sigara geldi beraber içelim mi? 🚬"',
            '"Bütün gece beraberiz 😏"',
            '"İnstanı alabilir miyim? 📱"',
            '"Kahve içiyorum, rahatsız etme ☕"',
            '"Seni izliyorum... 👀"',
            '"Homurdanıyor... 😤"',
            '"Nöbetim bitti aslında... 🥱"',
            '"Bir kahve molası verdim 😎"',
            '"Patron haklarımı kullanıyorum 💼"',
            '"Şimdi kahve zamanı ☕✨"',
            '"Mesai dışı saatlerim bunlar 🕐"',
            '"Stres atıyorum biraz 😌"',
            '"Özlemi izlemek yorucu iş 😓"',
            '"Mola hakkım var benim 🤷"',
            '"Sadece 5 dakika... ⏰"',
            '"Numaramı ister misin? 📞"',
            '"Beraber çay içelim mi? 🍵"',
            '"Instagram\'dan takip eder misin? 📸"',
            '"Patronluk böyle bir şey işte 😏"'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const gorkemStatus = document.querySelector('.gorkem-status');
        if (gorkemStatus) {
            gorkemStatus.textContent = randomMessage;
            gorkemStatus.style.fontSize = '16px';
            gorkemStatus.style.fontStyle = 'italic';
            gorkemStatus.style.maxWidth = '400px';
            gorkemStatus.style.lineHeight = '1.4';
            gorkemStatus.style.padding = '10px 15px';
            gorkemStatus.style.background = 'rgba(255, 255, 255, 0.95)';
            gorkemStatus.style.borderRadius = '12px';
            gorkemStatus.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        }
    }

    handleToolClick(toolButton) {
        const damage = parseInt(toolButton.dataset.damage) || 10;
        this.bossHealth -= damage;
        
        if (this.bossHealth < 0) this.bossHealth = 0;
        
        // Tool hit sesi
        this.soundManager.play('toolHit');
        
        // Visual feedback
        toolButton.classList.add('tool-btn-active');
        setTimeout(() => {
            toolButton.classList.remove('tool-btn-active');
        }, 200);
        
        // Show damage message
        const toolType = toolButton.dataset.tool;
        const messages = {
            'syringe': '💉 Şırınga ile saldırı! -15 HP',
            'stethoscope': '🩺 Stetoskop fırlatıldı! -10 HP',
            'thermometer': '🌡️ Termometre vurdu! -8 HP',
            'scalpel': '🔪 Bistüri keskin! -20 HP',
            'bandage': '🩹 Bandaj çıkarıldı! -5 HP',
            'pill': '💊 İlaç etkili! -12 HP'
        };
        
        this.showFeedback(messages[toolType] || 'Saldırı!', 'success');
        
        this.updateBossHealth();
        
        if (this.bossHealth <= 0) {
            this.endBossFight();
        }
    }

    updateBossHealth() {
        const healthFill = document.getElementById('boss-health-fill');
        const healthText = document.getElementById('boss-health-text');
        const bossCharacter = document.querySelector('.boss-character');
        
        if (healthFill) {
        healthFill.style.width = this.bossHealth + '%';
        }
        
        if (healthText) {
        healthText.textContent = this.bossHealth;
        }
        
        if (bossCharacter) {
            if (this.bossHealth <= 30) {
                bossCharacter.classList.add('hurt');
            } else {
                bossCharacter.classList.remove('hurt');
            }
        }
        
        // Change color
        if (healthFill) {
        if (this.bossHealth > 60) {
            healthFill.style.background = 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)';
        } else if (this.bossHealth > 30) {
            healthFill.style.background = 'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)';
        } else {
            healthFill.style.background = 'linear-gradient(90deg, #f44336 0%, #e91e63 100%)';
            }
        }
    }

    endBossFight() {
        this.score += 500;
        this.gorkemAppeared = false;
        
        // Boss müziğini durdur ve arka plan müziğini devam ettir
        this.soundManager.stop('bossMusic');
        this.soundManager.resume('backgroundMusic');
        
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('boss-fight-game').style.display = 'none';
        
        this.gameState = 'MONITORING';
        this.showFeedback('Görkem yenildi! +500 puan', 'success');
        this.updateUI();
    }

    endGame(victory) {
        this.gameState = 'GAME_OVER';
        
        // Clear all timers
        if (this.gameTimer) clearInterval(this.gameTimer);
        if (this.rescueTimer) clearInterval(this.rescueTimer);
        if (this.criticalCheckInterval) clearInterval(this.criticalCheckInterval);
        if (this.gorkemCheckInterval) clearInterval(this.gorkemCheckInterval);
        if (this.autoFailTimeout) clearTimeout(this.autoFailTimeout);
        
        // Show game over screen
        document.getElementById('game-over-screen').style.display = 'flex';
        
        document.getElementById('final-time').textContent = this.formatTime(this.gameTime);
        document.getElementById('final-saved').textContent = this.savedCount;
        document.getElementById('final-lost').textContent = this.lostCount;
        document.getElementById('final-score').textContent = this.score;
        
        if (victory) {
            this.showFeedback('Tebrikler! Süreyi tamamladınız!', 'success');
        } else {
            this.showFeedback(`Oyun bitti! ${this.lostCount} bebek kaybedildi.`, 'error');
        }
    }

    restartGame() {
        // Reset all game state
        this.gameState = 'START';
        this.score = 0;
        this.savedCount = 0;
        this.lostCount = 0;
        this.gameTime = 0;
        this.bossHealth = 100;
        this.gorkemAppeared = false;
        this.currentCriticalBaby = null;
        this.currentMiniGameType = null;
        this.lastMiniGameType = null;
        this.sameGameCount = 0;
        this.lastCriticalTime = 0;
        this.criticalBabies = [];
        
        // Stop all sounds
        this.soundManager.stopAll();
        this.soundManager.play('buttonClick');
        
        // Clear all timers
        if (this.gameTimer) clearInterval(this.gameTimer);
        if (this.rescueTimer) clearInterval(this.rescueTimer);
        if (this.criticalCheckInterval) clearInterval(this.criticalCheckInterval);
        if (this.gorkemCheckInterval) clearInterval(this.gorkemCheckInterval);
        if (this.autoFailTimeout) clearTimeout(this.autoFailTimeout);
        
        // Hide overlays
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        
        // Reset babies
        this.createBabies();
        this.updateUI();
    }

    updateUI() {
        this.updateTimer();
        
        document.getElementById('saved-count').textContent = this.savedCount;
        document.getElementById('score').textContent = this.score;
        document.getElementById('lost-count').textContent = this.lostCount;
        
        const doctor = document.getElementById('doctor');
        const doctorStatus = doctor.querySelector('.doctor-status');
        
        if (this.gameState === 'MONITORING') {
            doctorStatus.textContent = 'İzliyor...';
            doctor.classList.remove('alert');
        } else if (this.gameState === 'BABY_MINIGAME') {
            doctorStatus.textContent = 'Bebek kurtarıyor!';
            doctor.classList.add('alert');
        } else if (this.gameState === 'BOSS_FIGHT') {
            doctorStatus.textContent = 'Görkem ile savaşıyor!';
            doctor.classList.add('alert');
        }
    }

    updateTimer() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 5000;
            animation: feedbackFade 2s ease-out forwards;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    try {
        const game = new HospitalGuardGame();
        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});
