import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface SimpleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleLoginModal({ isOpen, onClose }: SimpleLoginModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/simple-login", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: `Welcome ${data.user.firstName || data.user.email}!`,
      });
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      form.reset();
      onClose();
      
      // Refresh the page to update the UI
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to log in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleClose = () => {
    if (!loginMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="login-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-tsu-green" data-testid="modal-title">
            Login to TSU Wallet
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

            <Card className="bg-blue-50" data-testid="admin-info">
              <CardContent className="pt-4">
                <div className="text-center">
                  <h4 className="font-medium text-blue-900 mb-2">Admin Access</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Use: <code className="bg-blue-100 px-2 py-1 rounded">admin@tsu-wallet.com</code>
                  </p>
                  <p className="text-xs text-blue-600">
                    This gives you super admin privileges to manage the platform.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loginMutation.isPending}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="flex-1 bg-tsu-green hover:bg-tsu-light-green"
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}