import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import CreateCoinModal from "@/components/CreateCoinModal";
import AddAdminModal from "@/components/AddAdminModal";
import ContentEditor from "@/components/ContentEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Coins, BarChart3, Shield, Plus, Edit, Settings } from "lucide-react";

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
  const [showCreateCoinModal, setShowCreateCoinModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showContentEditor, setShowContentEditor] = useState(false);

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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="users" data-testid="tab-users">User Management</TabsTrigger>
                  <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="reserves" data-testid="tab-reserves">Reserves</TabsTrigger>
                  <TabsTrigger value="admins" data-testid="tab-admins">Admin Management</TabsTrigger>
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
                          <Button variant="ghost" size="sm" className="text-tsu-gold hover:text-tsu-light-green" data-testid={`button-view-user-${userData.id}`}>
                            View
                          </Button>
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
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateCoinModal isOpen={showCreateCoinModal} onClose={() => setShowCreateCoinModal(false)} />
      <AddAdminModal isOpen={showAddAdminModal} onClose={() => setShowAddAdminModal(false)} />
      {showContentEditor && <ContentEditor onClose={() => setShowContentEditor(false)} />}
    </div>
  );
}
