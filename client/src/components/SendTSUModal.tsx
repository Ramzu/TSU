import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Scan, Users } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const sendTSUSchema = z.object({
  recipientEmail: z.string().email("Please enter a valid email address"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => parseFloat(val) > 0, 
    "Amount must be greater than 0"
  ),
  description: z.string().optional(),
});

type SendTSUFormData = z.infer<typeof sendTSUSchema>;

interface SendTSUModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string;
}

export default function SendTSUModal({ isOpen, onClose, currentBalance }: SendTSUModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SendTSUFormData>({
    resolver: zodResolver(sendTSUSchema),
    defaultValues: {
      recipientEmail: "",
      amount: "",
      description: "",
    },
  });

  const sendTSUMutation = useMutation({
    mutationFn: async (data: SendTSUFormData) => {
      return apiRequest("POST", "/api/transactions/send", data);
    },
    onSuccess: () => {
      toast({
        title: "TSU Sent Successfully",
        description: "Your TSU transfer has been completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/transactions"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      let errorMessage = error.message || "Failed to send TSU. Please try again.";
      
      // Provide more helpful error message for recipient not found
      if (error.message === "Recipient not found") {
        errorMessage = "This email address is not registered in the TSU system. The recipient must create an account before receiving TSU transfers. For testing, try sending to: admin2@tsu-wallet.com";
      }
      
      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SendTSUFormData) => {
    const amount = parseFloat(data.amount);
    const balance = parseFloat(currentBalance);
    
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough TSU for this transfer.",
        variant: "destructive",
      });
      return;
    }

    sendTSUMutation.mutate(data);
  };

  const handleScanQR = () => {
    setIsScanning(true);
    // In a real app, this would open camera for QR scanning
    toast({
      title: "QR Scanner",
      description: "QR code scanning feature coming soon!",
    });
    setIsScanning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="send-tsu-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-tsu-green">
            <Send className="h-5 w-5" />
            Send TSU
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Balance Display */}
            <div className="p-3 bg-tsu-light-green/10 rounded-lg" data-testid="current-balance">
              <div className="text-sm text-tsu-green">Available Balance</div>
              <div className="text-xl font-bold text-tsu-green">
                {parseFloat(currentBalance).toFixed(2)} TSU
              </div>
            </div>

            {/* Recipient */}
            <FormField
              control={form.control}
              name="recipientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        placeholder="Enter recipient's email address"
                        {...field}
                        data-testid="input-recipient-email"
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={handleScanQR}
                      data-testid="button-scan-qr"
                    >
                      <Scan className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (TSU)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      data-testid="input-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => form.setValue("amount", (parseFloat(currentBalance) * 0.25).toFixed(2))}
                data-testid="button-25-percent"
              >
                25%
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => form.setValue("amount", (parseFloat(currentBalance) * 0.5).toFixed(2))}
                data-testid="button-50-percent"
              >
                50%
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => form.setValue("amount", (parseFloat(currentBalance) * 0.75).toFixed(2))}
                data-testid="button-75-percent"
              >
                75%
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => form.setValue("amount", currentBalance)}
                data-testid="button-max"
              >
                Max
              </Button>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What's this transfer for?"
                      {...field}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-tsu-green hover:bg-tsu-light-green text-white"
                disabled={sendTSUMutation.isPending}
                data-testid="button-send"
              >
                {sendTSUMutation.isPending ? "Sending..." : "Send TSU"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}