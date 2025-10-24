// Hospital Guard Game - Main Game Logic
class HospitalGuardGame {
    constructor() {
        this.gameState = 'START'; // START, MONITORING, BABY_MINIGAME, BOSS_FIGHT, GAME_OVER
        this.babies = [];
        this.score = 0;
        this.savedCount = 0;
        this.lostCount = 0; // Kaybedilen bebek sayısı
        this.gameTime = 0;
        this.gameTimer = null;
        this.bossHealth = 100;
        this.gorkemAppeared = false;
        this.currentCriticalBaby = null;
        
        // Game settings
        this.maxBabies = 4;
        this.criticalChance = 0.3; // 30% chance per second
        this.gorkemChance = 0.1; // 10% chance per 5 seconds
        this.gameDuration = 120; // 2 minutes in seconds
        this.randomEventIntervals = []; // Track intervals for cleanup
        
        // Mobile detection and optimization
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            // Easier settings for mobile
            this.criticalChance = 0.25; // Slightly easier
            this.gameDuration = 90; // Shorter game for mobile
        }
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createBabies();
        this.updateUI();
        this.preventDoubleClickZoom();
    }

    preventDoubleClickZoom() {
        // Prevent double-click zoom on all elements
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // Prevent pinch-to-zoom on touch devices
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent double-tap zoom on mobile
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
            startBtn.addEventListener('click', () => {
                this.startGame();
            });
        }

        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        // Baby click/touch events (delegated)
        const babiesContainer = document.getElementById('babies-container');
        if (babiesContainer) {
            // Mouse events
            babiesContainer.addEventListener('click', (e) => {
                if (e.target.closest('.baby')) {
                    this.handleBabyClick(e.target.closest('.baby'));
                }
            });
            
            // Touch events for mobile
            babiesContainer.addEventListener('touchend', (e) => {
                if (e.target.closest('.baby')) {
                    this.handleBabyClick(e.target.closest('.baby'));
                }
            });
        }

        // Tool button events (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tool-btn')) {
                this.handleToolClick(e.target);
            }
        });
        
        // Touch events for tool buttons
        document.addEventListener('touchend', (e) => {
            if (e.target.classList.contains('tool-btn')) {
                this.handleToolClick(e.target);
            }
        });

        // Rescue game click/touch - use target zone, not timer
        const rescueTarget = document.getElementById('rescue-target');
        if (rescueTarget) {
            rescueTarget.addEventListener('click', () => {
                this.handleRescueClick();
            });
            
            rescueTarget.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleRescueClick();
            }, { passive: false });
        }
    }

    createBabies() {
        const container = document.getElementById('babies-container');
        container.innerHTML = '';
        this.babies = [];

        console.log(`Creating ${this.maxBabies} babies...`);

        for (let i = 0; i < this.maxBabies; i++) {
            const baby = {
                id: i,
                state: 'normal', // normal, critical, saved
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
            
            console.log(`Created baby ${i}`);
        }
        
        console.log(`Total babies created: ${this.babies.length}`);
        console.log(`Container children: ${container.children.length}`);
        
        // Force image loading
        this.preloadImages();
    }

    preloadImages() {
        const images = [
            'images/baby-normal.png',
            'images/baby-hurt.png'
        ];
        
        images.forEach(src => {
            const img = new Image();
            img.onload = () => console.log(`✅ Image loaded: ${src}`);
            img.onerror = () => console.log(`❌ Image failed to load: ${src}`);
            img.src = src;
        });
    }

    startGame() {
        this.gameState = 'MONITORING';
        document.getElementById('start-screen').style.display = 'none';
        this.startGameTimer();
        this.startRandomEvents();
        this.updateUI();
    }

    startGameTimer() {
        this.gameTime = 0;
        this.gameTimer = setInterval(() => {
            this.gameTime++;
            this.updateTimer();
            
            // Check game over condition
            if (this.gameTime >= this.gameDuration) {
                this.endGame(true); // Victory
            }
        }, 1000);
    }

    startRandomEvents() {
        // Clear any existing intervals
        this.clearRandomEvents();
        
        // Critical baby events
        const criticalInterval = setInterval(() => {
            if (this.gameState === 'MONITORING' && !this.currentCriticalBaby) {
                if (Math.random() < this.criticalChance) {
                    this.makeRandomBabyCritical();
                }
            }
        }, 1000);
        this.randomEventIntervals.push(criticalInterval);

        // Görkem appearance
        const gorkemInterval = setInterval(() => {
            if (this.gameState === 'MONITORING' && !this.gorkemAppeared) {
                if (Math.random() < this.gorkemChance) {
                    this.appearGorkem();
                }
            }
        }, 5000);
        this.randomEventIntervals.push(gorkemInterval);
    }

    clearRandomEvents() {
        // Clear all random event intervals
        this.randomEventIntervals.forEach(interval => clearInterval(interval));
        this.randomEventIntervals = [];
    }

    makeRandomBabyCritical() {
        const normalBabies = this.babies.filter(baby => baby.state === 'normal');
        if (normalBabies.length === 0) return;

        const randomBaby = normalBabies[Math.floor(Math.random() * normalBabies.length)];
        this.setBabyState(randomBaby.id, 'critical');
        this.currentCriticalBaby = randomBaby.id;
        
        // Auto-fail after 8 seconds if not clicked (increased from 5 for better gameplay)
        setTimeout(() => {
            if (this.currentCriticalBaby === randomBaby.id && this.gameState === 'MONITORING') {
                this.loseBaby(); // Bebek kaybedildi
            }
        }, 8000);
    }

    setBabyState(babyId, state) {
        const baby = this.babies[babyId];
        if (!baby) return;

        baby.state = state;
        const element = baby.element;
        
        // Remove all state classes
        element.classList.remove('normal', 'critical', 'saved');
        
        // Add new state class
        element.classList.add(state);
        
        // Update status text
        const statusElement = element.querySelector('.baby-status');
        switch (state) {
            case 'normal':
                statusElement.textContent = 'İyi';
                break;
            case 'critical':
                statusElement.textContent = 'Kritik!';
                break;
            case 'saved':
                statusElement.textContent = 'Kurtarıldı';
                break;
        }
    }

    handleBabyClick(babyElement) {
        const babyId = parseInt(babyElement.id.split('-')[1]);
        const baby = this.babies[babyId];
        
        if (baby.state === 'critical' && this.gameState === 'MONITORING') {
            this.startBabyRescueGame(babyId);
        }
    }

    startBabyRescueGame(babyId) {
        this.gameState = 'BABY_MINIGAME';
        this.currentCriticalBaby = babyId;
        
        // Random mini-game type
        this.currentMiniGameType = this.getRandomMiniGameType();
        
        // Show rescue game overlay
        document.getElementById('game-overlay').style.display = 'flex';
        document.getElementById('baby-rescue-game').style.display = 'block';
        document.getElementById('boss-fight-game').style.display = 'none';
        
        // Start specific mini-game
        this.startSpecificMiniGame();
    }

    getRandomMiniGameType() {
        const types = ['cpr', 'injection', 'quiz'];
        return types[Math.floor(Math.random() * types.length)];
    }

    startSpecificMiniGame() {
        const rescueGame = document.getElementById('baby-rescue-game');
        
        switch(this.currentMiniGameType) {
            case 'cpr':
                this.startCPRGame();
                break;
            case 'injection':
                this.startInjectionGame();
                break;
            case 'quiz':
                this.startQuizGame();
                break;
        }
    }


    // CPR Mini-game
    startCPRGame() {
        const rescueHeader = document.querySelector('.rescue-header h3');
        const rescueInstructions = document.querySelector('.rescue-instructions p');
        
        rescueHeader.textContent = '❤️ Kalp Masajı (CPR)!';
        const target = this.isMobile ? 30 : 50;
        rescueInstructions.textContent = `Kalbe hızlıca ${target} kez tıklayın!`;
        
        this.startCPRTimer();
    }

    // Injection Mini-game
    startInjectionGame() {
        const rescueHeader = document.querySelector('.rescue-header h3');
        const rescueInstructions = document.querySelector('.rescue-instructions p');
        
        rescueHeader.textContent = '💉 İğne Yapma!';
        rescueInstructions.textContent = 'İğneyi yeşil hedef bölgesine sürükleyin!';
        
        this.startInjectionTimer();
    }

    // Quiz Mini-game
    startQuizGame() {
        const rescueHeader = document.querySelector('.rescue-header h3');
        const rescueInstructions = document.querySelector('.rescue-instructions p');
        
        rescueHeader.textContent = '🧠 Tıbbi Bilgi Testi!';
        rescueInstructions.textContent = 'Doğru cevabı seçin!';
        
        this.startQuizTimer();
    }


    startCPRTimer() {
        const targetZone = document.getElementById('rescue-target');
        
        // CPR requires clicks in time (made easier - was too hard at 100 clicks)
        this.cprClicks = 0;
        this.cprTarget = this.isMobile ? 30 : 50; // Easier: 30 for mobile, 50 for desktop
        
        // Show full screen heart image
        targetZone.innerHTML = '<div class="heart-image"></div>';
        
        // Add click event listener to heart
        const heartImage = targetZone.querySelector('.heart-image');
        if (heartImage) {
            heartImage.addEventListener('click', () => this.handleRescueClick());
            heartImage.addEventListener('touchend', () => this.handleRescueClick());
        }
        
        // Timer for 10 seconds
        let timeLeft = 10;
        const progressBar = document.getElementById('rescue-progress');
        
        const interval = setInterval(() => {
            timeLeft--;
            
            // Update progress bar to show time remaining
            const progress = ((10 - timeLeft) / 10) * 100;
            progressBar.style.width = progress + '%';
            progressBar.style.background = 'linear-gradient(90deg, #f44336 0%, #ff9800 50%, #4CAF50 100%)';
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                // Check if enough CPR clicks
                if (this.cprClicks >= this.cprTarget) {
                    this.endBabyRescueGame(true);
                } else {
                    this.endBabyRescueGame(false);
                }
            }
        }, 1000); // 1 second intervals
        
        this.rescueInterval = interval;
    }

    startInjectionTimer() {
        const targetZone = document.getElementById('rescue-target');
        
        // Injection requires successful injections in time
        this.injectionClicks = 0;
        this.injectionTarget = this.isMobile ? 2 : 3; // Easier for mobile: 2 vs 3
        this.injectionSuccess = false;
        
        // Show baby butt and syringe for drag and drop
        targetZone.innerHTML = `
            <div class="injection-game-container" style="width: 100%; min-height: 300px; position: relative; display: flex; align-items: center; justify-content: space-around; padding: 30px; gap: 40px;">
                <div class="baby-butt">
                    <div class="injection-zone"></div>
                </div>
                <div class="syringe-container" style="width: 120px; height: 120px; position: relative; display: flex; align-items: center; justify-content: center;">
                    <div class="syringe-draggable"></div>
                </div>
            </div>
        `;
        
        // Add drag and drop functionality
        this.setupInjectionDragDrop();
        
        // Initialize injection zone position
        this.moveInjectionZone();
        
        // Timer for 10 seconds
        let timeLeft = 10;
        const progressBar = document.getElementById('rescue-progress');
        
        const interval = setInterval(() => {
            timeLeft--;
            
            // Update progress bar to show time remaining
            const progress = ((10 - timeLeft) / 10) * 100;
            progressBar.style.width = progress + '%';
            progressBar.style.background = 'linear-gradient(90deg, #f44336 0%, #ff9800 50%, #4CAF50 100%)';
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                // Check if enough successful injections
                if (this.injectionClicks >= this.injectionTarget) {
                    this.endBabyRescueGame(true);
                } else {
                    this.endBabyRescueGame(false);
                }
            }
        }, 1000); // 1 second intervals
        
        this.rescueInterval = interval;
    }

    moveInjectionZone() {
        const injectionZone = document.querySelector('.injection-zone');
        if (!injectionZone) return;
        
        // Generate random position within baby butt area
        const babyButt = document.querySelector('.baby-butt');
        if (!babyButt) return;
        
        const buttRect = babyButt.getBoundingClientRect();
        const zoneSize = 60; // injection zone size
        
        // Random position within baby butt (with some margin)
        const margin = 30;
        const maxX = buttRect.width - zoneSize - margin;
        const maxY = buttRect.height - zoneSize - margin;
        
        const randomX = Math.random() * maxX + margin;
        const randomY = Math.random() * maxY + margin;
        
        // Set new position
        injectionZone.style.left = randomX + 'px';
        injectionZone.style.top = randomY + 'px';
        injectionZone.style.transform = 'none';
        
        // Reset background color
        injectionZone.style.background = 'rgba(76, 175, 80, 0.3)';
    }

    setupInjectionDragDrop() {
        const syringe = document.querySelector('.syringe-draggable');
        const injectionZone = document.querySelector('.injection-zone');
        const babyButt = document.querySelector('.baby-butt');
        
        let isDragging = false;
        let startX, startY, currentX, currentY;
        
        // Mouse events
        syringe.addEventListener('mousedown', (e) => {
            isDragging = true;
            syringe.style.cursor = 'grabbing';
            startX = e.clientX - syringe.offsetLeft;
            startY = e.clientY - syringe.offsetTop;
            syringe.style.zIndex = '1000';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            currentX = e.clientX - startX;
            currentY = e.clientY - startY;
            
            syringe.style.left = currentX + 'px';
            syringe.style.top = currentY + 'px';
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            syringe.style.cursor = 'grab';
            syringe.style.zIndex = '10';
            
            // Check if dropped in injection zone
            const syringeRect = syringe.getBoundingClientRect();
            const zoneRect = injectionZone.getBoundingClientRect();
            
            if (syringeRect.left < zoneRect.right &&
                syringeRect.right > zoneRect.left &&
                syringeRect.top < zoneRect.bottom &&
                syringeRect.bottom > zoneRect.top) {
                
                // Successful injection
                this.injectionClicks++;
                const instructions = document.querySelector('.rescue-instructions p');
                instructions.textContent = `✅ Harika! ${this.injectionClicks}/${this.injectionTarget} başarılı enjeksiyon`;
                
                // Visual feedback
                injectionZone.style.background = 'rgba(76, 175, 80, 0.8)';
                injectionZone.style.transform = 'translate(-50%, -50%) scale(1.3)';
                setTimeout(() => {
                    injectionZone.style.background = 'rgba(76, 175, 80, 0.4)';
                    injectionZone.style.transform = 'translate(-50%, -50%) scale(1)';
                }, 500);
                
                // Return syringe to start position
                syringe.style.left = '0px';
                syringe.style.top = '0px';
                
                // Move injection zone to new random position
                this.moveInjectionZone();
                
                // Check if target reached
                if (this.injectionClicks >= this.injectionTarget) {
                    clearInterval(this.rescueInterval);
                    this.endBabyRescueGame(true);
                }
            } else {
                // Failed injection - return syringe to start position
                syringe.style.left = '0px';
                syringe.style.top = '0px';
            }
        });
        
        // Touch events for mobile
        syringe.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            syringe.style.cursor = 'grabbing';
            const touch = e.touches[0];
            startX = touch.clientX - syringe.offsetLeft;
            startY = touch.clientY - syringe.offsetTop;
            syringe.style.zIndex = '1000';
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            currentX = touch.clientX - startX;
            currentY = touch.clientY - startY;
            
            syringe.style.left = currentX + 'px';
            syringe.style.top = currentY + 'px';
        });
        
        document.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            syringe.style.cursor = 'grab';
            syringe.style.zIndex = '10';
            
            // Check if dropped in injection zone
            const syringeRect = syringe.getBoundingClientRect();
            const zoneRect = injectionZone.getBoundingClientRect();
            
            if (syringeRect.left < zoneRect.right &&
                syringeRect.right > zoneRect.left &&
                syringeRect.top < zoneRect.bottom &&
                syringeRect.bottom > zoneRect.top) {
                
                // Successful injection
                this.injectionClicks++;
                const instructions = document.querySelector('.rescue-instructions p');
                instructions.textContent = `✅ Harika! ${this.injectionClicks}/${this.injectionTarget} başarılı enjeksiyon`;
                
                // Visual feedback
                injectionZone.style.background = 'rgba(76, 175, 80, 0.8)';
                injectionZone.style.transform = 'translate(-50%, -50%) scale(1.3)';
                setTimeout(() => {
                    injectionZone.style.background = 'rgba(76, 175, 80, 0.4)';
                    injectionZone.style.transform = 'translate(-50%, -50%) scale(1)';
                }, 500);
                
                // Return syringe to start position
                syringe.style.left = '0px';
                syringe.style.top = '0px';
                
                // Move injection zone to new random position
                this.moveInjectionZone();
                
                // Check if target reached
                if (this.injectionClicks >= this.injectionTarget) {
                    clearInterval(this.rescueInterval);
                    this.endBabyRescueGame(true);
                }
            } else {
                // Failed injection - return syringe to start position
                syringe.style.left = '0px';
                syringe.style.top = '0px';
            }
        });
    }

    startQuizTimer() {
        const progressBar = document.getElementById('rescue-progress');
        const targetZone = document.getElementById('rescue-target');
        
        // Reset progress
        progressBar.style.width = '0%';
        
        // Quiz has more time
        let progress = 0;
        const interval = setInterval(() => {
            progress += 0.8;
            progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                // Auto-fail if not answered
                setTimeout(() => {
                    if (this.gameState === 'BABY_MINIGAME') {
                        this.endBabyRescueGame(false);
                    }
                }, 1000);
            }
        }, 60);
        
        this.rescueInterval = interval;
    }

    handleRescueClick() {
        if (this.gameState !== 'BABY_MINIGAME') return;
        
        switch(this.currentMiniGameType) {
            case 'cpr':
                this.handleCPRClick();
                break;
            case 'injection':
                this.handleInjectionClick();
                break;
            case 'quiz':
                this.handleQuizClick();
                break;
        }
    }


    handleCPRClick() {
        this.cprClicks++;
        const instructions = document.querySelector('.rescue-instructions p');
        instructions.textContent = `Kalp Masajı: ${this.cprClicks}/${this.cprTarget} tıklama`;
        
        // Visual feedback for CPR
        const progressBar = document.getElementById('rescue-progress');
        progressBar.style.background = 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 50%, #4CAF50 100%)';
        
        // Heart animation on click
        const heartImage = document.querySelector('.heart-image');
        if (heartImage) {
            heartImage.style.transform = 'scale(1.1)';
            setTimeout(() => {
                heartImage.style.transform = 'scale(1)';
            }, 100);
        }
        
        // Check if enough clicks
        if (this.cprClicks >= this.cprTarget) {
            this.endBabyRescueGame(true);
        }
    }

    handleInjectionClick() {
        // This function is no longer used for injection mini-game
        // Injection now uses drag and drop mechanism
        return;
    }

    handleQuizClick() {
        // For quiz, we'll show a simple popup with questions
        this.showQuizPopup();
    }

    showQuizPopup() {
        const questions = [
            {
                question: "Yenidoğanın normal kalp atış hızı aralığı nedir?",
                options: ["80-100 atım/dakika", "180-200 atım/dakika", "120-160 atım/dakika"],
                correct: 2
            },
            {
                question: "Yenidoğanın normal solunum sayısı aralığı nedir?",
                options: ["12-20 nefes/dakika", "30-60 nefes/dakika", "70-90 nefes/dakika"],
                correct: 1
            },
            {
                question: "APGAR skoru nedir ve ne zaman bakılır?",
                options: [
                    "Bebeğin doğum sonrası durumunu değerlendiren bir skor. 1. ve 5. dakikalarda bakılır.",
                    "Bebeğin anne karnındaki gelişimini ölçer. 1. ve 5. aylarda bakılır.",
                    "Annenin doğum riskini belirler. Doğumdan hemen önce bakılır."
                ],
                correct: 0
            },
            {
                question: "APGAR'daki 'G' harfi neyi ifade eder?",
                options: ["Gestation (Gebelik haftası)", "Grimace (Refleks uyarılabilirlik)", "Glucose (Kan şekeri)"],
                correct: 1
            },
            {
                question: "Bebeğin ilk kakasına ne ad verilir ve rengi nedir?",
                options: [
                    "Kolostrum. Beyaz ve köpüklüdür.",
                    "Sürfaktan. Sarı ve suludur.",
                    "Mekonyum. Koyu yeşil-siyah ve yapışkandır."
                ],
                correct: 2
            },
            {
                question: "Yenidoğanda 'fizyolojik sarılık' genellikle kaçıncı gün başlar?",
                options: [
                    "Doğar doğmaz ilk 1 saat içinde.",
                    "Doğumdan 24 saat sonra (Genellikle 2. veya 3. gün).",
                    "Genellikle 10. günden sonra."
                ],
                correct: 1
            },
            {
                question: "İlk 24 saat içinde başlayan sarılığa ne denir ve neden önemlidir?",
                options: [
                    "Anne sütü sarılığı. Bolca emzirmek yeterlidir.",
                    "Fizyolojik sarılık. Normaldir ve kendiliğinden geçer.",
                    "Patolojik sarılık. Acil değerlendirme gerektirir."
                ],
                correct: 2
            },
            {
                question: "Yenidoğan sarılığının temel (en sık kullanılan) tedavisi nedir?",
                options: ["Fototerapi (ışık tedavisi)", "Antibiyotik tedavisi", "Şekerli su verilmesi"],
                correct: 0
            },
            {
                question: "Doğumda her bebeğe neden K vitamini yapılır?",
                options: [
                    "Sarılığı daha hızlı atlatması için.",
                    "Yenidoğanın hemorajik (kanamalı) hastalığını önlemek için.",
                    "Bağışıklık sistemini güçlendirmek için."
                ],
                correct: 1
            },
            {
                question: "Doğumda göze uygulanan antibiyotikli merhemin amacı nedir?",
                options: [
                    "Bebeğin göz renginin netleşmesi için.",
                    "Görme yeteneğini keskinleştirmek için.",
                    "Doğum kanalından bulaşabilecek enfeksiyonlara bağlı göz iltihabını önlemek."
                ],
                correct: 2
            },
            {
                question: "Yenidoğanda ani ses veya düşme hissine karşı kollarını iki yana açıp geri topladığı refleksin adı nedir?",
                options: ["Moro refleksi", "Emme refleksi", "Babinski refleksi"],
                correct: 0
            },
            {
                question: "Bebeğin yanağına dokunulduğunda başını o yöne çevirip ağzını açması hangi reflekstir?",
                options: ["Yakalama (Grasping) refleksi", "Arama (Rooting) refleksi", "Tonik boyun refleksi"],
                correct: 1
            },
            {
                question: "Yenidoğanlar ilk birkaç günde doğum ağırlıklarının yaklaşık yüzde kaçını kaybedebilir (ve bu normal kabul edilir)?",
                options: ["%25'ine kadar", "%10'una kadar", "%1'ine kadar"],
                correct: 1
            },
            {
                question: "Bebeğin kaybettiği doğum kilosunu ne zaman geri alması beklenir?",
                options: ["İlk 48 saat içinde", "Yaklaşık 1 aylıkken", "Genellikle 10-14. günde"],
                correct: 2
            },
            {
                question: "'Topuk kanı' (Guthrie testi) ideal olarak ne zaman alınır?",
                options: [
                    "Doğumdan hemen sonra, kordon kesilmeden önce.",
                    "Genellikle 3-5. günler arasında (en az 48 saat beslendikten sonra).",
                    "Bebek 1 aylık olduğunda."
                ],
                correct: 1
            },
            {
                question: "Topuk kanında taranan en bilinen iki metabolik/hormonal hastalık nedir?",
                options: ["Diyabet ve Astım", "Fenilketonüri (PKU) ve Konjenital Hipotiroidi", "Suçiçeği ve Kabakulak"],
                correct: 1
            },
            {
                question: "Prematüre bebeklerde solunum sıkıntısına (RDS) yol açan, akciğerde eksik olan maddenin adı nedir?",
                options: ["Bilirubin", "Hemoglobin", "Sürfaktan"],
                correct: 2
            },
            {
                question: "Yenidoğanın geçici takipnesi (TTN) nedir?",
                options: [
                    "Akciğer enfeksiyonuna (pnömoni) bağlı ateşli hastalık.",
                    "Akciğerlerde kalan fetal sıvının yavaş emilmesine bağlı hızlı solunum.",
                    "Kalp kapakçığında oluşan geçici bir üfürüm."
                ],
                correct: 1
            },
            {
                question: "Kaçıncı gebelik haftasından önce doğan bebeklere 'prematüre' denir?",
                options: ["37. haftadan önce", "40. haftadan önce", "32. haftadan önce"],
                correct: 0
            },
            {
                question: "Diyabetik (şeker hastası) annelerin bebeklerinde en sık görülen metabolik sorun nedir?",
                options: ["Hiperglisemi (yüksek kan şekeri)", "Hipoglisemi (düşük kan şekeri)", "Hiperkalsemi (yüksek kalsiyum)"],
                correct: 1
            }
        ];

        // Remove any existing quiz popup first
        const existingPopup = document.querySelector('.quiz-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        // Create quiz popup
        const quizPopup = document.createElement('div');
        quizPopup.className = 'quiz-popup';
        quizPopup.innerHTML = `
            <div class="quiz-content">
                <h3>🧠 Tıbbi Bilgi Testi!</h3>
                <div class="quiz-question-text">${randomQuestion.question}</div>
                <div class="quiz-options">
                    ${randomQuestion.options.map((option, index) => 
                        `<button class="quiz-option" data-answer="${index}">${option}</button>`
                    ).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(quizPopup);
        
        // Add event listeners to options
        quizPopup.querySelectorAll('.quiz-option').forEach(button => {
            button.addEventListener('click', (e) => {
                const selectedAnswer = parseInt(e.target.dataset.answer);
                const isCorrect = selectedAnswer === randomQuestion.correct;
                
                // Remove popup
                document.body.removeChild(quizPopup);
                
                // End game based on answer
                this.endBabyRescueGame(isCorrect);
            });
        });
    }

    endBabyRescueGame(success) {
        clearInterval(this.rescueInterval);
        
        if (success) {
            // Save baby
            this.setBabyState(this.currentCriticalBaby, 'saved');
            this.savedCount++;
            this.score += 100;
            
            // After some time, set baby back to normal
            const savedBabyId = this.currentCriticalBaby;
            setTimeout(() => {
                this.setBabyState(savedBabyId, 'normal');
            }, 3000);
            
            this.currentCriticalBaby = null;
            
            // Show success feedback
            this.showFeedback('Bebek kurtarıldı! +100 puan', 'success');
        } else {
            // Baby dies - lose baby
            this.loseBaby();
            
            // Hide rescue game
            document.getElementById('game-overlay').style.display = 'none';
            document.getElementById('baby-rescue-game').style.display = 'none';
            
            this.gameState = 'MONITORING';
            this.updateUI();
            return;
        }
        
        // Hide rescue game
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('baby-rescue-game').style.display = 'none';
        
        this.gameState = 'MONITORING';
        this.updateUI();
    }

    appearGorkem() {
        if (this.gorkemAppeared || this.gameState !== 'MONITORING') return;
        
        this.gorkemAppeared = true;
        
        // Show door animation first
        const door = document.getElementById('door');
        door.classList.add('open');
        
        // Show Görkem entering animation
        this.showFeedback('Görkem kapıdan giriyor!', 'error');
        
        // Wait for door animation, then show Görkem in the room
        setTimeout(() => {
            this.showGorkemInRoom();
        }, 1000);
    }

    showGorkemInRoom() {
        // Show Görkem character in the doctor station
        const doctorStation = document.querySelector('.doctor-station');
        const gorkemElement = document.createElement('div');
        gorkemElement.className = 'gorkem-in-room';
        gorkemElement.innerHTML = `
            <div class="gorkem-sprite"></div>
            <div class="gorkem-status">Kahve içiyor...</div>
        `;
        gorkemElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 6;
        `;
        
        doctorStation.appendChild(gorkemElement);
        
        // Wait a bit, then start boss fight
        setTimeout(() => {
            this.gameState = 'BOSS_FIGHT';
            document.getElementById('game-overlay').style.display = 'flex';
            document.getElementById('boss-fight-game').style.display = 'block';
            document.getElementById('baby-rescue-game').style.display = 'none';
            
            this.startBossFight();
        }, 2000);
    }

    startBossFight() {
        this.bossHealth = 100;
        this.updateBossHealth();
        
        // Reset door animation
        const door = document.getElementById('door');
        door.classList.remove('open');
    }

    handleToolClick(toolButton) {
        if (this.gameState !== 'BOSS_FIGHT') return;
        
        // Add visual feedback
        toolButton.classList.add('selected');
        setTimeout(() => {
            toolButton.classList.remove('selected');
        }, 200);
        
        // Calculate damage based on tool
        const toolDamage = this.getToolDamage(toolButton.dataset.tool);
        this.bossHealth -= toolDamage;
        
        if (this.bossHealth < 0) this.bossHealth = 0;
        
        this.updateBossHealth();
        
        if (this.bossHealth <= 0) {
            this.endBossFight();
        }
    }

    getToolDamage(tool) {
        const damages = {
            'syringe': 15,
            'stethoscope': 10,
            'thermometer': 8,
            'scalpel': 20,
            'bandage': 5,
            'pill': 12
        };
        return damages[tool] || 10;
    }

    updateBossHealth() {
        const healthFill = document.getElementById('boss-health-fill');
        const healthText = document.getElementById('boss-health-text');
        const bossCharacter = document.querySelector('.boss-character');
        
        healthFill.style.width = this.bossHealth + '%';
        healthText.textContent = this.bossHealth;
        
        // Change color based on health
        if (this.bossHealth > 60) {
            healthFill.style.background = 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)';
            bossCharacter.classList.remove('hurt');
        } else if (this.bossHealth > 30) {
            healthFill.style.background = 'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)';
            bossCharacter.classList.remove('hurt');
        } else {
            healthFill.style.background = 'linear-gradient(90deg, #f44336 0%, #e91e63 100%)';
            bossCharacter.classList.add('hurt');
        }
    }

    endBossFight() {
        this.score += 500; // Bonus for defeating Görkem
        this.gorkemAppeared = false;
        
        // Remove Görkem from room
        const gorkemInRoom = document.querySelector('.gorkem-in-room');
        if (gorkemInRoom) {
            gorkemInRoom.remove();
        }
        
        // Reset door
        const door = document.getElementById('door');
        door.classList.remove('open');
        
        // Hide boss fight
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('boss-fight-game').style.display = 'none';
        
        this.gameState = 'MONITORING';
        this.showFeedback('Görkem yenildi! +500 puan', 'success');
        this.updateUI();
    }

    loseBaby() {
        this.lostCount++;
        
        // Reset the baby back to normal state instead of removing
        if (this.currentCriticalBaby !== null) {
            this.setBabyState(this.currentCriticalBaby, 'normal');
        }
        
        this.currentCriticalBaby = null;
        
        // Show feedback
        this.showFeedback(`Bebek kaybedildi! (${this.lostCount}/100)`, 'error');
        
        // Check if game over (100 babies lost)
        if (this.lostCount >= 100) {
            this.endGame(false);
            return;
        }
        
        // Penalty: reduce score
        this.score = Math.max(0, this.score - 50);
        
        this.updateUI();
    }

    endGame(victory) {
        this.gameState = 'GAME_OVER';
        clearInterval(this.gameTimer);
        this.clearRandomEvents(); // Clean up random event intervals
        
        // Show game over screen
        document.getElementById('game-over-screen').style.display = 'flex';
        
        // Update final stats
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
        
        // Clear timers
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        if (this.rescueInterval) {
            clearInterval(this.rescueInterval);
        }
        this.clearRandomEvents(); // Clean up random event intervals
        
        // Remove any lingering popups
        const existingQuizPopup = document.querySelector('.quiz-popup');
        if (existingQuizPopup) {
            existingQuizPopup.remove();
        }
        
        // Remove Görkem from room if exists
        const gorkemInRoom = document.querySelector('.gorkem-in-room');
        if (gorkemInRoom) {
            gorkemInRoom.remove();
        }
        
        // Hide all overlays
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        
        // Reset babies
        this.createBabies();
        this.updateUI();
    }

    updateUI() {
        // Update timer
        this.updateTimer();
        
        // Update stats
        document.getElementById('saved-count').textContent = this.savedCount;
        document.getElementById('score').textContent = this.score;
        document.getElementById('lost-count').textContent = this.lostCount;
        
        // Update doctor status
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
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = `feedback feedback-${type}`;
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
            z-index: 4000;
            animation: feedbackFade 2s ease-out forwards;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes feedbackFade {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(feedback);
        
        // Remove after animation
        setTimeout(() => {
            document.body.removeChild(feedback);
            document.head.removeChild(style);
        }, 2000);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new HospitalGuardGame();
});
