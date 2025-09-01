import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import SimpleLoginModal from "@/components/SimpleLoginModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/simple-logout", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("toast.logoutSuccess"),
        description: t("toast.logoutMessage"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.reload();
    },
    onError: () => {
      toast({
        title: t("toast.logoutFailed"),
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-tsu-green shadow-lg fixed w-full top-0 z-50" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="/tsu-logo.png" 
                alt="TSU Logo" 
                className="w-10 h-10 mr-3 rounded-full object-cover"
                data-testid="logo"
              />
              <span className="text-white font-semibold text-xl" data-testid="brand-name">TSU</span>
            </div>
            {!isAuthenticated && (
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <button 
                    onClick={() => document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-gray-300 hover:text-tsu-gold px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    data-testid="nav-home"
                  >
                    {t("nav.home")}
                  </button>
                  <button 
                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-gray-300 hover:text-tsu-gold px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    data-testid="nav-about"
                  >
                    {t("nav.about")}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {!isAuthenticated ? (
              <div className="flex space-x-2" data-testid="auth-buttons">
                <Button
                  variant="ghost"
                  onClick={() => { setLoginModalMode('login'); setShowLoginModal(true); }}
                  className="text-gray-300 hover:text-tsu-gold"
                  data-testid="button-login"
                >
                  {t("nav.login")}
                </Button>
                <Button
                  onClick={() => { setLoginModalMode('register'); setShowLoginModal(true); }}
                  className="bg-tsu-gold text-tsu-green hover:bg-yellow-400"
                  data-testid="button-register"
                >
                  {t("nav.register")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4" data-testid="user-menu">
                <span className="text-gray-300 hidden sm:inline" data-testid="welcome-message">
                  {t("nav.welcome", { name: user?.firstName || user?.email?.split('@')[0] })}
                </span>
                
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation('/admin')}
                    className="text-tsu-gold hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    data-testid="button-admin"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {t("nav.admin")}
                  </Button>
                )}
                
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="text-gray-300 hover:text-tsu-gold p-2"
                      data-testid="user-dropdown-trigger"
                    >
                      <User className="h-6 w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48" data-testid="user-dropdown">
                    <DropdownMenuItem 
                      onClick={() => handleNavigation('/')}
                      data-testid="dropdown-dashboard"
                    >
                      <User className="mr-2 h-4 w-4" />
                      {t("nav.dashboard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      data-testid="dropdown-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {logoutMutation.isPending ? "Logging out..." : t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      <SimpleLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} mode={loginModalMode} />
    </nav>
  );
}
