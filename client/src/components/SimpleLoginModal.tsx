import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

const COUNTRY_OPTIONS = [
  // African Nations  
  { value: "south_africa", label: "South Africa", region: "Africa" },
  { value: "nigeria", label: "Nigeria", region: "Africa" },
  { value: "egypt", label: "Egypt", region: "Africa" },
  { value: "kenya", label: "Kenya", region: "Africa" },
  { value: "ghana", label: "Ghana", region: "Africa" },
  { value: "morocco", label: "Morocco", region: "Africa" },
  { value: "ethiopia", label: "Ethiopia", region: "Africa" },
  { value: "tanzania", label: "Tanzania", region: "Africa" },
  { value: "uganda", label: "Uganda", region: "Africa" },
  { value: "rwanda", label: "Rwanda", region: "Africa" },
  { value: "senegal", label: "Senegal", region: "Africa" },
  { value: "ivory_coast", label: "Ivory Coast", region: "Africa" },
  { value: "botswana", label: "Botswana", region: "Africa" },
  { value: "namibia", label: "Namibia", region: "Africa" },
  { value: "zambia", label: "Zambia", region: "Africa" },
  { value: "zimbabwe", label: "Zimbabwe", region: "Africa" },
  { value: "angola", label: "Angola", region: "Africa" },
  { value: "mozambique", label: "Mozambique", region: "Africa" },
  { value: "madagascar", label: "Madagascar", region: "Africa" },
  { value: "mauritius", label: "Mauritius", region: "Africa" },
  
  // BRICS+ Nations
  { value: "brazil", label: "Brazil", region: "BRICS+" },
  { value: "russia", label: "Russia", region: "BRICS+" },
  { value: "india", label: "India", region: "BRICS+" },
  { value: "china", label: "China", region: "BRICS+" },
  { value: "iran", label: "Iran", region: "BRICS+" },
  { value: "uae", label: "UAE", region: "BRICS+" },
  { value: "ethiopia_brics", label: "Ethiopia (BRICS)", region: "BRICS+" },
  { value: "egypt_brics", label: "Egypt (BRICS)", region: "BRICS+" },
  { value: "saudi_arabia", label: "Saudi Arabia", region: "BRICS+" },
];

interface SimpleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
}

export default function SimpleLoginModal({ isOpen, onClose, mode }: SimpleLoginModalProps) {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    accountType: "individual",
    firstName: "",
    lastName: "",
    companyName: "",
    businessType: "",
    taxId: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: ""
  });

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset forms when modal opens or mode changes
  useEffect(() => {
    setCurrentMode(mode);
    setLoginData({ email: "", password: "" });
    setRegisterData({ accountType: "individual", firstName: "", lastName: "", companyName: "", businessType: "", taxId: "", email: "", password: "", confirmPassword: "", country: "" });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode, isOpen]);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest("POST", "/api/auth/simple-login", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const { confirmPassword, ...registerData } = data;
      return apiRequest("POST", "/api/auth/simple-register", registerData);
    },
    onSuccess: () => {
      toast({
        title: "Account Created!",
        description: "Your account has been created successfully. You can now log in.",
      });
      setCurrentMode('login');
      setRegisterData({ accountType: "individual", firstName: "", lastName: "", companyName: "", businessType: "", taxId: "", email: "", password: "", confirmPassword: "", country: "" });
      setErrors({});
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    
    if (!loginData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!loginData.password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};
    
    if (registerData.accountType === 'individual') {
      if (!registerData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      
      if (!registerData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
    } else {
      if (!registerData.companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      
      if (!registerData.businessType.trim()) {
        newErrors.businessType = "Business type is required";
      }
    }
    
    if (!registerData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!registerData.password) {
      newErrors.password = "Password is required";
    } else if (registerData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    if (!registerData.country) {
      newErrors.country = "Please select your country";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateLogin()) {
      loginMutation.mutate(loginData);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateRegister()) {
      registerMutation.mutate(registerData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentMode === 'login' ? 'Welcome Back' : 'Join TSU Wallet'}
          </DialogTitle>
          <DialogDescription>
            {currentMode === 'login' 
              ? 'Sign in to access your TSU digital wallet'
              : 'Create your account to start trading with TSU'
            }
          </DialogDescription>
        </DialogHeader>

        {currentMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email Address</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                disabled={loginMutation.isPending}
                data-testid="input-email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={loginMutation.isPending}
                  data-testid="input-password"
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loginMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentMode('register')}
                disabled={loginMutation.isPending}
                data-testid="button-switch-register"
              >
                Register
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Account Type Selection */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={registerData.accountType === 'individual' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setRegisterData(prev => ({ ...prev, accountType: 'individual' }))}
                  disabled={registerMutation.isPending}
                  data-testid="button-individual"
                >
                  Individual
                </Button>
                <Button
                  type="button"
                  variant={registerData.accountType === 'business' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setRegisterData(prev => ({ ...prev, accountType: 'business' }))}
                  disabled={registerMutation.isPending}
                  data-testid="button-business"
                >
                  Business
                </Button>
              </div>
            </div>

            {registerData.accountType === 'individual' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-firstName">First Name</Label>
                  <Input
                    id="register-firstName"
                    type="text"
                    placeholder="Your first name"
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={registerMutation.isPending}
                    data-testid="input-firstName"
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.firstName}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-lastName">Last Name</Label>
                  <Input
                    id="register-lastName"
                    type="text"
                    placeholder="Your last name"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={registerMutation.isPending}
                    data-testid="input-lastName"
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-companyName">Company Name</Label>
                  <Input
                    id="register-companyName"
                    type="text"
                    placeholder="Your company name"
                    value={registerData.companyName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, companyName: e.target.value }))}
                    disabled={registerMutation.isPending}
                    data-testid="input-companyName"
                    className={errors.companyName ? "border-red-500" : ""}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.companyName}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-businessType">Business Type</Label>
                  <Input
                    id="register-businessType"
                    type="text"
                    placeholder="e.g., Import/Export, Manufacturing, Services"
                    value={registerData.businessType}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, businessType: e.target.value }))}
                    disabled={registerMutation.isPending}
                    data-testid="input-businessType"
                    className={errors.businessType ? "border-red-500" : ""}
                  />
                  {errors.businessType && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.businessType}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-taxId">Tax ID (Optional)</Label>
                  <Input
                    id="register-taxId"
                    type="text"
                    placeholder="Business tax identification number"
                    value={registerData.taxId}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, taxId: e.target.value }))}
                    disabled={registerMutation.isPending}
                    data-testid="input-taxId"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="register-email">Email Address</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="your@email.com"
                value={registerData.email}
                onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                disabled={registerMutation.isPending}
                data-testid="input-register-email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 6 characters)"
                  value={registerData.password}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={registerMutation.isPending}
                  data-testid="input-register-password"
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={registerMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="register-confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={registerMutation.isPending}
                  data-testid="input-confirm-password"
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={registerMutation.isPending}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select 
                value={registerData.country} 
                onValueChange={(value) => setRegisterData(prev => ({ ...prev, country: value }))}
                disabled={registerMutation.isPending}
              >
                <SelectTrigger data-testid="select-country" className={errors.country ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  <div className="text-xs font-medium text-gray-500 px-2 py-1">African Nations</div>
                  {COUNTRY_OPTIONS.filter(country => country.region === 'Africa').map((country) => (
                    <SelectItem key={country.value} value={country.value} data-testid={`country-${country.value}`}>
                      {country.label}
                    </SelectItem>
                  ))}
                  <div className="text-xs font-medium text-gray-500 px-2 py-1 mt-2">BRICS+ Partners</div>
                  {COUNTRY_OPTIONS.filter(country => country.region === 'BRICS+').map((country) => (
                    <SelectItem key={country.value} value={country.value} data-testid={`country-${country.value}`}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.country}
                </p>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentMode('login')}
                disabled={registerMutation.isPending}
                data-testid="button-switch-login"
              >
                Login
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}