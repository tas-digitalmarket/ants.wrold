// سیستم ذخیره و بازیابی وضعیت شبیه‌سازی
class SaveSystem {
    constructor() {
        this.storageKey = 'ant-simulation-save';
        this.autoSaveInterval = 30000; // هر 30 ثانیه
        this.maxSaves = 5; // حداکثر تعداد save slot
        this.lastAutoSave = Date.now();
        this.compressionEnabled = true;
        
        // فعال‌سازی auto save
        this.setupAutoSave();
    }

    setupAutoSave() {
        setInterval(() => {
            this.autoSave();
        }, this.autoSaveInterval);
        
        // ذخیره هنگام بستن برنامه
        window.addEventListener('beforeunload', () => {
            this.autoSave();
        });
        
        // ذخیره هنگام تغییر فوکوس
        window.addEventListener('blur', () => {
            this.autoSave();
        });
    }

    // ذخیره وضعیت فعلی
    saveGame(slotName = 'autosave') {
        try {
            const gameState = this.captureGameState();
            const saveData = {
                timestamp: Date.now(),
                version: '1.0',
                gameState: gameState,
                playTime: this.calculatePlayTime(),
                metadata: {
                    totalAnts: workerAnts.length + 2, // +2 برای نر و ماده
                    totalFood: world.nest.storedFood,
                    totalLarvae: larvae.length,
                    slotName: slotName
                }
            };
            
            // فشرده‌سازی داده‌ها
            const compressedData = this.compressionEnabled ? 
                this.compressData(JSON.stringify(saveData)) : 
                JSON.stringify(saveData);
            
            // ذخیره در localStorage
            const saves = this.getAllSaves();
            saves[slotName] = compressedData;
            
            // حفظ حداکثر تعداد save
            this.manageSaveSlots(saves);
            
            localStorage.setItem(this.storageKey, JSON.stringify(saves));
            
            this.showSaveNotification(`بازی در ${slotName} ذخیره شد`);
            console.log(`بازی در ${slotName} ذخیره شد`);
            
            return true;
        } catch (error) {
            console.error('خطا در ذخیره بازی:', error);
            this.showSaveNotification('خطا در ذخیره بازی!', 'error');
            return false;
        }
    }

    // بازیابی وضعیت
    loadGame(slotName = 'autosave') {
        try {
            const saves = this.getAllSaves();
            const saveData = saves[slotName];
            
            if (!saveData) {
                this.showSaveNotification('فایل ذخیره یافت نشد!', 'error');
                return false;
            }
            
            // از حالت فشرده خارج کردن
            const rawData = this.compressionEnabled ? 
                this.decompressData(saveData) : 
                saveData;
            
            const gameData = JSON.parse(rawData);
            
            // بازیابی وضعیت
            this.restoreGameState(gameData.gameState);
            
            this.showSaveNotification(`بازی از ${slotName} بازیابی شد`);
            console.log(`بازی از ${slotName} بازیابی شد`);
            
            return true;
        } catch (error) {
            console.error('خطا در بازیابی بازی:', error);
            this.showSaveNotification('خطا در بازیابی بازی!', 'error');
            return false;
        }
    }

    // ذخیره خودکار
    autoSave() {
        if (Date.now() - this.lastAutoSave < this.autoSaveInterval) {
            return;
        }
        
        this.saveGame('autosave');
        this.lastAutoSave = Date.now();
    }

    // ضبط وضعیت فعلی بازی
    captureGameState() {
        return {
            // مورچه‌ها
            maleAnt: this.serializeAnt(maleAnt),
            femaleAnt: this.serializeAnt(femaleAnt),
            workerAnts: workerAnts.map(ant => this.serializeAnt(ant)),
            larvae: larvae.map(larva => this.serializeLarva(larva)),
            
            // محیط
            world: {
                nest: {
                    ...world.nest
                },
                foods: world.foods.map(food => ({...food})),
                obstacles: world.obstacles.map(obstacle => ({...obstacle})),
                time: world.time
            },
            
            // متغیرهای بازی
            reproductionCooldown: reproductionCooldown,
            startTime: startTime,
            
            // تنظیمات
            settings: {
                showDebugInfo: showDebugInfo,
                isRotated: isRotated
            }
        };
    }

    // بازیابی وضعیت بازی
    restoreGameState(gameState) {
        // توقف animation فعلی
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        // بازیابی مورچه‌ها
        maleAnt = this.deserializeAnt(gameState.maleAnt);
        femaleAnt = this.deserializeAnt(gameState.femaleAnt);
        workerAnts = gameState.workerAnts.map(antData => this.deserializeAnt(antData));
        larvae = gameState.larvae.map(larvaData => this.deserializeLarva(larvaData));
        
        // بازیابی محیط
        world.nest = {...gameState.world.nest};
        world.foods = gameState.world.foods.map(foodData => ({...foodData}));
        world.obstacles = gameState.world.obstacles.map(obstacleData => ({...obstacleData}));
        world.time = gameState.world.time || 0;
        
        // بازیابی متغیرهای بازی
        reproductionCooldown = gameState.reproductionCooldown;
        startTime = gameState.startTime;
        
        // بازیابی تنظیمات
        if (gameState.settings) {
            showDebugInfo = gameState.settings.showDebugInfo;
            isRotated = gameState.settings.isRotated;
        }
        
        // شروع مجدد animation
        animate();
    }

    // سریال‌سازی مورچه
    serializeAnt(ant) {
        return {
            gender: ant.gender,
            x: ant.x,
            y: ant.y,
            direction: ant.direction,
            energy: ant.energy,
            age: ant.age,
            state: ant.state,
            carriedFood: ant.carriedFood,
            brain: {
                ...ant.brain
            },
            isDead: ant.isDead,
            hasMated: ant.hasMated,
            restDuration: ant.restDuration
        };
    }

    // غیرسریال‌سازی مورچه
    deserializeAnt(antData) {
        const ant = new Ant(world, antData.gender);
        ant.x = antData.x;
        ant.y = antData.y;
        ant.direction = antData.direction;
        ant.energy = antData.energy;
        ant.age = antData.age;
        ant.state = antData.state;
        ant.carriedFood = antData.carriedFood;
        ant.brain = {...antData.brain};
        ant.isDead = antData.isDead;
        ant.hasMated = antData.hasMated;
        ant.restDuration = antData.restDuration || 0;
        return ant;
    }

    // سریال‌سازی لارو
    serializeLarva(larva) {
        return {
            x: larva.x,
            y: larva.y,
            hatchTime: larva.hatchTime
        };
    }

    // غیرسریال‌سازی لارو
    deserializeLarva(larvaData) {
        const larva = new Larva(world, larvaData.x, larvaData.y);
        larva.hatchTime = larvaData.hatchTime;
        return larva;
    }

    // فشرده‌سازی داده‌ها
    compressData(data) {
        // یک فشرده‌سازی ساده با حذف فضاهای خالی
        return data.replace(/\s+/g, ' ').trim();
    }

    // از حالت فشرده خارج کردن
    decompressData(data) {
        return data;
    }

    // مدیریت save slot ها
    manageSaveSlots(saves) {
        const saveKeys = Object.keys(saves);
        if (saveKeys.length > this.maxSaves) {
            // حذف قدیمی‌ترین save (به جز autosave)
            const sortedSaves = saveKeys
                .filter(key => key !== 'autosave')
                .map(key => ({
                    key: key,
                    timestamp: JSON.parse(saves[key]).timestamp
                }))
                .sort((a, b) => a.timestamp - b.timestamp);
            
            // حذف قدیمی‌ترین
            if (sortedSaves.length > 0) {
                delete saves[sortedSaves[0].key];
            }
        }
    }

    // دریافت تمام save ها
    getAllSaves() {
        const saves = localStorage.getItem(this.storageKey);
        return saves ? JSON.parse(saves) : {};
    }

    // دریافت لیست save ها
    getSaveList() {
        const saves = this.getAllSaves();
        return Object.keys(saves).map(key => {
            try {
                const saveData = JSON.parse(this.compressionEnabled ? 
                    this.decompressData(saves[key]) : 
                    saves[key]);
                return {
                    slotName: key,
                    timestamp: saveData.timestamp,
                    metadata: saveData.metadata,
                    playTime: saveData.playTime
                };
            } catch (error) {
                console.error(`خطا در خواندن save ${key}:`, error);
                return null;
            }
        }).filter(save => save !== null);
    }

    // حذف save
    deleteSave(slotName) {
        const saves = this.getAllSaves();
        if (saves[slotName]) {
            delete saves[slotName];
            localStorage.setItem(this.storageKey, JSON.stringify(saves));
            this.showSaveNotification(`${slotName} حذف شد`);
            return true;
        }
        return false;
    }

    // محاسبه زمان بازی
    calculatePlayTime() {
        return Date.now() - startTime;
    }

    // نمایش اعلان ذخیره
    showSaveNotification(message, type = 'success') {
        // ایجاد المان اعلان
        const notification = document.createElement('div');
        notification.className = `save-notification ${type}`;
        notification.textContent = message;
        
        // استایل اعلان
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 255, 0, 0.9)'};
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // حذف اعلان بعد از 3 ثانیه
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // صدور آمار ذخیره
    exportSaveStats() {
        const saves = this.getAllSaves();
        const stats = {
            totalSaves: Object.keys(saves).length,
            storageUsed: JSON.stringify(saves).length,
            saves: this.getSaveList()
        };
        
        return stats;
    }
}

// اضافه کردن انیمیشن‌های CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// صدور برای استفاده در سایر فایل‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveSystem;
}
