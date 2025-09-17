import { useState } from "react";
import Navigation from "@/components/Navigation";
import SimpleLoginModal from "@/components/SimpleLoginModal";
import ContactModal from "@/components/ContactModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Globe, Zap, Users, BarChart3, Clock, Coins, DollarSign, CheckCircle, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";

interface ContentItem {
  key: string;
  title?: string;
  value: string;
  section?: string;
}

export default function Landing() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');
  const [showContactModal, setShowContactModal] = useState(false);
  const { t } = useTranslation();
  
  const { data: content = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (response: any) => response.data || response, // Handle new response format
  });

  const getContent = (key: string, defaultValue: string) => {
    const item = content.find((c) => c.key === key);
    return item?.value || defaultValue;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-tsu-green to-tsu-light-green min-h-screen flex items-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1577495508048-b635879837f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
        data-testid="hero-section"
      >
        <div className="absolute inset-0 bg-tsu-green bg-opacity-80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src="/tsu-logo.png" 
                alt="TSU Logo" 
                className="w-32 h-32 rounded-full object-cover shadow-2xl"
                data-testid="hero-logo"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" data-testid="hero-title">
              {getContent('hero-title', t('hero.title'))}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-6 max-w-3xl mx-auto" data-testid="hero-subtitle">
              {getContent('hero-subtitle', t('hero.subtitle'))}
            </p>
            
            {/* TSU Value Display */}
            <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-tsu-gold mb-2">{t('hero.currentValue')}</h3>
                <div className="flex justify-center items-center space-x-8 text-white">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-tsu-gold">1 TSU</p>
                    <p className="text-sm opacity-80">{t('hero.tradeUnit')}</p>
                  </div>
                  <div className="text-3xl text-tsu-gold">=</div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">1 USD</p>
                    <p className="text-sm opacity-80">United States Dollar</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-tsu-gold text-tsu-green hover:bg-yellow-400 px-8 py-3 text-lg font-semibold"
                onClick={() => { setLoginModalMode('register'); setShowLoginModal(true); }}
                data-testid="button-get-started"
              >
                {t('hero.getStarted')}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-tsu-gold text-tsu-gold hover:bg-tsu-gold hover:text-tsu-green px-8 py-3 text-lg font-semibold"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-learn-more"
              >
                {t('hero.learnMore')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-tsu-green mb-4" data-testid="features-title">
              {getContent('features-title', t('features.title'))}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="features-subtitle">
              {getContent('features-subtitle', t('features.subtitle'))}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="feature-card-1">
              <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-tsu-green" />
              </div>
              <h3 className="text-xl font-semibold text-tsu-green mb-3" data-testid="feature-1-title">
                {getContent('feature-1-title', t('features.reserve.title'))}
              </h3>
              <p className="text-gray-600" data-testid="feature-1-desc">
                {getContent('feature-1-desc', t('features.reserve.desc'))}
              </p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="feature-card-2">
              <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-tsu-green" />
              </div>
              <h3 className="text-xl font-semibold text-tsu-green mb-3" data-testid="feature-2-title">
                {getContent('feature-2-title', t('features.trade.title'))}
              </h3>
              <p className="text-gray-600" data-testid="feature-2-desc">
                {getContent('feature-2-desc', t('features.trade.desc'))}
              </p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="feature-card-3">
              <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-tsu-green" />
              </div>
              <h3 className="text-xl font-semibold text-tsu-green mb-3" data-testid="feature-3-title">
                {getContent('feature-3-title', t('features.stable.title'))}
              </h3>
              <p className="text-gray-600" data-testid="feature-3-desc">
                {getContent('feature-3-desc', t('features.stable.desc'))}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-gray-50" data-testid="programs-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-tsu-green mb-4" data-testid="programs-title">
              Transform Your Assets with TSU
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="programs-subtitle">
              Unlock the true value of your resources and currencies through our comprehensive programs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Commodities Program */}
            <Card className="shadow-lg bg-gradient-to-br from-tsu-green to-tsu-light-green text-white border-tsu-dark-green p-8" data-testid="landing-commodities-program-card">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="h-8 w-8 text-tsu-green" />
                </div>
                <h3 className="text-2xl font-semibold text-tsu-gold" data-testid="commodities-program-title">
                  Commodities Program
                </h3>
              </div>
              <p className="text-white/90 mb-6 text-center">
                Transform your valuable resources into global trade liquidity. Register commodities like oil, gold, cocoa, and copper to access Trade Settlement Units backed by real reserves.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-tsu-gold flex-shrink-0" />
                  <span className="text-white">Turn unsold assets into usable settlement units</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-tsu-gold flex-shrink-0" />
                  <span className="text-white">Access to BRICS and African trade corridors</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-tsu-gold flex-shrink-0" />
                  <span className="text-white">Independent verification and security</span>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = '/commodities'}
                className="w-full bg-tsu-gold hover:bg-yellow-400 text-tsu-green font-semibold py-3"
                data-testid="button-landing-commodities-program"
              >
                Explore Commodities Program
              </Button>
            </Card>

            {/* Currency Program */}
            <Card className="shadow-lg bg-gradient-to-br from-tsu-gold to-yellow-400 text-tsu-green border-tsu-gold p-8" data-testid="landing-currency-program-card">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-tsu-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-tsu-gold" />
                </div>
                <h3 className="text-2xl font-semibold text-tsu-green" data-testid="currency-program-title">
                  Currency Program
                </h3>
              </div>
              <p className="text-tsu-dark-green mb-6 text-center">
                Convert illiquid local currency into stable, usable Trade Settlement Units. Transform trapped funds into global trade power across Africa and BRICS networks.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-tsu-green flex-shrink-0" />
                  <span className="text-tsu-dark-green">Monetize idle local currency holdings</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-tsu-green flex-shrink-0" />
                  <span className="text-tsu-dark-green">Secure imports without USD bottlenecks</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-tsu-green flex-shrink-0" />
                  <span className="text-tsu-dark-green">Stable value backed by gold and FX reserves</span>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = '/currency'}
                className="w-full bg-tsu-green hover:bg-tsu-dark-green text-white font-semibold py-3"
                data-testid="button-landing-currency-program"
              >
                Explore Currency Program
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-tsu-green" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold text-tsu-gold mb-2" data-testid="stat-trade-volume">Coming Soon</div>
              <div className="text-lg">Trade Volume</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold text-tsu-gold mb-2" data-testid="stat-partner-nations">54</div>
              <div className="text-lg">Partner Nations</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold text-tsu-gold mb-2" data-testid="stat-uptime">99.9%</div>
              <div className="text-lg">Uptime</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold text-tsu-gold mb-2" data-testid="stat-support">24/7</div>
              <div className="text-lg">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white" data-testid="about-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-tsu-green mb-6" data-testid="about-title">
              {getContent('about-title', 'About the Trade Settlement Unit')}
            </h2>
            <p className="text-xl text-gray-600" data-testid="about-intro">
              {getContent('about-intro', 'A revolutionary approach to African-BRICS trade settlements')}
            </p>
          </div>

          <div className="space-y-12">
            <Card className="p-8 bg-gray-50" data-testid="problem-card">
              <h3 className="text-2xl font-semibold text-tsu-green mb-4" data-testid="problem-title">
                {getContent('problem-title', 'The Problem')}
              </h3>
              <p className="text-gray-700 leading-relaxed" data-testid="problem-desc">
                {getContent('problem-desc', 'USD dependence exposes African nations to sanctions, high transaction costs, and currency volatility. Traditional banking systems create barriers to efficient trade settlements between Africa and BRICS partners.')}
              </p>
            </Card>

            <Card className="p-8 bg-tsu-green text-white" data-testid="solution-card">
              <h3 className="text-2xl font-semibold text-tsu-gold mb-4" data-testid="solution-title">
                {getContent('solution-title', 'Our Solution')}
              </h3>
              <p className="leading-relaxed" data-testid="solution-desc">
                {getContent('solution-desc', 'TSU is a centralized CBDC-style digital currency, pegged to a diversified basket of reserves. Starting with petroleum exports to Africa, TSU provides immediate real-world utility while building trust and adoption across the continent.')}
              </p>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 bg-gray-50" data-testid="governance-card">
                <h4 className="text-xl font-semibold text-tsu-green mb-3" data-testid="governance-title">
                  {getContent('governance-title', 'Governance')}
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Independent Issuing Authority</li>
                  <li>• Reserve Trustee oversight</li>
                  <li>• Regular independent audits</li>
                  <li>• Transparent reserve reporting</li>
                </ul>
              </Card>
              <Card className="p-6 bg-gray-50" data-testid="technology-card">
                <h4 className="text-xl font-semibold text-tsu-green mb-3" data-testid="technology-title">
                  {getContent('technology-title', 'Technology')}
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Secure centralized ledger</li>
                  <li>• Mobile and USSD wallet access</li>
                  <li>• FX integration with BRICS rails</li>
                  <li>• Real-time settlement capability</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trade Settlement Authority Section */}
      <section className="py-16 bg-gray-50" data-testid="tsa-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-tsu-green mb-6" data-testid="tsa-title">
              {getContent('tsa-title', 'About Trade Settlement Authority (TSA)')}
            </h2>
          </div>

          <Card className="p-8 bg-white shadow-lg" data-testid="tsa-card">
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed" data-testid="tsa-description">
              {getContent('tsa-description', `The Trade Settlement Authority (TSA) is an independent trust-based institution created to solve Africa and BRICS' long-standing trade finance and foreign exchange challenges. TSA issues the Trade Settlement Unit (TSU) — a reserve-backed digital settlement instrument — and operates programs that unlock local currencies, commodity contracts, and trade flows into stable, usable liquidity.

Through its Currency Program, Commodities Program, and Beneficiary Program, TSA helps companies, governments, and citizens access fair settlement mechanisms outside of dollar bottlenecks and sanctions. TSA's mission is to expand trade corridors, strengthen financial sovereignty, and ensure that the benefits of global trade are shared across communities in Africa, the BRICS alliance, and the wider Afrodescendant diaspora.`)}
            </div>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-tsu-gold to-yellow-400" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-tsu-green mb-4" data-testid="cta-title">
            {getContent('cta-title', 'Ready to Join the Future of Trade?')}
          </h2>
          <p className="text-xl text-tsu-dark-green mb-8" data-testid="cta-subtitle">
            {getContent('cta-subtitle', 'Join thousands of businesses already using TSU for seamless Africa-BRICS trade settlements.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-tsu-green text-white hover:bg-tsu-dark-green px-8 py-3 text-lg font-semibold"
              onClick={() => { setLoginModalMode('register'); setShowLoginModal(true); }}
              data-testid="button-create-wallet"
            >
              {t('hero.getStarted')}
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-tsu-green text-tsu-green hover:bg-tsu-green hover:text-white px-8 py-3 text-lg font-semibold"
              onClick={() => setShowContactModal(true)}
              data-testid="button-contact-us"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Contact Us
            </Button>
          </div>
        </div>
      </section>
      
      {/* Login Modal */}
      <SimpleLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} mode={loginModalMode} />
      
      {/* Contact Modal */}
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
      
      <Footer />
    </div>
  );
}
