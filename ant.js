class Ant {
    constructor(world, gender = 'male') {
        this.world = world;
        this.gender = gender;
        this.hasMated = false; // برای جلوگیری از جفت‌گیری مجدد در همان چرخه
        this.baseColor = gender === 'male' ? '#333333' : '#4A3333'; // رنگ پایه
        this.restColor = gender === 'male' ? '#222222' : '#3A2323'; // رنگ استراحت
        this.color = this.baseColor;
        this.radius = gender === 'male' ? 8 : 10; // مورچه ماده کمی بزرگتر
        this.x = world.nest.x;
        this.y = world.nest.y;
        this.speed = 2;
        this.direction = Math.random() * Math.PI * 2;
        this.energy = 100;
        this.maxEnergy = 100;
        this.carriedFood = null;
        this.searchRadius = 100;
        this.state = 'searching'; // searching, returning, eating
        this.brain = {
            memoryLength: 10,
            positions: [],
            lastFoundFoodAt: null,
            targetX: null,
            targetY: null
        };
        // اضافه شدن طول عمر:
        this.age = 0;
        this.maxAge = 10000; // مقدار نمونه (می‌توانید به دلخواه تغییر دهید)
        this.startTime = Date.now();
        this.lastEnergyDecrease = Date.now();
        this.isDead = false;
        this.experienceMemory = []; // Array to store all experiences
        this.memoryLimit = 100;      // Maximum number of experiences to keep
        this.restProbability = 0.007; // احتمال رفتن به حالت استراحت
        this.maxRestDuration = 100; // حداکثر زمان استراحت
        this.restDuration = 0; // مدت زمان باقی‌مانده استراحت
    }
    logExperience(type, details) {
        const experience = {
            type,
            details,
            timestamp: Date.now()
        };
        this.experienceMemory.push(experience);
        if (this.experienceMemory.length > this.memoryLimit) {
            this.experienceMemory.shift();
        }
    }

    reset() {
        this.isDead = false;
        this.x = this.world.nest.x;
        this.y = this.world.nest.y;
        this.energy = this.maxEnergy;
        this.carriedFood = null;
        this.state = 'searching';
        this.direction = Math.random() * Math.PI * 2;
        this.age = 0;
        this.startTime = Date.now();
        this.lastEnergyDecrease = Date.now();
        this.color = this.baseColor;
    }

    update() {
        if (this.isDead) {
            return;
        }

        // بررسی حالت استراحت
        if (this.state === 'resting') {
            this.restDuration--;
            if (this.restDuration <= 0) {
                // بررسی وضعیت قبل از استراحت
                if (this.carriedFood) {
                    this.state = 'returning'; // اگر غذا دارد به لانه برگردد
                } else {
                    this.state = 'searching'; // اگر غذا ندارد به جستجو ادامه دهد
                }
            }
            return;
        }

        // احتمال رفتن به حالت استراحت
        if (Math.random() < this.restProbability) {
            this.state = 'resting';
            this.restDuration = Math.floor(Math.random() * this.maxRestDuration);
            return;
        }

        // افزایش سن
        this.age++;
    
        // کاهش انرژی هر دو ثانیه
        const currentTime = Date.now();
        if (currentTime - this.lastEnergyDecrease >= 2000) {
            this.energy -= 1;
            this.lastEnergyDecrease = currentTime;
        }
    
        // بررسی مرگ از گرسنگی
        if (this.energy <= 0) {
            this.die();
            return;
        }

        // ذخیره موقعیت برای حافظه
        this.brain.positions.push({x: this.x, y: this.y});
        if (this.brain.positions.length > this.brain.memoryLength) {
            this.brain.positions.shift();
        }

        // Log the current position as a movement experience
        this.logExperience('move', { x: this.x, y: this.y });
    
        // تصمیم‌گیری بر اساس وضعیت
        switch (this.state) {
            case 'searching':
                this.searchForFood();
                break;
            case 'returning':
                this.returnToNest();
                break;
            case 'eating':
                this.eat();
                break;
        }
    
        // بررسی نیاز به غذا
        if (this.energy < 30 && this.world.nest.storedFood > 0 && this.state !== 'eating') {
            this.state = 'returning';
        }
    }    

    die() {
        this.isDead = true;
        this.energy = 0;
        
        // فقط اگر المنت ant-energy وجود دارد، آن را آپدیت کن
        const energyElement = document.getElementById('ant-energy');
        if (energyElement) {
            energyElement.textContent = '0';
        }
    }

    draw() {
        if (this.isDead) {
            // کشیدن مورچه مرده (به پشت افتاده)
            const ctx = this.world.ctx;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.PI / 2); // چرخش 90 درجه
            
            // بدن مورچه مرده
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // پاهای مورچه مرده
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const angle = (i * Math.PI / 3) + Math.PI / 6;
                ctx.lineTo(Math.cos(angle) * this.radius * 1.2, Math.sin(angle) * this.radius * 1.2);
                ctx.stroke();
            }
            
            ctx.restore();
            return;
        }

        // تنظیم رنگ بر اساس وضعیت
        this.color = this.state === 'resting' ? this.restColor : this.baseColor;

        const ctx = this.world.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // بدن مورچه
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // سر مورچه
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.radius * 0.7, 0, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // پاهای مورچه
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const angle = (i * Math.PI / 3) + Math.PI / 6;
            ctx.lineTo(Math.cos(angle) * this.radius * 1.2, Math.sin(angle) * this.radius * 1.2);
            ctx.stroke();
        }

        // شاخک‌های مورچه
        ctx.beginPath();
        ctx.moveTo(this.radius * 0.7, -this.radius * 0.2);
        ctx.lineTo(this.radius * 1.2, -this.radius * 0.5);
        ctx.moveTo(this.radius * 0.7, this.radius * 0.2);
        ctx.lineTo(this.radius * 1.2, this.radius * 0.5);
        ctx.stroke();

        // نمایش غذای حمل شده
        if (this.carriedFood) {
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.arc(-this.radius * 0.5, 0, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }    searchForFood() {
        let detectedFood = null;
        for (const food of this.world.foods) {
            const dx = this.x - food.x;
            const dy = this.y - food.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.searchRadius) {
                detectedFood = food;
                break;
            }
        }

        if (detectedFood) {
            this.brain.targetX = detectedFood.x;
            this.brain.targetY = detectedFood.y;
            // Log that food was spotted
            this.logExperience('food_spotted', { foodX: detectedFood.x, foodY: detectedFood.y });
            const foodAtCollision = this.world.getFoodAt(this.x, this.y, this.radius);
            if (foodAtCollision) {
                this.carriedFood = foodAtCollision;
                this.brain.lastFoundFoodAt = { x: this.x, y: this.y };
                // Log that food was picked up
                this.logExperience('food_picked', { pickupX: this.x, pickupY: this.y, foodValue: foodAtCollision.value });
                this.state = 'returning';
                
                // پخش صدای گرفتن غذا
                if (typeof soundManager !== 'undefined' && soundManager) {
                    soundManager.playSound('food_pickup', 0.3);
                }
                return;
            }
            this.moveTowards(this.brain.targetX, this.brain.targetY);
            return;
        }
        
        // اگر غذایی در محدوده یافت نشد، الگوریتم جستجوی تصادفی قبلی اجرا شود
        if (!this.brain.targetX || !this.brain.targetY ||
            (Math.abs(this.x - this.brain.targetX) < 10 && Math.abs(this.y - this.brain.targetY) < 10)) {
            // تعیین هدف جدید
            if (this.brain.lastFoundFoodAt && Math.random() < 0.3) {
                this.brain.targetX = this.brain.lastFoundFoodAt.x + (Math.random() * 100 - 50);
                this.brain.targetY = this.brain.lastFoundFoodAt.y + (Math.random() * 100 - 50);
            } else {
                this.brain.targetX = Math.random() * this.world.width;
                this.brain.targetY = Math.random() * this.world.height;
            }
        }

        // حرکت به سمت هدف
        this.moveTowards(this.brain.targetX, this.brain.targetY);
    }    
    returnToNest() {
        if (this.world.isNearNest(this.x, this.y, this.radius)) {
            if (this.carriedFood) {
                this.world.storeFood(this.carriedFood.value);
                // Log that food was delivered to the nest
                this.logExperience('food_delivered', { nestX: this.world.nest.x, nestY: this.world.nest.y, foodValue: this.carriedFood.value });
                this.carriedFood = null;
                this.state = 'searching';
                
                // پخش صدای بازگشت به لانه
                if (typeof soundManager !== 'undefined' && soundManager) {
                    soundManager.playSound('nest_return', 0.4);
                }
            } else if (this.energy < 30) {
                this.state = 'eating';
            }
            return;
        }
        this.moveTowards(this.world.nest.x, this.world.nest.y);
    }
    
    eat() {
        if (this.world.nest.storedFood > 0 && this.energy < this.maxEnergy) {
            // خوردن غذا از لانه
            this.world.nest.storedFood -= 1;
            this.energy += 5;
            if (this.energy > this.maxEnergy) {
                this.energy = this.maxEnergy;
            }
            document.getElementById('stored-food').textContent = this.world.nest.storedFood;            
            // وقتی انرژی کافی دارد، دوباره به جستجو بازگردد
            if (this.energy > 70 || this.world.nest.storedFood <= 0) {
                this.state = 'searching';
            }
        } else {
            // اگر غذایی برای خوردن نیست، برو دنبال غذا
            this.state = 'searching';
        }
    }
    
    moveTowards(targetX, targetY) {
        // محاسبه جهت به سمت هدف
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // هدف جدید با کمی انحراف تصادفی برای جستجوی طبیعی‌تر
            this.direction = Math.atan2(dy, dx) + (Math.random() * 0.5 - 0.25);
        }
        
        // بررسی موانع در مسیر
        let newX = this.x + Math.cos(this.direction) * this.speed;
        let newY = this.y + Math.sin(this.direction) * this.speed;
        
        // اگر با مانع برخورد می‌کند، تغییر مسیر بده
        if (this.world.isCollision(newX, newY, this.radius, this.world.obstacles)) {
            // تغییر مسیر برای دور زدن مانع
            this.direction += Math.PI/2 + Math.random() * Math.PI;
            newX = this.x + Math.cos(this.direction) * this.speed;
            newY = this.y + Math.sin(this.direction) * this.speed;
        }
        
        // بررسی دیوارهای محیط
        if (newX < this.radius || newX > this.world.width - this.radius) {
            this.direction = Math.PI - this.direction;
            newX = this.x + Math.cos(this.direction) * this.speed;
        }
        
        if (newY < this.radius || newY > this.world.height - this.radius) {
            this.direction = -this.direction;
            newY = this.y + Math.sin(this.direction) * this.speed;
        }
        
        // تغییر موقعیت
        this.x = newX;
        this.y = newY;
    }
    
    draw() {
        const ctx = this.world.ctx;
        
        // سایه مورچه
        ctx.beginPath();
        ctx.arc(this.x, this.y + 1, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();
        
        // بدن مورچه - سه قسمت
        
        // قسمت عقب
        ctx.beginPath();
        ctx.ellipse(
            this.x - Math.cos(this.direction) * this.radius * 0.8, 
            this.y - Math.sin(this.direction) * this.radius * 0.8, 
            this.radius * 0.9, 
            this.radius * 0.7, 
            this.direction, 
            0, 
            Math.PI * 2
        );
        ctx.fillStyle = '#333';
        ctx.fill();
        
        // قسمت میانی
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        
        // سر مورچه
        const headX = this.x + Math.cos(this.direction) * this.radius * 1.2;
        const headY = this.y + Math.sin(this.direction) * this.radius * 1.2;
        ctx.beginPath();
        ctx.arc(headX, headY, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        
        // شاخک‌ها
        const antennaLength = this.gender === 'male' ? this.radius * 1.4 : this.radius * 1.1; // شاخک‌های نر بلندتر
        const antennaAngle = this.gender === 'male' ? 0.6 : 0.4; // زاویه شاخک‌های نر بیشتر
        
        // شاخک چپ
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        const leftAntennaAngle = this.direction - antennaAngle;
        const leftAntennaEndX = headX + Math.cos(leftAntennaAngle) * antennaLength;
        const leftAntennaEndY = headY + Math.sin(leftAntennaAngle) * antennaLength;
        ctx.bezierCurveTo(
            headX + Math.cos(leftAntennaAngle) * antennaLength * 0.5,
            headY + Math.sin(leftAntennaAngle) * antennaLength * 0.5 - 5,
            leftAntennaEndX - 3,
            leftAntennaEndY - 5,
            leftAntennaEndX,
            leftAntennaEndY
        );
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        
        // شاخک راست
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        const rightAntennaAngle = this.direction + antennaAngle;
        const rightAntennaEndX = headX + Math.cos(rightAntennaAngle) * antennaLength;
        const rightAntennaEndY = headY + Math.sin(rightAntennaAngle) * antennaLength;
        ctx.bezierCurveTo(
            headX + Math.cos(rightAntennaAngle) * antennaLength * 0.5,
            headY + Math.sin(rightAntennaAngle) * antennaLength * 0.5 - 5,
            rightAntennaEndX - 3,
            rightAntennaEndY - 5,
            rightAntennaEndX,
            rightAntennaEndY
        );
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.stroke();        
        // پاهای مورچه (۳ جفت)
        const legLength = this.radius * 1.3;
        
        // سمت چپ
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const legAngle = this.direction - Math.PI/2;
            const jointX = this.x + Math.cos(this.direction) * (i - 1) * this.radius * 0.7;
            const jointY = this.y + Math.sin(this.direction) * (i - 1) * this.radius * 0.7;
            
            const legStartX = jointX + Math.cos(legAngle) * this.radius * 0.2;
            const legStartY = jointY + Math.sin(legAngle) * this.radius * 0.2;
            
            const legEndX = legStartX + Math.cos(legAngle) * legLength;
            const legEndY = legStartY + Math.sin(legAngle) * legLength;
            
            ctx.moveTo(legStartX, legStartY);
            ctx.quadraticCurveTo(
                legStartX + Math.cos(legAngle) * legLength * 0.5,
                legStartY + Math.sin(legAngle) * legLength * 0.5 + 5,
                legEndX,
                legEndY
            );
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#000';
            ctx.stroke();
        }
        
        // سمت راست
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const legAngle = this.direction + Math.PI/2;
            const jointX = this.x + Math.cos(this.direction) * (i - 1) * this.radius * 0.7;
            const jointY = this.y + Math.sin(this.direction) * (i - 1) * this.radius * 0.7;
            
            const legStartX = jointX + Math.cos(legAngle) * this.radius * 0.2;
            const legStartY = jointY + Math.sin(legAngle) * this.radius * 0.2;
            
            const legEndX = legStartX + Math.cos(legAngle) * legLength;
            const legEndY = legStartY + Math.sin(legAngle) * legLength;
            
            ctx.moveTo(legStartX, legStartY);
            ctx.quadraticCurveTo(
                legStartX + Math.cos(legAngle) * legLength * 0.5,
                legStartY + Math.sin(legAngle) * legLength * 0.5 + 5,
                legEndX,
                legEndY
            );
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#000';
            ctx.stroke();
        }
                  // اگر غذا حمل می‌کند، آن را نشان بده
                  if (this.carriedFood) {
                      const ctx = this.world.ctx;
                      const headX = this.x + Math.cos(this.direction) * this.radius * 1.2;
                      const headY = this.y + Math.sin(this.direction) * this.radius * 1.2;
                      
                      // کشیدن دانه گندم در دهان مورچه
                      ctx.beginPath();
                      ctx.ellipse(
                          headX + Math.cos(this.direction) * this.radius * 0.8,
                          headY + Math.sin(this.direction) * this.radius * 0.8,
                          12.5, // نصف سایز دانه اصلی (25/2)
                          10, // اندازه عرضی متناسب
                          this.direction + Math.PI/4,
                          0,
                          Math.PI * 2
                      );
                      ctx.fillStyle = '#DAA520';
                      ctx.fill();
                      
                      // برجستگی دانه
                      ctx.beginPath();
                      ctx.ellipse(
                          headX + Math.cos(this.direction) * this.radius * 1,
                          headY + Math.sin(this.direction) * this.radius * 1,
                          15,
                          10,
                          this.direction + Math.PI/4,
                          0,
                          Math.PI * 2
                      );
                      ctx.fillStyle = '#F4C430';
                      ctx.fill();
                  }
        
        // نمایش وضعیت انرژی
        const energyBarWidth = this.radius * 2.2;
        const energyBarHeight = 3;
        const energyBarX = this.x - energyBarWidth / 2;
        const energyBarY = this.y - this.radius - 8;
        
        // پس‌زمینه نوار انرژی
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(energyBarX, energyBarY, energyBarWidth, energyBarHeight);
        
        // نوار انرژی
        ctx.fillStyle = this.energy < 30 ? '#e74c3c' : (this.energy < 70 ? '#f39c12' : '#2ecc71');
        ctx.fillRect(energyBarX, energyBarY, energyBarWidth * (this.energy / this.maxEnergy), energyBarHeight);
    }    
    reset() {
        // بازگشت مورچه به لانه و تنظیم مجدد
        this.x = this.world.nest.x;
        this.y = this.world.nest.y;
        this.startTime = Date.now();
        this.energy = this.maxEnergy;
        this.carriedFood = null;
        this.state = 'searching';
        this.direction = Math.random() * Math.PI * 2;
        this.age = 0; // ریست سن
    }
}
