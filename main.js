// متغیرهای اصلی
let world;
let maleAnt;
let femaleAnt; 
let workerAnts = [];
let larvae = [];
let foodManager;
let animationId;
let reproductionCooldown = 0;
let startTime;

// سیستم‌های جدید
let performanceOptimizer;
let saveSystem;
let soundManager;

// متغیرهای موبایل و انیمیشن
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchStartX, touchStartY;
let lastTouchTime = 0;
let lastAnimationTime = 0;
let frameInterval = 1000 / 60; // 60 FPS

// متغیر برای کنترل حالت چرخش
let isRotated = false;

// متغیر برای کنترل حالت debug
let showDebugInfo = false;

// آرایه افکت‌های بصری
const visualEffects = [];

// تابع اصلی مقداردهی
async function init() {
    const canvas = document.getElementById('simulation-canvas');
    
    // راه‌اندازی سیستم‌های جدید
    performanceOptimizer = new PerformanceOptimizer();
    saveSystem = new SaveSystem();
    soundManager = new SoundManager();
    
    // صدور سیستم‌ها به window برای دسترسی global
    window.performanceOptimizer = performanceOptimizer;
    window.saveSystem = saveSystem;
    window.soundManager = soundManager;
    window.visualEffects = visualEffects;
    
    // تنظیم اندازه کانواس
    resizeCanvas();
    
    world = new World(canvas);
    world.initialize();
    
    // پاک کردن آرایه‌ها برای شروع مجدد
    workerAnts = [];
    larvae = [];
    
    maleAnt = new Ant(world, 'male');
    femaleAnt = new Ant(world, 'female');
    
    // اختصاص متغیرها به window برای دسترسی قورباغه
    window.maleAnt = maleAnt;
    window.femaleAnt = femaleAnt;
    window.workerAnts = workerAnts;
    
    foodManager = new FoodManager(world);
    
    startTime = Date.now();
    reproductionCooldown = Date.now();
    
    setupEventListeners();
    
    // تنظیم touch events برای موبایل
    if (isMobile) {
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    
    animate();
    updateStats();
    
    // شروع افکت‌های بصری
    createFloatingParticles();
    
    // شروع تایمر تولید مثل
    setInterval(updateReproductionTimer, 1000);
    
    // تنظیم resize listener
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 100);
    });
    
    // پخش صدای شروع را حذف کن تا مشکل AudioContext نداشته باشیم
    // soundManager.playSound('success');
    
    // تنظیم اولیه نمایش دکمه صدا
    updateSoundButtonDisplay();
    
    console.log('🐜 شبیه‌سازی مورچه آماده است!');
}

// تنظیم اندازه کانواس
function resizeCanvas() {
    const canvas = document.getElementById('simulation-canvas');
    if (!canvas) return;
    
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    
    canvas.width = vw;
    canvas.height = vh;
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    
    // اعمال چرخش اگر فعال باشد
    if (isRotated) {
        canvas.style.transform = 'rotate(90deg)';
        canvas.style.transformOrigin = 'center center';
    } else {
        canvas.style.transform = 'rotate(0deg)';
    }
    
    if (world) {
        // ذخیره ابعاد قبلی
        const oldWidth = world.width;
        const oldHeight = world.height;
        
        // تنظیم ابعاد جدید
        if (isRotated) {
            world.width = vh;
            world.height = vw;
        } else {
            world.width = vw;
            world.height = vh;
        }
        
        world.canvas = canvas;
        world.ctx = canvas.getContext('2d');
        
        // بازتوزیع عناصر اگر ابعاد تغییر کرده باشد
        if (oldWidth && oldHeight && (oldWidth !== world.width || oldHeight !== world.height)) {
            redistributeElements(oldWidth, oldHeight, world.width, world.height);
        }
        
        // تنظیم مجدد موقعیت لانه در مرکز صفحه
        if (world.nest) {
            world.nest.x = world.width / 2;
            world.nest.y = world.height / 2;
        }
    }
    
    console.log(`Canvas resized: ${canvas.width}x${canvas.height}, World: ${world?.width}x${world?.height}, Rotated: ${isRotated}`);
}

// حلقه انیمیشن اصلی
function animate() {
    // شروع اندازه‌گیری عملکرد
    performanceOptimizer.startFrame();
    
    // بررسی آیا باید آپدیت کنیم یا نه
    if (!performanceOptimizer.shouldUpdate(performanceOptimizer.frameCount)) {
        animationId = requestAnimationFrame(animate);
        return;
    }
    
    // بررسی زمان تولید مثل
    if (Date.now() >= reproductionCooldown) {
        maleAnt.x = world.nest.x;
        maleAnt.y = world.nest.y;
        femaleAnt.x = world.nest.x;
        femaleAnt.y = world.nest.y;
        
        createLarva();
        reproductionCooldown = Date.now() + 120000; // 2 دقیقه
        
        // پخش صدای تولید مثل
        soundManager.playSound('reproduction');
    }
    
    // به‌روزرسانی مورچه‌های اصلی
    maleAnt.update();
    femaleAnt.update();

    // به‌روزرسانی مورچه‌های کارگر
    const maxWorkers = performanceOptimizer.qualitySettings.maxVisibleAnts;
    for (let i = 0; i < Math.min(workerAnts.length, maxWorkers); i++) {
        workerAnts[i].update();
    }
    
    // به‌روزرسانی غذا
    foodManager.update();
    
    // به‌روزرسانی قورباغه
    if (world.frog) {
        world.frog.update();
    }
    
    // رسم دنیا و افکت‌ها
    world.draw();
    
    // اضافه کردن افکت‌های بصری بر اساس تنظیمات کیفیت
    if (performanceOptimizer.qualitySettings.drawParticleEffects) {
        addVisualEffects();
    }
    
    if (performanceOptimizer.qualitySettings.drawEnvironmentDetails) {
        addEnvironmentalEffects();
    }
    
    // رسم مورچه‌ها
    maleAnt.draw();
    femaleAnt.draw();
    
    // به‌روزرسانی و رسم لاروها
    for (let i = larvae.length - 1; i >= 0; i--) {
        const larva = larvae[i];
        if (larva.update()) {
            // تبدیل لارو به مورچه کارگر
            let workerAnt = new Ant(world, 'worker');
            workerAnt.radius = 6;
            workerAnt.x = larva.x;
            workerAnt.y = larva.y;
            workerAnt.energy = 100;
            workerAnt.state = 'searching';
            workerAnts.push(workerAnt);
            larvae.splice(i, 1);
            
            createBirthEffect(larva.x, larva.y);
            showNotification('🐜 مورچه کارگر جدید متولد شد!', 'success');
            
            // پخش صدای رشد لارو
            soundManager.playSound('larva_hatch');
        } else {
            larva.draw();
        }
    }
    
    // رسم مورچه‌های کارگر
    for (let i = 0; i < Math.min(workerAnts.length, maxWorkers); i++) {
        workerAnts[i].draw();
    }
    
    // حذف آمار قورباغه - دیگر نمایش داده نمی‌شود
    
    updateStats();
    
    // نمایش اطلاعات debug اگر فعال باشد
    if (showDebugInfo) {
        drawCanvasDebugInfo();
    }
    
    // تمیز کردن افکت‌ها
    cleanupEffects();
    
    // پایان اندازه‌گیری عملکرد
    performanceOptimizer.endFrame();
    
    animationId = requestAnimationFrame(animate);
}

// ایجاد لارو جدید
function createLarva() {
    const nest = world.nest;
    let offsetX = (Math.random() - 0.5) * 60;
    let offsetY = (Math.random() - 0.5) * 60;
    const newLarva = new Larva(world, nest.x + offsetX, nest.y + offsetY);
    larvae.push(newLarva);
    
    createBirthEffect(nest.x + offsetX, nest.y + offsetY);
    showNotification('🥚 لارو جدید تولید شد!', 'info');
}

// فرمت زمان
function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    return `${hours} ساعت و ${minutes} دقیقه`;
}

// تنظیم event listeners
function setupEventListeners() {
    // اضافه کردن event listener برای دکمه آمار
    const statsButton = document.getElementById('stats-button');
    if (statsButton) {
        statsButton.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Stats button clicked');
            
            const modal = document.getElementById('stats-modal');
            if (modal) {
                if (modal.style.display === 'none' || modal.style.display === '') {
                    modal.style.display = 'flex';
                    setTimeout(() => {
                        modal.style.opacity = '1';
                    }, 10);
                    console.log('Modal opened via event listener');
                } else {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                    console.log('Modal closed via event listener');
                }
            }
        });
    }
    
    // دکمه بستن modal
    const closeButton = document.getElementById('close-modal-button');
    if (closeButton) {
        closeButton.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Close button clicked');
            
            const modal = document.getElementById('stats-modal');
            if (modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // دکمه‌های کنترل
    const addFoodButton = document.getElementById('add-food');
    if (addFoodButton) {
        addFoodButton.addEventListener('click', () => {
            world.addRandomFood(3);
            soundManager.playSound('food_add');
            showNotification('🍯 3 غذا اضافه شد!', 'success');
            if (navigator.vibrate) navigator.vibrate(100);
        });
    }
    
    const addObstacleButton = document.getElementById('add-obstacle');
    if (addObstacleButton) {
        addObstacleButton.addEventListener('click', () => {
            world.addRandomObstacles(1);
            soundManager.playSound('obstacle_add');
            showNotification('🪨 مانع جدید اضافه شد!', 'success');
            if (navigator.vibrate) navigator.vibrate(100);
        });
    }
    
    const restartButton = document.getElementById('restart');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            cancelAnimationFrame(animationId);
            init();
            soundManager.playSound('success');
            showNotification('🔄 شبیه‌سازی مجدد شروع شد!', 'success');
            if (navigator.vibrate) navigator.vibrate(200);
        });
    }
    
    // اضافه کردن event handler های جدید
    handleGameEvents();
}

// تابع بروزرسانی نمایش دکمه صدا
function updateSoundButtonDisplay() {
    const soundButton = document.getElementById('sound-toggle');
    if (!soundButton || !soundManager) return;
    
    if (soundManager.soundEnabled) {
        soundButton.textContent = '🔊';
        soundButton.title = 'صدا فعال است - کلیک کنید تا خاموش شود';
        soundButton.classList.remove('muted');
    } else {
        soundButton.textContent = '🔇';
        soundButton.title = 'صدا غیرفعال است - کلیک کنید تا روشن شود';
        soundButton.classList.add('muted');
    }
}

// Event handler های کنترل صوتی
function toggleSoundButton() {
    if (!soundManager) return;
    
    const soundButton = document.getElementById('sound-toggle');
    if (!soundButton) return;
    
    // تغییر حالت صدا
    soundManager.toggleSound();
    
    // به‌روزرسانی نمایش دکمه
    if (soundManager.soundEnabled) {
        soundButton.textContent = '🔊';
        soundButton.title = 'صدا فعال است - کلیک کنید تا خاموش شود';
        soundButton.classList.remove('muted');
        showNotification('🔊 صدا فعال شد', 'success');
    } else {
        soundButton.textContent = '🔇';
        soundButton.title = 'صدا غیرفعال است - کلیک کنید تا روشن شود';
        soundButton.classList.add('muted');
        showNotification('🔇 صدا غیرفعال شد', 'info');
    }
    
    // ویبریشن برای موبایل
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function toggleSoundSettings() {
    toggleSoundButton();
}

// Event handler های کنترل بازی
function handleGameEvents() {
    // اولین کلیک یا کلید برای فعال‌سازی صدا
    let audioInitialized = false;
    
    const initializeAudio = () => {
        if (!audioInitialized && soundManager && soundManager.audioContext) {
            soundManager.resumeAudioContext();
            audioInitialized = true;
        }
    };
    
    // کلیک برای اضافه کردن غذا
    world.canvas.addEventListener('click', (e) => {
        initializeAudio();
        
        const rect = world.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const transformed = transformCoordinates(x, y);
        
        world.addFood(transformed.x, transformed.y);
        createClickEffect(e.clientX, e.clientY);
        showNotification('🍯 غذا اضافه شد!', 'success');
        
        // پخش صدای اضافه کردن غذا
        soundManager.playSound('food_add');
    });
    
    // کلیدهای میانبر
    document.addEventListener('keydown', (e) => {
        initializeAudio();
        
        switch(e.key) {
            case 'f':
            case 'F':
                world.addRandomFood(3);
                soundManager.playSound('food_add');
                break;
            case 'o':
            case 'O':
                world.addRandomObstacles(1);
                soundManager.playSound('obstacle_add');
                break;
            case 's':
            case 'S':
                if (e.ctrlKey) {
                    e.preventDefault();
                    saveSystem.saveGame('manual');
                }
                break;
            case 'l':
            case 'L':
                if (e.ctrlKey) {
                    e.preventDefault();
                    saveSystem.loadGame('manual');
                }
                break;
            case 'm':
            case 'M':
                soundManager.toggleSound();
                break;
        }
    });
}



// تابع بروزرسانی شده برای آمار
function updateStatsEnhanced() {
    // فعلاً هیچ آمار اضافی نداریم
}

// مدیریت لمس موبایل
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    
    const distance = Math.sqrt(
        Math.pow(touchEndX - touchStartX, 2) + 
        Math.pow(touchEndY - touchStartY, 2)
    );
    
    if (distance < 20) {
        const rect = world.canvas.getBoundingClientRect();
        const x = touchEndX - rect.left;
        const y = touchEndY - rect.top;
        const transformed = transformCoordinates(x, y);
        
        world.addFood(transformed.x, transformed.y);
        createClickEffect(touchEndX, touchEndY);
        showNotification('🍯 غذا اضافه شد!', 'success');
        if (navigator.vibrate) navigator.vibrate(50);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
}

// تبدیل مختصات برای چرخش
function transformCoordinates(x, y) {
    if (!isRotated) {
        return { x, y };
    }
    
    const centerX = world.canvas.width / 2;
    const centerY = world.canvas.height / 2;
    
    const localX = x - centerX;
    const localY = y - centerY;
    
    const transformedX = localY + world.width / 2;
    const transformedY = -localX + world.height / 2;
    
    return { x: transformedX, y: transformedY };
}

// تابع toggle برای modal آمار
function toggleStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (!modal) {
        console.error('Stats modal not found');
        return;
    }
    
    if (modal.style.display === 'none' || modal.style.display === '') {
        // باز کردن modal
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        console.log('Stats modal opened');
        if (navigator.vibrate) navigator.vibrate(50);
    } else {
        // بستن modal
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        console.log('Stats modal closed');
    }
}

// تابع چرخش
function toggleRotation() {
    isRotated = !isRotated;
    const canvas = document.getElementById('simulation-canvas');
    const rotateButton = document.getElementById('rotate-toggle');
    
    if (isRotated) {
        canvas.style.transform = 'rotate(90deg)';
        if (rotateButton) rotateButton.innerHTML = '↻';
        showNotification('🔄 دنیا 90 درجه چرخید!', 'info');
    } else {
        canvas.style.transform = 'rotate(0deg)';
        if (rotateButton) rotateButton.innerHTML = '↺';
        showNotification('🔄 دنیا به حالت عادی برگشت!', 'info');
    }
    
    // اضافه کردن تاخیر برای اتمام انیمیشن چرخش
    setTimeout(() => {
        resizeCanvas();
        // اضافه کردن چند غذا و مانع جدید بعد از چرخش برای بهتر شدن نمایش
        if (world) {
            world.addRandomFood(2);
            world.addRandomObstacles(1);
        }
    }, 300);
}

// تابع debug
function toggleDebugInfo() {
    showDebugInfo = !showDebugInfo;
    showNotification(showDebugInfo ? '🔍 Debug mode فعال شد' : '🔍 Debug mode غیرفعال شد', 'info');
}

// رسم اطلاعات debug
function drawCanvasDebugInfo() {
    if (!world || !world.ctx) return;
    
    const ctx = world.ctx;
    
    // رسم چارچوب
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, world.width, world.height);
    
    // خطوط راهنما
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(world.width / 2, 0);
    ctx.lineTo(world.width / 2, world.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, world.height / 2);
    ctx.lineTo(world.width, world.height / 2);
    ctx.stroke();
    
    // نمایش اطلاعات
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Arial';
    ctx.fillText(`${world.width}x${world.height}`, 10, 20);
}

// به‌روزرسانی آمار
function updateStats() {
    animateCounterTo('stored-food', world.nest.storedFood);
    animateCounterTo('male-ant-energy', Math.floor(maleAnt.energy));
    animateCounterTo('female-ant-energy', Math.floor(femaleAnt.energy));
    animateCounterTo('worker-count', workerAnts.length);
    animateCounterTo('larvae-count', larvae.length);
    
    // سن کلونی - میانگین سن نر و ماده
    const maleAge = Date.now() - maleAnt.startTime;
    const femaleAge = Date.now() - femaleAnt.startTime;
    const averageAge = (maleAge + femaleAge) / 2;
    document.getElementById('colony-age').textContent = formatTime(averageAge);
    
    // رنگ انرژی
    const maleEnergyEl = document.getElementById('male-ant-energy');
    const femaleEnergyEl = document.getElementById('female-ant-energy');
    
    maleEnergyEl.style.color = maleAnt.energy < 30 ? '#e74c3c' : '#27ae60';
    femaleEnergyEl.style.color = femaleAnt.energy < 30 ? '#e74c3c' : '#27ae60';
    
    // بروزرسانی آمار پیشرفته
    updateStatsEnhanced();
}

// انیمیشن شمارنده
function animateCounterTo(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    
    if (currentValue !== targetValue) {
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            element.textContent = targetValue;
            element.style.transform = 'scale(1)';
        }, 150);
    }
}

// تایمر تولید مثل
function updateReproductionTimer() {
    const timeLeft = Math.max(0, reproductionCooldown - Date.now());
    const seconds = Math.ceil(timeLeft / 1000);
    
    if (seconds > 0) {
        document.title = `🐜 تولید مثل بعدی: ${seconds}s - شبیه‌سازی مورچه`;
    } else {
        document.title = '🐜 شبیه‌سازی مورچه هوشمند - اکوسیستم مصنوعی';
    }
}

// سیستم نوتیفیکیشن
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const isSmallScreen = window.innerWidth <= 768;
    
    notification.style.cssText = `
        position: fixed;
        ${isSmallScreen ? 'top: 10px; left: 50%; transform: translateX(-50%);' : 'top: 20px; right: 20px;'}
        padding: ${isSmallScreen ? '12px 16px' : '15px 20px'};
        border-radius: ${isSmallScreen ? '8px' : '10px'};
        color: white;
        font-weight: 600;
        font-size: ${isSmallScreen ? '12px' : '14px'};
        z-index: 10000;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        max-width: ${isSmallScreen ? '90vw' : '300px'};
        text-align: center;
        opacity: 0;
        transform: ${isSmallScreen ? 'translateX(-50%) translateY(-20px)' : 'translateX(20px)'};
    `;
    
    // رنگ‌بندی
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // انیمیشن ورود
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = isSmallScreen ? 'translateX(-50%) translateY(0)' : 'translateX(0)';
    }, 100);
    
    // حذف خودکار
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = isSmallScreen ? 'translateX(-50%) translateY(-20px)' : 'translateX(20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// افکت‌های بصری
function addVisualEffects() {
    if (Math.random() < 0.1 && maleAnt.speed > 1) {
        createDustEffect(maleAnt.x, maleAnt.y);
    }
    if (Math.random() < 0.1 && femaleAnt.speed > 1) {
        createDustEffect(femaleAnt.x, femaleAnt.y);
    }
    
    updateVisualEffects();
}

function createDustEffect(x, y) {
    for (let i = 0; i < 3; i++) {
        visualEffects.push({
            type: 'dust',
            x: x + (Math.random() * 10 - 5),
            y: y + (Math.random() * 10 - 5),
            radius: 1 + Math.random() * 2,
            opacity: 0.7,
            life: 20
        });
    }
}

function updateVisualEffects() {
    for (let i = visualEffects.length - 1; i >= 0; i--) {
        const effect = visualEffects[i];
        effect.life--;
        
        if (effect.life <= 0) {
            visualEffects.splice(i, 1);
            continue;
        }
        
        if (effect.type === 'dust') {
            effect.opacity = effect.life / 20;
            effect.radius += 0.1;
            effect.y -= 0.2;
            
            world.ctx.beginPath();
            world.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            world.ctx.fillStyle = `rgba(180, 170, 150, ${effect.opacity})`;
            world.ctx.fill();
        }
        // سایر انواع افکت‌ها...
    }
}

function addEnvironmentalEffects() {
    // افکت‌های محیطی ساده
    if (Math.random() < 0.01) {
        visualEffects.push({
            type: 'dust',
            x: Math.random() * world.width,
            y: world.height + 10,
            radius: 1,
            opacity: 0.3,
            life: 100
        });
    }
}

function createFloatingParticles() {
    setInterval(() => {
        if (Math.random() < 0.3) {
            visualEffects.push({
                type: 'dust',
                x: Math.random() * world.width,
                y: world.height + 10,
                radius: 1 + Math.random(),
                opacity: 0.2,
                life: 150
            });
        }
    }, 1000);
}

function createBirthEffect(x, y) {
    for (let i = 0; i < 5; i++) {
        visualEffects.push({
            type: 'dust',
            x: x + (Math.random() * 20 - 10),
            y: y + (Math.random() * 20 - 10),
            radius: 2 + Math.random() * 2,
            opacity: 1,
            life: 30
        });
    }
}

function createClickEffect(x, y) {
    // افکت ساده کلیک
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: fixed;
        left: ${x - 25}px;
        top: ${y - 25}px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
        pointer-events: none;
        z-index: 1000;
        transform: scale(0);
        opacity: 1;
        transition: all 0.6s ease-out;
    `;
    
    document.body.appendChild(ripple);
    
    setTimeout(() => {
        ripple.style.transform = 'scale(4)';
        ripple.style.opacity = '0';
    }, 10);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

function cleanupEffects() {
    if (visualEffects.length > 100) {
        visualEffects.splice(0, visualEffects.length - 100);
    }
}

// ضروری: قرار دادن toggleStatsModal در window برای دسترسی از HTML
window.toggleStatsModal = function() {
    console.log('toggleStatsModal called from HTML');
    toggleStatsModal();
};
window.toggleRotation = toggleRotation;
window.toggleDebugInfo = toggleDebugInfo;
window.toggleSoundButton = toggleSoundButton;

// شروع برنامه
window.addEventListener('load', () => {
    // تعریف توابع global برای HTML
    window.toggleStatsModal = function() {
        console.log('Window toggleStatsModal called');
        const modal = document.getElementById('stats-modal');
        if (!modal) {
            console.error('Stats modal not found');
            return;
        }
        
        console.log('Current modal display:', modal.style.display);
        
        if (modal.style.display === 'none' || modal.style.display === '') {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
            console.log('Modal opened');
        } else {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            console.log('Modal closed');
        }
    };
    
    window.toggleSoundButton = toggleSoundButton;
    
    init();
    console.log('🎉 شبیه‌سازی مورچه آماده است!');
});

// تابع بازتوزیع عناصر بعد از تغییر ابعاد
function redistributeElements(oldWidth, oldHeight, newWidth, newHeight) {
    if (!world) return;
    
    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;
    
    // بازتوزیع غذاها
    if (world.foods && world.foods.length > 0) {
        world.foods.forEach(food => {
            food.x = Math.max(20, Math.min(newWidth - 20, food.x * scaleX));
            food.y = Math.max(20, Math.min(newHeight - 20, food.y * scaleY));
        });
    }
    
    // بازتوزیع موانع
    if (world.obstacles && world.obstacles.length > 0) {
        world.obstacles.forEach(obstacle => {
            obstacle.x = Math.max(20, Math.min(newWidth - 20, obstacle.x * scaleX));
            obstacle.y = Math.max(20, Math.min(newHeight - 20, obstacle.y * scaleY));
        });
    }
    
    // بازتوزیع المان‌های محیطی
    if (world.redistributeEnvironmentElements) {
        world.redistributeEnvironmentElements(scaleX, scaleY);
    }
    
    // بازتوزیع مورچه‌ها
    if (maleAnt) {
        maleAnt.x = Math.max(20, Math.min(newWidth - 20, maleAnt.x * scaleX));
        maleAnt.y = Math.max(20, Math.min(newHeight - 20, maleAnt.y * scaleY));
    }
    
    if (femaleAnt) {
        femaleAnt.x = Math.max(20, Math.min(newWidth - 20, femaleAnt.x * scaleX));
        femaleAnt.y = Math.max(20, Math.min(newHeight - 20, femaleAnt.y * scaleY));
    }
    
    // بازتوزیع مورچه‌های کارگر
    if (workerAnts && workerAnts.length > 0) {
        workerAnts.forEach(ant => {
            ant.x = Math.max(20, Math.min(newWidth - 20, ant.x * scaleX));
            ant.y = Math.max(20, Math.min(newHeight - 20, ant.y * scaleY));
        });
    }
    
    // بازتوزیع لاروها
    if (larvae && larvae.length > 0) {
        larvae.forEach(larva => {
            larva.x = Math.max(20, Math.min(newWidth - 20, larva.x * scaleX));
            larva.y = Math.max(20, Math.min(newHeight - 20, larva.y * scaleY));
        });
    }
    
    console.log(`Elements redistributed from ${oldWidth}x${oldHeight} to ${newWidth}x${newHeight}`);
}
