import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';

export type WalletType = 'metamask' | 'walletconnect' | null;

interface Web3ContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  walletType: WalletType;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: (type?: WalletType) => Promise<void>;
  connectMetaMask: () => Promise<boolean>;
  connectWalletConnect: () => Promise<boolean>;
  disconnectWallet: () => void;
  error: string | null;
  supportedWallets: string[];
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletConnectProvider, setWalletConnectProvider] = useState<any>(null);

  const isConnected = !!account && !!provider;

  const connectMetaMask = async (): Promise<boolean> => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(ethProvider);
        setWalletType('metamask');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Failed to connect MetaMask:', err);
      setError(err.message || 'Failed to connect MetaMask');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWalletConnect = async (): Promise<boolean> => {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
    const chainId = import.meta.env.VITE_EVM_CHAIN_ID ? parseInt(import.meta.env.VITE_EVM_CHAIN_ID) : 1;
    
    if (!projectId) {
      setError('WalletConnect is not configured. Please contact support.');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create WalletConnect provider
      const wcProvider = await EthereumProvider.init({
        projectId,
        chains: [chainId],
        showQrModal: true,
      });

      // Enable session (triggers QR Code modal)
      const accounts = await wcProvider.enable();
      
      if (accounts.length > 0) {
        const ethProvider = new ethers.BrowserProvider(wcProvider);
        setWalletConnectProvider(wcProvider);
        setAccount(accounts[0]);
        setProvider(ethProvider);
        setWalletType('walletconnect');

        // Add WalletConnect event listeners
        wcProvider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnectWallet();
          } else {
            setAccount(accounts[0]);
          }
        });

        wcProvider.on('chainChanged', () => {
          window.location.reload();
        });

        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Failed to connect WalletConnect:', err);
      setError(err.message || 'Failed to connect via WalletConnect');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWallet = async (type: WalletType = 'metamask') => {
    if (type === 'walletconnect') {
      await connectWalletConnect();
    } else {
      await connectMetaMask();
    }
  };

  const disconnectWallet = () => {
    if (walletConnectProvider && walletType === 'walletconnect') {
      try {
        walletConnectProvider.disconnect();
      } catch (err) {
        console.error('Error disconnecting WalletConnect:', err);
      }
      setWalletConnectProvider(null);
    }
    
    setAccount(null);
    setProvider(null);
    setWalletType(null);
    setError(null);
  };

  // Supported wallets list
  const supportedWallets = [
    'MetaMask (browser extension)',
    'WalletConnect (mobile wallets)',
    'Trust Wallet (via WalletConnect)',
    'Coinbase Wallet (via WalletConnect)',
    'Rainbow Wallet (via WalletConnect)',
    '300+ other wallets (via WalletConnect)'
  ];

  // Check if wallet is already connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            const ethProvider = new ethers.BrowserProvider(window.ethereum);
            setAccount(accounts[0]);
            setProvider(ethProvider);
            setWalletType('metamask'); // Fix: Set wallet type during auto-reconnect
          }
        } catch (err) {
          console.error('Failed to check wallet connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // Reload page when chain changes to avoid issues
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account]);

  const value: Web3ContextType = {
    account,
    provider,
    walletType,
    isConnected,
    isConnecting,
    connectWallet,
    connectMetaMask,
    connectWalletConnect,
    disconnectWallet,
    error,
    supportedWallets,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};