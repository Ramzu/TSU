import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Shield, Users, TrendingUp, DollarSign, Globe, Building } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Currency() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navigation />
      <div className="pt-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="heading-currency-program">
            TSU Currency Program
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            Transform Local Currency Into Global Trade Power
          </p>
        </div>

        {/* What Is Section */}
        <Card className="mb-8" data-testid="card-what-is">
          <CardHeader>
            <CardTitle className="text-2xl text-green-700" data-testid="heading-what-is">
              What Is the TSU Currency Program?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4" data-testid="text-program-description">
              Many companies, cooperatives, and even governments hold large balances of local currency that are hard to redeem for USD or other foreign exchange. Inflation, capital controls, and liquidity shortages mean those funds often sit idle while businesses struggle to import critical goods.
            </p>
            <p className="text-gray-700 leading-relaxed" data-testid="text-program-solution">
              The TSU Currency Program solves this problem by converting illiquid local currency into Trade Settlement Units (TSU) — a stable, reserve-backed settlement instrument usable across Africa and BRICS trade corridors.
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
              <div className="text-center" data-testid="step-deposit">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">Deposit Local Currency Into Escrow</h3>
                <p className="text-sm text-gray-600">
                  Companies deposit their local currency (e.g., ZWL, NGN, PKR, TRY, etc.) into a designated escrow account with a partner bank or trustee.
                </p>
              </div>
              
              <div className="text-center" data-testid="step-issuance">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">TSU Issuance with Lock-Up</h3>
                <p className="text-sm text-gray-600">
                  TSU credits are minted and credited to your account, pegged to the reserve basket (gold, BRICS FX, commodities). For system stability, your TSU credits remain locked for 30–60 days.
                </p>
              </div>
              
              <div className="text-center" data-testid="step-reserve-building">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">Reserve Building</h3>
                <p className="text-sm text-gray-600">
                  During the lock-up, the TSU Authority sells TSU to investors and BRICS buyers, raising hard FX (CNY, ZAR, INR, RUB) and gold to ensure redemption is fully backed.
                </p>
              </div>
              
              <div className="text-center" data-testid="step-unlock">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">Unlock & Redeem</h3>
                <p className="text-sm text-gray-600">
                  After lock-up, your TSU is unlocked. Pay for imports, redeem for BRICS currencies, or convert to gold and commodities within the system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card data-testid="card-companies-benefits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Building className="w-5 h-5" />
                For Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3" data-testid="benefit-monetize-currency">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Monetize Idle Currency</strong> – Turn trapped local funds into usable trade value.
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="benefit-secure-imports">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Secure Imports</strong> – Use TSU to directly pay international suppliers.
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="benefit-stability">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Stability</strong> – Protect your purchasing power with a basket pegged to gold, FX, and commodities.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-governments-benefits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Globe className="w-5 h-5" />
                For Governments & Banks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3" data-testid="benefit-relieve-pressure">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Relieve Forex Pressure</strong> – Ease USD shortages by channeling local deposits into TSU.
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="benefit-support-industry">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Support Local Industry</strong> – Provide companies with access to imports without draining national reserves.
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="benefit-increase-confidence">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Increase Confidence</strong> – Demonstrate transparent reserve backing and international arbitration safeguards.
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
                  <strong>Over-Collateralization:</strong> Escrow deposits may exceed the TSU value issued (120–150%) to cover risk.
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="safeguard-trustees">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Validation</Badge>
                <div>
                  <strong>Independent Trustees:</strong> Local banks or neutral entities hold deposits securely.
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="safeguard-proof-reserves">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Transparency</Badge>
                <div>
                  <strong>Proof-of-Reserves:</strong> Monthly audits published to ensure transparency.
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="safeguard-lockup">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Stability</Badge>
                <div>
                  <strong>Lock-Up Window:</strong> Provides stability and ensures reserve buildup before TSU circulation.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200" data-testid="card-example">
          <CardHeader>
            <CardTitle className="text-blue-700" data-testid="heading-example">Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-700">
              <p data-testid="text-example-step1">• A Nigerian manufacturer holds ₦20B naira in bank accounts but cannot source USD for spare parts.</p>
              <p data-testid="text-example-step2">• The company deposits the funds into a TSU escrow account.</p>
              <p data-testid="text-example-step3">• TSU worth $15M is minted and locked for 30 days.</p>
              <p data-testid="text-example-step4">• During lock-up, TSU Authority raises $15M equivalent in CNY and gold.</p>
              <p data-testid="text-example-step5">• After unlock, the company uses TSU to import machinery from China and chemicals from South Africa.</p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white" data-testid="card-cta">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4" data-testid="heading-get-started">Get Started</h2>
              <p className="text-green-100 mb-6" data-testid="text-cta-description">
                Don't let trapped local currency hold back your growth. Convert it into TSU — the settlement instrument built for Africa and BRICS trade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white text-green-700 hover:bg-green-50"
                  data-testid="button-join-program"
                >
                  Join the Currency Program
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-green-700 font-semibold"
                  data-testid="button-contact-authority"
                >
                  Contact TSU Authority
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-green-700 font-semibold"
                  data-testid="button-download-framework"
                >
                  Download Escrow & Lock-Up Framework
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  );
}