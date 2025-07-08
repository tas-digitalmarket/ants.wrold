// بهینه‌ساز عملکرد برای شبیه‌سازی مورچه
class PerformanceOptimizer {
    constructor() {
        this.frameRate = 60;
        this.targetFrameTime = 1000 / this.frameRate;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.performanceMetrics = {
            avgFrameTime: 0,
            maxFrameTime: 0,
            minFrameTime: Infinity,
            totalFrames: 0,
            droppedFrames: 0
        };
        
        // تنظیمات کیفیت بر اساس عملکرد
        this.qualitySettings = {
            level: 'high', // high, medium, low
            drawEnvironmentDetails: true,
            drawParticleEffects: true,
            drawShadows: true,
            maxVisibleAnts: 50,
            maxVisibleFood: 20,
            updateFrequency: 1 // هر چند فریم یکبار آپدیت شود
        };
        
        this.frameTimeBuffer = [];
        this.bufferSize = 60; // آخرین 60 فریم
        this.adaptiveQuality = true;
        this.lastQualityCheck = Date.now();
        this.qualityCheckInterval = 2000; // هر 2 ثانیه
    }

    startFrame() {
        this.lastFrameTime = performance.now();
    }

    endFrame() {
        const currentTime = performance.now();
        const frameTime = currentTime - this.lastFrameTime;
        
        // بروزرسانی متریک‌های عملکرد
        this.updateMetrics(frameTime);
        
        // بررسی کیفیت تطبیقی
        if (this.adaptiveQuality && currentTime - this.lastQualityCheck > this.qualityCheckInterval) {
            this.adjustQuality();
            this.lastQualityCheck = currentTime;
        }
        
        this.frameCount++;
        return frameTime;
    }

    updateMetrics(frameTime) {
        this.frameTimeBuffer.push(frameTime);
        if (this.frameTimeBuffer.length > this.bufferSize) {
            this.frameTimeBuffer.shift();
        }
        
        // محاسبه FPS
        this.fps = Math.round(1000 / frameTime);
        
        // بروزرسانی متریک‌ها
        this.performanceMetrics.totalFrames++;
        this.performanceMetrics.avgFrameTime = this.frameTimeBuffer.reduce((a, b) => a + b, 0) / this.frameTimeBuffer.length;
        this.performanceMetrics.maxFrameTime = Math.max(this.performanceMetrics.maxFrameTime, frameTime);
        this.performanceMetrics.minFrameTime = Math.min(this.performanceMetrics.minFrameTime, frameTime);
        
        // شمارش فریم‌های از دست رفته
        if (frameTime > this.targetFrameTime * 1.5) {
            this.performanceMetrics.droppedFrames++;
        }
    }

    adjustQuality() {
        const avgFrameTime = this.performanceMetrics.avgFrameTime;
        const targetFrameTime = this.targetFrameTime;
        
        if (avgFrameTime > targetFrameTime * 1.3) {
            // عملکرد ضعیف - کاهش کیفیت
            this.lowerQuality();
        } else if (avgFrameTime < targetFrameTime * 0.8) {
            // عملکرد خوب - افزایش کیفیت
            this.raiseQuality();
        }
    }

    lowerQuality() {
        const settings = this.qualitySettings;
        
        if (settings.level === 'high') {
            settings.level = 'medium';
            settings.drawShadows = false;
            settings.maxVisibleAnts = 30;
            settings.maxVisibleFood = 15;
            console.log('کیفیت به متوسط تغییر یافت');
        } else if (settings.level === 'medium') {
            settings.level = 'low';
            settings.drawEnvironmentDetails = false;
            settings.drawParticleEffects = false;
            settings.maxVisibleAnts = 20;
            settings.maxVisibleFood = 10;
            settings.updateFrequency = 2;
            console.log('کیفیت به پایین تغییر یافت');
        }
    }

    raiseQuality() {
        const settings = this.qualitySettings;
        
        if (settings.level === 'low') {
            settings.level = 'medium';
            settings.drawEnvironmentDetails = true;
            settings.drawParticleEffects = true;
            settings.maxVisibleAnts = 30;
            settings.maxVisibleFood = 15;
            settings.updateFrequency = 1;
            console.log('کیفیت به متوسط تغییر یافت');
        } else if (settings.level === 'medium') {
            settings.level = 'high';
            settings.drawShadows = true;
            settings.maxVisibleAnts = 50;
            settings.maxVisibleFood = 20;
            console.log('کیفیت به بالا تغییر یافت');
        }
    }

    shouldUpdate(frameNumber) {
        return frameNumber % this.qualitySettings.updateFrequency === 0;
    }

    getPerformanceStats() {
        return {
            fps: this.fps,
            quality: this.qualitySettings.level,
            avgFrameTime: Math.round(this.performanceMetrics.avgFrameTime * 100) / 100,
            droppedFrames: this.performanceMetrics.droppedFrames,
            totalFrames: this.performanceMetrics.totalFrames
        };
    }

    // Object pooling برای کاهش garbage collection
    static createObjectPool(createFn, resetFn, initialSize = 10) {
        const pool = [];
        const active = new Set();
        
        // پر کردن اولیه pool
        for (let i = 0; i < initialSize; i++) {
            pool.push(createFn());
        }
        
        return {
            get() {
                let obj;
                if (pool.length > 0) {
                    obj = pool.pop();
                } else {
                    obj = createFn();
                }
                active.add(obj);
                return obj;
            },
            
            release(obj) {
                if (active.has(obj)) {
                    active.delete(obj);
                    resetFn(obj);
                    pool.push(obj);
                }
            },
            
            clear() {
                pool.length = 0;
                active.clear();
            }
        };
    }
}

// پول particle برای بهینه‌سازی
const particlePool = PerformanceOptimizer.createObjectPool(
    () => ({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0,
        color: '#ffffff', size: 1
    }),
    (particle) => {
        particle.x = 0;
        particle.y = 0;
        particle.vx = 0;
        particle.vy = 0;
        particle.life = 0;
        particle.maxLife = 0;
        particle.color = '#ffffff';
        particle.size = 1;
    },
    50
);

// پول effect برای بهینه‌سازی
const effectPool = PerformanceOptimizer.createObjectPool(
    () => ({
        x: 0, y: 0, type: 'sparkle',
        duration: 0, maxDuration: 0,
        scale: 1, alpha: 1
    }),
    (effect) => {
        effect.x = 0;
        effect.y = 0;
        effect.type = 'sparkle';
        effect.duration = 0;
        effect.maxDuration = 0;
        effect.scale = 1;
        effect.alpha = 1;
    },
    30
);

// صدور متغیرها برای استفاده در سایر فایل‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceOptimizer, particlePool, effectPool };
}
