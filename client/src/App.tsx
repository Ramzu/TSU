import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Web3Provider from "@/providers/Web3Provider";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import AdminDashboard from "@/pages/AdminDashboard";
import Commodities from "@/pages/Commodities";
import Currency from "@/pages/Currency";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import MonthlyAuditReports from "@/pages/MonthlyAuditReports";
import NotFound from "@/pages/not-found";
import ResetPassword from "@/pages/ResetPassword";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tsu-green">
        <div className="text-center">
          <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-tsu-green font-bold text-2xl">TSU</span>
          </div>
          <p className="text-tsu-gold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/commodities" component={Commodities} />
      <Route path="/currency" component={Currency} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/monthly-audit-reports" component={MonthlyAuditReports} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <Route path="/admin" component={AdminDashboard} />
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const isRTL = i18n.language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default App;
