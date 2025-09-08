import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import BuyTSUModal from "@/components/BuyTSUModal";
import SendTSUModal from "@/components/SendTSUModal";
import ReceiveTSUModal from "@/components/ReceiveTSUModal";
import SecurityWidget from "@/components/SecurityWidget";
import ExchangeRateWidget from "@/components/ExchangeRateWidget";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, ArrowUpDown, Plus, Minus, Send, QrCode, ArrowUp, ArrowDown, DollarSign, CheckCircle, Bell, Shield } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState } from "react";

interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'transfer' | 'creation' | 'exchange';
  amount: string;
  currency: string;
  description?: string;
  createdAt: string;
  fromAddress?: string;
  toAddress?: string;
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/users/transactions"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
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
  }, [user, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-tsu-green font-bold text-2xl">TSU</span>
          </div>
          <p className="text-tsu-green">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowDown className="h-5 w-5 text-green-600" />;
      case 'sale':
        return <ArrowUp className="h-5 w-5 text-red-600" />;
      case 'transfer':
        return <Send className="h-5 w-5 text-blue-600" />;
      case 'exchange':
        return <ArrowUpDown className="h-5 w-5 text-purple-600" />;
      default:
        return <Coins className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="mb-8" data-testid="dashboard-header">
            <h1 className="text-3xl font-bold text-tsu-green">Dashboard</h1>
            <p className="text-gray-600">Welcome back, <span data-testid="user-name">{user.firstName || user.email?.split('@')[0]}</span></p>
          </div>

          {/* Enhanced Wallet Overview */}
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-lg" data-testid="tsu-balance-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-tsu-green">TSU Balance</CardTitle>
                <Coins className="h-4 w-4 text-tsu-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-tsu-green" data-testid="tsu-balance">
                  {parseFloat(user.tsuBalance || '0').toFixed(2)} TSU
                </div>
                <p className="text-xs text-muted-foreground">
                  ≈ ${parseFloat(user.tsuBalance || '0').toFixed(2)} USD
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="portfolio-value-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-tsu-green">Portfolio Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-tsu-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-tsu-green" data-testid="portfolio-value">
                  ${parseFloat(user.tsuBalance || '0').toFixed(2)}
                </div>
                <p className="text-xs text-green-500">Stable value</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg" data-testid="active-trades-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-tsu-green">Total Transactions</CardTitle>
                <ArrowUpDown className="h-4 w-4 text-tsu-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-tsu-green" data-testid="total-transactions">
                  {transactions.length}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            {/* Security Status */}
            <Card className="shadow-lg" data-testid="security-status-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-tsu-green">Security Status</CardTitle>
                <Shield className="h-4 w-4 text-tsu-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="security-status">
                  Protected
                </div>
                <p className="text-xs text-green-500">Account secured</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-lg mb-8" data-testid="quick-actions-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-tsu-green">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  onClick={() => setShowBuyModal(true)}
                  className="flex flex-col items-center p-6 h-auto bg-tsu-green hover:bg-tsu-light-green text-white"
                  data-testid="button-buy-tsu"
                >
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Buy TSU</span>
                </Button>
                <Button 
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto text-tsu-green border-tsu-green hover:bg-tsu-green hover:text-white"
                  disabled
                  data-testid="button-sell-tsu"
                >
                  <Minus className="h-6 w-6 mb-2" />
                  <span>Sell TSU</span>
                </Button>
                <Button 
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto text-tsu-green border-tsu-green hover:bg-tsu-green hover:text-white"
                  onClick={() => setShowSendModal(true)}
                  data-testid="button-send"
                >
                  <Send className="h-6 w-6 mb-2" />
                  <span>Send</span>
                </Button>
                <Button 
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto text-tsu-green border-tsu-green hover:bg-tsu-green hover:text-white"
                  onClick={() => setShowReceiveModal(true)}
                  data-testid="button-receive"
                >
                  <QrCode className="h-6 w-6 mb-2" />
                  <span>Receive</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commodities Program Section */}
          <Card className="shadow-lg mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200" data-testid="commodities-section">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-tsu-green flex items-center gap-2">
                <Coins className="h-6 w-6 text-tsu-gold" />
                TSU Commodities Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <p className="text-gray-700 mb-4">
                    Turn your commodities into global trade liquidity. Register unsold resources like oil, cocoa, copper, and grain to access TSU-backed settlement units.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Direct access to producers and traders across Africa & BRICS
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Reserve-backed by gold, foreign exchange, and verified commodities
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      De-dollarized settlement with transparent monthly audits
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Button 
                    onClick={() => window.location.href = '/commodities'}
                    className="bg-tsu-green hover:bg-tsu-light-green text-white px-6 py-3"
                    data-testid="button-learn-commodities"
                  >
                    Learn More About Commodities
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* New Features Row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Security & Notifications */}
            <SecurityWidget />
            
            {/* Exchange Rates */}
            <ExchangeRateWidget />
            
            {/* Currency Program Section */}
            <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-tsu-light-green/20 border-blue-200" data-testid="currency-section">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-tsu-green flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-tsu-gold" />
                  TSU Currency Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700 text-sm">
                    Convert local currencies into stable, globally accepted Trade Settlement Units backed by verified reserves.
                  </p>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Direct currency conversion
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-blue-500" />
                      Stable value backing
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-purple-500" />
                      Real-time exchange rates
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/currency'}
                    className="w-full bg-tsu-green hover:bg-tsu-light-green text-white"
                    data-testid="button-learn-currency"
                  >
                    Learn More About Currency
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="shadow-lg" data-testid="transactions-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-tsu-green">Recent Transactions</CardTitle>
              <Button variant="ghost" className="text-tsu-gold hover:text-tsu-light-green" data-testid="button-view-all">
                View all
              </Button>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                      <div className="w-20 h-4 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8" data-testid="no-transactions">
                  <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                  <p className="text-sm text-gray-400">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`transaction-${transaction.id}`}>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 capitalize" data-testid={`transaction-type-${transaction.id}`}>
                            {transaction.type} {transaction.currency}
                          </div>
                          <div className="text-sm text-gray-500" data-testid={`transaction-desc-${transaction.id}`}>
                            {transaction.description || `${transaction.type} transaction`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.type === 'purchase' ? 'text-green-600' : 
                          transaction.type === 'sale' ? 'text-red-600' : 
                          'text-gray-900'
                        }`} data-testid={`transaction-amount-${transaction.id}`}>
                          {transaction.type === 'purchase' ? '+' : transaction.type === 'sale' ? '-' : ''}
                          {parseFloat(transaction.amount).toFixed(2)} {transaction.currency}
                        </div>
                        <div className="text-sm text-gray-500" data-testid={`transaction-date-${transaction.id}`}>
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <BuyTSUModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />
      <SendTSUModal 
        isOpen={showSendModal} 
        onClose={() => setShowSendModal(false)}
        currentBalance={user?.tsuBalance || "0"} 
      />
      <ReceiveTSUModal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} />
      <Footer />
    </div>
  );
}
