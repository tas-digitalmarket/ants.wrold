// Service Worker برای ادامه شبیه‌سازی در پس‌زمینه
const CACHE_NAME = 'ant-simulation-v2';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './world.js',
    './ant.js',
    './food.js',
    './larva.js',
    './environmental-effects.js',
    './performance-optimizer.js',
    './save-system.js',
    './sound-manager.js'
];

// نصب Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                self.skipWaiting();
            })
    );
});

// فعال‌سازی Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// مدیریت درخواست‌ها
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// متغیرهای شبیه‌سازی در پس‌زمینه
let backgroundSimulation = {
    isRunning: false,
    ants: [],
    larvae: [],
    food: 0,
    lastUpdate: Date.now(),
    reproductionTimer: 0
};

// شروع شبیه‌سازی پس‌زمینه
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'START_BACKGROUND_SIMULATION') {
        console.log('Starting background simulation...');
        backgroundSimulation = {
            ...backgroundSimulation,
            ...event.data.simulationState,
            isRunning: true,
            lastUpdate: Date.now()
        };
        
        // شروع حلقه شبیه‌سازی پس‌زمینه
        startBackgroundLoop();
    } else if (event.data && event.data.type === 'STOP_BACKGROUND_SIMULATION') {
        console.log('Stopping background simulation...');
        backgroundSimulation.isRunning = false;
    } else if (event.data && event.data.type === 'GET_SIMULATION_STATE') {
        // ارسال وضعیت فعلی شبیه‌سازی
        event.ports[0].postMessage({
            type: 'SIMULATION_STATE',
            state: backgroundSimulation
        });
    }
});

// حلقه شبیه‌سازی پس‌زمینه
function startBackgroundLoop() {
    if (!backgroundSimulation.isRunning) return;
    
    const now = Date.now();
    const deltaTime = now - backgroundSimulation.lastUpdate;
    
    // به‌روزرسانی هر 5 ثانیه (برای صرفه‌جویی در باتری)
    if (deltaTime >= 5000) {
        updateBackgroundSimulation(deltaTime);
        backgroundSimulation.lastUpdate = now;
        
        // اطلاع‌رسانی به کلاینت
        notifyClients();
    }
    
    // ادامه حلقه
    setTimeout(startBackgroundLoop, 1000);
}

// به‌روزرسانی شبیه‌سازی در پس‌زمینه
function updateBackgroundSimulation(deltaTime) {
    const seconds = deltaTime / 1000;
    
    // شبیه‌سازی تولید مثل
    backgroundSimulation.reproductionTimer += deltaTime;
    if (backgroundSimulation.reproductionTimer >= 120000) { // 2 دقیقه
        // تولید لارو جدید
        backgroundSimulation.larvae.push({
            id: Date.now(),
            hatchTime: Date.now() + 30000, // 30 ثانیه برای هچ شدن
            x: Math.random() * 800,
            y: Math.random() * 600
        });
        backgroundSimulation.reproductionTimer = 0;
        
        console.log('New larva created in background');
    }
    
    // بررسی هچ شدن لاروها
    backgroundSimulation.larvae = backgroundSimulation.larvae.filter(larva => {
        if (Date.now() >= larva.hatchTime) {
            // تبدیل لارو به مورچه کارگر
            backgroundSimulation.ants.push({
                id: Date.now(),
                type: 'worker',
                energy: 100,
                x: larva.x,
                y: larva.y,
                birthTime: Date.now()
            });
            console.log('Larva hatched in background');
            return false; // حذف لارو
        }
        return true;
    });
    
    // شبیه‌سازی جمع‌آوری غذا
    backgroundSimulation.ants.forEach(ant => {
        if (ant.type === 'worker' && Math.random() < 0.1) {
            backgroundSimulation.food += 1;
        }
        
        // کاهش انرژی
        ant.energy = Math.max(0, ant.energy - seconds * 0.1);
    });
    
    // حذف مورچه‌های بدون انرژی
    backgroundSimulation.ants = backgroundSimulation.ants.filter(ant => ant.energy > 0);
}

// اطلاع‌رسانی به تمام کلاینت‌ها
function notifyClients() {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'BACKGROUND_UPDATE',
                state: backgroundSimulation
            });
        });
    });
}

// مدیریت اعلان‌ها
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked');
    event.notification.close();
    
    // باز کردن برنامه
    event.waitUntil(
        clients.openWindow('./index.html')
    );
});

// ارسال اعلان‌های مهم
function sendNotification(title, body, data = {}) {
    if (Notification.permission === 'granted') {
        self.registration.showNotification(title, {
            body: body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐜</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐜</text></svg>',
            data: data,
            requireInteraction: false,
            silent: false
        });
    }
}

// ارسال اعلان برای رویدادهای مهم
setInterval(() => {
    if (backgroundSimulation.isRunning) {
        const totalAnts = backgroundSimulation.ants.length;
        const totalLarvae = backgroundSimulation.larvae.length;
        
        if (totalAnts > 0 && totalAnts % 5 === 0) {
            sendNotification(
                '🐜 کلونی مورچه‌ها در حال رشد!',
                `اکنون ${totalAnts} مورچه کارگر و ${totalLarvae} لارو دارید.`,
                { type: 'colony_growth' }
            );
        }
    }
}, 60000); // هر دقیقه چک کن
