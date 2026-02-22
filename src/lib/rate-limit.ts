// In-memory rate limiter for simple abuse protection.
// Note: In serverless environments, this state is per-instance. 
// For distributed, use Redis (Upstash) or Supabase.

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

export class RateLimiter {
    /**
     * @param limit - Maximum number of requests allowed within the window.
     * @param windowMs - The time window in milliseconds.
     */
    static check(identifier: string, limit: number, windowMs: number): { success: boolean, remaining: number } {
        const now = Date.now();
        const record = store.get(identifier);

        if (!record || now > record.resetAt) {
            store.set(identifier, {
                count: 1,
                resetAt: now + windowMs
            });
            return { success: true, remaining: limit - 1 };
        }

        if (record.count >= limit) {
            return { success: false, remaining: 0 };
        }

        record.count += 1;
        return { success: true, remaining: limit - record.count };
    }
}
