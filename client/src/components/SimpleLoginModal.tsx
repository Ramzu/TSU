import { useState, useEffect } from "react";
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
import { useTranslation } from "react-i18next";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface SimpleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'login' | 'register';
}

export default function SimpleLoginModal({ isOpen, onClose, mode = 'login' }: SimpleLoginModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(mode);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  // Reset mode when modal opens or mode prop changes
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, isOpen]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/simple-login", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("toast.loginSuccess"),
        description: t("toast.loginWelcome", { name: data.user.firstName || data.user.email }),
      });
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      loginForm.reset();
      onClose();
      
      // Refresh the page to update the UI
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: t("toast.loginFailed"),
        description: error.message || "Failed to log in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/auth/simple-register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("toast.registrationSuccess"),
        description: t("toast.registrationWelcome", { name: data.user.firstName }),
      });
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      registerForm.reset();
      onClose();
      
      // Refresh the page to update the UI
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: t("toast.registrationFailed"),
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: LoginFormData | RegisterFormData) => {
    if (currentMode === 'login') {
      loginMutation.mutate(data as LoginFormData);
    } else {
      registerMutation.mutate(data as RegisterFormData);
    }
  };

  const handleClose = () => {
    if (!loginMutation.isPending && !registerMutation.isPending) {
      loginForm.reset();
      registerForm.reset();
      onClose();
    }
  };

  const switchMode = () => {
    setCurrentMode(currentMode === 'login' ? 'register' : 'login');
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="login-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-tsu-green" data-testid="modal-title">
            {currentMode === 'login' ? t('auth.login.title') : t('auth.register.title')}
          </DialogTitle>
        </DialogHeader>
        
        {currentMode === 'login' ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
              <FormField
                control={loginForm.control}
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

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              

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

              <div className="text-center pt-2">
                <Button
                  type="button"
                  variant="link"
                  onClick={switchMode}
                  className="text-tsu-green hover:text-tsu-light-green"
                  data-testid="button-switch-mode"
                >
                  Don't have an account? Register here
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Your first name"
                        data-testid="input-firstName"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Your last name"
                        data-testid="input-lastName"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
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

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={registerMutation.isPending}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="flex-1 bg-tsu-green hover:bg-tsu-light-green"
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </div>

              <div className="text-center pt-2">
                <Button
                  type="button"
                  variant="link"
                  onClick={switchMode}
                  className="text-tsu-green hover:text-tsu-light-green"
                  data-testid="button-switch-mode"
                >
                  Already have an account? Login here
                </Button>
              </div>
            </form>
          </Form>
        )}

      </DialogContent>
    </Dialog>
  );
}