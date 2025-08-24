import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: "Email Sent",
        description: "If the email exists, a password reset link has been sent.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    if (!forgotPasswordMutation.isPending) {
      form.reset();
      setEmailSent(false);
      onClose();
    }
  };

  const handleSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="forgot-password-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-tsu-green flex items-center gap-2" data-testid="modal-title">
            <Mail className="h-5 w-5" />
            Reset Password
          </DialogTitle>
        </DialogHeader>
        
        {!emailSent ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={forgotPasswordMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="bg-tsu-green hover:bg-tsu-dark-green"
                  data-testid="button-send-email"
                >
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Sent!</h3>
            <p className="text-gray-600 mb-6">
              If an account with that email exists, we've sent you a password reset link. Please check your email and follow the instructions.
            </p>
            <Button onClick={handleClose} className="bg-tsu-green hover:bg-tsu-dark-green">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}