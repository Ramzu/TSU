import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Shield, Users, TrendingUp, Coins, Globe } from "lucide-react";

export default function Commodities() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <Coins className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="heading-commodities-program">
            TSU Commodities Program
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            Unlock the True Value of Your Resources
          </p>
        </div>

        {/* What Is Section */}
        <Card className="mb-8" data-testid="card-what-is">
          <CardHeader>
            <CardTitle className="text-2xl text-green-700" data-testid="heading-what-is">
              What Is the TSU Commodities Program?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed" data-testid="text-program-description">
              The TSU Commodities Program is designed for producers, exporters, and traders who hold valuable resources but face challenges converting them into stable liquidity. By registering unsold or allocated commodities (oil, cocoa, copper, grain, and more) with the TSU Authority, you gain access to Trade Settlement Units (TSU) — a digital settlement token backed by real reserves.
            </p>
          </CardContent>
        </Card>

        {/* How It Works Section */}
        <Card className="mb-8" data-testid="card-how-it-works">
          <CardHeader>
            <CardTitle className="text-2xl text-green-700" data-testid="heading-how-it-works">
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center" data-testid="step-register">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">Register Your Commodities</h3>
                <p className="text-sm text-gray-600">
                  Producers submit proof of ownership (allocation contracts, warehouse receipts, or export rights). Independent Trustees verify and secure the assets.
                </p>
              </div>
              
              <div className="text-center" data-testid="step-issuance">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">TSU Issuance with Lock-Up</h3>
                <p className="text-sm text-gray-600">
                  TSU credits are minted against your registered commodity value. For security, these credits remain locked for 30–60 days while the Authority builds FX and gold reserves.
                </p>
              </div>
              
              <div className="text-center" data-testid="step-reserve-building">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">Reserve Building</h3>
                <p className="text-sm text-gray-600">
                  During lock-up, TSU is offered to investors and BRICS partners. Proceeds strengthen the reserve pool (gold, foreign currency, and other commodities).
                </p>
              </div>
              
              <div className="text-center" data-testid="step-unlock">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">Unlock & Redeem</h3>
                <p className="text-sm text-gray-600">
                  Once the lock-up expires, your TSU is unlocked. You can pay for imports, redeem for BRICS currencies, or exchange for gold.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card data-testid="card-producers-benefits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="w-5 h-5" />
                For Producers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3" data-testid="benefit-liquidity">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Liquidity Today</strong> – Turn unsold assets into usable settlement units.
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="benefit-stability">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Stability</strong> – TSU is pegged to a diversified basket of gold, FX, and commodities.
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="benefit-market-access">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Market Access</strong> – Expand beyond USD bottlenecks into BRICS and African demand.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-traders-benefits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Globe className="w-5 h-5" />
                For Traders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3" data-testid="benefit-reliable-supply">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Reliable Supply</strong> – Source commodities through a transparent, reserve-backed system.
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="benefit-de-dollarized">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>De-Dollarized Settlement</strong> – Transact in TSU instead of relying on USD channels.
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="benefit-verified-assets">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Verified Assets</strong> – All commodities are independently validated before issuance.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safeguards Section */}
        <Card className="mb-8" data-testid="card-safeguards">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Shield className="w-6 h-6" />
              Safeguards You Can Trust
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3" data-testid="safeguard-collateralization">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Security</Badge>
                <div>
                  <strong>Over-Collateralization:</strong> Producers pledge 120–150% of the value of TSU minted.
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="safeguard-trustees">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Validation</Badge>
                <div>
                  <strong>Independent Trustees:</strong> All assets are validated by neutral third parties.
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="safeguard-reserves">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Transparency</Badge>
                <div>
                  <strong>Proof-of-Reserves:</strong> Monthly audits published for transparency.
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="safeguard-arbitration">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Protection</Badge>
                <div>
                  <strong>International Arbitration:</strong> Neutral dispute resolution protects all partners.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Section */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200" data-testid="card-example">
          <CardHeader>
            <CardTitle className="text-green-700" data-testid="heading-example">Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-700">
              <p data-testid="text-example-step1">• A cocoa cooperative registers 50,000 tons of cocoa worth $100M.</p>
              <p data-testid="text-example-step2">• TSU worth $70M is minted and locked for 45 days.</p>
              <p data-testid="text-example-step3">• During lock-up, reserves are raised in CNY and gold.</p>
              <p data-testid="text-example-step4">• After unlock, the cooperative uses TSU to buy tractors from China and fertilizer from South Africa.</p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white" data-testid="card-cta">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4" data-testid="heading-get-started">Get Started</h2>
              <p className="text-green-100 mb-6" data-testid="text-cta-description">
                Turn your commodities into global trade liquidity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white text-green-700 hover:bg-green-50"
                  data-testid="button-register-commodities"
                >
                  Register Commodities
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-green-800"
                  data-testid="button-contact-authority"
                >
                  Contact TSU Authority
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-green-800"
                  data-testid="button-download-framework"
                >
                  Download Partnership Framework
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}