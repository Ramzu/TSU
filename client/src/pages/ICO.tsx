import { useState, useEffect } from "react";
import { useWeb3 } from "@/providers/Web3Provider";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Wallet, 
  Coins, 
  Shield, 
  Globe, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink
} from "lucide-react";
import { ethers } from "ethers";
import tsuXCoinImage from "@assets/tsu-x-coin.png";
import { useToast } from "@/hooks/use-toast";

const POLYGON_MAINNET = {
  chainId: '0x89', // 137 in decimal
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/']
};

// Token addresses on Polygon Mainnet
const TOKEN_ADDRESSES = {
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon (verified)
  USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT on Polygon (verified)  
  TSU_X: import.meta.env.VITE_TSU_X_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000', // TSU-X token contract
  TOKEN_SALE: import.meta.env.VITE_TOKEN_SALE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000', // TokenSale contract
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)", 
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const TOKEN_SALE_ABI = [
  "function buyTokensWithUSDC(uint256 amount) payable",
  "function buyTokensWithUSDT(uint256 amount) payable",
  "function tokensSold() view returns (uint256)",
  "function maxTokens() view returns (uint256)",
  "function tokenPrice() view returns (uint256)",
  "function isActive() view returns (bool)"
];

interface TokenBalance {
  usdc: string;
  usdt: string;
  tsux: string;
  allowanceUsdc: string;
  allowanceUsdt: string;
}

export default function ICO() {
  const { account, provider, isConnected, connectWallet, isConnecting, error: web3Error } = useWeb3();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [purchaseAmount, setPurchaseAmount] = useState("");
  
  // Check if contracts are configured
  const isConfigured = TOKEN_ADDRESSES.TSU_X !== '0x0000000000000000000000000000000000000000' && 
                      TOKEN_ADDRESSES.TOKEN_SALE !== '0x0000000000000000000000000000000000000000';
  
  // Check if user is admin for configuration warnings
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT'>('USDC');
  const [balances, setBalances] = useState<TokenBalance>({
    usdc: "0",
    usdt: "0", 
    tsux: "0",
    allowanceUsdc: "0",
    allowanceUsdt: "0"
  });
  const [saleInfo, setSaleInfo] = useState({
    tokensSold: "0",
    maxTokens: "20000000000", // 20B tokens
    isActive: true,
    progress: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [chainId, setChainId] = useState<string>("");

  // Check and switch to Polygon network
  const ensurePolygonNetwork = async () => {
    if (!provider || !window.ethereum) return false;
    
    try {
      const network = await provider.getNetwork();
      if (network.chainId.toString() !== '137') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: POLYGON_MAINNET.chainId }]
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [POLYGON_MAINNET]
            });
          } else {
            throw switchError;
          }
        }
        // Refresh page after network switch
        window.location.reload();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Network switch error:', error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to switch to Polygon network. Please switch manually in your wallet."
      });
      return false;
    }
  };

  // Load token balances and allowances
  const loadBalances = async () => {
    if (!provider || !account) return;

    try {
      const signer = await provider.getSigner();
      
      // Load USDC
      const usdcContract = new ethers.Contract(TOKEN_ADDRESSES.USDC, ERC20_ABI, signer);
      const usdcBalance = await usdcContract.balanceOf(account);
      const usdcAllowance = await usdcContract.allowance(account, TOKEN_ADDRESSES.TOKEN_SALE);
      
      // Load USDT
      const usdtContract = new ethers.Contract(TOKEN_ADDRESSES.USDT, ERC20_ABI, signer);
      const usdtBalance = await usdtContract.balanceOf(account);
      const usdtAllowance = await usdtContract.allowance(account, TOKEN_ADDRESSES.TOKEN_SALE);

      // Load TSU-X (if address provided)
      let tsuxBalance = "0";
      if (TOKEN_ADDRESSES.TSU_X !== '0x0000000000000000000000000000000000000000') {
        const tsuxContract = new ethers.Contract(TOKEN_ADDRESSES.TSU_X, ERC20_ABI, signer);
        tsuxBalance = await tsuxContract.balanceOf(account);
      }
      
      setBalances({
        usdc: ethers.formatUnits(usdcBalance, 6), // USDC has 6 decimals
        usdt: ethers.formatUnits(usdtBalance, 6), // USDT has 6 decimals
        tsux: ethers.formatEther(tsuxBalance), // TSU-X has 18 decimals
        allowanceUsdc: ethers.formatUnits(usdcAllowance, 6),
        allowanceUsdt: ethers.formatUnits(usdtAllowance, 6)
      });
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  // Load sale information
  const loadSaleInfo = async () => {
    if (!provider) return;

    try {
      if (!isConfigured) {
        // When contracts not configured, show inactive sale
        setSaleInfo({
          tokensSold: "0",
          maxTokens: "20000000000", // 20B total for display
          isActive: false,
          progress: 0
        });
        return;
      }

      const signer = await provider.getSigner();
      const tokenSaleContract = new ethers.Contract(TOKEN_ADDRESSES.TOKEN_SALE, TOKEN_SALE_ABI, signer);
      
      const tokensSold = await tokenSaleContract.tokensSold();
      const maxTokens = await tokenSaleContract.maxTokens();
      const isActive = await tokenSaleContract.isActive();
      
      const progress = (parseFloat(ethers.formatEther(tokensSold)) / parseFloat(ethers.formatEther(maxTokens))) * 100;
      
      setSaleInfo({
        tokensSold: ethers.formatEther(tokensSold),
        maxTokens: ethers.formatEther(maxTokens),
        isActive,
        progress
      });
    } catch (error) {
      console.error('Error loading sale info:', error);
      // On error, set inactive state
      setSaleInfo({
        tokensSold: "0", 
        maxTokens: "20000000000",
        isActive: false,
        progress: 0
      });
    }
  };

  // Approve token spending
  const approveToken = async (token: 'USDC' | 'USDT', amount: string) => {
    if (!provider || !account) return;
    
    // Runtime guard: Check if contracts are configured
    if (!isConfigured) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Smart contracts are not configured. Please contact support."
      });
      return;
    }

    const isCorrectNetwork = await ensurePolygonNetwork();
    if (!isCorrectNetwork) return;

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const tokenAddress = token === 'USDC' ? TOKEN_ADDRESSES.USDC : TOKEN_ADDRESSES.USDT;
      const decimals = 6; // Both USDC and USDT have 6 decimals on Polygon
      
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const approveAmount = ethers.parseUnits(amount, decimals);
      
      const tx = await tokenContract.approve(TOKEN_ADDRESSES.TOKEN_SALE, approveAmount);
      setTransactionHash(tx.hash);
      
      toast({
        title: "Approval Pending",
        description: `Approving ${amount} ${token}. Please wait for confirmation.`
      });
      
      await tx.wait();
      
      toast({
        title: "Approval Successful",
        description: `${amount} ${token} approved for spending.`
      });
      
      await loadBalances();
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message || 'Failed to approve token spending'
      });
    } finally {
      setIsLoading(false);
      setTransactionHash("");
    }
  };

  // Purchase TSU-X tokens
  const purchaseTokens = async () => {
    if (!provider || !account || !purchaseAmount) return;
    
    // Runtime guard: Check if contracts are configured
    if (!isConfigured) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Smart contracts are not configured. ICO is not available."
      });
      return;
    }

    const isCorrectNetwork = await ensurePolygonNetwork();
    if (!isCorrectNetwork) return;

    const amount = parseFloat(purchaseAmount);
    if (amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid purchase amount"
      });
      return;
    }

    const currentBalance = selectedToken === 'USDC' ? parseFloat(balances.usdc) : parseFloat(balances.usdt);
    if (amount > currentBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You don't have enough ${selectedToken} tokens`
      });
      return;
    }

    const currentAllowance = selectedToken === 'USDC' ? parseFloat(balances.allowanceUsdc) : parseFloat(balances.allowanceUsdt);
    if (amount > currentAllowance) {
      toast({
        variant: "destructive",
        title: "Insufficient Allowance",
        description: `Please approve ${selectedToken} spending first`
      });
      return;
    }

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const tokenSaleContract = new ethers.Contract(TOKEN_ADDRESSES.TOKEN_SALE, TOKEN_SALE_ABI, signer);
      
      const purchaseAmountWei = ethers.parseUnits(purchaseAmount, 6); // 6 decimals for stablecoins
      
      let tx;
      if (selectedToken === 'USDC') {
        tx = await tokenSaleContract.buyTokensWithUSDC(purchaseAmountWei);
      } else {
        tx = await tokenSaleContract.buyTokensWithUSDT(purchaseAmountWei);
      }
      
      setTransactionHash(tx.hash);
      
      toast({
        title: "Purchase Pending",
        description: `Purchasing ${purchaseAmount} TSU-X tokens. Please wait for confirmation.`
      });
      
      await tx.wait();
      
      toast({
        title: "Purchase Successful",
        description: `Successfully purchased ${purchaseAmount} TSU-X tokens!`
      });
      
      await Promise.all([loadBalances(), loadSaleInfo()]);
      setPurchaseAmount("");
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error.message || 'Failed to purchase tokens'
      });
    } finally {
      setIsLoading(false);
      setTransactionHash("");
    }
  };

  // Get current network chain ID
  useEffect(() => {
    const getChainId = async () => {
      if (provider) {
        const network = await provider.getNetwork();
        setChainId(network.chainId.toString());
      }
    };
    getChainId();
  }, [provider]);

  // Load data when wallet connects
  useEffect(() => {
    if (isConnected && account && provider) {
      Promise.all([loadBalances(), loadSaleInfo()]);
    }
  }, [isConnected, account, provider]);

  const needsApproval = selectedToken === 'USDC' 
    ? parseFloat(purchaseAmount || "0") > parseFloat(balances.allowanceUsdc)
    : parseFloat(purchaseAmount || "0") > parseFloat(balances.allowanceUsdt);

  const isWrongNetwork = chainId && chainId !== '137';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-tsu-green to-tsu-light-green py-24">
        <div className="absolute inset-0 bg-tsu-green bg-opacity-70"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src={tsuXCoinImage} 
                alt="TSU-X Token" 
                className="w-32 h-32 rounded-full object-cover shadow-2xl"
                data-testid="tsux-logo"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" data-testid="ico-title">
              TSU-X Token ICO
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto" data-testid="ico-subtitle">
              The utility token powering BRICS + Africa trade liquidity on Polygon Mainnet
            </p>

            {/* What is TSU-X Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-4xl mx-auto text-left">
              <h2 className="text-3xl font-bold text-tsu-gold mb-6 text-center">What is TSU-X in Relation to TSU?</h2>
              <div className="space-y-6 text-gray-100">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-tsu-gold">TSU (Trade Settlement Unit)</h3>
                    <p className="text-lg leading-relaxed">
                      TSU is a reserve-backed digital currency designed specifically for Africa-BRICS trade settlements. 
                      It operates as a stable, government-regulated digital currency that reduces dependency on the USD 
                      for international trade between African nations and BRICS countries.
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 border border-tsu-gold/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-tsu-gold" />
                        <span className="font-semibold">Government Regulated</span>
                      </div>
                      <ul className="space-y-1 text-sm text-gray-200">
                        <li>• Central bank backing</li>
                        <li>• Reserve asset support</li>
                        <li>• Regulatory compliance</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-tsu-gold">TSU-X (TSU Extended)</h3>
                    <p className="text-lg leading-relaxed">
                      TSU-X is the blockchain-native utility token that powers the TSU ecosystem. Built on Polygon, 
                      it enables instant liquidity, smart contract functionality, and decentralized features that 
                      complement the core TSU digital currency.
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 border border-tsu-gold/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="h-5 w-5 text-tsu-gold" />
                        <span className="font-semibold">Blockchain Powered</span>
                      </div>
                      <ul className="space-y-1 text-sm text-gray-200">
                        <li>• Polygon mainnet deployment</li>
                        <li>• Smart contract integration</li>
                        <li>• DeFi compatibility</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-tsu-gold/20 to-yellow-500/20 rounded-lg p-6 border border-tsu-gold/50">
                  <h4 className="text-xl font-bold text-tsu-gold mb-3 text-center">The Relationship</h4>
                  <div className="text-center">
                    <p className="text-lg leading-relaxed mb-4">
                      <strong className="text-tsu-gold">TSU-X</strong> acts as the digital bridge that connects traditional 
                      TSU settlements with modern blockchain infrastructure. While TSU handles the core trade settlements, 
                      TSU-X enables instant liquidity, programmable money features, and integration with global DeFi protocols.
                    </p>
                    <div className="inline-flex items-center gap-4 text-tsu-gold font-semibold">
                      <span>TSU (Core Currency)</span>
                      <span>↔</span>
                      <span>TSU-X (Blockchain Utility)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ICO Progress */}
            <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-tsu-gold mb-4">ICO Progress</h3>
                <Progress 
                  value={saleInfo.progress} 
                  className="w-full h-3 mb-4"
                  data-testid="ico-progress"
                />
                <div className="flex justify-between text-white text-sm">
                  <span>{(parseFloat(saleInfo.tokensSold) / 1e9).toFixed(1)}B TSU-X sold</span>
                  <span>{saleInfo.progress.toFixed(1)}% complete</span>
                  <span>{(parseFloat(saleInfo.maxTokens) / 1e9).toFixed(0)}B TSU-X total</span>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold text-tsu-gold">
                    {isConfigured ? "1 USDC/USDT = 1 TSU-X" : "ICO Not Available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose TSU-X Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose TSU-X?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              TSU-X isn't just another cryptocurrency – it's your gateway to the future of 
              Africa-BRICS trade and financial independence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-tsu-gold" data-testid="benefit-early-access">
              <div className="flex items-center justify-center w-12 h-12 bg-tsu-gold rounded-lg mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Early Access Advantage</h3>
              <p className="text-gray-600 leading-relaxed">
                Get in before widespread adoption. As the TSU ecosystem grows and more countries 
                join the Africa-BRICS trade network, early TSU-X holders benefit from increasing 
                utility and demand.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-tsu-gold" data-testid="benefit-real-utility">
              <div className="flex items-center justify-center w-12 h-12 bg-tsu-gold rounded-lg mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-World Utility</h3>
              <p className="text-gray-600 leading-relaxed">
                Unlike speculative tokens, TSU-X powers actual trade settlements worth billions. 
                Every transaction between Africa and BRICS nations can potentially use TSU-X for 
                instant liquidity and smart contract automation.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-tsu-gold" data-testid="benefit-institutional">
              <div className="flex items-center justify-center w-12 h-12 bg-tsu-gold rounded-lg mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Institutional Backing</h3>
              <p className="text-gray-600 leading-relaxed">
                TSU-X is backed by the same reserve assets and institutional framework as TSU. 
                This provides stability and legitimacy that pure cryptocurrency projects cannot match.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-tsu-gold" data-testid="benefit-defi">
              <div className="flex items-center justify-center w-12 h-12 bg-tsu-gold rounded-lg mb-4">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">DeFi Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Access the entire Polygon DeFi ecosystem. Use TSU-X for yield farming, liquidity 
                provision, and automated trading strategies while maintaining exposure to 
                Africa-BRICS trade growth.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-tsu-gold" data-testid="benefit-low-fees">
              <div className="flex items-center justify-center w-12 h-12 bg-tsu-gold rounded-lg mb-4">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Low Fees & Speed</h3>
              <p className="text-gray-600 leading-relaxed">
                Polygon's infrastructure means your TSU-X transactions cost pennies and confirm 
                in seconds. No more waiting hours or paying high fees for international transfers.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-tsu-gold" data-testid="benefit-sovereignty">
              <div className="flex items-center justify-center w-12 h-12 bg-tsu-gold rounded-lg mb-4">
                <ExternalLink className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Financial Sovereignty</h3>
              <p className="text-gray-600 leading-relaxed">
                Break free from USD dependency and Western banking restrictions. TSU-X enables 
                direct peer-to-peer value transfer across the Global South without intermediaries.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-tsu-green to-tsu-light-green rounded-2xl p-8 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Join the Revolution?</h3>
            <p className="text-xl text-gray-100 mb-6 max-w-2xl mx-auto">
              The TSU-X ICO represents more than an investment opportunity – it's your chance to 
              be part of reshaping global trade for the next generation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-white">
              <div>
                <div className="text-2xl font-bold">4+ Billion</div>
                <div className="text-sm">People Connected</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$2+ Trillion</div>
                <div className="text-sm">Trade Volume Potential</div>
              </div>
              <div>
                <div className="text-2xl font-bold">1:1 Fixed</div>
                <div className="text-sm">ICO Price (USDC/USDT)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Purchase Panel */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg" data-testid="purchase-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-tsu-gold" />
                  Purchase TSU-X Tokens
                </CardTitle>
                <CardDescription>
                  Connect your wallet and purchase TSU-X tokens at a fixed 1:1 rate with USDC or USDT
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Network Warning */}
                {isWrongNetwork && (
                  <Alert data-testid="network-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please switch to Polygon Mainnet to participate in the ICO.
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                        onClick={() => ensurePolygonNetwork()}
                        data-testid="switch-network-button"
                      >
                        Switch Network
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {!isConnected ? (
                  <div className="text-center py-8">
                    <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-600 mb-4">Connect your wallet to participate in the TSU-X ICO</p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => connectWallet('metamask')} 
                        disabled={isConnecting}
                        className="w-full"
                        data-testid="connect-metamask"
                      >
                        {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                      </Button>
                      <Button 
                        onClick={() => connectWallet('walletconnect')} 
                        disabled={isConnecting}
                        variant="outline"
                        className="w-full"
                        data-testid="connect-walletconnect"
                      >
                        {isConnecting ? 'Connecting...' : 'Connect via WalletConnect'}
                      </Button>
                    </div>
                    {web3Error && (
                      <p className="text-red-600 text-sm mt-2" data-testid="connection-error">{web3Error}</p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Contract Configuration Warning - Admin Only */}
                    {!isConfigured && isAdmin && (
                      <Alert data-testid="config-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Admin Configuration Required:</strong> Set environment variables for smart contracts.
                          <details className="mt-2 text-xs">
                            <summary className="cursor-pointer font-medium">Environment Variables Needed:</summary>
                            <div className="mt-1 space-y-1 font-mono">
                              <div>VITE_TSU_X_TOKEN_ADDRESS: {TOKEN_ADDRESSES.TSU_X}</div>
                              <div>VITE_TOKEN_SALE_CONTRACT_ADDRESS: {TOKEN_ADDRESSES.TOKEN_SALE}</div>
                              <div>USDC (verified): {TOKEN_ADDRESSES.USDC}</div>
                              <div>USDT (verified): {TOKEN_ADDRESSES.USDT}</div>
                            </div>
                          </details>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Public Notice when not configured */}
                    {!isConfigured && !isAdmin && (
                      <Alert data-testid="public-notice">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          The TSU-X ICO is currently being configured. Please check back soon.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Connected Wallet Info */}
                    <div className="bg-green-50 p-4 rounded-lg" data-testid="wallet-connected">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Wallet Connected</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">{account}</p>
                      <p className="text-xs text-green-600">Network: {chainId === '137' ? 'Polygon Mainnet' : `Chain ID ${chainId}`}</p>
                    </div>

                    {/* Token Selection */}
                    <div className="space-y-2">
                      <Label>Select Payment Token</Label>
                      <Tabs value={selectedToken} onValueChange={(value) => setSelectedToken(value as 'USDC' | 'USDT')}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="USDC" data-testid="select-usdc">USDC</TabsTrigger>
                          <TabsTrigger value="USDT" data-testid="select-usdt">USDT</TabsTrigger>
                        </TabsList>
                        <TabsContent value="USDC" className="mt-4">
                          <div className="text-sm text-gray-600">
                            Balance: {parseFloat(balances.usdc).toFixed(6)} USDC
                          </div>
                        </TabsContent>
                        <TabsContent value="USDT" className="mt-4">
                          <div className="text-sm text-gray-600">
                            Balance: {parseFloat(balances.usdt).toFixed(6)} USDT
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Purchase Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="purchase-amount">Purchase Amount ({selectedToken})</Label>
                      <Input
                        id="purchase-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                        data-testid="purchase-amount-input"
                      />
                      {purchaseAmount && (
                        <p className="text-sm text-gray-600">
                          You will receive: {purchaseAmount} TSU-X tokens
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {needsApproval && (
                        <Button
                          onClick={() => approveToken(selectedToken, purchaseAmount)}
                          disabled={isLoading || !purchaseAmount || !isConfigured}
                          className="w-full"
                          variant="outline"
                          data-testid="approve-button"
                        >
                          {!isConfigured ? 'Contract Configuration Required' :
                           isLoading ? 'Approving...' : `Approve ${selectedToken} Spending`}
                        </Button>
                      )}
                      
                      <Button
                        onClick={purchaseTokens}
                        disabled={isLoading || !purchaseAmount || needsApproval || !isConfigured}
                        className="w-full bg-tsu-gold hover:bg-tsu-gold/90"
                        data-testid="purchase-button"
                      >
                        {!isConfigured ? 'Contract Configuration Required' : 
                         isLoading ? 'Processing...' : 'Purchase TSU-X Tokens'}
                      </Button>
                    </div>

                    {/* Transaction Hash */}
                    {transactionHash && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                        <a 
                          href={`https://polygonscan.com/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                          data-testid="transaction-link"
                        >
                          {transactionHash}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Token Balances */}
            {isConnected && (
              <Card data-testid="balance-card">
                <CardHeader>
                  <CardTitle className="text-lg">Your Balances</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">USDC:</span>
                    <span className="font-medium" data-testid="usdc-balance">
                      {parseFloat(balances.usdc).toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">USDT:</span>
                    <span className="font-medium" data-testid="usdt-balance">
                      {parseFloat(balances.usdt).toFixed(6)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">TSU-X:</span>
                    <span className="font-medium text-tsu-gold" data-testid="tsux-balance">
                      {parseFloat(balances.tsux).toFixed(6)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ICO Information */}
            <Card data-testid="ico-info-card">
              <CardHeader>
                <CardTitle className="text-lg">ICO Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Token Price:</span>
                    <span className="font-medium">1 USDC/USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium">20B TSU-X</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span className="font-medium">Polygon Mainnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={saleInfo.isActive ? "default" : "destructive"}>
                      {saleInfo.isActive ? "Active" : "Ended"}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Features:</h4>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li>• Governance rights in TSU ecosystem</li>
                    <li>• Fee discounts on TSU transactions</li>
                    <li>• Staking rewards from revenue sharing</li>
                    <li>• Buy-back & burn mechanism</li>
                    <li>• BRICS + Africa trade corridor access</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open('/tsu-x-whitepaper.pdf', '_blank')}
                    data-testid="whitepaper-button"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Whitepaper
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Risk Warning */}
            <Card className="border-yellow-200 bg-yellow-50" data-testid="risk-warning">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Important Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 text-sm">
                  Cryptocurrency investments carry significant risks. Please ensure you understand 
                  the risks involved and only invest what you can afford to lose. 
                  This is not financial advice.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}