import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

const buyTSUSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 10;
    },
    "Minimum purchase amount is $10"
  ),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

type BuyTSUFormData = z.infer<typeof buyTSUSchema>;

interface BuyTSUModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyTSUModal({ isOpen, onClose }: BuyTSUModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BuyTSUFormData>({
    resolver: zodResolver(buyTSUSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "",
    },
  });

  const watchAmount = form.watch("amount");
  const watchPaymentMethod = form.watch("paymentMethod");
  const amount = parseFloat(watchAmount) || 0;
  const processingFee = amount * 0.025; // 2.5% fee
  const tsuPrice = 1.25; // $1.25 per TSU
  const tsuAmount = (amount - processingFee) / tsuPrice;

  const buyTSUMutation = useMutation({
    mutationFn: async (data: BuyTSUFormData) => {
      const response = await apiRequest("POST", "/api/tsu/purchase", {
        amount: data.amount,
        currency: "USD",
        paymentMethod: data.paymentMethod,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purchase Successful",
        description: `You have successfully purchased ${parseFloat(data.transaction.amount).toFixed(2)} TSU!`,
      });
      
      // Invalidate and refetch user data and transactions
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/transactions"] });
      
      form.reset();
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to process TSU purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: BuyTSUFormData) => {
    buyTSUMutation.mutate(data);
  };

  const handleClose = () => {
    if (!buyTSUMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="buy-tsu-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-tsu-green" data-testid="modal-title">
            Buy TSU
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="10"
                      placeholder="100.00"
                      data-testid="input-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {amount > 0 && (
              <Card className="bg-gray-50" data-testid="transaction-summary">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Exchange Rate:</span>
                      <span>1 TSU = $1.25 USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee (2.5%):</span>
                      <span>${processingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-tsu-green border-t pt-2">
                      <span>You will receive:</span>
                      <span data-testid="tsu-amount-display">{tsuAmount.toFixed(2)} TSU</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paypal" data-testid="payment-paypal">PayPal</SelectItem>
                      <SelectItem value="bitcoin" data-testid="payment-bitcoin">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ethereum" data-testid="payment-ethereum">Ethereum (ETH)</SelectItem>
                      <SelectItem value="credit-card" data-testid="payment-credit-card">Credit Card</SelectItem>
                      <SelectItem value="bank-transfer" data-testid="payment-bank-transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method Specific Instructions */}
            {watchPaymentMethod === 'paypal' && (
              <Card className="bg-blue-50 border-blue-200" data-testid="paypal-instructions">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PP</span>
                    </div>
                    <span className="font-medium text-blue-900">PayPal Payment</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Secure payment through PayPal. You'll be redirected to PayPal to complete your purchase.
                  </p>
                </CardContent>
              </Card>
            )}

            {(watchPaymentMethod === 'bitcoin' || watchPaymentMethod === 'ethereum') && (
              <Card className="bg-orange-50 border-orange-200" data-testid="crypto-instructions">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₿</span>
                    </div>
                    <span className="font-medium text-orange-900">
                      {watchPaymentMethod === 'bitcoin' ? 'Bitcoin' : 'Ethereum'} Payment
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 mb-2">
                    Current rate: 1 TSU = {watchPaymentMethod === 'bitcoin' ? '0.000025 BTC' : '0.0008 ETH'}
                  </p>
                  <p className="text-sm text-orange-600">
                    Cryptocurrency payments coming soon. Please use PayPal for now.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={buyTSUMutation.isPending}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={buyTSUMutation.isPending || watchPaymentMethod === 'bitcoin' || watchPaymentMethod === 'ethereum'}
                className="flex-1 bg-tsu-green hover:bg-tsu-light-green disabled:opacity-50"
                data-testid="button-buy-tsu"
              >
                {buyTSUMutation.isPending ? "Processing..." : 
                 (watchPaymentMethod === 'bitcoin' || watchPaymentMethod === 'ethereum') ? "Coming Soon" : "Buy TSU"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
