import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Shield, Users, TrendingUp, Coins, Globe, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import CommodityRegistrationModal from "@/components/CommodityRegistrationModal";
import ContactModal from "@/components/ContactModal";

interface ContentItem {
  key: string;
  title?: string;
  value: string;
  section?: string;
}

export default function Commodities() {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  const { data: content = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const getContent = (key: string, defaultValue: string) => {
    const item = content.find((c) => c.key === key);
    return item?.value || defaultValue;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-tsu-green to-tsu-light-green pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-tsu-gold rounded-full mb-6">
              <Coins className="w-10 h-10 text-tsu-green" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-6" data-testid="heading-commodities-program">
              {getContent('commodities-hero-title', 'TSU Commodities Program')}
            </h1>
            <p className="text-xl text-tsu-gold max-w-3xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
              {getContent('commodities-hero-subtitle', 'Transform your valuable resources into global trade liquidity. Turn unsold commodities into usable Trade Settlement Units backed by real reserves.')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-tsu-gold hover:bg-yellow-400 text-tsu-green font-semibold px-8 py-3"
                data-testid="button-get-started"
              >
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-tsu-green font-semibold px-8 py-3"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
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
                {getContent('commodities-overview-title', 'Unlock the True Value of Your Resources')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-700 leading-relaxed text-center max-w-4xl mx-auto" data-testid="text-overview">
                {getContent('commodities-overview-desc', 'The TSU Commodities Program is designed for producers, exporters, and traders who hold valuable resources but face challenges converting them into stable liquidity. By registering unsold or allocated commodities with the TSU Authority, you gain access to Trade Settlement Units backed by real reserves.')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-tsu-green mb-4" data-testid="heading-how-it-works">
              {getContent('commodities-process-title', 'How It Works')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {getContent('commodities-process-subtitle', 'Simple, secure, and transparent process from commodity registration to TSU access')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow" data-testid="step-register">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-tsu-green font-bold text-xl">1</span>
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green text-lg">Register Your Commodities</h3>
                <p className="text-sm text-gray-600">
                  Submit proof of ownership through allocation contracts, warehouse receipts, or export rights. Independent Trustees verify and secure your assets.
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
                  TSU credits are minted against your registered commodity value. Credits remain locked for 30–60 days while the Authority builds FX and gold reserves.
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
                  During lock-up, TSU is offered to investors and BRICS partners. Proceeds strengthen the reserve pool with gold, foreign currency, and commodities.
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
                  Once reserves are sufficient, your TSU credits unlock. Use them for trade settlements, imports, or convert to other currencies through partner networks.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-tsu-green mb-4" data-testid="heading-benefits">
              Why Choose TSU Commodities Program?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-lg" data-testid="benefit-liquidity">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-tsu-green rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green">Instant Liquidity</h3>
                <p className="text-gray-600">
                  Transform illiquid commodities into usable settlement units without waiting for buyers or market conditions.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg" data-testid="benefit-security">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-tsu-green rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green">Secure & Verified</h3>
                <p className="text-gray-600">
                  Independent trustees and regular audits ensure your commodities are properly secured and reserves are transparent.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg" data-testid="benefit-network">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-tsu-green rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-3 text-tsu-green">Global Network</h3>
                <p className="text-gray-600">
                  Access to BRICS and African trade corridors with growing network of importers, exporters, and financial partners.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Eligible Commodities */}
        <section className="mb-16">
          <Card className="shadow-lg" data-testid="card-eligible-commodities">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green text-center" data-testid="heading-eligible-commodities">
                Eligible Commodities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  "Crude Oil & Petroleum Products",
                  "Gold & Precious Metals", 
                  "Cocoa & Coffee",
                  "Copper & Base Metals",
                  "Agricultural Products",
                  "Natural Gas",
                  "Iron Ore",
                  "Diamonds & Gemstones"
                ].map((commodity, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-tsu-green flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{commodity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <section>
          <Card className="bg-gradient-to-r from-tsu-green to-tsu-light-green text-white shadow-lg" data-testid="card-cta">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4" data-testid="heading-get-started">
                  Ready to Transform Your Commodities?
                </h2>
                <p className="text-tsu-gold mb-8 text-lg max-w-2xl mx-auto" data-testid="text-cta-description">
                  Join producers and traders already converting their resources into global trade liquidity through the TSU Commodities Program.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-tsu-gold hover:bg-yellow-400 text-tsu-green font-semibold px-8 py-3"
                    data-testid="button-register-commodities"
                    onClick={() => setIsRegistrationModalOpen(true)}
                  >
                    Register Commodities
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-tsu-green font-semibold px-8 py-3"
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
      <CommodityRegistrationModal 
        isOpen={isRegistrationModalOpen} 
        onClose={() => setIsRegistrationModalOpen(false)} 
      />
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
}