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
    const initPayPal = async () => {
      try {
        const clientToken = await fetch("/api/paypal/setup")
          .then((res) => res.json())
          .then((data) => data.clientToken);

        if (!(window as any).paypal) {
          console.error("PayPal SDK not loaded");
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

        if (cardContainerRef.current && paypalButtonsRef.current.isEligible()) {
          paypalButtonsRef.current.render(cardContainerRef.current);
        } else {
          console.log("PayPal card payments not eligible");
          onPaymentError?.("Card payments not available. Please use PayPal instead.");
        }
      } catch (error) {
        console.error("Failed to initialize PayPal card payments:", error);
        onPaymentError?.("Failed to initialize card payments");
      }
    };

    // Add a small delay to ensure PayPal SDK is loaded
    const timer = setTimeout(initPayPal, 500);
    return () => {
      clearTimeout(timer);
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