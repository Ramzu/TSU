import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PayPalCardButtonProps {
  amount: string;
  currency: string;
  onPaymentComplete?: () => void;
  onPaymentError?: (error: string) => void;
}

export default function PayPalCardButton({
  amount,
  currency,
  onPaymentComplete,
  onPaymentError,
}: PayPalCardButtonProps) {
  const { toast } = useToast();
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const paypalButtonsRef = useRef<any>(null);

  const createOrder = async () => {
    try {
      console.log("Creating PayPal order with amount:", amount, "currency:", currency);
      const orderPayload = {
        amount: amount,
        currency: currency,
        intent: "CAPTURE", // PayPal API expects uppercase
      };
      const response = await fetch("/api/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("PayPal order creation failed:", response.status, errorData);
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message}`);
      }
      
      const output = await response.json();
      console.log("PayPal order created successfully:", output);
      
      // Return just the order ID string
      if (typeof output.id === 'string') {
        return output.id;
      } else {
        console.error("Order ID is not a string:", output);
        throw new Error("Invalid order ID format");
      }
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      onPaymentError?.("Failed to create payment order");
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      console.log("Card payment approved", data);
      const response = await fetch(`/api/paypal/order/${data.orderID}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const orderData = await response.json();
      console.log("Capture result", orderData);
      
      // Process TSU purchase after successful PayPal payment
      if (orderData && orderData.status === 'COMPLETED') {
        const purchaseResponse = await fetch("/api/tsu/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount,
            currency: currency,
            paymentMethod: "paypal-card",
            paymentReference: data.orderID,
          }),
        });

        if (purchaseResponse.ok) {
          const purchaseData = await purchaseResponse.json();
          console.log("TSU purchase successful:", purchaseData);
          
          toast({
            title: "Payment Successful",
            description: `Successfully purchased ${parseFloat(amount).toFixed(2)} TSU with your card!`,
          });
          
          onPaymentComplete?.();
          // Refresh the page to update balance
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          throw new Error("Failed to process TSU purchase");
        }
      }
    } catch (error) {
      console.error("Error processing card payment:", error);
      onPaymentError?.("Payment failed. Please try again.");
    }
  };

  const onError = (err: any) => {
    console.error("PayPal card payment error:", err);
    onPaymentError?.("Payment failed. Please try again.");
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      // Check if PayPal SDK is already loaded from the main PayPal button
      if ((window as any).paypal) {
        console.log("PayPal SDK already loaded from main component");
        return true;
      }
      
      // If not loaded, try to load it
      try {
        console.log("Loading PayPal SDK for card payments...");
        const script = document.createElement("script");
        script.src = import.meta.env.PROD
          ? "https://www.paypal.com/sdk/js?components=buttons&disable-funding=credit,card"
          : "https://www.paypal.com/sdk/js?components=buttons&disable-funding=credit,card";
        script.async = true;
        
        return new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("PayPal SDK loaded successfully for card payments");
            resolve(true);
          };
          script.onerror = () => {
            console.error("Failed to load PayPal SDK for card payments");
            reject(new Error("Failed to load PayPal SDK"));
          };
          document.body.appendChild(script);
        });
      } catch (error) {
        console.error("Error loading PayPal SDK:", error);
        throw error;
      }
    };

    const initPayPal = async () => {
      try {
        // Ensure SDK is loaded first
        await loadPayPalSDK();
        
        // Small delay to ensure SDK is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));

        const clientToken = await fetch("/api/paypal/setup")
          .then((res) => res.json())
          .then((data) => data.clientToken);

        if (!(window as any).paypal) {
          console.log("PayPal SDK still not loaded, using fallback button");
          return;
        }

        if (paypalButtonsRef.current) {
          paypalButtonsRef.current.close();
        }

        if (cardContainerRef.current) {
          cardContainerRef.current.innerHTML = '';
        }

        paypalButtonsRef.current = (window as any).paypal
          .Buttons({
            fundingSource: (window as any).paypal.FUNDING.CARD,
            createOrder: createOrder,
            onApprove: onApprove,
            onError: onError,
            style: {
              layout: 'horizontal',
              color: 'black',
              shape: 'pill',
              label: 'pay',
              tagline: false,
              height: 40,
            },
          });

        console.log("PayPal buttons created, checking eligibility...");
        console.log("Container ref:", cardContainerRef.current);
        console.log("Buttons eligible:", paypalButtonsRef.current.isEligible());
        
        if (cardContainerRef.current && paypalButtonsRef.current.isEligible()) {
          console.log("Rendering PayPal card button...");
          paypalButtonsRef.current.render(cardContainerRef.current);
          console.log("PayPal card button rendered successfully");
        } else {
          console.log("PayPal card payments not eligible or container not found");
          console.log("Container:", !!cardContainerRef.current, "Eligible:", paypalButtonsRef.current.isEligible());
          console.log("Fallback button will be shown");
        }
      } catch (error) {
        console.log("PayPal card button initialization failed, using fallback:", error);
      }
    };

    // Initialize PayPal immediately
    initPayPal();

    return () => {
      if (paypalButtonsRef.current) {
        paypalButtonsRef.current.close();
      }
    };
  }, [amount, currency]);

  const [showFallbackButton, setShowFallbackButton] = useState(false);

  const handleFallbackPayment = async () => {
    try {
      // Use the same createOrder function but trigger payment differently
      const orderId = await createOrder();
      
      // Use live PayPal checkout URL (not sandbox)
      const checkoutUrl = import.meta.env.PROD 
        ? `https://www.paypal.com/checkoutnow?token=${orderId}`
        : `https://www.paypal.com/checkoutnow?token=${orderId}`;
      
      console.log("Opening PayPal checkout:", checkoutUrl);
      window.open(checkoutUrl, '_blank');
      
    } catch (error) {
      console.error("Fallback payment error:", error);
      alert("Payment initialization failed. Please try again.");
    }
  };

  // Set fallback button after timeout if PayPal button doesn't render
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (cardContainerRef.current && cardContainerRef.current.children.length === 0) {
        console.log("PayPal card button didn't render, showing fallback");
        setShowFallbackButton(true);
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  return (
    <div className="w-full">
      <div 
        ref={cardContainerRef} 
        className="paypal-card-button-container min-h-[40px]"
        data-testid="paypal-card-button"
      />
      
      {showFallbackButton && (
        <div className="mt-2">
          <button
            onClick={handleFallbackPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            data-testid="fallback-card-payment-button"
          >
            💳 Pay with Card
          </button>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Powered by PayPal - Pay with your debit or credit card
      </p>
    </div>
  );
}