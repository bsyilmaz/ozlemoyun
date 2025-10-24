// Hospital Guard Game - Clean Version
class HospitalGuardGame {
    constructor() {
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
        this.gorkemAppearCount = 0;
        this.currentCriticalBaby = null;
        this.currentMiniGameType = null;
        
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
        this.injectionTarget = 3;
        
        // Game settings
        this.maxBabies = 4;
        this.criticalChance = 0.2;
        this.gorkemChance = 0.3;
        this.gameDuration = 300; // 5 minutes
        this.criticalTimeout = 8000; // 8 seconds to respond
        
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            this.cprTarget = 30;
            this.injectionTarget = 2;
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
            
            if (this.gameTime >= this.gameDuration) {
                this.endGame(true);
            }
        }, 1000);
    }
    
    startRandomEvents() {
        // Check for critical babies every second
        this.criticalCheckInterval = setInterval(() => {
            if (this.gameState === 'MONITORING' && !this.currentCriticalBaby) {
                if (Math.random() < this.criticalChance) {
                    this.makeRandomBabyCritical();
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
        this.currentCriticalBaby = randomBaby.id;
        
        // Auto-fail after timeout
        this.autoFailTimeout = setTimeout(() => {
            if (this.currentCriticalBaby === randomBaby.id && this.gameState === 'MONITORING') {
                this.loseBaby();
            }
        }, this.criticalTimeout);
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
        
        if (baby && baby.state === 'critical') {
            if (this.autoFailTimeout) {
                clearTimeout(this.autoFailTimeout);
                this.autoFailTimeout = null;
            }
            this.startBabyRescueGame(babyId);
        }
    }
    
    startBabyRescueGame(babyId) {
        this.gameState = 'BABY_MINIGAME';
        this.currentCriticalBaby = babyId;
        
        // Random mini-game
        const types = ['cpr', 'injection', 'quiz'];
        this.currentMiniGameType = types[Math.floor(Math.random() * types.length)];
        
        // Show overlay
        document.getElementById('game-overlay').style.display = 'flex';
        document.getElementById('baby-rescue-game').style.display = 'block';
        document.getElementById('boss-fight-game').style.display = 'none';
        
        // Load specific mini-game
        this.loadMiniGame();
    }
    
    loadMiniGame() {
        const rescueContent = document.getElementById('rescue-content');
        
        if (this.currentMiniGameType === 'cpr') {
            this.loadCPRGame(rescueContent);
        } else if (this.currentMiniGameType === 'injection') {
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
            <div id="cpr-game" style="padding: 20px; cursor: pointer;">
                <div style="width: 100%; max-width: 350px; height: 350px; margin: 0 auto; 
                     background-image: url('images/kalp.png'); background-size: contain; 
                     background-repeat: no-repeat; background-position: center; position: relative;">
                    <div id="cpr-counter" style="position: absolute; top: 50%; left: 50%; 
                         transform: translate(-50%, -50%); font-size: 48px; font-weight: bold; 
                         color: #f44336; text-shadow: 2px 2px 4px rgba(0,0,0,0.7); 
                         background: rgba(255,255,255,0.9); padding: 15px 25px; border-radius: 15px;">
                        ${this.cprClicks}/${this.cprTarget}
                    </div>
                </div>
            </div>
        `;
        
        const cprGame = document.getElementById('cpr-game');
        cprGame.addEventListener('click', () => this.handleCPRClick());
        
        // Timer
        let timeLeft = 15;
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
            <div class="rescue-instructions">İğneyi bebek poposuna sürükleyip bırakın! (${this.injectionTarget} kez)</div>
            <div style="display: flex; align-items: center; justify-content: space-around; gap: 30px; 
                 padding: 20px; flex-wrap: wrap;">
                <div id="baby-butt" style="width: 250px; height: 250px; 
                     background-image: url('images/bebekpoposu.png'); background-size: contain; 
                     background-repeat: no-repeat; background-position: center; 
                     border: 4px solid #4CAF50; border-radius: 20px; position: relative;">
                    <div id="injection-zone" style="position: absolute; top: 50%; left: 50%; 
                         transform: translate(-50%, -50%); width: 100px; height: 100px; 
                         background: rgba(76, 175, 80, 0.3); border: 3px dashed #4CAF50; 
                         border-radius: 50%; animation: pulseZone 1.5s infinite;"></div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <div id="injection-counter" style="font-size: 36px; font-weight: bold; 
                         color: #4CAF50;">
                        ${this.injectionClicks}/${this.injectionTarget}
                    </div>
                    <div id="syringe" style="width: 120px; height: 120px; 
                         background-image: url('images/igne.png'); background-size: contain; 
                         background-repeat: no-repeat; background-position: center; cursor: grab; 
                         border: 4px solid #2196F3; border-radius: 12px; 
                         background-color: rgba(33, 150, 243, 0.2); 
                         box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                         transition: transform 0.2s ease, box-shadow 0.2s ease;
                         touch-action: none;"></div>
                    <div style="font-size: 14px; color: #666; text-align: center; margin-top: 5px;">
                        📱 Sürükle ve yeşil alana bırak
                    </div>
                </div>
            </div>
        `;
        
        this.setupInjectionDragDrop();
        
        // Timer
        let timeLeft = 15;
        this.rescueTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0 || this.injectionClicks >= this.injectionTarget) {
                clearInterval(this.rescueTimer);
                this.endBabyRescueGame(this.injectionClicks >= this.injectionTarget);
            }
        }, 1000);
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
            {
                q: "Yenidoğanın normal kalp atış hızı aralığı nedir?",
                options: ["80-100 atım/dk", "120-160 atım/dk", "180-200 atım/dk"],
                correct: 1
            },
            {
                q: "APGAR skoru ne zaman bakılır?",
                options: ["Doğumdan önce", "1. ve 5. dakikada", "1 saat sonra"],
                correct: 1
            },
            {
                q: "Bebeğin ilk kakasına ne denir?",
                options: ["Kolostrum", "Mekonyum", "Sürfaktan"],
                correct: 1
            },
            {
                q: "Prematüre bebek kaçıncı haftadan önce doğar?",
                options: ["40. haftadan", "37. haftadan", "32. haftadan"],
                correct: 1
            },
            {
                q: "K vitamini neden verilir?",
                options: ["Sarılık için", "Kanama önlemi için", "Bağışıklık için"],
                correct: 1
            }
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
        
        if (success) {
            this.setBabyState(this.currentCriticalBaby, 'saved');
            this.savedCount++;
            this.score += 100;
            
            const savedBabyId = this.currentCriticalBaby;
            setTimeout(() => {
                this.setBabyState(savedBabyId, 'normal');
            }, 3000);
            
            this.showFeedback('Bebek kurtarıldı! +100 puan', 'success');
        } else {
            this.loseBaby();
        }
        
        this.currentCriticalBaby = null;
        
        // Hide rescue game
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('baby-rescue-game').style.display = 'none';
        
        this.gameState = 'MONITORING';
        this.updateUI();
    }
    
    loseBaby() {
        this.lostCount++;
        
        if (this.currentCriticalBaby !== null) {
            this.setBabyState(this.currentCriticalBaby, 'normal');
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
        this.gorkemAppearCount++;
        
        this.showFeedback('⚠️ Görkem geldi! Hazır ol!', 'error');
        
        setTimeout(() => {
            this.startBossFight();
        }, 1000);
    }
    
    startBossFight() {
        this.gameState = 'BOSS_FIGHT';
        this.bossHealth = 100;
        
        document.getElementById('game-overlay').style.display = 'flex';
        document.getElementById('boss-fight-game').style.display = 'block';
        document.getElementById('baby-rescue-game').style.display = 'none';
        
        this.updateBossHealth();
    }
    
    handleToolClick(toolButton) {
        const damage = parseInt(toolButton.dataset.damage) || 10;
        this.bossHealth -= damage;
        
        if (this.bossHealth < 0) this.bossHealth = 0;
        
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
        this.gorkemAppearCount = 0;
        this.currentCriticalBaby = null;
        this.currentMiniGameType = null;
        
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
