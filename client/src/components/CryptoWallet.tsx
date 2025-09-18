import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWeb3 } from "@/providers/Web3Provider";
import { fetchCryptoPrices, calculateCryptoAmount } from "@/lib/cryptoService";
import WalletSelector from "@/components/WalletSelector";

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
  paymentAddress?: string; // Optional custom payment address
}

export default function CryptoWallet({ amount, currency, onPaymentComplete, onPaymentError, paymentAddress }: CryptoWalletProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [rates, setRates] = useState<{ BTC: number; ETH: number } | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const { toast } = useToast();
  const { account, provider, walletType, isConnected, isConnecting, connectWallet, disconnectWallet, error: web3Error } = useWeb3();

  // Payment addresses loaded from environment variables
  const DEFAULT_PAYMENT_ADDRESSES = {
    ETH: import.meta.env.VITE_CRYPTO_ETH_ADDRESS || "0xa02476e87E6646C824dfb1C6aa071B5A73DAcc80", // Your Ethereum address
    BTC: import.meta.env.VITE_CRYPTO_BTC_ADDRESS || "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // Bitcoin address needed
  };

  const getPaymentAddress = () => {
    return paymentAddress || DEFAULT_PAYMENT_ADDRESSES[currency];
  };

  // Fetch crypto prices on component mount
  useEffect(() => {
    const loadRates = async () => {
      setIsLoadingRates(true);
      try {
        const newRates = await fetchCryptoPrices();
        setRates(newRates);
      } catch (error) {
        console.error('Failed to load crypto rates:', error);
        toast({
          title: "Price Loading Failed",
          description: "Using fallback exchange rates",
          variant: "destructive",
        });
      } finally {
        setIsLoadingRates(false);
      }
    };

    loadRates();
  }, []);

  const cryptoAmount = rates 
    ? calculateCryptoAmount(parseFloat(amount), currency, rates)
    : "Loading...";


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
        
        // Send payment to configured address
        const recipientAddress = getPaymentAddress();
        const ethAmount = rates ? calculateCryptoAmount(parseFloat(amount), currency, rates) : "0";
        const tx = await signer.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(ethAmount),
        });

        await tx.wait();

        // Record the transaction in our system
        try {
          const response = await apiRequest("POST", "/api/tsu/purchase", {
            amount: amount,
            currency: "USD",
            paymentMethod: "ethereum",
            paymentReference: tx.hash,
          });
          
          const purchaseData = await response.json();
          
          toast({
            title: "Purchase Successful",
            description: `Successfully purchased ${parseFloat(purchaseData.transaction.amount).toFixed(2)} TSU with Ethereum! TX: ${tx.hash.slice(0, 10)}...`,
          });

          onPaymentComplete();
        } catch (purchaseError: any) {
          console.error("TSU purchase failed:", purchaseError);
          toast({
            title: "Payment Processed, TSU Purchase Failed", 
            description: `Ethereum payment succeeded (TX: ${tx.hash.slice(0, 10)}...) but TSU purchase failed. Please contact support.`,
            variant: "destructive",
          });
          onPaymentError(`TSU purchase failed: ${purchaseError.message || 'Unknown error'}`);
        }
      } else if (currency === "BTC") {
        toast({
          title: "Bitcoin Disabled",
          description: "Bitcoin payments are disabled for security",
          variant: "destructive",
        });
        onPaymentError("Bitcoin payments are disabled");
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
              ≈ ${amount} USD {isLoadingRates ? "(Loading rates...)" : "at current market rates"}
            </div>
          </div>

          {currency === "ETH" && !isConnected && (
            <WalletSelector 
              onWalletConnect={() => {
                toast({
                  title: "Wallet Connected",
                  description: `Successfully connected via ${walletType === 'metamask' ? 'MetaMask' : 'WalletConnect'}`,
                });
              }}
            />
          )}

          {currency === "ETH" && isConnected && (
            <div className="space-y-2">
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                Connected via {walletType === 'metamask' ? 'MetaMask' : walletType === 'walletconnect' ? 'WalletConnect' : 'Wallet'}: {account?.slice(0, 6)}...{account?.slice(-4)}
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={processPayment}
                  disabled={isProcessing || isLoadingRates || !rates}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  data-testid="button-pay-eth"
                >
                  {isProcessing 
                    ? "Processing..." 
                    : isLoadingRates 
                    ? "Loading rates..." 
                    : `Pay ${cryptoAmount} ETH`}
                </Button>
                <Button
                  onClick={() => {
                    disconnectWallet();
                    toast({
                      title: "Wallet Disconnected",
                      description: "Wallet has been disconnected",
                    });
                  }}
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