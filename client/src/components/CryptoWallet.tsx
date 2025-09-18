import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [btcTransactionHash, setBtcTransactionHash] = useState("");
  const [showBtcForm, setShowBtcForm] = useState(false);
  const [isBtcWalletVerified, setIsBtcWalletVerified] = useState(false);
  const [showBtcVerification, setShowBtcVerification] = useState(false);
  const [btcChallenge, setBtcChallenge] = useState("");
  const [btcAddress, setBtcAddress] = useState("");
  const [btcSignature, setBtcSignature] = useState("");
  const [isVerifyingBtc, setIsVerifyingBtc] = useState(false);
  const { toast } = useToast();
  const { account, provider, walletType, isConnected, isConnecting, connectWallet, disconnectWallet, error: web3Error } = useWeb3();

  // Payment addresses loaded from environment variables - NO HARDCODED FALLBACKS FOR SECURITY
  const DEFAULT_PAYMENT_ADDRESSES = {
    ETH: import.meta.env.VITE_CRYPTO_ETH_ADDRESS,
    BTC: import.meta.env.VITE_CRYPTO_BTC_ADDRESS,
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

  // Generate Bitcoin wallet verification challenge
  const generateBtcChallenge = async () => {
    try {
      const response = await apiRequest("POST", "/api/wallet/bitcoin/verify-challenge", {});
      const data = await response.json();
      setBtcChallenge(data.challenge);
      setShowBtcVerification(true);
      
      toast({
        title: "Bitcoin Wallet Verification",
        description: "Please sign the challenge message with your Bitcoin wallet",
      });
    } catch (error) {
      console.error("Failed to generate Bitcoin challenge:", error);
      toast({
        title: "Verification Failed",
        description: "Failed to generate wallet verification challenge",
        variant: "destructive",
      });
    }
  };

  // Verify Bitcoin wallet signature
  const verifyBtcWallet = async () => {
    if (!btcAddress || !btcSignature || !btcChallenge) {
      toast({
        title: "Verification Required",
        description: "Please provide your Bitcoin address and signature",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingBtc(true);
    try {
      const response = await apiRequest("POST", "/api/wallet/bitcoin/verify-signature", {
        address: btcAddress,
        signature: btcSignature,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsBtcWalletVerified(true);
        setShowBtcVerification(false);
        toast({
          title: "Bitcoin Wallet Verified",
          description: `Your Bitcoin address ${btcAddress} has been verified successfully`,
        });
      }
    } catch (error: any) {
      console.error("Bitcoin wallet verification failed:", error);
      const errorData = error.response ? await error.response.json() : {};
      toast({
        title: "Verification Failed",
        description: errorData.message || "Failed to verify Bitcoin wallet",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingBtc(false);
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
        // Process Bitcoin payment verification
        if (!btcTransactionHash || btcTransactionHash.trim() === "") {
          toast({
            title: "Transaction Hash Required",
            description: "Please enter your Bitcoin transaction hash",
            variant: "destructive",
          });
          onPaymentError("Transaction hash required");
          return;
        }

        // Record the Bitcoin transaction for verification
        try {
          const response = await apiRequest("POST", "/api/tsu/purchase", {
            amount: amount,
            currency: "USD",
            paymentMethod: "bitcoin",
            paymentReference: btcTransactionHash.trim(),
          });
          
          const purchaseData = await response.json();
          
          toast({
            title: "Purchase Successful",
            description: `Successfully purchased ${parseFloat(purchaseData.transaction.amount).toFixed(2)} TSU with Bitcoin! TX: ${btcTransactionHash.slice(0, 10)}...`,
          });

          onPaymentComplete();
        } catch (purchaseError: any) {
          console.error("Bitcoin TSU purchase failed:", purchaseError);
          const errorData = purchaseError.response ? await purchaseError.response.json() : {};
          toast({
            title: "Bitcoin Payment Verification Failed",
            description: errorData.error || "Bitcoin transaction verification failed. Please check your transaction hash and ensure the payment was sent to the correct address.",
            variant: "destructive",
          });
          onPaymentError(`Bitcoin payment verification failed: ${errorData.error || 'Unknown error'}`);
        }
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
            <div className="space-y-3">
              <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded">
                <div className="font-semibold mb-2">Bitcoin Payment Instructions:</div>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  <li>Verify your Bitcoin wallet address for security</li>
                  <li>Send exactly <strong>{cryptoAmount} BTC</strong> to the address below</li>
                  <li>Wait for at least 3 confirmations</li>
                  <li>Enter your transaction hash and verify the payment</li>
                </ol>
              </div>

              {/* Bitcoin wallet verification section */}
              {!isBtcWalletVerified && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <div className="text-sm font-semibold text-red-700 mb-2">⚠️ Bitcoin Wallet Verification Required</div>
                  <div className="text-xs text-red-600 mb-3">
                    For security, you must verify your Bitcoin wallet address before making payments. This prevents fraudulent transactions.
                  </div>
                  
                  {!showBtcVerification ? (
                    <Button
                      onClick={generateBtcChallenge}
                      className="w-full bg-red-600 hover:bg-red-700"
                      data-testid="button-verify-btc-wallet"
                    >
                      Verify Bitcoin Wallet
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-gray-600">
                        <div className="font-semibold mb-1">Challenge Message:</div>
                        <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">
                          {btcChallenge}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Your Bitcoin address (that you'll send from)"
                          value={btcAddress}
                          onChange={(e) => setBtcAddress(e.target.value)}
                          className="font-mono text-sm"
                          data-testid="input-btc-address"
                        />
                        
                        <Input
                          type="text"
                          placeholder="Signature from your Bitcoin wallet"
                          value={btcSignature}
                          onChange={(e) => setBtcSignature(e.target.value)}
                          className="font-mono text-sm"
                          data-testid="input-btc-signature"
                        />
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={verifyBtcWallet}
                            disabled={isVerifyingBtc || !btcAddress || !btcSignature}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            data-testid="button-submit-btc-verification"
                          >
                            {isVerifyingBtc ? "Verifying..." : "Submit Verification"}
                          </Button>
                          <Button
                            onClick={() => setShowBtcVerification(false)}
                            variant="outline"
                            size="sm"
                            data-testid="button-cancel-btc-verification"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isBtcWalletVerified && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  ✅ Bitcoin wallet verified - You can now make Bitcoin payments
                </div>
              )}
              
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs font-semibold text-gray-600 mb-1">Payment Address:</div>
                <div className="font-mono text-sm break-all bg-white p-2 rounded border">
                  {getPaymentAddress()}
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(getPaymentAddress());
                    toast({
                      title: "Address Copied",
                      description: "Bitcoin address copied to clipboard",
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  data-testid="button-copy-btc-address"
                >
                  Copy Address
                </Button>
              </div>

              {!showBtcForm && isBtcWalletVerified && (
                <Button
                  onClick={() => setShowBtcForm(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  data-testid="button-show-btc-form"
                >
                  I've Sent the Bitcoin Payment
                </Button>
              )}

              {!isBtcWalletVerified && (
                <div className="text-center text-sm text-gray-500 italic">
                  Please verify your Bitcoin wallet first to proceed with payment
                </div>
              )}

              {showBtcForm && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">Enter Transaction Hash:</div>
                  <Input
                    type="text"
                    placeholder="Enter your Bitcoin transaction hash..."
                    value={btcTransactionHash}
                    onChange={(e) => setBtcTransactionHash(e.target.value)}
                    className="font-mono text-sm"
                    data-testid="input-btc-transaction-hash"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={processPayment}
                      disabled={isProcessing || isLoadingRates || !rates || !btcTransactionHash.trim()}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      data-testid="button-verify-btc-payment"
                    >
                      {isProcessing 
                        ? "Verifying..." 
                        : "Verify Bitcoin Payment"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowBtcForm(false);
                        setBtcTransactionHash("");
                      }}
                      variant="outline"
                      size="sm"
                      data-testid="button-cancel-btc-form"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}