import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  change24h?: number; // Percentage change in 24h
  source: string;
  updatedAt: string;
}

interface TSURate {
  baseCurrency: string;
  tsuPrice: string;
  gasolineEquivalent: string;
  cryptoRates?: {
    BTC?: number;
    ETH?: number;
    USD?: number;
  };
  updatedAt: string;
}

export default function ExchangeRateWidget() {
  const { data: rates = [], isLoading, refetch } = useQuery<ExchangeRate[]>({
    queryKey: ["/api/exchange-rates"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: tsuRates } = useQuery<TSURate[]>({
    queryKey: ["/api/tsu-rates"],
    refetchInterval: 60000,
  });

  const formatRate = (rate: string, currency: string) => {
    const num = parseFloat(rate);
    if (currency === 'BTC') return num.toFixed(8);
    if (currency === 'ETH') return num.toFixed(6);
    return num.toFixed(2);
  };

  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus className="h-3 w-3 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  const getTrendColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  const currentTSURate = tsuRates?.[0];

  return (
    <Card className="shadow-lg" data-testid="exchange-rates-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-tsu-green">Live Exchange Rates</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          className="h-8 w-8 p-0"
          data-testid="refresh-rates"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TSU Main Rate */}
        {currentTSURate && (
          <div className="p-3 bg-gradient-to-r from-tsu-green to-tsu-light-green rounded-lg text-white" data-testid="tsu-main-rate">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">1 TSU</div>
                <div className="text-xs opacity-90">Trade Settlement Unit</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  ${formatRate(currentTSURate.tsuPrice, 'USD')}
                </div>
                <div className="text-xs opacity-90">
                  ⛽ {currentTSURate.gasolineEquivalent}L
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Currency Rates */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Major Currencies</div>
          {rates.slice(0, 4).map((rate) => (
            <div 
              key={rate.id} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
              data-testid={`rate-${rate.fromCurrency}-${rate.toCurrency}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {rate.fromCurrency}/{rate.toCurrency}
                </span>
                {getTrendIcon(rate.change24h)}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {formatRate(rate.rate, rate.toCurrency)}
                </div>
                {rate.change24h && (
                  <div className={`text-xs ${getTrendColor(rate.change24h)}`}>
                    {rate.change24h > 0 ? '+' : ''}{rate.change24h.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Crypto Rates */}
        {currentTSURate?.cryptoRates && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Cryptocurrencies</div>
            {Object.entries(currentTSURate.cryptoRates).map(([crypto, rate]) => (
              <div 
                key={crypto} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                data-testid={`crypto-rate-${crypto}`}
              >
                <span className="text-sm font-medium">TSU/{crypto}</span>
                <span className="text-sm font-semibold">
                  {formatRate(rate.toString(), crypto)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Update Time */}
        <div className="text-xs text-muted-foreground text-center" data-testid="rates-updated">
          Last updated: {currentTSURate ? new Date(currentTSURate.updatedAt).toLocaleTimeString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
}