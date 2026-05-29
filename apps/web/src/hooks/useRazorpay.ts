import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const RAZORPAY_KEY_ID = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RAZORPAY_KEY_ID) || '';

interface RazorpayOptions {
  amount: number;
  currency?: string;
  name: string;
  description?: string;
  image?: string;
  orderId: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface UseRazorpayReturn {
  isLoading: boolean;
  error: string | null;
  createOrder: (amount: number, notes?: Record<string, string>) => Promise<{ order_id: string; amount: number } | null>;
  openCheckout: (options: RazorpayOptions) => Promise<PaymentResponse | null>;
  verifyPayment: (response: PaymentResponse) => Promise<{ valid: boolean; status?: string } | null>;
}

export function useRazorpay(): UseRazorpayReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (amount: number, notes?: Record<string, string>): Promise<{ order_id: string; amount: number } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { data, error: fnError } = await supabase.functions.invoke('razorpay-create-order', {
        body: {
          amount,
          currency: 'INR',
          notes,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to create order');
      }

      if (!data?.order_id) {
        throw new Error('Invalid order response');
      }

      return {
        order_id: data.order_id,
        amount: data.amount,
      };
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openCheckout = useCallback((options: RazorpayOptions): Promise<PaymentResponse | null> => {
    return new Promise((resolve, reject) => {
      if (!RAZORPAY_KEY_ID) {
        setError('Razorpay key not configured');
        reject(new Error('Razorpay key not configured'));
        return;
      }

      // Check if Razorpay script is loaded
      if (!(window as any).Razorpay) {
        setError('Razorpay script not loaded');
        reject(new Error('Razorpay script not loaded. Please refresh the page.'));
        return;
      }

      const razorpay = new (window as any).Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: options.amount,
        currency: options.currency || 'INR',
        name: options.name,
        description: options.description,
        image: options.image,
        order_id: options.orderId,
        prefill: options.prefill,
        notes: options.notes,
        theme: options.theme || { color: '#C045FF' },
        handler: function (response: PaymentResponse) {
          resolve(response);
        },
        modal: {
          ondismiss: function() {
            reject(new Error('Payment cancelled by user'));
          },
          escape: false,
          backdropclose: false,
        },
      });

      razorpay.on('payment.failed', function (response: any) {
        reject(new Error(response.error.description || 'Payment failed'));
      });

      razorpay.open();
    });
  }, []);

  const verifyPayment = useCallback(async (response: PaymentResponse): Promise<{ valid: boolean; status?: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('razorpay-verify-payment', {
        body: response,
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to verify payment');
      }

      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to verify payment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createOrder,
    openCheckout,
    verifyPayment,
  };
}

// TypeScript declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}
