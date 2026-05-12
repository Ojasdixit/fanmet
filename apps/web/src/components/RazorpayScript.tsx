import { useEffect, useState } from 'react';

interface RazorpayScriptProps {
  children: React.ReactNode;
}

export function RazorpayScript({ children }: RazorpayScriptProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById('razorpay-script')) {
      setIsLoaded(true);
      return;
    }

    // Check if Razorpay is already available
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount as it might be needed by other components
    };
  }, []);

  return <>{children}</>;
}
