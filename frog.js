// کلاس قورباغه هوشمند با AI طبیعی
class Frog {
    constructor(world) {
        this.world = world;
        this.size = 35;
        
        // موقعیت در گوشه پایین راست با فاصله از لبه‌ها
        this.x = world.width - this.size - 50; // نزدیک لبه راست
        this.y = world.height - this.size - 50; // نزدیک لبه پایین
        
        this.eyeSize = 6;
        this.tongueLength = 0;
        this.maxTongueLength = 75; // نصف طول قبلی برای برد کمتر
        this.tongueSpeed = 20; // افزایش سرعت زبان
        this.isHunting = false;
        this.target = null;
        this.energy = 100;
        this.satisfaction = 0;
        this.detectionRadius = 300; // افزایش بیشتر برد تشخیص برای موقعیت ثابت
        this.huntCooldown = 0;
        this.lastHuntTime = 0;
        this.blinkTime = 0;
        this.breathingOffset = 0;
        
        // رفتار هوش مصنوعی - بسیار تهاجمی
        this.state = 'idle'; // idle, alert, hunting, eating, resting
        this.patience = 0;
        this.aggressiveness = 0.9; // حداکثر تهاجم
        this.huntingSkill = 0.95; // حداکثر مهارت شکار
        
        // انیمیشن و زمان
        this.animationTime = 0;
        this.lastEatTime = 0;
        this.huntingMemory = [];
        this.lastSoundTime = 0;
        
        // رنگ‌های طبیعی
        this.baseColor = `hsl(${100 + Math.random() * 20}, 60%, 40%)`;
        this.bellyColor = `hsl(${50 + Math.random() * 20}, 40%, 70%)`;
        this.antsEaten = 0;
    }

    update() {
        this.animationTime += 0.02;
        this.breathingOffset = Math.sin(this.animationTime * 2) * 1.5;
        this.blinkTime += 0.05;
        
        if (this.huntCooldown > 0) this.huntCooldown -= 3; // خیلی سریع‌تر کاهش cooldown
        
        this.energy -= 0.003; // کاهش خیلی کمتر انرژی
        this.satisfaction = Math.max(0, this.satisfaction - 0.012); // کاهش بیشتر satisfaction
        
        this.think();
        this.behaviorStateMachine();
        
        // محدود کردن در مرزها - قورباغه در موقعیت ثابت باقی می‌ماند
        // this.x = Math.max(this.size, Math.min(this.world.width - this.size, this.x));
        // this.y = Math.max(this.size, Math.min(this.world.height - this.size, this.y));
    }

    think() {
        let nearestAnt = this.findNearestAnt();
        
        // دیباگ اطلاعات
        if (nearestAnt && Math.random() < 0.005) { // خیلی کم لاگ کند
            let distance = this.getDistance(nearestAnt);
            console.log(`🐸 Frog sees ant at distance ${Math.round(distance)}, state: ${this.state}, canHunt: ${this.canHunt()}, cooldown: ${this.huntCooldown}`);
        }
        
        // قورباغه همیشه به مورچه‌های نزدیک واکنش نشان می‌دهد
        if (nearestAnt) {
            let distance = this.getDistance(nearestAnt);
            
            // اگر مورچه خیلی نزدیک است، فوری شکار کن
            if (distance < this.detectionRadius) {
                // اگر در برد زبان است و قورباغه در حال شکار نیست
                if (distance < this.maxTongueLength && this.state !== 'hunting' && this.canHunt()) {
                    console.log(`🐸 Starting hunt! Distance: ${Math.round(distance)}, State: ${this.state}`);
                    this.startHunt(nearestAnt);
                }
                // اگر نزدیک است ولی در برد زبان نیست، به حالت آماده‌باش برو
                else if (this.state === 'idle' || this.state === 'resting') {
                    this.state = 'alert';
                    this.target = nearestAnt;
                    this.patience = 0;
                    // اگر در حالت استراحت بود، فوری از آن خارج شو
                    if (distance < this.maxTongueLength * 1.2) {
                        this.state = 'idle';
                        this.huntCooldown = Math.max(0, this.huntCooldown - 20); // کاهش فوری cooldown
                    }
                }
            }
        } else if (this.state === 'alert') {
            this.patience++;
            if (this.patience > 40) { // صبر کمتر - سریع‌تر به حالت idle برمی‌گردد
                this.state = 'idle';
                this.patience = 0;
                this.target = null;
            }
        }
        
        // شرایط استراحت بسیار سخت‌تر - تقریباً هرگز استراحت نمی‌کند
        if (this.energy < 5 && this.satisfaction > 90) {
            this.state = 'resting';
        }
    }

    behaviorStateMachine() {
        switch (this.state) {
            case 'idle': this.idleBehavior(); break;
            case 'alert': this.alertBehavior(); break;
            case 'hunting': this.huntingBehavior(); break;
            case 'eating': this.eatingBehavior(); break;
            case 'resting': this.restingBehavior(); break;
        }
    }

    idleBehavior() {
        // قورباغه در موقعیت ثابت می‌ماند
        
        if (Math.random() < 0.0015 && Date.now() - this.lastSoundTime > 4000) { // بیشتر صدا می‌کند
            this.makeIdleSound();
        }
    }

    alertBehavior() {
        if (this.target) {
            let dx = this.target.x - this.x;
            let dy = this.target.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            this.eyeDirection = Math.atan2(dy, dx);
            
            // قورباغه در جای خود می‌ماند و فقط چشم‌هایش را حرکت می‌دهد
            
            // اگر در برد زبان رسیدیم، فوری شکار کن
            if (distance <= this.maxTongueLength && this.canHunt()) {
                this.startHunt(this.target);
            }
        }
    }

    huntingBehavior() {
        if (this.target) {
            let distance = this.getDistance(this.target);
            
            if (distance <= this.maxTongueLength && this.tongueLength < this.maxTongueLength) {
                this.tongueLength += this.tongueSpeed;
                
                if (this.tongueLength >= distance - 12) { // ضرب بیشتر برای شکار آسان‌تر
                    this.catchPrey();
                }
            } else {
                this.missHunt();
            }
        }
    }

    eatingBehavior() {
        if (this.tongueLength > 0) {
            this.tongueLength -= this.tongueSpeed * 1.8;
        } else {
            this.state = 'resting';
            this.lastEatTime = Date.now();
        }
    }

    restingBehavior() {
        this.energy += 0.15; // بازیابی سریع‌تر انرژی
        
        // بررسی مورچه‌های نزدیک حین استراحت
        let nearestAnt = this.findNearestAnt();
        if (nearestAnt) {
            let distance = this.getDistance(nearestAnt);
            // اگر مورچه خیلی نزدیک است، فوری از استراحت خارج شو
            if (distance < this.maxTongueLength * 1.5) {
                this.state = 'alert';
                this.target = nearestAnt;
                this.huntCooldown = Math.max(0, this.huntCooldown - 30);
                return;
            }
        }
        
        if (Date.now() - this.lastEatTime > 1000) { // استراحت بسیار کمتر
            this.state = 'idle';
        }
    }

    startHunt(ant) {
        if (!this.canHunt()) return;
        
        this.state = 'hunting';
        this.target = ant;
        this.isHunting = true;
        this.huntCooldown = 15; // کاهش بیشتر زمان cooldown
        this.lastHuntTime = Date.now();
        
        this.makeHuntSound();
        
        this.huntingMemory.push({
            time: Date.now(),
            success: false,
            antType: ant.type || 'worker'
        });
    }

    catchPrey() {
        if (this.target) {
            // فقط مورچه‌های کارگر شکار می‌شوند
            this.removePrey(this.target);
            
            this.satisfaction += 35; // بیشتر سیر می‌شود
            this.energy += 25; // بیشتر انرژی می‌گیرد
            this.antsEaten++;
            
            if (this.huntingMemory.length > 0) {
                this.huntingMemory[this.huntingMemory.length - 1].success = true;
            }
            
            this.state = 'eating';
            this.isHunting = false;
            
            this.makeEatSound();
            this.createCatchEffect();
            
            // نوتیفیکیشن فقط برای مورچه‌های کارگر
            if (window.showNotification) {
                window.showNotification('🐸 قورباغه یک مورچه کارگر خورد!', 'error');
            }
        }
    }

    missHunt() {
        this.tongueLength = 0;
        this.isHunting = false;
        
        // اگر مورچه هنوز نزدیک است، دوباره سعی کن
        if (this.target) {
            let distance = this.getDistance(this.target);
            if (distance < this.detectionRadius) {
                this.state = 'alert'; // فوری به حالت آماده‌باش برو
                this.huntCooldown = 5; // cooldown بسیار کم
            } else {
                this.state = 'idle';
                this.target = null;
            }
        } else {
            this.state = 'idle';
            this.target = null;
        }
        
        this.patience = 0;
        this.makeMissSound();
    }

    findNearestAnt() {
        let nearest = null;
        let minDistance = Infinity;
        
        // کنسول لاگ برای دیباگ
        let foundAnts = 0;
        
        // فقط مورچه‌های کارگر را در نظر بگیر - مورچه‌های نر و ماده را نادیده بگیر
        
        if (window.workerAnts && window.workerAnts.length > 0) {
            foundAnts += window.workerAnts.length;
            for (let ant of window.workerAnts) {
                let distance = this.getDistance(ant);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = ant;
                }
            }
        }
        
        // دیباگ اطلاعات
        if (foundAnts > 0 && Math.random() < 0.01) { // هر 100 فریم یک بار
            console.log(`🐸 Frog found ${foundAnts} worker ants, nearest at distance ${Math.round(minDistance)}, detection radius: ${this.detectionRadius}`);
        }
        
        return nearest;
    }

    getDistance(ant) {
        let dx = ant.x - this.x;
        let dy = ant.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    canHunt() {
        // قورباغه تقریباً همیشه می‌تواند شکار کند
        return this.huntCooldown <= 0 && 
               this.energy > 1 && // حد انرژی بسیار پایین
               !this.isHunting;
    }

    removePrey(ant) {
        // فقط مورچه‌های کارگر را حذف کن
        if (window.workerAnts) {
            let index = window.workerAnts.indexOf(ant);
            if (index > -1) {
                window.workerAnts.splice(index, 1);
                return;
            }
        }
        
        // مورچه‌های نر و ماده هرگز آسیب نمی‌بینند
        // این بخش دیگر اجرا نمی‌شود چون قورباغه آن‌ها را تارگت نمی‌کند
    }

    createCatchEffect() {
        for (let i = 0; i < 10; i++) { // بیشتر افکت بصری
            if (window.visualEffects) {
                window.visualEffects.push({
                    type: 'frog_catch',
                    x: this.x + Math.random() * 24 - 12,
                    y: this.y + Math.random() * 24 - 12,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 35,
                    color: '#ff6b6b'
                });
            }
        }
    }

    makeIdleSound() {
        if (window.soundManager) {
            window.soundManager.playFrogSound('idle');
            this.lastSoundTime = Date.now();
        }
    }

    makeHuntSound() {
        if (window.soundManager) {
            window.soundManager.playFrogSound('hunt');
        }
    }

    makeEatSound() {
        if (window.soundManager) {
            window.soundManager.playFrogSound('eat');
        }
    }

    makeMissSound() {
        if (window.soundManager) {
            window.soundManager.playFrogSound('miss');
        }
    }

    draw() {
        const ctx = this.world.ctx;
        if (!ctx) return;
        
        ctx.save();
        ctx.translate(this.x, this.y + this.breathingOffset);
        
        // سایه قورباغه
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, this.size * 0.25, this.size * 0.7, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // بدن اصلی
        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.65, this.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // شکم
        ctx.fillStyle = this.bellyColor;
        ctx.beginPath();
        ctx.ellipse(0, this.size * 0.08, this.size * 0.45, this.size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // چشم‌ها
        this.drawEyes(ctx);
        
        // زبان
        if (this.tongueLength > 0) {
            this.drawTongue(ctx);
        }
        
        // دهان
        this.drawMouth(ctx);
        
        // نقاط پوست
        this.drawSpots(ctx);
        
        ctx.restore();
        
        // اطلاعات debug
        if (window.showDebugInfo) {
            this.drawDebugInfo(ctx);
        }
    }

    drawEyes(ctx) {
        // چشم چپ
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-this.size * 0.18, -this.size * 0.25, this.eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // چشم راست
        ctx.beginPath();
        ctx.arc(this.size * 0.18, -this.size * 0.25, this.eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // مردمک‌ها
        let blinkFactor = Math.sin(this.blinkTime) > 0.96 ? 0.2 : 1;
        ctx.fillStyle = '#000';
        
        let eyeOffsetX = 0, eyeOffsetY = 0;
        
        if (this.target && this.state === 'alert') {
            let dx = this.target.x - this.x;
            let dy = this.target.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            eyeOffsetX = (dx / distance) * 1.5;
            eyeOffsetY = (dy / distance) * 1.5;
        }
        
        ctx.beginPath();
        ctx.arc(-this.size * 0.18 + eyeOffsetX, -this.size * 0.25 + eyeOffsetY, this.eyeSize * 0.5 * blinkFactor, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.size * 0.18 + eyeOffsetX, -this.size * 0.25 + eyeOffsetY, this.eyeSize * 0.5 * blinkFactor, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTongue(ctx) {
        if (!this.target) return;
        
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        let tongueX = (dx / distance) * this.tongueLength;
        let tongueY = (dy / distance) * this.tongueLength;
        
        // زبان صورتی
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, this.size * 0.08);
        ctx.lineTo(tongueX, tongueY + this.size * 0.08);
        ctx.stroke();
        
        // نوک زبان
        ctx.fillStyle = '#ff1493';
        ctx.beginPath();
        ctx.arc(tongueX, tongueY + this.size * 0.08, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMouth(ctx) {
        ctx.strokeStyle = '#2d5016';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        let mouthWidth = this.size * 0.35;
        if (this.state === 'eating' || this.tongueLength > 0) {
            mouthWidth *= 1.4;
        }
        
        ctx.beginPath();
        ctx.arc(0, this.size * 0.08, mouthWidth, 0.1, Math.PI - 0.1);
        ctx.stroke();
    }

    drawSpots(ctx) {
        ctx.fillStyle = 'rgba(0, 80, 0, 0.4)';
        
        const spots = [
            {x: -this.size * 0.25, y: -this.size * 0.08, size: 3},
            {x: this.size * 0.25, y: -this.size * 0.08, size: 2.5},
            {x: -this.size * 0.08, y: this.size * 0.15, size: 4},
            {x: this.size * 0.15, y: this.size * 0.08, size: 2}
        ];
        
        for (let spot of spots) {
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, spot.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawDebugInfo(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '11px Arial';
        ctx.fillText(`State: ${this.state}`, this.x - 35, this.y - 55);
        ctx.fillText(`Energy: ${Math.round(this.energy)}`, this.x - 35, this.y - 42);
        ctx.fillText(`Eaten: ${this.antsEaten}`, this.x - 35, this.y - 29);
        
        // دایره تشخیص
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.detectionRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // برد زبان
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.maxTongueLength, 0, Math.PI * 2);
        ctx.stroke();
    }
}
