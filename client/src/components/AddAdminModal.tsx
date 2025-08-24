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
import { Checkbox } from "@/components/ui/checkbox";

const addAdminSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "super_admin"], {
    required_error: "Please select an admin role",
  }),
});

type AddAdminFormData = z.infer<typeof addAdminSchema>;

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAdminModal({ isOpen, onClose }: AddAdminModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddAdminFormData>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      email: "",
      role: "admin",
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async (data: AddAdminFormData) => {
      // For now, we'll create a placeholder user ID based on email
      // In a real implementation, you'd first create the user account or search for existing user
      const userId = `temp_${data.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      const response = await apiRequest("POST", "/api/admin/users/promote", {
        userId: userId,
        role: data.role,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Administrator Added",
        description: "The user has been successfully promoted to administrator.",
      });
      
      // Invalidate admin queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      
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
        title: "Failed to Add Administrator",
        description: "User must have an existing account before being promoted to admin. Please ask them to register first.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AddAdminFormData) => {
    addAdminMutation.mutate(data);
  };

  const handleClose = () => {
    if (!addAdminMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="add-admin-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-tsu-green" data-testid="modal-title">
            Add Administrator
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
                      placeholder="admin@example.com"
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="Select admin role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin" data-testid="role-admin">Administrator</SelectItem>
                      <SelectItem value="super_admin" data-testid="role-super-admin">Super Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3" data-testid="permissions-section">
              <FormLabel>Permissions Preview</FormLabel>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox checked disabled />
                  <span className="text-gray-700">User Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked disabled />
                  <span className="text-gray-700">Transaction Monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={form.watch("role") === "super_admin"} disabled />
                  <span className="text-gray-700">Coin Creation (Super Admin only)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked disabled />
                  <span className="text-gray-700">Content Management</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={addAdminMutation.isPending}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addAdminMutation.isPending}
                className="flex-1 bg-tsu-green hover:bg-tsu-light-green"
                data-testid="button-add-admin"
              >
                {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
