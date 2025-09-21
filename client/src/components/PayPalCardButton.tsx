import React, { useEffect, useRef } from "react";
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
      const orderPayload = {
        amount: amount,
        currency: currency,
        intent: "CAPTURE",
      };
      const response = await fetch("/api/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const output = await response.json();
      return output.id;
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
      try {
        if (!(window as any).paypal) {
          console.log("Loading PayPal SDK for card payments...");
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/sdk/js?components=buttons"
            : "https://www.sandbox.paypal.com/sdk/js?components=buttons";
          script.async = true;
          
          return new Promise((resolve, reject) => {
            script.onload = () => {
              console.log("PayPal SDK loaded successfully");
              resolve(true);
            };
            script.onerror = () => {
              console.error("Failed to load PayPal SDK");
              reject(new Error("Failed to load PayPal SDK"));
            };
            document.body.appendChild(script);
          });
        }
        return true;
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
          console.error("PayPal SDK still not loaded after loading attempt");
          onPaymentError?.("PayPal SDK failed to load. Please refresh and try again.");
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
          onPaymentError?.("Card payments not available. Please use PayPal instead.");
        }
      } catch (error) {
        console.error("Failed to initialize PayPal card payments:", error);
        onPaymentError?.("Failed to initialize card payments");
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

  return (
    <div className="w-full">
      <div 
        ref={cardContainerRef} 
        className="paypal-card-button-container"
        data-testid="paypal-card-button"
      />
      <p className="text-xs text-gray-500 mt-2 text-center">
        Powered by PayPal - Pay with your debit or credit card
      </p>
    </div>
  );
}