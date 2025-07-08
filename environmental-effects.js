// افکت‌های محیطی جدید برای world.js

// اضافه کردن به انتهای تابع draw()
function addEnvironmentalEffects() {
    // نور خورشید
    if (Math.random() < 0.3) {
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
    
    // باران ملایم
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
    
    // پروانه‌های رنگی
    if (Math.random() < 0.02) {
        const butterflyX = Math.random() * this.width;
        const butterflyY = Math.random() * this.height;
        
        this.ctx.save();
        this.ctx.translate(butterflyX, butterflyY);
        
        // بال‌های پروانه
        this.ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
        this.ctx.beginPath();
        this.ctx.ellipse(-3, -2, 4, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
        this.ctx.beginPath();
        this.ctx.ellipse(3, -2, 4, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
}

// افکت رنگین کمان بعد از باران
function drawRainbow() {
    if (Math.random() < 0.001) {
        const centerX = this.width / 2;
        const centerY = this.height;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        
        for (let i = 0; i < colors.length; i++) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 200 + i * 10, Math.PI, 0);
            this.ctx.strokeStyle = colors[i];
            this.ctx.lineWidth = 8;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
}
