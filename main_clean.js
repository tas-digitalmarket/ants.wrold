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
    
    // تنظیم اندازه کانواس
    resizeCanvas();
    
    world = new World(canvas);
    world.initialize();
    
    // پاک کردن آرایه‌ها برای شروع مجدد
    workerAnts = [];
    larvae = [];
    
    maleAnt = new Ant(world, 'male');
    femaleAnt = new Ant(world, 'female');
    
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
        if (isRotated) {
            world.width = vh;
            world.height = vw;
        } else {
            world.width = vw;
            world.height = vh;
        }
        
        world.canvas = canvas;
        world.ctx = canvas.getContext('2d');
        
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
    // بررسی زمان تولید مثل
    if (Date.now() >= reproductionCooldown) {
        maleAnt.x = world.nest.x;
        maleAnt.y = world.nest.y;
        femaleAnt.x = world.nest.x;
        femaleAnt.y = world.nest.y;
        
        createLarva();
        reproductionCooldown = Date.now() + 120000; // 2 دقیقه
    }
    
    // به‌روزرسانی مورچه‌های اصلی
    maleAnt.update();
    femaleAnt.update();

    // به‌روزرسانی مورچه‌های کارگر
    for (let ant of workerAnts) {
        ant.update();
    }
    
    // به‌روزرسانی غذا
    foodManager.update();
    
    // رسم دنیا و افکت‌ها
    world.draw();
    addVisualEffects();
    addEnvironmentalEffects();
    
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
        } else {
            larva.draw();
        }
    }
    
    // رسم مورچه‌های کارگر
    for (let ant of workerAnts) {
        ant.draw();
    }
    
    updateStats();
    
    // نمایش اطلاعات debug اگر فعال باشد
    if (showDebugInfo) {
        drawCanvasDebugInfo();
    }
    
    // تمیز کردن افکت‌ها
    cleanupEffects();
    
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
    // دکمه‌های کنترل
    document.getElementById('add-food').addEventListener('click', () => {
        world.addRandomFood(3);
        showNotification('🍯 3 واحد غذا اضافه شد!', 'success');
        if (navigator.vibrate) navigator.vibrate(100);
    });
    
    document.getElementById('add-obstacle').addEventListener('click', () => {
        world.addRandomObstacles(1);
        showNotification('🪨 مانع جدید اضافه شد!', 'info');
        if (navigator.vibrate) navigator.vibrate(100);
    });
    
    document.getElementById('restart').addEventListener('click', () => {
        cancelAnimationFrame(animationId);
        showNotification('🔄 شبیه‌سازی مجدداً شروع شد!', 'warning');
        init();
        if (navigator.vibrate) navigator.vibrate(200);
    });
    
    // کلیک روی کانواس
    world.canvas.addEventListener('click', (event) => {
        const rect = world.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const transformed = transformCoordinates(x, y);
        
        world.addFood(transformed.x, transformed.y);
        createClickEffect(event.clientX, event.clientY);
        showNotification('🍯 غذا اضافه شد!', 'success');
        if (navigator.vibrate) navigator.vibrate(50);
    });
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
    
    setTimeout(() => {
        resizeCanvas();
    }, 500);
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
    
    document.getElementById('male-ant-age').textContent = formatTime(Date.now() - maleAnt.startTime);
    document.getElementById('female-ant-age').textContent = formatTime(Date.now() - femaleAnt.startTime);
    
    // رنگ انرژی
    const maleEnergyEl = document.getElementById('male-ant-energy');
    const femaleEnergyEl = document.getElementById('female-ant-energy');
    
    maleEnergyEl.style.color = maleAnt.energy < 30 ? '#e74c3c' : '#27ae60';
    femaleEnergyEl.style.color = femaleAnt.energy < 30 ? '#e74c3c' : '#27ae60';
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
window.toggleStatsModal = toggleStatsModal;
window.toggleRotation = toggleRotation;
window.toggleDebugInfo = toggleDebugInfo;

// شروع برنامه
window.addEventListener('load', () => {
    init();
    console.log('🎉 شبیه‌سازی مورچه آماده است!');
});
