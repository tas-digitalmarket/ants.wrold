class FoodManager {
    constructor(world) {
        this.world = world;
        
        // برنامه زمانی ایجاد غذای جدید
        this.foodGenerationInterval = 10000; // هر 10 ثانیه
        this.lastFoodGenerationTime = Date.now();
    }
    
    update() {
        const currentTime = Date.now();
        
        // افزودن غذای جدید به صورت تصادفی
        if (currentTime - this.lastFoodGenerationTime > this.foodGenerationInterval) {
            if (this.world.foods.length < 15) { // حداکثر تعداد غذا
                this.generateRandomFood();
            }
            this.lastFoodGenerationTime = currentTime;
        }
    }
    
    generateRandomFood() {
        // یافتن محلی برای غذای جدید که با موانع برخورد نداشته باشد
        let valid = false;
        let x, y;
        let attempts = 0;
        
        while (!valid && attempts < 10) {
            x = Math.random() * this.world.width;
            y = Math.random() * this.world.height;
            
            // بررسی عدم برخورد با موانع
            if (!this.world.isCollision(x, y, 6, this.world.obstacles)) {
                valid = true;
            }
            
            attempts++;
        }
        
        if (valid) {
            this.world.addFood(x, y);
        }
    }
}
