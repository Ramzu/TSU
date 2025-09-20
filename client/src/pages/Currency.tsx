import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Shield, Users, TrendingUp, DollarSign, Globe, Building, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import globalFinanceImage from "@assets/stock_images/modern_financial_das_ec08f7bf.jpg";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import CurrencyConversionModal from "@/components/CurrencyConversionModal";
import ContactModal from "@/components/ContactModal";

interface ContentItem {
  key: string;
  title?: string;
  value: string;
  section?: string;
}

export default function Currency() {
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  const { data: contentResponse } = useQuery<{data: ContentItem[]}>({
    queryKey: ["/api/content"],
  });

  const getContent = (key: string, defaultValue: string) => {
    const content = contentResponse?.data || [];
    const item = Array.isArray(content) ? content.find((c: any) => c.key === key) : undefined;
    return item?.value || defaultValue;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-tsu-gold to-yellow-400 pt-20 pb-16"
        style={{
          backgroundImage: `url(${globalFinanceImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="absolute inset-0 bg-tsu-gold bg-opacity-80"></div>
        <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-tsu-green rounded-full mb-6">
              <DollarSign className="w-10 h-10 text-tsu-gold" />
            </div>
            <h1 className="text-5xl font-bold text-tsu-green mb-6" data-testid="heading-currency-program">
              {getContent('currency-hero-title', 'TSU Currency Program')}
            </h1>
            <p className="text-xl text-tsu-dark-green max-w-3xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
              {getContent('currency-hero-subtitle', 'Transform illiquid local currency into stable, usable Trade Settlement Units. Convert trapped funds into global trade power across Africa and BRICS networks.')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-tsu-green hover:bg-tsu-dark-green text-white font-semibold px-8 py-3"
                data-testid="button-get-started"
              >
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-tsu-green bg-transparent text-tsu-green hover:bg-tsu-green hover:text-white font-semibold px-8 py-3"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Overview Section */}
        <section className="mb-16">
          <Card className="shadow-lg" data-testid="card-overview">
            <CardHeader>
              <CardTitle className="text-3xl text-tsu-green text-center" data-testid="heading-overview">
                {getContent('currency-overview-title', 'Transform Local Currency Into Global Trade Power')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-lg text-gray-700 leading-relaxed text-center max-w-4xl mx-auto" data-testid="text-problem">
                  {getContent('currency-overview-problem', 'Many companies, cooperatives, and governments hold large balances of local currency that are hard to redeem for USD or other foreign exchange. Inflation, capital controls, and liquidity shortages mean those funds often sit idle while businesses struggle to import critical goods.')}
                </p>
                <p className="text-lg text-gray-700 leading-relaxed text-center max-w-4xl mx-auto" data-testid="text-solution">
                  {getContent('currency-overview-solution', 'The TSU Currency Program solves this problem by converting illiquid local currency into Trade Settlement Units — a stable, reserve-backed settlement instrument usable across Africa and BRICS trade corridors.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-tsu-green mb-4" data-testid="heading-how-it-works">
              {getContent('currency-process-title', 'How It Works')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {getContent('currency-process-subtitle', 'Simple conversion process from local currency to globally accepted TSU')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow" data-testid="step-deposit">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-tsu-green font-bold text-xl">1</span>
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green text-lg">Deposit Into Escrow</h3>
                <p className="text-sm text-gray-600">
                  Deposit your local currency (ZWL, NGN, PKR, TRY, etc.) into a designated escrow account with a partner bank or trustee.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow" data-testid="step-issuance">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-tsu-green font-bold text-xl">2</span>
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green text-lg">TSU Issuance</h3>
                <p className="text-sm text-gray-600">
                  TSU credits are minted and credited to your account, pegged to the reserve basket. Credits remain locked for 30–60 days for system stability.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow" data-testid="step-reserve-building">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-tsu-green font-bold text-xl">3</span>
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green text-lg">Reserve Building</h3>
                <p className="text-sm text-gray-600">
                  During lock-up, the Authority uses local currency proceeds to strengthen gold and FX reserves, ensuring TSU stability.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow" data-testid="step-activation">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-tsu-green font-bold text-xl">4</span>
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green text-lg">TSU Activation</h3>
                <p className="text-sm text-gray-600">
                  Once reserves are sufficient, your TSU credits unlock. Use them for trade settlements, imports, or convert through partner networks.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-tsu-green mb-4" data-testid="heading-benefits">
              Why Choose TSU Currency Program?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg" data-testid="benefit-liquidity">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-tsu-green rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green">Monetize Idle Currency</h3>
                <p className="text-gray-600">
                  Convert trapped local currency holdings into usable global trade instruments without forex bottlenecks.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg" data-testid="benefit-stability">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-tsu-green rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green">Stable Value</h3>
                <p className="text-gray-600">
                  TSU is backed by gold and FX reserves, providing stability against local currency inflation and volatility.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg" data-testid="benefit-access">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-tsu-green rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green">Import Access</h3>
                <p className="text-gray-600">
                  Secure imports without USD bottlenecks through our growing network of BRICS and African trade partners.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Supported Currencies */}
        <section className="mb-16">
          <Card className="shadow-lg" data-testid="card-supported-currencies">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green text-center" data-testid="heading-supported-currencies">
                Supported Local Currencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  "Zimbabwean Dollar (ZWL)",
                  "Nigerian Naira (NGN)", 
                  "Pakistani Rupee (PKR)",
                  "Turkish Lira (TRY)",
                  "Egyptian Pound (EGP)",
                  "South African Rand (ZAR)",
                  "Ghanaian Cedi (GHS)",
                  "Kenyan Shilling (KES)"
                ].map((currency, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-tsu-green flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{currency}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Additional currencies being evaluated. Contact us to discuss your specific currency needs.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-tsu-green mb-4" data-testid="heading-use-cases">
              Perfect For
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-lg" data-testid="use-case-corporations">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-tsu-gold rounded-full flex items-center justify-center mb-4">
                  <Building className="w-6 h-6 text-tsu-green" />
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green">Corporations</h3>
                <p className="text-gray-600">
                  Companies with large local currency balances that need to import equipment, raw materials, or finished goods.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg" data-testid="use-case-cooperatives">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-tsu-gold rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-tsu-green" />
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green">Cooperatives</h3>
                <p className="text-gray-600">
                  Agricultural and trade cooperatives looking to monetize local currency reserves for member benefits.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg" data-testid="use-case-institutions">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-tsu-gold rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-tsu-green" />
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green">Institutions</h3>
                <p className="text-gray-600">
                  Government entities and institutions seeking stable alternatives to volatile local currency holdings.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section>
          <Card className="bg-gradient-to-r from-tsu-gold to-yellow-400 shadow-lg" data-testid="card-cta">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4 text-tsu-green" data-testid="heading-get-started">
                  Ready to Transform Your Currency Holdings?
                </h2>
                <p className="text-tsu-dark-green mb-8 text-lg max-w-2xl mx-auto" data-testid="text-cta-description">
                  Join companies and institutions already converting their local currency into stable, globally accepted Trade Settlement Units.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-tsu-green hover:bg-tsu-dark-green text-white font-semibold px-8 py-3"
                    data-testid="button-convert-currency"
                    onClick={() => setIsConversionModalOpen(true)}
                  >
                    Convert Currency
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-tsu-green bg-transparent text-tsu-green hover:bg-tsu-green hover:text-white font-semibold px-8 py-3"
                    data-testid="button-contact-authority"
                    onClick={() => setIsContactModalOpen(true)}
                  >
                    Contact TSU Authority
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      
      <Footer />
      
      {/* Modals */}
      <CurrencyConversionModal 
        isOpen={isConversionModalOpen} 
        onClose={() => setIsConversionModalOpen(false)} 
      />
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
}