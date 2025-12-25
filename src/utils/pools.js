/**
 * Object Pooling - Reduces garbage collection overhead
 */

/**
 * Generic object pool implementation
 */
export class ObjectPool {
    constructor(factory, initialSize = 10, maxSize = 100) {
        this.factory = factory;
        this.maxSize = maxSize;
        this.pool = [];
        this.active = [];

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }

    /**
     * Get an object from the pool
     * @param {function} initializer - Function to initialize the object
     * @returns {object} The pooled object
     */
    get(initializer) {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.factory();
        }

        if (initializer) {
            initializer(obj);
        }

        obj._poolActive = true;
        this.active.push(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     * @param {object} obj - The object to return
     */
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            obj._poolActive = false;

            if (this.pool.length < this.maxSize) {
                this.pool.push(obj);
            }
        }
    }

    /**
     * Release all active objects
     */
    releaseAll() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }

    /**
     * Get all active objects
     * @returns {array} Active objects
     */
    getActive() {
        return this.active;
    }

    /**
     * Update all active objects and release those that should be removed
     * @param {function} updateFn - Returns true if object should be released
     */
    updateAll(updateFn) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const obj = this.active[i];
            if (updateFn(obj, i)) {
                this.release(obj);
            }
        }
    }
}

// ============ SPECIALIZED POOLS ============

/**
 * Create a bullet pool
 */
export function createBulletPool(initialSize = 20) {
    return new ObjectPool(
        () => ({
            x: 0,
            z: 0,
            angle: 0,
            life: 0,
            _poolActive: false,
        }),
        initialSize,
        50
    );
}

/**
 * Create an alien pool
 */
export function createAlienPool(initialSize = 10) {
    return new ObjectPool(
        () => ({
            x: 0,
            z: 0,
            speed: 1.5,
            walkOffset: 0,
            _poolActive: false,
        }),
        initialSize,
        30
    );
}

/**
 * Create a particle pool
 */
export function createParticlePool(initialSize = 30) {
    return new ObjectPool(
        () => ({
            x: 0,
            y: 0,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            life: 0,
            color: 'white',
            _poolActive: false,
        }),
        initialSize,
        100
    );
}

// ============ POOL MANAGER ============

/**
 * Manages all object pools in the game
 */
export class PoolManager {
    constructor() {
        this.bullets = createBulletPool();
        this.aliens = createAlienPool();
        this.particles = createParticlePool();
    }

    /**
     * Spawn a bullet
     */
    spawnBullet(x, z, angle, life = 60) {
        return this.bullets.get(bullet => {
            bullet.x = x;
            bullet.z = z;
            bullet.angle = angle;
            bullet.life = life;
        });
    }

    /**
     * Spawn an alien
     */
    spawnAlien(x, z, speed, walkOffset = 0) {
        return this.aliens.get(alien => {
            alien.x = x;
            alien.z = z;
            alien.speed = speed;
            alien.walkOffset = walkOffset;
        });
    }

    /**
     * Spawn particles for explosion effect
     */
    spawnExplosion(x, z, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.get(particle => {
                particle.x = x;
                particle.z = z;
                particle.y = -20;
                particle.vx = (Math.random() - 0.5) * 4;
                particle.vy = -2 - Math.random() * 3;
                particle.vz = (Math.random() - 0.5) * 4;
                particle.life = 20;
                particle.color = color;
            });
        }
    }

    /**
     * Update all bullets
     */
    updateBullets(bulletSpeed = 15) {
        this.bullets.updateAll(bullet => {
            bullet.x += Math.sin(bullet.angle) * bulletSpeed;
            bullet.z += Math.cos(bullet.angle) * bulletSpeed;
            bullet.life--;
            return bullet.life <= 0;
        });
    }

    /**
     * Update all particles
     */
    updateParticles() {
        this.particles.updateAll(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.z += particle.vz;
            particle.life--;
            return particle.life <= 0;
        });
    }

    /**
     * Get active bullets for collision detection
     */
    getActiveBullets() {
        return this.bullets.getActive();
    }

    /**
     * Get active aliens
     */
    getActiveAliens() {
        return this.aliens.getActive();
    }

    /**
     * Get active particles
     */
    getActiveParticles() {
        return this.particles.getActive();
    }

    /**
     * Release a specific bullet
     */
    releaseBullet(bullet) {
        this.bullets.release(bullet);
    }

    /**
     * Release a specific alien
     */
    releaseAlien(alien) {
        this.aliens.release(alien);
    }

    /**
     * Clear all pools
     */
    clearAll() {
        this.bullets.releaseAll();
        this.aliens.releaseAll();
        this.particles.releaseAll();
    }
}

// Singleton instance
let poolManager = null;

/**
 * Get the pool manager instance
 */
export function getPoolManager() {
    if (!poolManager) {
        poolManager = new PoolManager();
    }
    return poolManager;
}

/**
 * Reset the pool manager
 */
export function resetPoolManager() {
    if (poolManager) {
        poolManager.clearAll();
    }
    poolManager = new PoolManager();
    return poolManager;
}
