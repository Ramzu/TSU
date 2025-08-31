import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    ethereum?: any;
    bitcoin?: any;
  }
}

interface CryptoWalletProps {
  amount: string;
  currency: "BTC" | "ETH";
  onPaymentComplete: () => void;
  onPaymentError: (error: string) => void;
}

export default function CryptoWallet({ amount, currency, onPaymentComplete, onPaymentError }: CryptoWalletProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Conversion rates (simplified - in production these should come from an API)
  const RATES = {
    BTC: 0.000025, // 1 USD = 0.000025 BTC
    ETH: 0.0008,   // 1 USD = 0.0008 ETH
  };

  const cryptoAmount = (parseFloat(amount) * RATES[currency]).toFixed(8);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (currency === "ETH") {
        if (window.ethereum) {
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          setAccount(accounts[0]);
          setProvider(ethProvider);
          toast({
            title: "Wallet Connected",
            description: "Ethereum wallet connected successfully",
          });
        } else {
          throw new Error("No Ethereum wallet found");
        }
      } else if (currency === "BTC") {
        // For Bitcoin, we'll simulate wallet connection
        // In production, you'd integrate with actual Bitcoin wallet providers
        toast({
          title: "Bitcoin Payment",
          description: "Bitcoin payment simulation - feature coming soon",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      onPaymentError("Failed to connect wallet");
      toast({
        title: "Connection Failed",
        description: "Failed to connect to wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const processPayment = async () => {
    if (!account && currency === "ETH") {
      onPaymentError("Wallet not connected");
      return;
    }

    setIsProcessing(true);
    try {
      if (currency === "ETH" && provider) {
        // Process Ethereum payment
        const signer = await provider.getSigner();
        
        // For demo purposes, we'll use a simple transaction
        // In production, you'd send to your smart contract or payment address
        const tx = await signer.sendTransaction({
          to: "0x742d35Cc6565C3E31fD2a8a7aEf7Ef01dD1E2E0C", // Demo address
          value: ethers.parseEther(cryptoAmount),
        });

        await tx.wait();

        // Record the transaction in our system
        await apiRequest("POST", "/api/tsu/purchase", {
          amount: amount,
          currency: "USD",
          paymentMethod: "ethereum",
          paymentReference: tx.hash,
        });

        toast({
          title: "Payment Successful",
          description: `Ethereum payment completed. TX: ${tx.hash.slice(0, 10)}...`,
        });

        onPaymentComplete();
      } else if (currency === "BTC") {
        // Bitcoin payment simulation
        // In production, integrate with Bitcoin payment processors
        toast({
          title: "Bitcoin Payment",
          description: "Bitcoin payments coming soon",
          variant: "destructive",
        });
        onPaymentError("Bitcoin payments not yet implemented");
      }
    } catch (error) {
      console.error("Payment error:", error);
      onPaymentError("Payment failed");
      toast({
        title: "Payment Failed",
        description: "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    toast({
      title: "Wallet Disconnected",
      description: "Wallet has been disconnected",
    });
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardContent className="pt-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {currency === "BTC" ? "₿" : "Ξ"}
            </span>
          </div>
          <span className="font-medium text-purple-900">
            {currency === "BTC" ? "Bitcoin" : "Ethereum"} Payment
          </span>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-purple-700">
            <div>Amount: {cryptoAmount} {currency}</div>
            <div className="text-xs text-purple-600">
              ≈ ${amount} USD at current rates
            </div>
          </div>

          {currency === "ETH" && !account && (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-connect-eth-wallet"
            >
              {isConnecting ? "Connecting..." : "Connect Ethereum Wallet"}
            </Button>
          )}

          {currency === "ETH" && account && (
            <div className="space-y-2">
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={processPayment}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-pay-eth"
                >
                  {isProcessing ? "Processing..." : `Pay ${cryptoAmount} ETH`}
                </Button>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  size="sm"
                  data-testid="button-disconnect-eth"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          {currency === "BTC" && (
            <div className="space-y-2">
              <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                Bitcoin payments are coming soon. Our team is working on integrating with major Bitcoin wallet providers.
              </div>
              <Button
                disabled
                className="w-full bg-gray-400 cursor-not-allowed"
                data-testid="button-pay-btc-disabled"
              >
                Bitcoin Payment (Coming Soon)
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}