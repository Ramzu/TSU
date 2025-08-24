import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, Settings, CheckCircle, AlertCircle } from "lucide-react";

interface SmtpConfig {
  id?: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

const smtpConfigSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.string().min(1, "Port is required"),
  secure: z.boolean(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fromEmail: z.string().email("Valid email address is required"),
  fromName: z.string().min(1, "From name is required"),
});

type SmtpConfigFormData = z.infer<typeof smtpConfigSchema>;

export default function SmtpConfigSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Query to get current SMTP config
  const { data: smtpConfig, isLoading } = useQuery<SmtpConfig | null>({
    queryKey: ["/api/admin/smtp-config"],
    retry: false,
  });

  const form = useForm<SmtpConfigFormData>({
    resolver: zodResolver(smtpConfigSchema),
    defaultValues: {
      host: "",
      port: "587",
      secure: false,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "TSU Wallet",
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (smtpConfig && !isEditing) {
      form.reset({
        host: smtpConfig.host || "",
        port: smtpConfig.port?.toString() || "587",
        secure: smtpConfig.secure || false,
        username: smtpConfig.username || "",
        password: "", // Always empty for security
        fromEmail: smtpConfig.fromEmail || "",
        fromName: smtpConfig.fromName || "TSU Wallet",
      });
    }
  }, [smtpConfig, isEditing, form]);

  const saveConfigMutation = useMutation({
    mutationFn: async (data: SmtpConfigFormData) => {
      const response = await apiRequest("POST", "/api/admin/smtp-config", {
        ...data,
        port: parseInt(data.port),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMTP Configuration Saved",
        description: "Email settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smtp-config"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Save Configuration",
        description: error.message || "Could not save SMTP settings.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/smtp-test");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Test Successful",
        description: "SMTP server connection is working properly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Could not connect to SMTP server.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SmtpConfigFormData) => {
    saveConfigMutation.mutate(data);
  };

  const handleTestConnection = () => {
    if (!smtpConfig) {
      toast({
        title: "No Configuration",
        description: "Please save SMTP configuration before testing.",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-tsu-green border-t-transparent rounded-full mx-auto" />
            <p className="mt-2 text-gray-600">Loading configuration...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </div>
          <div className="flex items-center gap-2">
            {smtpConfig ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isEditing && smtpConfig ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">SMTP Host</label>
                <p className="text-sm">{smtpConfig.host}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Port</label>
                <p className="text-sm">{smtpConfig.port}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Username</label>
                <p className="text-sm">{smtpConfig.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">From Email</label>
                <p className="text-sm">{smtpConfig.fromEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">From Name</label>
                <p className="text-sm">{smtpConfig.fromName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Secure Connection</label>
                <p className="text-sm">{smtpConfig.secure ? "Yes" : "No"}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Edit Configuration
              </Button>
              <Button 
                onClick={handleTestConnection}
                disabled={testConnectionMutation.isPending}
                variant="outline"
              >
                {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="smtp.gmail.com"
                          data-testid="input-smtp-host"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="587"
                          data-testid="input-smtp-port"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="your-email@gmail.com"
                          data-testid="input-smtp-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          data-testid="input-smtp-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="noreply@tsu-wallet.com"
                          data-testid="input-from-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="TSU Wallet"
                          data-testid="input-from-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="secure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Secure Connection</FormLabel>
                      <div className="text-sm text-gray-600">
                        Use TLS/SSL for secure email transmission
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-secure"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={saveConfigMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveConfigMutation.isPending}
                  className="bg-tsu-green hover:bg-tsu-dark-green"
                >
                  {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {!smtpConfig && !isEditing && (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Email Configuration</h3>
            <p className="text-gray-600 mb-4">
              Configure SMTP settings to enable password reset emails and other notifications.
            </p>
            <Button onClick={() => setIsEditing(true)} className="bg-tsu-green hover:bg-tsu-dark-green">
              <Settings className="h-4 w-4 mr-2" />
              Configure Email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}