import { createClient } from 'redis';
import { logger } from './logger.js';

// Create Redis client
const redisClient = createClient({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    database: parseInt(process.env.REDIS_DB) || 0
});

// Handle Redis events
redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));
redisClient.on('ready', () => logger.info('Redis Client Ready'));
redisClient.on('end', () => logger.info('Redis Client Connection Ended'));

// Connect to Redis
await redisClient.connect().catch((err) => {
    logger.error('Redis Connection Error:', err);
    process.exit(1);
});

// Session Management
export const setSession = async (userId, sessionData, expiryInSeconds = process.env.REDIS_SESSION_TTL) => {
    try {
        const key = `session:${userId}`;
        await redisClient.setEx(key, expiryInSeconds, JSON.stringify(sessionData));
        return true;
    } catch (error) {
        logger.error('Redis Set Session Error:', error);
        return false;
    }
};

export const getSession = async (userId) => {
    try {
        const key = `session:${userId}`;
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        logger.error('Redis Get Session Error:', error);
        return null;
    }
};

export const deleteSession = async (userId) => {
    try {
        const key = `session:${userId}`;
        await redisClient.del(key);
        return true;
    } catch (error) {
        logger.error('Redis Delete Session Error:', error);
        return false;
    }
};

// OTP Management
export const setOTP = async (userId, otp, expiryInSeconds = process.env.REDIS_OTP_TTL) => {
    try {
        const key = `otp:${userId}`;
        const data = {
            code: otp,
            attempts: 0,
            createdAt: Date.now()
        };
        await redisClient.setEx(key, expiryInSeconds, JSON.stringify(data));
        return true;
    } catch (error) {
        logger.error('Redis Set OTP Error:', error);
        return false;
    }
};

export const getOTP = async (userId) => {
    try {
        const key = `otp:${userId}`;
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        logger.error('Redis Get OTP Error:', error);
        return null;
    }
};

export const verifyOTP = async (userId, inputOTP) => {
    try {
        const key = `otp:${userId}`;
        const data = await redisClient.get(key);
        if (!data) return { valid: false, message: 'OTP expired or not found' };

        const otpData = JSON.parse(data);
        
        // Check attempts
        if (otpData.attempts >= parseInt(process.env.OTP_MAX_ATTEMPTS)) {
            await redisClient.del(key);
            return { valid: false, message: 'Maximum attempts exceeded' };
        }

        // Update attempts
        otpData.attempts += 1;
        await redisClient.setEx(key, process.env.REDIS_OTP_TTL, JSON.stringify(otpData));

        // Verify OTP
        if (otpData.code !== inputOTP) {
            return { 
                valid: false, 
                message: 'Invalid OTP',
                remainingAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) - otpData.attempts 
            };
        }

        // OTP verified, clean up
        await redisClient.del(key);
        return { valid: true, message: 'OTP verified successfully' };
    } catch (error) {
        logger.error('Redis Verify OTP Error:', error);
        return { valid: false, message: 'Error verifying OTP' };
    }
};

// Rate Limiting
export const checkRateLimit = async (key, limit, windowInSeconds) => {
    try {
        const current = await redisClient.incr(key);
        
        if (current === 1) {
            await redisClient.expire(key, windowInSeconds);
        }

        return {
            current,
            isAllowed: current <= limit,
            remainingAttempts: Math.max(0, limit - current)
        };
    } catch (error) {
        logger.error('Redis Rate Limit Error:', error);
        return { isAllowed: true }; // Fail open for rate limiting
    }
};

// Cache Management
export const setCache = async (key, data, expiryInSeconds = process.env.REDIS_TTL) => {
    try {
        await redisClient.setEx(key, expiryInSeconds, JSON.stringify(data));
        return true;
    } catch (error) {
        logger.error('Redis Set Cache Error:', error);
        return false;
    }
};

export const getCache = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        logger.error('Redis Get Cache Error:', error);
        return null;
    }
};

export const deleteCache = async (key) => {
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        logger.error('Redis Delete Cache Error:', error);
        return false;
    }
};

export default redisClient; 