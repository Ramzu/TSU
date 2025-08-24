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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const createCoinSchema = z.object({
  totalSupply: z.string().min(1, "Total supply is required").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    "Total supply must be a positive number"
  ),
  reserveGold: z.string().min(1, "Gold reserve is required").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    "Gold reserve must be a non-negative number"
  ),
  reserveBrics: z.string().min(1, "BRICS reserve is required").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    "BRICS reserve must be a non-negative number"
  ),
  reserveCommodities: z.string().min(1, "Commodities reserve is required").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    "Commodities reserve must be a non-negative number"
  ),
  reserveAfrican: z.string().min(1, "African reserve is required").refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    "African reserve must be a non-negative number"
  ),
});

type CreateCoinFormData = z.infer<typeof createCoinSchema>;

interface CreateCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCoinModal({ isOpen, onClose }: CreateCoinModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateCoinFormData>({
    resolver: zodResolver(createCoinSchema),
    defaultValues: {
      totalSupply: "",
      reserveGold: "",
      reserveBrics: "",
      reserveCommodities: "",
      reserveAfrican: "",
    },
  });

  const watchTotalSupply = form.watch("totalSupply");
  const totalSupply = parseFloat(watchTotalSupply) || 0;

  const createCoinMutation = useMutation({
    mutationFn: async (data: CreateCoinFormData) => {
      const response = await apiRequest("POST", "/api/admin/coins/create", {
        totalSupply: data.totalSupply,
        circulatingSupply: data.totalSupply, // Initially, all created coins are in circulation
        reserveGold: data.reserveGold,
        reserveBrics: data.reserveBrics,
        reserveCommodities: data.reserveCommodities,
        reserveAfrican: data.reserveAfrican,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Coins Created Successfully",
        description: `Created ${parseFloat(data.totalSupply).toFixed(0)} TSU coins with proper reserve backing.`,
      });
      
      // Invalidate admin queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      
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
        title: "Coin Creation Failed",
        description: error.message || "Failed to create TSU coins. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateCoinFormData) => {
    createCoinMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createCoinMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="create-coin-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-tsu-green" data-testid="modal-title">
            Create TSU Coins
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="totalSupply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Supply (TSU)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="1"
                      min="1"
                      placeholder="1000000"
                      data-testid="input-total-supply"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reserveGold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gold Reserve (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="400000"
                        data-testid="input-gold-reserve"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reserveBrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BRICS Reserve (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="300000"
                        data-testid="input-brics-reserve"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reserveCommodities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commodities Reserve (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="200000"
                        data-testid="input-commodities-reserve"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reserveAfrican"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>African Reserve (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="100000"
                        data-testid="input-african-reserve"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {totalSupply > 0 && (
              <Card className="bg-gray-50" data-testid="reserve-allocation">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-tsu-green mb-3">Recommended Reserve Allocation</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Gold (40%)</span>
                      <div className="bg-tsu-gold h-2 rounded-full mt-1"></div>
                      <span className="text-xs text-gray-500">
                        ${(totalSupply * 0.4).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">BRICS (30%)</span>
                      <div className="bg-blue-500 h-2 rounded-full mt-1"></div>
                      <span className="text-xs text-gray-500">
                        ${(totalSupply * 0.3).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Commodities (20%)</span>
                      <div className="bg-green-500 h-2 rounded-full mt-1"></div>
                      <span className="text-xs text-gray-500">
                        ${(totalSupply * 0.2).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">African (10%)</span>
                      <div className="bg-orange-500 h-2 rounded-full mt-1"></div>
                      <span className="text-xs text-gray-500">
                        ${(totalSupply * 0.1).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert className="border-yellow-200 bg-yellow-50" data-testid="warning-alert">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Creating new TSU coins requires adequate reserve backing. Ensure sufficient reserves are available before proceeding.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createCoinMutation.isPending}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCoinMutation.isPending}
                className="flex-1 bg-tsu-green hover:bg-tsu-light-green"
                data-testid="button-create-coins"
              >
                {createCoinMutation.isPending ? "Creating..." : "Create Coins"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
