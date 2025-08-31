import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, TrendingDown, Users, Globe } from "lucide-react";
import { COUNTRY_OPTIONS } from "@shared/schema";

const balanceAdjustSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  operation: z.enum(["increase", "decrease"], {
    required_error: "Operation is required",
  }),
});

const distributeCoinsSchema = z.object({
  country: z.string().min(1, "Country is required"),
  amount: z.string().min(1, "Amount is required"),
  reason: z.string().min(1, "Reason is required"),
});

type BalanceAdjustFormData = z.infer<typeof balanceAdjustSchema>;
type DistributeCoinsFormData = z.infer<typeof distributeCoinsSchema>;

export default function BalanceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const balanceForm = useForm<BalanceAdjustFormData>({
    resolver: zodResolver(balanceAdjustSchema),
    defaultValues: {
      amount: "",
      operation: "increase",
    },
  });

  const distributeForm = useForm<DistributeCoinsFormData>({
    resolver: zodResolver(distributeCoinsSchema),
    defaultValues: {
      country: "",
      amount: "",
      reason: "",
    },
  });

  // Get current coin supply
  const { data: coinSupply, isLoading: isLoadingSupply } = useQuery({
    queryKey: ["/api/coin-supply"],
    retry: false,
  });

  // Get country statistics
  const { data: countryStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/country-stats"],
    retry: false,
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: async (data: BalanceAdjustFormData) => {
      const response = await apiRequest("POST", "/api/admin/balance/adjust", {
        amount: data.amount,
        operation: data.operation,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Balance Adjusted",
        description: "TSU supply has been updated successfully",
      });
      balanceForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/coin-supply"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/country-stats"] });
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
        title: "Error",
        description: error.message || "Failed to adjust balance",
        variant: "destructive",
      });
    },
  });

  const distributeCoinsMutation = useMutation({
    mutationFn: async (data: DistributeCoinsFormData) => {
      const response = await apiRequest("POST", "/api/admin/distribute-coins", {
        country: data.country,
        amount: data.amount,
        reason: data.reason,
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Coins Distributed",
        description: `${result.totalDistributed} TSU distributed to ${result.distributedTo} users`,
      });
      distributeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/country-stats"] });
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
        title: "Error",
        description: error.message || "Failed to distribute coins",
        variant: "destructive",
      });
    },
  });

  if (isLoadingSupply || isLoadingStats) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="balance-management">
      {/* Current Supply Overview */}
      <Card data-testid="supply-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-tsu-green" />
            TSU Supply Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Supply</span>
                <Badge variant="secondary">{(coinSupply as any)?.totalSupply || '0'} TSU</Badge>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Circulating Supply</span>
                <Badge variant="secondary">{(coinSupply as any)?.circulatingSupply || '0'} TSU</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="adjust" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="adjust" data-testid="tab-adjust">Adjust Supply</TabsTrigger>
          <TabsTrigger value="distribute" data-testid="tab-distribute">Distribute by Country</TabsTrigger>
        </TabsList>

        {/* Adjust Supply Tab */}
        <TabsContent value="adjust">
          <Card data-testid="adjust-supply-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-tsu-green" />
                Adjust Total Supply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...balanceForm}>
                <form onSubmit={balanceForm.handleSubmit((data) => adjustBalanceMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={balanceForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.00000001"
                              placeholder="0.00000000"
                              data-testid="input-adjust-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={balanceForm.control}
                      name="operation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operation</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-operation">
                                <SelectValue placeholder="Select operation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="increase" data-testid="operation-increase">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                  Increase Supply
                                </div>
                              </SelectItem>
                              <SelectItem value="decrease" data-testid="operation-decrease">
                                <div className="flex items-center gap-2">
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                  Decrease Supply
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={adjustBalanceMutation.isPending}
                    className="w-full"
                    data-testid="button-adjust-balance"
                  >
                    {adjustBalanceMutation.isPending ? "Adjusting..." : "Adjust Supply"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribute by Country Tab */}
        <TabsContent value="distribute">
          <Card data-testid="distribute-coins-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-tsu-green" />
                Distribute by Country
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Country Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(countryStats as any)?.map((stat: any) => (
                  <div key={stat.country} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {COUNTRY_OPTIONS.find(c => c.value === stat.country)?.label || stat.country}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {stat.userCount}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold text-tsu-green mt-1">
                      {stat.totalBalance} TSU
                    </div>
                  </div>
                ))}
              </div>

              <Form {...distributeForm}>
                <form onSubmit={distributeForm.handleSubmit((data) => distributeCoinsMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={distributeForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Country</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-target-country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <div className="text-xs font-medium text-gray-500 px-2 py-1">African Nations</div>
                              {COUNTRY_OPTIONS.filter(country => country.region === 'Africa').map((country) => (
                                <SelectItem key={country.value} value={country.value} data-testid={`distribute-country-${country.value}`}>
                                  {country.label}
                                </SelectItem>
                              ))}
                              <div className="text-xs font-medium text-gray-500 px-2 py-1 mt-2">BRICS Partners</div>
                              {COUNTRY_OPTIONS.filter(country => country.region === 'BRICS').map((country) => (
                                <SelectItem key={country.value} value={country.value} data-testid={`distribute-country-${country.value}`}>
                                  {country.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={distributeForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount to Distribute</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.00000001"
                              placeholder="0.00000000"
                              data-testid="input-distribute-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={distributeForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distribution Reason</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="e.g., Monthly trade incentive, Emergency aid distribution..."
                            data-testid="textarea-reason"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={distributeCoinsMutation.isPending}
                    className="w-full"
                    data-testid="button-distribute-coins"
                  >
                    {distributeCoinsMutation.isPending ? "Distributing..." : "Distribute Coins"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}