'use client';
import { useEffect, useState } from 'react';

export default function RazorpayScriptLoader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error('Razorpay script load failed');
    document.body.appendChild(script);
  }, []);

  return null; // This component doesn’t render anything visually
}
