import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWeb3, WalletType } from "@/providers/Web3Provider";

interface WalletSelectorProps {
  onWalletConnect: () => void;
}

export default function WalletSelector({ onWalletConnect }: WalletSelectorProps) {
  const { isConnecting, connectMetaMask, connectWalletConnect, error } = useWeb3();

  const handleMetaMaskConnect = async () => {
    const success = await connectMetaMask();
    if (success) {
      onWalletConnect();
    }
  };

  const handleWalletConnectConnect = async () => {
    const success = await connectWalletConnect();
    if (success) {
      onWalletConnect();
    }
  };

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension',
      icon: '🦊',
      isAvailable: !!window.ethereum,
      handler: handleMetaMaskConnect,
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with 300+ wallets via QR code',
      icon: '📱',
      isAvailable: true,
      handler: handleWalletConnectConnect,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          Choose Your Wallet
        </h3>
        <p className="text-sm text-purple-600">
          Select how you'd like to connect your wallet
        </p>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-3">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {walletOptions.map((wallet) => (
          <Card
            key={wallet.id}
            className={`border-2 transition-all hover:border-purple-300 ${
              !wallet.isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <CardContent className="pt-4">
              <Button
                onClick={wallet.handler}
                disabled={!wallet.isAvailable || isConnecting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                data-testid={`button-connect-${wallet.id}`}
              >
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">
                      {isConnecting ? 'Connecting...' : wallet.name}
                    </div>
                    <div className="text-xs opacity-90">
                      {wallet.description}
                    </div>
                  </div>
                </div>
              </Button>
              
              {!wallet.isAvailable && wallet.id === 'metamask' && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  MetaMask not detected. Install the extension to use this option.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-purple-500">
          WalletConnect supports 300+ wallets including Trust Wallet, Coinbase Wallet, Rainbow, and more
        </p>
      </div>
    </div>
  );
}