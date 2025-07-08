class Larva {
  constructor(world, x, y) {
    this.world = world;
    this.x = x;
    this.y = y;
    // زمان هچ: 30 ثانیه بعد (برای تست بهتر)
    this.hatchTime = Date.now() + 30 * 1000;
    this.radius = 5; // سایز کوچک برای لارو
  }

  update() {
    // اگر زمان هچ فرا رسیده باشد
    if (Date.now() >= this.hatchTime) {
      return true;
    }
    return false;
  }

  draw() {
    const ctx = this.world.ctx;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    // رنگی برای نمایش لارو (مثلاً نارنجی ملایم)
    ctx.fillStyle = '#FF8C00';
    ctx.fill();
  }
}
