import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Globe, Zap, Users, BarChart3, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ContentItem {
  key: string;
  title?: string;
  value: string;
  section?: string;
}

export default function Landing() {
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
                src="/attached_assets/TSU_1756057418012.png" 
                alt="TSU Logo" 
                className="w-32 h-32 rounded-full object-cover shadow-2xl"
                data-testid="hero-logo"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" data-testid="hero-title">
              {getContent('hero-title', 'Trade Settlement Unit')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto" data-testid="hero-subtitle">
              {getContent('hero-subtitle', 'The future of Africa-BRICS trade settlements. A stable, reserve-backed digital currency freeing African nations from USD dependence.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-tsu-gold text-tsu-green hover:bg-yellow-400 px-8 py-3 text-lg font-semibold"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-get-started"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-tsu-gold text-tsu-gold hover:bg-tsu-gold hover:text-tsu-green px-8 py-3 text-lg font-semibold"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-learn-more"
              >
                Learn More
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
              {getContent('features-title', 'Why Choose TSU?')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="features-subtitle">
              {getContent('features-subtitle', 'Built for the future of African trade, backed by real reserves and designed for stability.')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="feature-card-1">
              <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-tsu-green" />
              </div>
              <h3 className="text-xl font-semibold text-tsu-green mb-3" data-testid="feature-1-title">
                {getContent('feature-1-title', 'Reserve-Backed Stability')}
              </h3>
              <p className="text-gray-600" data-testid="feature-1-desc">
                {getContent('feature-1-desc', 'Backed by 40% gold, 30% BRICS currencies, 20% African commodities, and 10% African currencies for maximum stability.')}
              </p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="feature-card-2">
              <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-tsu-green" />
              </div>
              <h3 className="text-xl font-semibold text-tsu-green mb-3" data-testid="feature-2-title">
                {getContent('feature-2-title', 'Africa-BRICS Focus')}
              </h3>
              <p className="text-gray-600" data-testid="feature-2-desc">
                {getContent('feature-2-desc', 'Specifically designed to facilitate trade between African nations and BRICS partners, reducing USD dependence.')}
              </p>
            </Card>
            <Card className="text-center p-6 hover:shadow-lg transition-shadow" data-testid="feature-card-3">
              <div className="w-16 h-16 bg-tsu-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-tsu-green" />
              </div>
              <h3 className="text-xl font-semibold text-tsu-green mb-3" data-testid="feature-3-title">
                {getContent('feature-3-title', 'Instant Settlement')}
              </h3>
              <p className="text-gray-600" data-testid="feature-3-desc">
                {getContent('feature-3-desc', 'Fast, secure transactions with immediate settlement for petroleum, gold, and currency exchanges.')}
              </p>
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

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-tsu-gold to-yellow-400" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-tsu-green mb-4" data-testid="cta-title">
            {getContent('cta-title', 'Ready to Join the Future of Trade?')}
          </h2>
          <p className="text-xl text-tsu-dark-green mb-8" data-testid="cta-subtitle">
            {getContent('cta-subtitle', 'Join thousands of businesses already using TSU for seamless Africa-BRICS trade settlements.')}
          </p>
          <Button 
            size="lg" 
            className="bg-tsu-green text-white hover:bg-tsu-dark-green px-8 py-3 text-lg font-semibold"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-create-wallet"
          >
            Create Your Wallet Today
          </Button>
        </div>
      </section>
    </div>
  );
}
