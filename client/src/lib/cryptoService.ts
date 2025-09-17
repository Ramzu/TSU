interface CryptoPrices {
  BTC: number;
  ETH: number;
}

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
  };
  ethereum: {
    usd: number;
  };
}

const FALLBACK_RATES = {
  BTC: 0.000025, // 1 USD = 0.000025 BTC (assuming $40,000 BTC)
  ETH: 0.0008,   // 1 USD = 0.0008 ETH (assuming $2,500 ETH)
};

/**
 * Fetches current cryptocurrency prices from CoinGecko API
 * Returns USD to crypto conversion rates (1 USD = X crypto)
 */
export async function fetchCryptoPrices(): Promise<CryptoPrices> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: CoinGeckoResponse = await response.json();
    
    return {
      BTC: 1 / data.bitcoin.usd,    // Convert to "1 USD = X BTC"
      ETH: 1 / data.ethereum.usd,   // Convert to "1 USD = X ETH"
    };
  } catch (error) {
    console.warn('Failed to fetch crypto prices, using fallback rates:', error);
    return FALLBACK_RATES;
  }
}

/**
 * Formats crypto amount with appropriate decimal places
 */
export function formatCryptoAmount(amount: number, currency: 'BTC' | 'ETH'): string {
  const decimals = currency === 'BTC' ? 8 : 6;
  return amount.toFixed(decimals);
}

/**
 * Calculates the crypto amount for a given USD amount using current rates
 */
export function calculateCryptoAmount(usdAmount: number, currency: 'BTC' | 'ETH', rates: CryptoPrices): string {
  const cryptoAmount = usdAmount * rates[currency];
  return formatCryptoAmount(cryptoAmount, currency);
}