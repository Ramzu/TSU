import { ethers } from 'ethers';

// Payment verification service for blockchain transactions
export class PaymentVerificationService {
  private ethProvider: ethers.JsonRpcProvider | null = null;
  
  constructor() {
    const ethRpcUrl = process.env.ETHEREUM_RPC_URL;
    if (ethRpcUrl) {
      this.ethProvider = new ethers.JsonRpcProvider(ethRpcUrl);
    }
  }

  /**
   * Verify an Ethereum transaction
   * @param txHash - Transaction hash to verify
   * @param expectedAddress - Expected recipient address
   * @param expectedAmountWei - Expected amount in wei
   * @param minConfirmations - Minimum confirmations required (default: 1)
   */
  async verifyEthereumTransaction(
    txHash: string,
    expectedAddress: string,
    expectedAmountWei: string,
minConfirmations: number = 3
  ): Promise<{
    verified: boolean;
    transaction?: any;
    confirmations?: number;
    error?: string;
  }> {
    if (!this.ethProvider) {
      return { verified: false, error: 'Ethereum RPC not configured' };
    }

    try {
      // Get transaction details
      const tx = await this.ethProvider.getTransaction(txHash);
      if (!tx) {
        return { verified: false, error: 'Transaction not found' };
      }

      // Get transaction receipt to verify success
      const receipt = await this.ethProvider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { verified: false, error: 'Transaction receipt not found' };
      }

      // Check if transaction succeeded (status = 1)
      if (receipt.status !== 1) {
        return { verified: false, error: 'Transaction failed or reverted' };
      }

      // Verify we're on mainnet (chain ID 1)
      const network = await this.ethProvider.getNetwork();
      if (Number(network.chainId) !== 1) {
        return { verified: false, error: `Wrong network: expected mainnet (1), got ${network.chainId}` };
      }

      // Get current block number for confirmation count
      const currentBlock = await this.ethProvider.getBlockNumber();
      const confirmations = tx.blockNumber ? currentBlock - tx.blockNumber + 1 : 0;

      // Verify transaction details
      const isValidRecipient = tx.to?.toLowerCase() === expectedAddress.toLowerCase();
      const isValidAmount = tx.value.toString() === expectedAmountWei;
      const hasMinConfirmations = confirmations >= minConfirmations;

      const verified = isValidRecipient && isValidAmount && hasMinConfirmations;

      return {
        verified,
        transaction: tx,
        confirmations,
        error: verified ? undefined : 
          !isValidRecipient ? 'Invalid recipient address' :
          !isValidAmount ? `Invalid amount: expected ${expectedAmountWei} wei, got ${tx.value.toString()} wei` :
          !hasMinConfirmations ? `Insufficient confirmations (${confirmations}/${minConfirmations})` :
          'Unknown error'
      };
    } catch (error) {
      console.error('Error verifying Ethereum transaction:', error);
      return { 
        verified: false, 
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Verify a Bitcoin transaction (placeholder - requires Bitcoin RPC implementation)
   */
  async verifyBitcoinTransaction(
    txHash: string,
    expectedAddress: string,
    expectedAmountSats: string,
    minConfirmations: number = 3
  ): Promise<{
    verified: boolean;
    transaction?: any;
    confirmations?: number;
    error?: string;
  }> {
    // Bitcoin verification implementation would go here
    // For now, return unverified
    return { 
      verified: false, 
      error: 'Bitcoin verification not yet implemented' 
    };
  }

  /**
   * Get current Ethereum gas price and network info
   */
  async getEthereumNetworkInfo(): Promise<{
    gasPrice?: string;
    blockNumber?: number;
    chainId?: number;
    error?: string;
  }> {
    if (!this.ethProvider) {
      return { error: 'Ethereum RPC not configured' };
    }

    try {
      const [gasPrice, blockNumber, network] = await Promise.all([
        this.ethProvider.getFeeData(),
        this.ethProvider.getBlockNumber(),
        this.ethProvider.getNetwork()
      ]);

      return {
        gasPrice: gasPrice.gasPrice?.toString(),
        blockNumber,
        chainId: Number(network.chainId)
      };
    } catch (error) {
      return { 
        error: `Failed to get network info: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

// Export singleton instance
export const paymentVerification = new PaymentVerificationService();