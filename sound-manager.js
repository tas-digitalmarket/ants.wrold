// سیستم صداهای محیطی برای شبیه‌سازی مورچه
class SoundManager {
    constructor() {
        this.sounds = {};
        this.audioContext = null;
        this.masterVolume = 0.3;
        this.soundEnabled = true;
        this.environmentSounds = true;
        this.uiSounds = true;
        
        // تنظیمات صداهای محیطی
        this.ambientSettings = {
            windVolume: 0.1,
            birdVolume: 0.05,
            insectVolume: 0.08,
            rustleVolume: 0.06
        };
        
        this.init();
    }

    async init() {
        try {
            // تنظیم event listener ها برای ایجاد AudioContext بعد از تعامل کاربر
            this.setupUserInteractionListeners();
            
            console.log('سیستم صوتی آماده شد (در انتظار تعامل کاربر)');
        } catch (error) {
            console.error('خطا در راه‌اندازی سیستم صوتی:', error);
        }
    }
    
    setupUserInteractionListeners() {
        const initializeAudioContext = () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('AudioContext created after user interaction');
                    
                    // ایجاد صداهای مصنوعی
                    this.createSyntheticSounds();
                    
                    // شروع صداهای محیطی
                    this.startAmbientSounds();
                    
                    // حذف event listener ها
                    document.removeEventListener('click', initializeAudioContext);
                    document.removeEventListener('keydown', initializeAudioContext);
                    document.removeEventListener('touchstart', initializeAudioContext);
                } catch (error) {
                    console.error('خطا در ایجاد AudioContext:', error);
                }
            }
        };
        
        // اضافه کردن event listener ها
        document.addEventListener('click', initializeAudioContext);
        document.addEventListener('keydown', initializeAudioContext);
        document.addEventListener('touchstart', initializeAudioContext);
    }

    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('AudioContext resumed');
                // شروع صداهای محیطی بعد از resume
                if (this.environmentSounds) {
                    this.startAmbientSounds();
                }
            });
        }
    }

    // ایجاد صداهای مصنوعی
    createSyntheticSounds() {
        // صدای کلیک
        this.sounds.click = () => this.createBeep(800, 0.1, 'sine');
        
        // صدای گرفتن غذا
        this.sounds.food_pickup = () => this.createBeep(600, 0.15, 'triangle');
        
        // صدای برگشت به لانه
        this.sounds.nest_return = () => this.createChord([400, 500, 600], 0.2);
        
        // صدای تولید مثل
        this.sounds.reproduction = () => this.createMelody([500, 600, 700, 800], 0.3);
        
        // صدای رشد لارو
        this.sounds.larva_hatch = () => this.createBeep(1000, 0.2, 'sawtooth');
        
        // صدای اضافه کردن غذا
        this.sounds.food_add = () => this.createWhoosh(0.2);
        
        // صدای اضافه کردن مانع
        this.sounds.obstacle_add = () => this.createThud(0.3);
        
        // صدای خطا
        this.sounds.error = () => this.createBeep(200, 0.5, 'square');
        
        // صدای موفقیت
        this.sounds.success = () => this.createMelody([800, 1000, 1200], 0.4);
        
        // صدای قورباغه
        this.sounds.frog_jump = () => this.createFrogJump();
        this.sounds.frog_croak = () => this.createFrogCroak();
        
        // صداهای قورباغه
        this.sounds.frog_idle = () => this.createFrogCroak('idle');
        this.sounds.frog_hunt = () => this.createFrogCroak('hunt');
        this.sounds.frog_eat = () => this.createFrogCroak('eat');
        this.sounds.frog_miss = () => this.createFrogCroak('miss');
    }

    // ایجاد صدای بیپ
    createBeep(frequency, duration, waveType = 'sine') {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = waveType;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // ایجاد آکورد
    createChord(frequencies, duration) {
        if (!this.audioContext || !this.soundEnabled) return;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createBeep(freq, duration * 0.8, 'sine');
            }, index * 50);
        });
    }

    // ایجاد ملودی
    createMelody(frequencies, duration) {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const noteDuration = duration / frequencies.length;
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createBeep(freq, noteDuration, 'triangle');
            }, index * noteDuration * 1000);
        });
    }

    // ایجاد صدای ویز
    createWhoosh(duration) {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(5000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // ایجاد صدای ضربه
    createThud(duration) {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // شروع صداهای محیطی
    startAmbientSounds() {
        if (!this.soundEnabled || !this.environmentSounds || !this.audioContext) {
            console.log('Ambient sounds not started - conditions not met');
            return;
        }
        
        // Ambient sounds disabled to remove long continuous sounds
        console.log('Ambient sounds disabled for better user experience');
        
        // صدای باد - غیرفعال شده
        // this.playWindSound();
        
        // صدای حشرات - غیرفعال شده
        // setInterval(() => {
        //     if (Math.random() < 0.1) {
        //         this.playInsectSound();
        //     }
        // }, 3000);
        
        // صدای پرندگان - غیرفعال شده
        // setInterval(() => {
        //     if (Math.random() < 0.05) {
        //         this.playBirdSound();
        //     }
        // }, 8000);
        
        // صدای خش‌خش برگ‌ها - غیرفعال شده
        // setInterval(() => {
        //     if (Math.random() < 0.08) {
        //         this.playRustleSound();
        //     }
        // }, 5000);
    }

    // صدای باد
    playWindSound() {
        if (!this.audioContext || !this.environmentSounds || !this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 80 + Math.random() * 40;
        
        filter.type = 'lowpass';
        filter.frequency.value = 300 + Math.random() * 200;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.ambientSettings.windVolume, this.audioContext.currentTime + 2);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 8);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 8);
        
        // تکرار صدای باد
        setTimeout(() => this.playWindSound(), 10000 + Math.random() * 10000);
    }

    // صدای حشرات
    playInsectSound() {
        if (!this.audioContext || !this.environmentSounds) return;
        
        const frequency = 400 + Math.random() * 800;
        const duration = 0.5 + Math.random() * 1.5;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(frequency * 1.1, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.ambientSettings.insectVolume, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // صدای پرندگان
    playBirdSound() {
        if (!this.audioContext || !this.environmentSounds) return;
        
        const notes = [800, 1000, 1200, 1000, 800];
        const noteLength = 0.15;
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(this.ambientSettings.birdVolume, this.audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + noteLength);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + noteLength);
            }, index * noteLength * 1000);
        });
    }

    // صدای خش‌خش برگ‌ها
    playRustleSound() {
        if (!this.audioContext || !this.environmentSounds) return;
        
        const duration = 0.3 + Math.random() * 0.5;
        
        // ایجاد نویز سفید
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.ambientSettings.rustleVolume, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        source.start(this.audioContext.currentTime);
        source.stop(this.audioContext.currentTime + duration);
    }

    // پخش صدا
    playSound(soundName, volume = 1.0) {
        if (!this.soundEnabled || !this.sounds[soundName]) return;
        
        // اگر AudioContext هنوز ایجاد نشده، آن را ایجاد کن
        if (!this.audioContext) {
            console.log('AudioContext not ready, skipping sound:', soundName);
            return;
        }
        
        try {
            // اگر AudioContext متوقف است، سعی کن آن را شروع کن
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // تنظیم حجم موقت
            const originalVolume = this.masterVolume;
            this.masterVolume *= volume;
            
            this.sounds[soundName]();
            
            // بازگردانی حجم اصلی
            this.masterVolume = originalVolume;
        } catch (error) {
            console.error('خطا در پخش صدا:', error);
        }
    }

    // تنظیم حجم کلی
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    // فعال/غیرفعال کردن صداها
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        if (this.soundEnabled) {
            this.init();
            // شروع مجدد صداهای محیطی اگر فعال باشند
            if (this.environmentSounds) {
                this.startAmbientSounds();
            }
        } else {
            // متوقف کردن تمام صداها
            this.stopAllSounds();
        }
    }

    // فعال/غیرفعال کردن صداهای محیطی
    toggleEnvironmentSounds() {
        this.environmentSounds = !this.environmentSounds;
        if (this.environmentSounds) {
            this.startAmbientSounds();
        }
    }

    // فعال/غیرفعال کردن صداهای رابط کاربری
    toggleUISounds() {
        this.uiSounds = !this.uiSounds;
    }

    // دریافت تنظیمات صوتی
    getSettings() {
        return {
            soundEnabled: this.soundEnabled,
            environmentSounds: this.environmentSounds,
            uiSounds: this.uiSounds,
            masterVolume: this.masterVolume,
            ambientSettings: {...this.ambientSettings}
        };
    }

    // اعمال تنظیمات صوتی
    applySettings(settings) {
        this.soundEnabled = settings.soundEnabled;
        this.environmentSounds = settings.environmentSounds;
        this.uiSounds = settings.uiSounds;
        this.masterVolume = settings.masterVolume;
        this.ambientSettings = {...settings.ambientSettings};
        
        if (this.soundEnabled && this.environmentSounds) {
            this.startAmbientSounds();
        }
    }

    // متوقف کردن تمام صداها
    stopAllSounds() {
        if (this.audioContext) {
            try {
                // متوقف کردن تمام نودهای صوتی
                this.audioContext.suspend();
                
                // پاک کردن تمام تایمرهای صوتی
                if (this.ambientTimer) {
                    clearInterval(this.ambientTimer);
                    this.ambientTimer = null;
                }
                if (this.windTimer) {
                    clearTimeout(this.windTimer);
                    this.windTimer = null;
                }
                if (this.birdTimer) {
                    clearTimeout(this.birdTimer);
                    this.birdTimer = null;
                }
                if (this.insectTimer) {
                    clearTimeout(this.insectTimer);
                    this.insectTimer = null;
                }
                
                console.log('تمام صداها متوقف شدند');
            } catch (error) {
                console.error('خطا در متوقف کردن صداها:', error);
            }
        }
    }
    
    // ایجاد صداهای قورباغه طبیعی
    createFrogCroak(type) {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        filter.type = 'lowpass';
        filter.Q.setValueAtTime(10, this.audioContext.currentTime);
        
        let freq1, freq2, duration, filterFreq;
        
        switch(type) {
            case 'idle':
                freq1 = 120;
                freq2 = 180;
                duration = 0.8;
                filterFreq = 800;
                break;
            case 'hunt':
                freq1 = 200;
                freq2 = 150;
                duration = 0.3;
                filterFreq = 1200;
                break;
            case 'eat':
                freq1 = 80;
                freq2 = 120;
                duration = 0.6;
                filterFreq = 600;
                break;
            case 'miss':
                freq1 = 100;
                freq2 = 80;
                duration = 0.4;
                filterFreq = 400;
                break;
            default:
                freq1 = 150;
                freq2 = 100;
                duration = 0.5;
                filterFreq = 700;
        }
        
        oscillator1.type = 'sawtooth';
        oscillator2.type = 'triangle';
        
        oscillator1.frequency.setValueAtTime(freq1, this.audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(freq2, this.audioContext.currentTime);
        
        // تنظیم فیلتر
        filter.frequency.setValueAtTime(filterFreq, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(filterFreq * 0.5, this.audioContext.currentTime + duration);
        
        // تنظیم حجم با envelope طبیعی
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.1, this.audioContext.currentTime + duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        // اضافه کردن تغییرات کوچک برای طبیعی بودن
        if (type === 'idle') {
            oscillator1.frequency.linearRampToValueAtTime(freq1 * 0.8, this.audioContext.currentTime + duration * 0.5);
            oscillator1.frequency.linearRampToValueAtTime(freq1, this.audioContext.currentTime + duration);
        }
        
        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + duration);
        oscillator2.stop(this.audioContext.currentTime + duration);
    }
    
    // پخش صداهای قورباغه
    playFrogSound(type, volume = 1.0) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const soundName = `frog_${type}`;
            if (this.sounds[soundName]) {
                const originalVolume = this.masterVolume;
                this.masterVolume *= volume;
                
                this.sounds[soundName]();
                
                this.masterVolume = originalVolume;
            }
        } catch (error) {
            console.error('خطا در پخش صدای قورباغه:', error);
        }
    }
}

// صدور برای استفاده در سایر فایل‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundManager;
}
