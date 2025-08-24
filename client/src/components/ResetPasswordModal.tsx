import { useState, useEffect } from "react";
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
import { Key, CheckCircle } from "lucide-react";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function ResetPasswordModal({ isOpen, onClose, token }: ResetPasswordModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [passwordReset, setPasswordReset] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      setPasswordReset(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
    },
    onError: (error) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password. The link may have expired.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    if (!resetPasswordMutation.isPending) {
      form.reset();
      setPasswordReset(false);
      onClose();
    }
  };

  const handleSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="reset-password-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-tsu-green flex items-center gap-2" data-testid="modal-title">
            <Key className="h-5 w-5" />
            Set New Password
          </DialogTitle>
        </DialogHeader>
        
        {!passwordReset ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">
                Enter your new password below. Make sure it's secure and easy to remember.
              </p>
              
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter new password"
                        data-testid="input-new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm new password"
                        data-testid="input-confirm-password"
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
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="bg-tsu-green hover:bg-tsu-dark-green"
                  data-testid="button-reset-password"
                >
                  {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Updated!</h3>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <Button onClick={handleClose} className="bg-tsu-green hover:bg-tsu-dark-green">
              Continue to Login
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}