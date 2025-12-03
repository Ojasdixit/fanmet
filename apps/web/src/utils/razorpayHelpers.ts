// Razorpay Helper Utilities
import { supabase } from '../lib/supabaseClient';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';

// Razorpay types
declare global {
    interface Window {
        Razorpay: any;
    }
}

// Load Razorpay script
export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

interface CreateRazorpayOrderParams {
    amount: number;
    userId: string;
    userEmail?: string;
}

interface RazorpayOrderResponse {
    orderId: string;
    keyId: string;
}

// Create Razorpay order via Edge Function
export const createRazorpayOrder = async (params: CreateRazorpayOrderParams): Promise<RazorpayOrderResponse> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('Please log in to continue.');
    }

    const orderRes = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-create-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount: params.amount }),
    });

    if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || 'Failed to create order.');
    }

    return await orderRes.json();
};

interface VerifyRazorpayPaymentParams {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

// Verify Razorpay payment via Edge Function
export const verifyRazorpayPayment = async (params: VerifyRazorpayPaymentParams): Promise<{ newBalance: number }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('Please log in to continue.');
    }

    const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-verify-payment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(params),
    });

    if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Payment verification failed.');
    }

    return await verifyRes.json();
};

interface OpenRazorpayCheckoutParams {
    amount: number;
    orderId: string;
    keyId: string;
    userEmail?: string;
    onSuccess: (response: any) => void;
    onDismiss?: () => void;
    description?: string;
}

// Open Razorpay checkout modal
export const openRazorpayCheckout = (params: OpenRazorpayCheckoutParams) => {
    const options = {
        key: params.keyId,
        amount: params.amount * 100,
        currency: 'INR',
        name: 'FanMeet',
        description: params.description || 'Payment',
        order_id: params.orderId,
        handler: params.onSuccess,
        prefill: {
            email: params.userEmail || '',
        },
        theme: {
            color: '#C045FF',
        },
        modal: {
            ondismiss: params.onDismiss || (() => { }),
        },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
};
