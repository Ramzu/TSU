import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Copy, Share, Download, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ReceiveTSUModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiveTSUModal({ isOpen, onClose }: ReceiveTSUModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const generatePaymentLink = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      recipient: user?.email || "",
      ...(amount && { amount }),
      ...(description && { description }),
    });
    return `${baseUrl}/send?${params.toString()}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Payment information has been copied.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const sharePaymentRequest = async () => {
    const paymentLink = generatePaymentLink();
    const shareText = `Send me ${amount || "some"} TSU: ${paymentLink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "TSU Payment Request",
          text: shareText,
          url: paymentLink,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const sendViaEmail = () => {
    const paymentLink = generatePaymentLink();
    const subject = "TSU Payment Request";
    const body = `Hi,\n\nPlease send me ${amount || "some"} TSU using this link:\n${paymentLink}\n\n${description ? `Note: ${description}` : ""}\n\nThanks!`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Generate QR code data
  const qrData = generatePaymentLink();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="receive-tsu-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-tsu-green">
            <QrCode className="h-5 w-5" />
            Receive TSU
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Your Email */}
          <Card>
            <CardContent className="pt-4">
              <Label className="text-sm font-medium">Your TSU Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  value={user?.email || ""} 
                  readOnly 
                  className="bg-gray-50"
                  data-testid="user-email"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(user?.email || "")}
                  data-testid="copy-email"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Request Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Request Amount (Optional)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00 TSU"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="input-amount"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="What's this payment for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-description"
            />
          </div>

          {/* QR Code Placeholder */}
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <QrCode className="h-12 w-12 mb-2" />
                <p className="text-sm">QR Code would appear here</p>
                <p className="text-xs text-muted-foreground">Coming soon!</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Link */}
          <div className="space-y-2">
            <Label>Payment Link</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={generatePaymentLink()} 
                readOnly 
                className="bg-gray-50 text-xs"
                data-testid="payment-link"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(generatePaymentLink())}
                data-testid="copy-link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={sharePaymentRequest}
              data-testid="share-request"
            >
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={sendViaEmail}
              data-testid="email-request"
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Download QR",
                  description: "QR code download coming soon!",
                });
              }}
              data-testid="download-qr"
            >
              <Download className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>

          <Button 
            onClick={onClose}
            className="w-full mt-4"
            data-testid="close-modal"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}