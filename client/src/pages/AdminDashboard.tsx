import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import CreateCoinModal from "@/components/CreateCoinModal";
import AddAdminModal from "@/components/AddAdminModal";
import ContentEditor from "@/components/ContentEditor";
import MetadataEditor from "@/pages/MetadataEditor";
import SmtpConfigSection from "@/components/SmtpConfigSection";
import EmailMessagingSection from "@/components/EmailMessagingSection";
import ContactMessagesSection from "@/components/ContactMessagesSection";
import CommodityRegistrationsSection from "@/components/CommodityRegistrationsSection";
import CurrencyRegistrationsSection from "@/components/CurrencyRegistrationsSection";
import ContentSyncSection from "@/components/ContentSyncSection";
import BalanceManagement from "@/components/BalanceManagement";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Users, Coins, BarChart3, Shield, Plus, Edit, Settings, Globe, Mail, Phone, MapPin, DollarSign, Wallet, Trash2, MessageCircle, Rocket, AlertTriangle, Package, CreditCard, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Footer from "@/components/Footer";

interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalTransactions: number;
  circulatingSupply: string;
  totalSupply: string;
}

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin' | 'super_admin';
  tsuBalance: string;
  isActive: boolean;
  createdAt: string;
}

interface Transaction {
  id: string;
  userId?: string;
  type: 'purchase' | 'sale' | 'transfer' | 'creation' | 'exchange';
  amount: string;
  currency: string;
  description?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateCoinModal, setShowCreateCoinModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [newTsuPrice, setNewTsuPrice] = useState("1.00");
  const [updateReason, setUpdateReason] = useState("");

  // Fetch current content to get contact info (without Date.now to prevent infinite loop)
  const { data: contentData = [] } = useQuery({
    queryKey: ['/api/content'],
    staleTime: 0,
    gcTime: 0,
    select: (response: any) => response.data || response
  });

  // Contact form handling
  const contactForm = useForm({
    defaultValues: {
      email: 'authority@tsu.africa',
      phone: '+27 (0) 11 123 4567',
      address: 'Johannesburg, South Africa'
    }
  });

  // Update form when contact data loads (stable effect)
  useEffect(() => {
    const contactItem = contentData.find((item: any) => item.key === 'contact_info');
    if (contactItem) {
      try {
        const savedContactInfo = JSON.parse(contactItem.value);
        contactForm.reset(savedContactInfo);
      } catch (e) {
        console.error('Error parsing contact info:', e);
      }
    }
  }, [contentData, contactForm]);

  // Contact info mutation
  const contactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      return apiRequest('POST', '/api/content', {
        key: 'contact_info',
        value: JSON.stringify(contactData),
        section: 'settings'
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Contact Information Saved!",
        description: "Your changes are now live on tsunit.com",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
    },
    onError: (error: any) => {
      console.error("Contact save error:", error);
      toast({
        title: "❌ Save Failed", 
        description: error.message || "Failed to update contact information",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "✅ User Deleted!",
        description: "User has been permanently removed from the system",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      console.error("Delete user error:", error);
      toast({
        title: "❌ Deletion Failed", 
        description: error.message || "Failed to delete user",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async (data: { tsuPrice: string; reason: string }) => {
      return apiRequest('PUT', '/api/admin/tsu-rates', data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Exchange Rate Updated!",
        description: "TSU exchange rate has been successfully updated",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tsu-rates'] });
      setNewTsuPrice("1.00");
      setUpdateReason("");
    },
    onError: (error: any) => {
      console.error("Update pricing error:", error);
      toast({
        title: "❌ Update Failed", 
        description: error.message || "Failed to update exchange rate",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const { data: stats, error: statsError } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const { data: users = [], error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const { data: transactions = [], error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Handle pricing update
  const handleUpdatePricing = () => {
    if (!newTsuPrice || parseFloat(newTsuPrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid TSU price greater than 0",
        variant: "destructive",
      });
      return;
    }

    updatePricingMutation.mutate({
      tsuPrice: newTsuPrice,
      reason: updateReason || "Admin rate update"
    });
  };

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
      return;
    }

    // Handle unauthorized errors from API calls
    const errors = [statsError, usersError, transactionsError].filter(Boolean);
    errors.forEach((error) => {
      if (error && isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    });
  }, [user, isLoading, toast, statsError, usersError, transactionsError]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-tsu-green font-bold text-2xl">TSU</span>
          </div>
          <p className="text-tsu-green">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Admin Header */}
          <div className="flex items-center justify-between mb-8" data-testid="admin-header">
            <div>
              <h1 className="text-3xl font-bold text-tsu-green">Admin Dashboard</h1>
              <p className="text-gray-600">Manage TSU platform and users</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowContentEditor(true)}
                className="bg-tsu-gold text-tsu-green hover:bg-yellow-400"
                data-testid="button-edit-content"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Content
              </Button>
              <Button
                onClick={() => setShowCreateCoinModal(true)}
                className="bg-tsu-green text-white hover:bg-tsu-light-green"
                data-testid="button-create-coins"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Coins
              </Button>
            </div>
          </div>

          {/* Admin Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg" data-testid="total-users-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-tsu-green">Total Users</CardTitle>
                <Users className="h-4 w-4 text-tsu-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-tsu-green" data-testid="total-users-count">
                  {stats?.totalUsers || 0}
                </div>
                <p className="text-xs text-green-500">Active platform users</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="tsu-circulation-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-tsu-green">TSU Circulation</CardTitle>
                <Coins className="h-4 w-4 text-tsu-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-tsu-green" data-testid="circulating-supply">
                  {stats ? parseFloat(stats.circulatingSupply).toFixed(0) : '0'}
                </div>
                <p className="text-xs text-blue-500">Circulating supply</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="trade-volume-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-tsu-green">Transactions</CardTitle>
                <BarChart3 className="h-4 w-4 text-tsu-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-tsu-green" data-testid="total-transactions-count">
                  {stats?.totalTransactions || 0}
                </div>
                <p className="text-xs text-green-500">Total transactions</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="reserve-ratio-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-tsu-green">Total Supply</CardTitle>
                <Shield className="h-4 w-4 text-tsu-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-tsu-green" data-testid="total-supply">
                  {stats ? parseFloat(stats.totalSupply).toFixed(0) : '0'}
                </div>
                <p className="text-xs text-green-500">Total TSU created</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Card className="shadow-lg" data-testid="admin-tabs">
            <Tabs defaultValue="users" className="w-full">
              <div className="border-b border-gray-200 px-6">
                <TabsList className="flex w-full overflow-x-auto gap-1 px-1">
                  <TabsTrigger value="users" data-testid="tab-users" className="text-xs whitespace-nowrap">Users</TabsTrigger>
                  <TabsTrigger value="transactions" data-testid="tab-transactions" className="text-xs whitespace-nowrap">Transactions</TabsTrigger>
                  <TabsTrigger value="balance" data-testid="tab-balance" className="text-xs whitespace-nowrap">Balance</TabsTrigger>
                  <TabsTrigger value="reserves" data-testid="tab-reserves" className="text-xs whitespace-nowrap">Reserves</TabsTrigger>
                  <TabsTrigger value="pricing" data-testid="tab-pricing" className="text-xs whitespace-nowrap">Pricing</TabsTrigger>
                  <TabsTrigger value="contact" data-testid="tab-contact" className="text-xs whitespace-nowrap">
                    <Phone className="h-3 w-3 mr-1" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="messages" data-testid="tab-messages" className="text-xs whitespace-nowrap">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="metadata" data-testid="tab-metadata" className="text-xs whitespace-nowrap">
                    <Globe className="h-3 w-3 mr-1" />
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="email" data-testid="tab-email" className="text-xs whitespace-nowrap">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="admins" data-testid="tab-admins" className="text-xs whitespace-nowrap">Admins</TabsTrigger>
                  <TabsTrigger value="ico" data-testid="tab-ico" className="text-xs whitespace-nowrap">
                    <Coins className="h-3 w-3 mr-1" />
                    ICO
                  </TabsTrigger>
                  <TabsTrigger value="commodities" data-testid="tab-commodities" className="text-xs whitespace-nowrap">
                    <Package className="h-3 w-3 mr-1" />
                    Commodities
                  </TabsTrigger>
                  <TabsTrigger value="currencies" data-testid="tab-currencies" className="text-xs whitespace-nowrap">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Currencies
                  </TabsTrigger>
                  <TabsTrigger value="sync" data-testid="tab-sync" className="text-xs whitespace-nowrap">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Content Sync
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="users" className="p-6" data-testid="users-tab-content">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-tsu-green">User Management</h3>
                  <div className="text-sm text-gray-500">
                    {users.length} total users
                  </div>
                </div>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <div className="text-center py-8" data-testid="no-users">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No users found</p>
                    </div>
                  ) : (
                    users.map((userData) => (
                      <div key={userData.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`user-${userData.id}`}>
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-tsu-gold rounded-full flex items-center justify-center">
                            <span className="text-tsu-green font-medium text-sm">
                              {userData.firstName ? userData.firstName.charAt(0).toUpperCase() : userData.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900" data-testid={`user-name-${userData.id}`}>
                              {userData.firstName && userData.lastName 
                                ? `${userData.firstName} ${userData.lastName}` 
                                : userData.email?.split('@')[0] || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500" data-testid={`user-email-${userData.id}`}>
                              {userData.email || 'No email'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-900" data-testid={`user-balance-${userData.id}`}>
                              {parseFloat(userData.tsuBalance).toFixed(2)} TSU
                            </div>
                            <Badge 
                              variant={userData.isActive ? "default" : "secondary"}
                              className={userData.isActive ? "bg-green-100 text-green-800" : ""}
                              data-testid={`user-status-${userData.id}`}
                            >
                              {userData.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-tsu-gold hover:text-tsu-light-green" data-testid={`button-view-user-${userData.id}`}>
                              View
                            </Button>
                            {user && user.role === 'super_admin' && userData.role !== 'super_admin' && userData.id !== user.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                                    data-testid={`button-delete-user-${userData.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to permanently delete {userData.firstName && userData.lastName 
                                        ? `${userData.firstName} ${userData.lastName}` 
                                        : userData.email?.split('@')[0] || 'this user'}? 
                                      This action cannot be undone and all user data will be permanently removed.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteUserMutation.mutate(userData.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      data-testid={`confirm-delete-user-${userData.id}`}
                                    >
                                      {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="p-6" data-testid="transactions-tab-content">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-tsu-green">Transaction Monitoring</h3>
                  <Button className="bg-tsu-green text-white hover:bg-tsu-light-green" data-testid="button-export-transactions">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8" data-testid="no-transactions">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions found</p>
                    </div>
                  ) : (
                    transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="bg-gray-50 p-4 rounded-lg" data-testid={`admin-transaction-${transaction.id}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 capitalize" data-testid={`admin-transaction-type-${transaction.id}`}>
                              {transaction.type} Transaction
                            </div>
                            <div className="text-sm text-gray-500" data-testid={`admin-transaction-desc-${transaction.id}`}>
                              {transaction.description || `${transaction.type} of ${transaction.amount} ${transaction.currency}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900" data-testid={`admin-transaction-amount-${transaction.id}`}>
                              {parseFloat(transaction.amount).toFixed(2)} {transaction.currency}
                            </div>
                            <div className="text-sm text-gray-500" data-testid={`admin-transaction-date-${transaction.id}`}>
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="balance" className="p-6" data-testid="balance-tab-content">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-tsu-green">Balance Management</h3>
                  <div className="text-sm text-gray-500">
                    Super admin controls for TSU supply
                  </div>
                </div>
                {user?.role === 'super_admin' ? (
                  <BalanceManagement />
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Super admin access required for balance management</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reserves" className="p-6" data-testid="reserves-tab-content">
                <h3 className="text-xl font-semibold text-tsu-green mb-6">Reserve Management</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">Gold Reserves</span>
                        <span className="text-tsu-green font-semibold">40.0%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-tsu-gold h-2 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">BRICS Currencies</span>
                        <span className="text-tsu-green font-semibold">30.0%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">African Commodities</span>
                        <span className="text-tsu-green font-semibold">20.0%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">African Currencies</span>
                        <span className="text-tsu-green font-semibold">10.0%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="p-6" data-testid="pricing-tab-content">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-tsu-green">TSU Pricing Management</h3>
                  <div className="text-sm text-gray-500">
                    Control TSU exchange rates and fees
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Current Pricing */}
                  <Card className="border-tsu-gold border-2" data-testid="current-pricing-card">
                    <CardHeader>
                      <CardTitle className="text-tsu-green">Current TSU Value</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center p-6 bg-gradient-to-br from-tsu-green to-tsu-light-green rounded-lg text-white">
                        <h4 className="text-2xl font-bold mb-2">1 TSU = 1 USD</h4>
                        <p className="text-lg">Current Rate: <span className="font-semibold text-tsu-gold">1 USD</span></p>
                        <p className="text-sm opacity-80">Last updated: Today</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Processing Fee:</span>
                          <span className="text-tsu-green font-semibold">2.5%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Minimum Purchase:</span>
                          <span className="text-tsu-green font-semibold">$10.00</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">Payment Methods:</span>
                          <span className="text-tsu-green font-semibold">PayPal, Crypto (Soon)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Price Update Form */}
                  <Card data-testid="price-update-card">
                    <CardHeader>
                      <CardTitle className="text-tsu-green">Update TSU Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h5 className="font-medium text-amber-800 mb-2">⚠️ Price Update Notice</h5>
                        <p className="text-sm text-amber-700">
                          TSU maintains stable value backed by diversified reserves. Price updates should reflect real market conditions.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New USD Rate per TSU
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={newTsuPrice}
                            onChange={(e) => setNewTsuPrice(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tsu-green"
                            data-testid="input-new-price"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Processing Fee (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            defaultValue="2.5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tsu-green"
                            data-testid="input-processing-fee"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Update
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g., Updated to reflect current market conditions"
                            value={updateReason}
                            onChange={(e) => setUpdateReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tsu-green"
                            data-testid="textarea-update-reason"
                          />
                        </div>
                        
                        <Button 
                          className="w-full bg-tsu-green hover:bg-tsu-light-green"
                          onClick={() => handleUpdatePricing()}
                          disabled={updatePricingMutation.isPending}
                          data-testid="button-update-pricing"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {updatePricingMutation.isPending ? "Updating..." : "Update Pricing"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Pricing History */}
                <Card className="mt-6" data-testid="pricing-history-card">
                  <CardHeader>
                    <CardTitle className="text-tsu-green">Pricing History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Initial Launch Rate</div>
                          <div className="text-sm text-gray-500">January 24, 2025</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-tsu-green">1 USD</div>
                          <div className="text-sm text-gray-500">System Launch</div>
                        </div>
                      </div>
                      
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No pricing updates yet</p>
                        <p className="text-sm">Price history will appear here after updates</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="p-6" data-testid="email-tab-content">
                <div className="space-y-8">
                  <SmtpConfigSection />
                  <hr className="border-gray-200" />
                  <EmailMessagingSection />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="p-6" data-testid="contact-tab-content">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-tsu-green">Contact Information Management</h3>
                  <p className="text-sm text-gray-500">Update the contact information displayed on the website</p>
                </div>
                
                <Card className="max-w-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-tsu-gold" />
                      Contact Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...contactForm}>
                      <form onSubmit={contactForm.handleSubmit((data) => contactMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={contactForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-tsu-gold" />
                                Email Address
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="authority@tsu.africa" 
                                  {...field}
                                  data-testid="input-contact-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={contactForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-tsu-gold" />
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="+27 (0) 11 123 4567" 
                                  {...field}
                                  data-testid="input-contact-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={contactForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-tsu-gold" />
                                Address
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Johannesburg, South Africa" 
                                  {...field}
                                  data-testid="input-contact-address"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end pt-4">
                          <Button 
                            type="submit"
                            disabled={contactMutation.isPending}
                            className="bg-tsu-green text-white hover:bg-tsu-light-green"
                            data-testid="button-save-contact"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {contactMutation.isPending ? 'Saving...' : 'Save Contact Information'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="p-6" data-testid="messages-tab-content">
                <ContactMessagesSection />
              </TabsContent>

              <TabsContent value="admins" className="p-6" data-testid="admins-tab-content">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-tsu-green">Administrator Management</h3>
                  {user.role === 'super_admin' && (
                    <Button
                      onClick={() => setShowAddAdminModal(true)}
                      className="bg-tsu-green text-white hover:bg-tsu-light-green"
                      data-testid="button-add-admin"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between" data-testid="current-user-admin">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-tsu-gold rounded-full flex items-center justify-center">
                        <span className="text-tsu-green font-medium">
                          {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900" data-testid="current-admin-name">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.email?.split('@')[0]} (You)
                        </div>
                        <div className="text-sm text-gray-500" data-testid="current-admin-email">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant="default" 
                        className={user.role === 'super_admin' ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}
                        data-testid="current-admin-role"
                      >
                        {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </Badge>
                      <span className="text-sm text-gray-500">Current User</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ico" className="p-6" data-testid="ico-tab-content">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-tsu-green">ICO Configuration</h3>
                  <div className="text-sm text-gray-500">
                    Manage TSU-X token ICO settings
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Environment Variables Setup */}
                  <Card className="border-tsu-gold/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-tsu-gold" />
                        Environment Variables
                      </CardTitle>
                      <CardDescription>
                        Configure the required environment variables for the TSU-X ICO smart contracts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> Environment variables must be set in your Replit project's Secrets tool for security.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-tsu-green">VITE_TSU_X_TOKEN_ADDRESS</h4>
                                <p className="text-sm text-gray-600">TSU-X ERC-20 token contract address on Polygon mainnet</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={import.meta.env.VITE_TSU_X_TOKEN_ADDRESS ? "default" : "destructive"}>
                                  {import.meta.env.VITE_TSU_X_TOKEN_ADDRESS ? "Configured" : "Missing"}
                                </Badge>
                                {import.meta.env.VITE_TSU_X_TOKEN_ADDRESS && (
                                  <div className="text-xs text-gray-500 mt-1 font-mono">
                                    {import.meta.env.VITE_TSU_X_TOKEN_ADDRESS}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-tsu-green">VITE_TOKEN_SALE_CONTRACT_ADDRESS</h4>
                                <p className="text-sm text-gray-600">TokenSale smart contract address for handling purchases</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={import.meta.env.VITE_TOKEN_SALE_CONTRACT_ADDRESS ? "default" : "destructive"}>
                                  {import.meta.env.VITE_TOKEN_SALE_CONTRACT_ADDRESS ? "Configured" : "Missing"}
                                </Badge>
                                {import.meta.env.VITE_TOKEN_SALE_CONTRACT_ADDRESS && (
                                  <div className="text-xs text-gray-500 mt-1 font-mono">
                                    {import.meta.env.VITE_TOKEN_SALE_CONTRACT_ADDRESS}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">How to Set Environment Variables in Replit:</h4>
                        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                          <li>Open the "Secrets" tool in your Replit project sidebar</li>
                          <li>Click "New secret" for each environment variable</li>
                          <li>Add <code className="bg-blue-100 px-1 rounded">VITE_TSU_X_TOKEN_ADDRESS</code> with your deployed TSU-X token contract address</li>
                          <li>Add <code className="bg-blue-100 px-1 rounded">VITE_TOKEN_SALE_CONTRACT_ADDRESS</code> with your TokenSale contract address</li>
                          <li>Restart your application to apply the changes</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ICO Status */}
                  <Card className="border-tsu-green/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-tsu-green" />
                        ICO Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium">Configuration Status:</span>
                          <Badge variant={import.meta.env.VITE_TSU_X_TOKEN_ADDRESS && import.meta.env.VITE_TOKEN_SALE_CONTRACT_ADDRESS ? "default" : "destructive"}>
                            {import.meta.env.VITE_TSU_X_TOKEN_ADDRESS && import.meta.env.VITE_TOKEN_SALE_CONTRACT_ADDRESS ? "Ready" : "Incomplete"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium">ICO Page:</span>
                          <a 
                            href="/ico" 
                            className="text-tsu-green hover:text-tsu-light-green font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View ICO Page →
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="commodities" className="p-6" data-testid="commodities-tab-content">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-tsu-green">Commodity Registrations</h3>
                  <div className="text-sm text-gray-500">
                    Manage commodity program applications
                  </div>
                </div>
                <CommodityRegistrationsSection />
              </TabsContent>

              <TabsContent value="currencies" className="p-6" data-testid="currencies-tab-content">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-tsu-green">Currency Registrations</h3>
                  <div className="text-sm text-gray-500">
                    Manage currency conversion applications
                  </div>
                </div>
                <CurrencyRegistrationsSection />
              </TabsContent>

              <TabsContent value="sync" className="p-6" data-testid="sync-tab-content">
                <ContentSyncSection />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateCoinModal isOpen={showCreateCoinModal} onClose={() => setShowCreateCoinModal(false)} />
      <AddAdminModal isOpen={showAddAdminModal} onClose={() => setShowAddAdminModal(false)} />
      {showContentEditor && <ContentEditor onClose={() => setShowContentEditor(false)} />}
      {showMetadataEditor && <MetadataEditor />}
      <Footer />
    </div>
  );
}
