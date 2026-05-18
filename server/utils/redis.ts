import { Redis } from "ioredis";
require("dotenv").config();

const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log(`Redis Connecting...`);
        return process.env.REDIS_URL;
    }

    throw new Error("Redis URL not configured");
};

let redis: Redis | null = null;
let redisAvailable = false;

try {
    redis = new Redis(redisClient(), {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        connectTimeout: 10000,
        retryStrategy(times) {
            if (times > 3) {
                console.error("❌ Redis: Max connection retries reached. Running without Redis.");
                redisAvailable = false;
                return null; // Stop retrying
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        reconnectOnError(err) {
            console.error("⚠️ Redis reconnect error:", err.message);
            return false;
        },
    });

    redis.on("connect", () => {
        console.log("✅ Redis Connected Successfully");
        redisAvailable = true;
    });

    redis.on("error", (err) => {
        console.error("❌ Redis Error:", err.message);
        redisAvailable = false;
    });

    redis.on("close", () => {
        console.log("⚠️ Redis connection closed");
        redisAvailable = false;
    });
} catch (error: any) {
    console.error("❌ Redis initialization failed:", error.message);
    console.log("⚠️ Server will run without Redis (sessions in memory only)");
    redisAvailable = false;
}

// Create a safe wrapper that doesn't crash if Redis is down
export const safeRedis = {
    async get(key: string): Promise<string | null> {
        if (!redis || !redisAvailable) {
            console.warn("⚠️ Redis unavailable, returning null");
            return null;
        }
        try {
            return await redis.get(key);
        } catch (error: any) {
            console.error("Redis GET error:", error.message);
            return null;
        }
    },

    async set(key: string, value: string, ...args: any[]): Promise<void> {
        if (!redis || !redisAvailable) {
            console.warn("⚠️ Redis unavailable, skipping SET");
            return;
        }
        try {
            await redis.set(key, value, ...args);
        } catch (error: any) {
            console.error("Redis SET error:", error.message);
        }
    },

    async del(key: string): Promise<void> {
        if (!redis || !redisAvailable) {
            console.warn("⚠️ Redis unavailable, skipping DEL");
            return;
        }
        try {
            await redis.del(key);
        } catch (error: any) {
            console.error("Redis DEL error:", error.message);
        }
    },
};

export { redis, redisAvailable };