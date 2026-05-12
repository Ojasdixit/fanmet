import { useState } from 'react';
import { Button } from '@fanmeet/ui';
import { useRazorpay } from '../hooks/useRazorpay';
import { useAuth } from '../contexts/AuthContext';

interface RazorpayPaymentButtonProps {
  amount: number; // in rupees
  description?: string;
  eventTitle: string;
  eventId: string;
  onSuccess?: (paymentId: string, orderId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function RazorpayPaymentButton({
  amount,
  description,
  eventTitle,
  eventId,
  onSuccess,
  onError,
  disabled = false,
  className,
}: RazorpayPaymentButtonProps) {
  const { isLoading, error, createOrder, openCheckout, verifyPayment } = useRazorpay();
  const { user } = useAuth();
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handlePayment = async () => {
    setPaymentError(null);

    try {
      // Step 1: Create order
      const orderData = await createOrder(amount * 100, { // Convert to paise
        event_id: eventId,
        user_id: user?.id || 'anonymous',
        event_title: eventTitle,
      });

      if (!orderData) {
        throw new Error(error || 'Failed to create order');
      }

      // Step 2: Open Razorpay checkout
      const paymentResponse = await openCheckout({
        amount: orderData.amount,
        currency: 'INR',
        name: 'FanMeet',
        description: description || `Payment for ${eventTitle}`,
        orderId: orderData.order_id,
        prefill: {
          name: user?.user_metadata?.name || '',
          email: user?.email || '',
        },
        notes: {
          event_id: eventId,
          user_id: user?.id || 'anonymous',
        },
        theme: {
          color: '#C045FF',
        },
      });

      if (!paymentResponse) {
        throw new Error('Payment was cancelled');
      }

      // Step 3: Verify payment
      const verification = await verifyPayment(paymentResponse);

      if (!verification?.valid) {
        throw new Error('Payment verification failed');
      }

      // Payment successful
      onSuccess?.(paymentResponse.razorpay_payment_id, paymentResponse.razorpay_order_id);
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setPaymentError(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handlePayment}
        disabled={disabled || isLoading}
        className={className}
        size="lg"
      >
        {isLoading ? 'Processing...' : `Pay ₹${amount}`}
      </Button>
      {paymentError && (
        <p className="text-xs text-red-500">{paymentError}</p>
      )}
    </div>
  );
}
