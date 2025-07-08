class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.obstacles = [];
        this.foods = [];
        this.nest = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 25,
            storedFood: 0,
            glowIntensity: 0
        };
        
        // جزئیات محیط بهبود یافته
        this.environmentDetails = {
            grass: [],
            flowers: [],
            pebbles: [],
            dirtPatches: [],
            waterDrops: [],
            mushrooms: [],
            twigs: []
        };
        
        // افکت‌های آب و هوایی
        this.weather = {
            windStrength: 0.5,
            windDirection: 0,
            timeOfDay: 0.5, // 0 = شب، 1 = روز
            rainDrops: []
        };
        
        // شمارنده زمان برای انیمیشن‌ها
        this.time = 0;
        
        // ایجاد قورباغه
        this.frog = new Frog(this);
    }

    initialize() {
        // تنظیم اندازه کانواس متناسب با صفحه
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // اضافه کردن چند غذا و مانع اولیه
        this.addRandomFood(5);
        this.addRandomObstacles(3);
        
        // ایجاد جزئیات محیط طبیعی
        this.generateEnvironmentDetails();
    }

    generateEnvironmentDetails() {
        // پاک کردن المان‌های قبلی
        this.environmentDetails = {
            grass: [],
            flowers: [],
            pebbles: [],
            dirtPatches: [],
            waterDrops: [],
            mushrooms: [],
            twigs: []
        };
        
        // ایجاد علف‌های متنوع
        for (let i = 0; i < 80; i++) {
            this.environmentDetails.grass.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                height: 3 + Math.random() * 12,
                width: 1 + Math.random() * 3,
                angle: Math.random() * 0.4 - 0.2,
                swayPhase: Math.random() * Math.PI * 2,
                color: `hsl(${95 + Math.random() * 25}, ${60 + Math.random() * 40}%, ${35 + Math.random() * 20}%)`
            });
        }
        
        // ایجاد گل‌های زیبا
        for (let i = 0; i < 15; i++) {
            this.environmentDetails.flowers.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 3 + Math.random() * 4,
                petals: 5 + Math.floor(Math.random() * 3),
                color: `hsl(${Math.random() * 360}, 80%, 60%)`,
                centerColor: `hsl(${45 + Math.random() * 30}, 90%, 50%)`,
                bloomPhase: Math.random() * Math.PI * 2
            });
        }
        
        // سنگریزه‌های سه‌بعدی
        for (let i = 0; i < 40; i++) {
            this.environmentDetails.pebbles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 2 + Math.random() * 6,
                color: `hsl(${30 + Math.random() * 40}, ${20 + Math.random() * 30}%, ${45 + Math.random() * 25}%)`,
                shadowOffset: 1 + Math.random() * 2
            });
        }
        
        // لکه‌های خاک با بافت
        for (let i = 0; i < 20; i++) {
            this.environmentDetails.dirtPatches.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 15 + Math.random() * 30,
                color: `hsla(${25 + Math.random() * 15}, ${30 + Math.random() * 20}%, ${25 + Math.random() * 15}%, 0.4)`,
                pattern: Math.random() > 0.5 ? 'cracked' : 'smooth'
            });
        }
        
        // قطره‌های آب درخشان
        for (let i = 0; i < 12; i++) {
            this.environmentDetails.waterDrops.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 2 + Math.random() * 3,
                sparkle: Math.random() * Math.PI * 2
            });
        }
        
        // قارچ‌های کوچک
        for (let i = 0; i < 8; i++) {
            this.environmentDetails.mushrooms.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                capRadius: 4 + Math.random() * 6,
                stemHeight: 3 + Math.random() * 4,
                capColor: `hsl(${Math.random() * 60 + 10}, 60%, 50%)`,
                spots: Math.random() > 0.5
            });
        }
        
        // شاخه‌های کوچک
        for (let i = 0; i < 10; i++) {
            this.environmentDetails.twigs.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                length: 8 + Math.random() * 15,
                angle: Math.random() * Math.PI * 2,
                thickness: 1 + Math.random() * 2
            });
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = this.canvas.width * 0.6;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // تنظیم مجدد موقعیت لانه
        this.nest.x = this.width / 2;
        this.nest.y = this.height / 2;
        
        // بازسازی جزئیات محیط
        this.environmentDetails = {
            grass: [],
            pebbles: [],
            dirtPatches: []
        };
        this.generateEnvironmentDetails();
    }

    draw() {
        this.time += 0.02; // برای انیمیشن‌ها
        
        // پاک کردن کانواس
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // گرادیانت پس‌زمینه پویا
        this.drawDynamicBackground();
        
        // کشیدن لکه‌های خاک با بافت
        this.drawDirtPatches();
        
        // کشیدن شاخه‌ها
        this.drawTwigs();
        
        // کشیدن سنگریزه‌ها با سایه
        this.drawPebbles();
        
        // کشیدن قارچ‌ها
        this.drawMushrooms();
        
        // کشیدن قطره‌های آب درخشان
        this.drawWaterDrops();
        
        // کشیدن علف‌ها با افکت باد
        this.drawGrass();
        
        // کشیدن گل‌ها
        this.drawFlowers();
        
        // کشیدن لانه با افکت‌های خاص
        this.drawNest();
        
        // کشیدن غذاها با جذابیت بیشتر
        this.drawFood();
        
        // کشیدن موانع سه‌بعدی
        this.drawObstacles();
        
        // افکت‌های نوری
        this.addLightingEffects();
        
        // افکت‌های جوی
        // افکت‌های آب و هوایی
        this.drawWeatherEffects();
        
        // کشیدن قورباغه
        this.frog.draw();
    }
    
    drawEnvironment() {
        // کشیدن لکه‌های خاک
        for (const patch of this.environmentDetails.dirtPatches) {
            this.ctx.beginPath();
            this.ctx.arc(patch.x, patch.y, patch.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = patch.color;
            this.ctx.fill();
        }
        
        // کشیدن سنگریزه‌ها
        for (const pebble of this.environmentDetails.pebbles) {
            this.ctx.beginPath();
            this.ctx.arc(pebble.x, pebble.y, pebble.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = pebble.color;
            this.ctx.fill();
        }
        
        // کشیدن علف‌ها
        for (const grass of this.environmentDetails.grass) {
            this.ctx.beginPath();
            this.ctx.rect(grass.x, grass.y - grass.height, grass.width, grass.height);
            this.ctx.fillStyle = grass.color;
            this.ctx.fill();
        }
    }
    
    drawNest() {
        const x = this.nest.x;
        const y = this.nest.y;
        const size = this.nest.radius * 2;
        
        // سایه خانه
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x - size/2 + 5, y - size/2 + 5, size, size);
        
        // دیوارهای خانه
        this.ctx.fillStyle = '#7d5a38';
        this.ctx.fillRect(x - size/2, y - size/2, size, size);
        
        // سقف خانه
        this.ctx.beginPath();
        this.ctx.moveTo(x - size/2 - 10, y - size/2);
        this.ctx.lineTo(x, y - size);
        this.ctx.lineTo(x + size/2 + 10, y - size/2);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();
        
        // درب ورودی
        this.ctx.fillStyle = '#3e2e1b';
        this.ctx.fillRect(x - size/4, y, size/2, size/2);
        
        // پنجره
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x - size/3, y - size/3, size/4, size/4);
        
        // قاب پنجره
        this.ctx.strokeStyle = '#3e2e1b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - size/3, y - size/3, size/4, size/4);
    }
    
    drawFood() {
        for (const food of this.foods) {
            // سایه دانه
            this.ctx.beginPath();
            this.ctx.ellipse(
                food.x,
                food.y + 2,
                food.radius * 0.7,
                food.radius * 0.4,
                Math.PI/4,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fill();
            
            // دانه گندم
            this.ctx.beginPath();
            this.ctx.ellipse(
                food.x,
                food.y,
                food.radius * 0.7,
                food.radius * 0.4,
                Math.PI/4,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = '#DAA520'; // رنگ گندم
            this.ctx.fill();
            
            // برجستگی دانه
            this.ctx.beginPath();
            this.ctx.ellipse(
                food.x - 5,
                food.y - 2,
                food.radius * 0.3,
                food.radius * 0.2,
                Math.PI/4,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = '#F4C430';
            this.ctx.fill();
        }
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            // سایه سنگ
            this.ctx.beginPath();
            this.ctx.ellipse(
                obstacle.x + obstacle.width/2 + 5, 
                obstacle.y + obstacle.height/2 + 5, 
                obstacle.width/1.5, 
                obstacle.height/1.8, 
                Math.PI/4,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fill();

            // بدنه اصلی سنگ
            this.ctx.beginPath();
            this.ctx.ellipse(
                obstacle.x + obstacle.width/2, 
                obstacle.y + obstacle.height/2, 
                obstacle.width/1.5, 
                obstacle.height/1.8, 
                Math.PI/4,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = '#6B4423';
            this.ctx.fill();
        }
    }

    addObstacle(x, y) {
        this.obstacles.push({
            x: x,
            y: y,
            width: 60 + Math.floor(Math.random() * 60),  // دو برابر شدن اندازه
            height: 60 + Math.floor(Math.random() * 60)  // دو برابر شدن اندازه
        });
    }

    addFood(x, y) {
        this.foods.push({
            x: x,
            y: y,
            radius: 25, // سایز ده برابر شده
            value: 10 + Math.floor(Math.random() * 10)
        });
    }

    addObstacle(x, y) {
        this.obstacles.push({
            x: x,
            y: y,
            width: 30 + Math.floor(Math.random() * 30),
            height: 30 + Math.floor(Math.random() * 30)
        });
    }

    addRandomFood(count) {
        for (let i = 0; i < count; i++) {
            this.addFood(
                Math.random() * this.width,
                Math.random() * this.height
            );
        }
        
        // پخش صدای اضافه کردن غذا فقط اگر کاربر صدا را فعال کرده
        if (typeof soundManager !== 'undefined' && soundManager && soundManager.audioContext && soundManager.audioContext.state === 'running') {
            soundManager.playSound('food_add', 0.5);
        }
    }

    addRandomObstacles(count) {
        for (let i = 0; i < count; i++) {
            this.addObstacle(
                Math.random() * this.width,
                Math.random() * this.height
            );
        }
        
        // پخش صدای اضافه کردن مانع فقط اگر کاربر صدا را فعال کرده
        if (typeof soundManager !== 'undefined' && soundManager && soundManager.audioContext && soundManager.audioContext.state === 'running') {
            soundManager.playSound('obstacle_add', 0.6);
        }
    }

    isCollision(x, y, radius, obstacles) {
        for (const obstacle of obstacles) {
            // بررسی برخورد با محیط مستطیلی موانع
            const closestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width));
            const closestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height));
            
            const distanceX = x - closestX;
            const distanceY = y - closestY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            if (distance < radius) {
                return true;
            }
        }
        return false;
    }

    getFoodAt(x, y, radius) {
        for (let i = 0; i < this.foods.length; i++) {
            const food = this.foods[i];
            const distance = Math.sqrt((x - food.x) ** 2 + (y - food.y) ** 2);
            
            if (distance < radius + food.radius) {
                // غذا پیدا شد
                const foundFood = this.foods.splice(i, 1)[0];
                return foundFood;
            }
        }
        return null;
    }

    isNearNest(x, y, radius) {
        const distance = Math.sqrt((x - this.nest.x) ** 2 + (y - this.nest.y) ** 2);
        return distance < this.nest.radius + radius;
    }

    storeFood(value) {
        this.nest.storedFood += value;
        document.getElementById('stored-food').textContent = this.nest.storedFood;
    }
    
    // متدهای اضافه شده برای افکت‌های محیطی
    addWindEffect() {
        // شبیه‌سازی حرکت علف‌ها با باد
        for (const grass of this.environmentDetails.grass) {
            grass.angle = (Math.sin(Date.now() * 0.005 + grass.x * 0.1) * 0.1);
            
            this.ctx.save();
            this.ctx.translate(grass.x, grass.y);
            this.ctx.rotate(grass.angle);
            this.ctx.beginPath();
            this.ctx.rect(-grass.width/2, -grass.height, grass.width, grass.height);
            this.ctx.fillStyle = grass.color;
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    addLightingEffects() {
        // افکت‌های نور و سایه در محیط
        
        // افکت نور خورشید در گوشه کانواس
        const gradient = this.ctx.createRadialGradient(
            0, 0, 
            0, 
            0, 0, 
            this.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(255, 253, 230, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 253, 230, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // نقاط روشن تصادفی (انعکاس نور روی سطح)
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = 1 + Math.random() * 3;
            const opacity = 0.05 + Math.random() * 0.1;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.fill();
        }
    }
    
    // گرادیانت پس‌زمینه پویا
    drawDynamicBackground() {
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width, this.height)
        );
        
        const lightness = 85 + Math.sin(this.time * 0.5) * 5;
        gradient.addColorStop(0, `hsl(120, 30%, ${lightness}%)`);
        gradient.addColorStop(0.7, `hsl(110, 40%, ${lightness - 10}%)`);
        gradient.addColorStop(1, `hsl(95, 50%, ${lightness - 20}%)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // کشیدن لکه‌های خاک با بافت
    drawDirtPatches() {
        for (const patch of this.environmentDetails.dirtPatches) {
            this.ctx.save();
            
            // سایه نرم
            this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            this.ctx.beginPath();
            this.ctx.arc(patch.x, patch.y, patch.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = patch.color;
            this.ctx.fill();
            
            // بافت ترک‌خورده
            if (patch.pattern === 'cracked') {
                this.ctx.strokeStyle = `hsla(20, 40%, 20%, 0.3)`;
                this.ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    this.ctx.beginPath();
                    const angle = (i * Math.PI * 2) / 3;
                    const startX = patch.x + Math.cos(angle) * patch.radius * 0.3;
                    const startY = patch.y + Math.sin(angle) * patch.radius * 0.3;
                    const endX = patch.x + Math.cos(angle) * patch.radius * 0.8;
                    const endY = patch.y + Math.sin(angle) * patch.radius * 0.8;
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.stroke();
                }
            }
            
            this.ctx.restore();
        }
    }
    
    // کشیدن شاخه‌ها
    drawTwigs() {
        for (const twig of this.environmentDetails.twigs) {
            this.ctx.save();
            this.ctx.translate(twig.x, twig.y);
            this.ctx.rotate(twig.angle);
            
            // سایه
            this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            this.ctx.lineWidth = twig.thickness + 1;
            this.ctx.beginPath();
            this.ctx.moveTo(1, 1);
            this.ctx.lineTo(twig.length + 1, 1);
            this.ctx.stroke();
            
            // شاخه اصلی
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = twig.thickness;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(twig.length, 0);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    // کشیدن سنگریزه‌ها با سایه
    drawPebbles() {
        for (const pebble of this.environmentDetails.pebbles) {
            this.ctx.save();
            
            // سایه
            this.ctx.beginPath();
            this.ctx.arc(pebble.x + pebble.shadowOffset, pebble.y + pebble.shadowOffset, pebble.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            this.ctx.fill();
            
            // سنگ اصلی با گرادیانت
            const gradient = this.ctx.createRadialGradient(
                pebble.x - pebble.radius * 0.3, pebble.y - pebble.radius * 0.3, 0,
                pebble.x, pebble.y, pebble.radius
            );
            gradient.addColorStop(0, pebble.color.replace('hsl', 'hsla').replace(')', ', 1.2)'));
            gradient.addColorStop(1, pebble.color.replace('hsl', 'hsla').replace(')', ', 0.8)'));
            
            this.ctx.beginPath();
            this.ctx.arc(pebble.x, pebble.y, pebble.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    // کشیدن قارچ‌ها
    drawMushrooms() {
        for (const mushroom of this.environmentDetails.mushrooms) {
            this.ctx.save();
            
            // ساقه
            this.ctx.fillStyle = '#DEB887';
            this.ctx.fillRect(mushroom.x - 1, mushroom.y - mushroom.stemHeight, 2, mushroom.stemHeight);
            
            // کلاهک
            this.ctx.beginPath();
            this.ctx.arc(mushroom.x, mushroom.y - mushroom.stemHeight, mushroom.capRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = mushroom.capColor;
            this.ctx.fill();
            
            // نقطه‌ها
            if (mushroom.spots) {
                this.ctx.fillStyle = 'white';
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2) / 3;
                    const spotX = mushroom.x + Math.cos(angle) * mushroom.capRadius * 0.5;
                    const spotY = mushroom.y - mushroom.stemHeight + Math.sin(angle) * mushroom.capRadius * 0.5;
                    this.ctx.beginPath();
                    this.ctx.arc(spotX, spotY, 1, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            this.ctx.restore();
        }
    }
    
    // کشیدن قطره‌های آب درخشان
    drawWaterDrops() {
        for (const drop of this.environmentDetails.waterDrops) {
            this.ctx.save();
            
            drop.sparkle += 0.1;
            const sparkleIntensity = Math.sin(drop.sparkle) * 0.5 + 0.5;
            
            // درخشش
            this.ctx.shadowColor = 'rgba(173,216,230,0.8)';
            this.ctx.shadowBlur = 5 + sparkleIntensity * 5;
            
            // قطره آب
            const gradient = this.ctx.createRadialGradient(
                drop.x - drop.radius * 0.3, drop.y - drop.radius * 0.3, 0,
                drop.x, drop.y, drop.radius
            );
            gradient.addColorStop(0, 'rgba(173,216,230,0.9)');
            gradient.addColorStop(0.7, 'rgba(135,206,235,0.7)');
            gradient.addColorStop(1, 'rgba(70,130,180,0.5)');
            
            this.ctx.beginPath();
            this.ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // نقطه درخشش
            this.ctx.beginPath();
            this.ctx.arc(drop.x - drop.radius * 0.4, drop.y - drop.radius * 0.4, 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255,255,255,${sparkleIntensity})`;
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    // کشیدن علف‌ها با افکت باد
    drawGrass() {
        this.weather.windDirection += 0.01;
        
        for (const grass of this.environmentDetails.grass) {
            this.ctx.save();
            
            grass.swayPhase += 0.05;
            const sway = Math.sin(grass.swayPhase) * 0.1 * this.weather.windStrength;
            
            this.ctx.translate(grass.x, grass.y);
            this.ctx.rotate(grass.angle + sway);
            
            // گرادیانت علف
            const gradient = this.ctx.createLinearGradient(0, 0, 0, -grass.height);
            gradient.addColorStop(0, grass.color.replace('hsl', 'hsla').replace(')', ', 0.8)'));
            gradient.addColorStop(1, grass.color.replace('hsl', 'hsla').replace(')', ', 1)'));
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = grass.width;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, -grass.height);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    // کشیدن گل‌ها
    drawFlowers() {
        for (const flower of this.environmentDetails.flowers) {
            this.ctx.save();
            this.ctx.translate(flower.x, flower.y);
            
            flower.bloomPhase += 0.02;
            const bloom = Math.sin(flower.bloomPhase) * 0.1 + 1;
            
            // گلبرگ‌ها
            for (let i = 0; i < flower.petals; i++) {
                this.ctx.save();
                this.ctx.rotate((i * Math.PI * 2) / flower.petals);
                
                this.ctx.beginPath();
                this.ctx.ellipse(0, -flower.radius * bloom, flower.radius * 0.6, flower.radius * bloom, 0, 0, Math.PI * 2);
                this.ctx.fillStyle = flower.color;
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            // مرکز گل
            this.ctx.beginPath();
            this.ctx.arc(0, 0, flower.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fillStyle = flower.centerColor;
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    // افکت‌های جوی
    drawWeatherEffects() {
        if (Math.random() < 0.3) {
            // نور خورشید
            const sunX = this.width * 0.8;
            const sunY = this.height * 0.2;
            
            this.ctx.save();
            this.ctx.globalAlpha = 0.1;
            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath();
                this.ctx.arc(sunX, sunY, 20 + i * 10, 0, Math.PI * 2);
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fill();
            }
            this.ctx.restore();
        }
        
        // افکت باران ملایم
        if (Math.random() < 0.05) {
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = 'rgba(135, 206, 250, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.moveTo(Math.random() * this.width, 0);
                this.ctx.lineTo(Math.random() * this.width - 10, Math.random() * 50);
                this.ctx.stroke();
            }
        }
    }

    // بازتوزیع المان‌های محیطی
    redistributeEnvironmentElements(scaleX, scaleY) {
        // بازتوزیع علف‌ها
        this.environmentDetails.grass.forEach(grass => {
            grass.x = Math.max(0, Math.min(this.width, grass.x * scaleX));
            grass.y = Math.max(0, Math.min(this.height, grass.y * scaleY));
        });
        
        // بازتوزیع گل‌ها
        this.environmentDetails.flowers.forEach(flower => {
            flower.x = Math.max(0, Math.min(this.width, flower.x * scaleX));
            flower.y = Math.max(0, Math.min(this.height, flower.y * scaleY));
        });
        
        // بازتوزیع سنگریزه‌ها
        this.environmentDetails.pebbles.forEach(pebble => {
            pebble.x = Math.max(0, Math.min(this.width, pebble.x * scaleX));
            pebble.y = Math.max(0, Math.min(this.height, pebble.y * scaleY));
        });
        
        // بازتوزیع لکه‌های خاک
        this.environmentDetails.dirtPatches.forEach(patch => {
            patch.x = Math.max(0, Math.min(this.width, patch.x * scaleX));
            patch.y = Math.max(0, Math.min(this.height, patch.y * scaleY));
        });
        
        // بازتوزیع قطرات آب
        this.environmentDetails.waterDrops.forEach(drop => {
            drop.x = Math.max(0, Math.min(this.width, drop.x * scaleX));
            drop.y = Math.max(0, Math.min(this.height, drop.y * scaleY));
        });
        
        // بازتوزیع قارچ‌ها
        this.environmentDetails.mushrooms.forEach(mushroom => {
            mushroom.x = Math.max(0, Math.min(this.width, mushroom.x * scaleX));
            mushroom.y = Math.max(0, Math.min(this.height, mushroom.y * scaleY));
        });
        
        // بازتوزیع شاخه‌ها
        this.environmentDetails.twigs.forEach(twig => {
            twig.x = Math.max(0, Math.min(this.width, twig.x * scaleX));
            twig.y = Math.max(0, Math.min(this.height, twig.y * scaleY));
        });
    }
}