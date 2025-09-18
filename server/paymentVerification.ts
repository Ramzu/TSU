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
   * @param expectedFromAddress - Expected sender address (user's verified wallet)
   * @param minConfirmations - Minimum confirmations required (default: 3)
   */
  async verifyEthereumTransaction(
    txHash: string,
    expectedAddress: string,
    expectedAmountWei: string,
    expectedFromAddress?: string,
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
      const isValidSender = expectedFromAddress ? 
        tx.from?.toLowerCase() === expectedFromAddress.toLowerCase() : true;
      const hasMinConfirmations = confirmations >= minConfirmations;

      const verified = isValidRecipient && isValidAmount && isValidSender && hasMinConfirmations;

      return {
        verified,
        transaction: tx,
        confirmations,
        error: verified ? undefined : 
          !isValidRecipient ? 'Invalid recipient address' :
          !isValidAmount ? `Invalid amount: expected ${expectedAmountWei} wei, got ${tx.value.toString()} wei` :
          !isValidSender ? 'Invalid sender address - transaction must come from your verified wallet' :
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
   * Verify a Bitcoin transaction using Blockstream API
   * @param txHash - Transaction hash to verify
   * @param expectedAddress - Expected recipient address
   * @param expectedAmountSats - Expected amount in satoshis
   * @param expectedFromAddress - Expected sender address (REQUIRED - user's verified Bitcoin address)
   * @param minConfirmations - Minimum confirmations required (default: 3 to match Ethereum security)
   */
  async verifyBitcoinTransaction(
    txHash: string,
    expectedAddress: string,
    expectedAmountSats: string,
    expectedFromAddress: string, // REQUIRED for security
    minConfirmations: number = 3
  ): Promise<{
    verified: boolean;
    transaction?: any;
    confirmations?: number;
    error?: string;
  }> {
    try {
      // Use Blockstream API to get transaction details
      const apiUrl = `https://blockstream.info/api/tx/${txHash}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { verified: false, error: 'Transaction not found' };
        }
        return { verified: false, error: `API error: ${response.status}` };
      }
      
      const tx = await response.json();
      
      // Verify transaction is confirmed (has block_height)
      if (!tx.status?.confirmed || !tx.status?.block_height) {
        return { 
          verified: false, 
          error: 'Transaction not yet confirmed',
          transaction: tx,
          confirmations: 0
        };
      }
      
      // Get current block height to calculate confirmations
      const tipResponse = await fetch('https://blockstream.info/api/blocks/tip/height');
      if (!tipResponse.ok) {
        return { verified: false, error: 'Failed to get current block height' };
      }
      
      const currentHeight = await tipResponse.json();
      const confirmations = currentHeight - tx.status.block_height + 1;
      
      // Check minimum confirmations
      if (confirmations < minConfirmations) {
        return {
          verified: false,
          error: `Insufficient confirmations (${confirmations}/${minConfirmations})`,
          transaction: tx,
          confirmations
        };
      }
      
      // Check if transaction has outputs (vout)
      if (!tx.vout || !Array.isArray(tx.vout)) {
        return { verified: false, error: 'Invalid transaction format - no outputs found' };
      }
      
      // Find output that matches our expected address and amount (with tolerance for rounding)
      const expectedAmountSatsNumber = parseInt(expectedAmountSats);
      const AMOUNT_TOLERANCE_SATS = 1000; // Allow ±1000 sats tolerance for rounding differences
      let foundValidOutput = false;
      
      for (const output of tx.vout) {
        // Check if output goes to our expected address
        if (output.scriptpubkey_address === expectedAddress) {
          // Check if amount matches within tolerance (output.value is in satoshis)
          const amountDifference = Math.abs(output.value - expectedAmountSatsNumber);
          if (amountDifference <= AMOUNT_TOLERANCE_SATS) {
            foundValidOutput = true;
            break;
          }
        }
      }
      
      if (!foundValidOutput) {
        // Find what addresses and amounts were actually sent to for debugging
        const actualOutputs = tx.vout.map((out: any) => ({
          address: out.scriptpubkey_address,
          amount: out.value
        }));
        
        return {
          verified: false,
          error: `No matching output found. Expected: ${expectedAddress} with ${expectedAmountSatsNumber} sats. Actual outputs: ${JSON.stringify(actualOutputs)}`,
          transaction: tx,
          confirmations
        };
      }
      
      // SECURITY: Require sender verification - Bitcoin payments must come from verified address
      if (!expectedFromAddress) {
        return {
          verified: false,
          error: 'Bitcoin payments require sender verification. Please verify your Bitcoin address first.',
          transaction: tx,
          confirmations
        };
      }
      
      // Verify sender address (REQUIRED)
      if (tx.vin && Array.isArray(tx.vin)) {
        // For Bitcoin, we need to check the inputs (vin) to verify sender
        // This requires getting the previous transaction for each input
        let validSender = false;
        
        for (const input of tx.vin) {
          if (input.prevout && input.prevout.scriptpubkey_address === expectedFromAddress) {
            validSender = true;
            break;
          }
        }
        
        if (!validSender) {
          const senderAddresses = tx.vin
            .filter((inp: any) => inp.prevout?.scriptpubkey_address)
            .map((inp: any) => inp.prevout.scriptpubkey_address);
          
          return {
            verified: false,
            error: `Invalid sender address - transaction must come from your verified wallet. Expected: ${expectedFromAddress}, Found: ${senderAddresses.join(', ')}`,
            transaction: tx,
            confirmations
          };
        }
      }
      
      return {
        verified: true,
        transaction: tx,
        confirmations
      };
      
    } catch (error) {
      console.error('Error verifying Bitcoin transaction:', error);
      return { 
        verified: false, 
        error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
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