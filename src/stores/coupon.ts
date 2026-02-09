import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export interface Coupon {
    valid: boolean;
    type: 'percentage' | 'fixed';
    value: number;
    code: string;
}

// Persistent coupon so it stays even if refresh
export const appliedCoupon = persistentAtom<Coupon | null>('applied_coupon', null, {
    encode: JSON.stringify,
    decode: JSON.parse
});
