import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";

interface ContentItem {
  key: string;
  title?: string;
  value: string;
  section?: string;
}

export default function PrivacyPolicy() {
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
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-tsu-green mb-4" data-testid="heading-privacy-policy">
              {getContent('privacy-title', 'Privacy Policy')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="text-privacy-intro">
              {getContent('privacy-intro', 'Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use the TSU digital wallet platform.')}
            </p>
            <p className="text-sm text-gray-500 mt-4" data-testid="text-privacy-updated">
              {getContent('privacy-updated', 'Last Updated: January 2025')}
            </p>
          </div>

          {/* Information Collection */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-info-collection">
                {getContent('privacy-collection-title', 'Information We Collect')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-info-collection">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('privacy-collection-content', 
                    '<p>We collect information necessary to provide secure digital wallet services:</p><ul><li><strong>Personal Information:</strong> Name, email address, phone number, and verification documents</li><li><strong>Transaction Data:</strong> Details of TSU transactions, wallet balances, and trading activity</li><li><strong>Technical Data:</strong> IP address, device information, and usage analytics</li><li><strong>Communication Data:</strong> Support inquiries and correspondence</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-info-use">
                {getContent('privacy-use-title', 'How We Use Your Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-info-use">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('privacy-use-content', 
                    '<p>Your information is used to:</p><ul><li>Process transactions and maintain wallet functionality</li><li>Verify identity and comply with regulatory requirements</li><li>Provide customer support and respond to inquiries</li><li>Improve our services and detect fraudulent activity</li><li>Send important updates about your account and services</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-data-security">
                {getContent('privacy-security-title', 'Data Security')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-data-security">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('privacy-security-content', 
                    '<p>We implement robust security measures to protect your information:</p><ul><li>End-to-end encryption for all transactions</li><li>Multi-factor authentication requirements</li><li>Regular security audits and penetration testing</li><li>Secure data centers with 24/7 monitoring</li><li>Employee background checks and access controls</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-data-sharing">
                {getContent('privacy-sharing-title', 'Information Sharing')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-data-sharing">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('privacy-sharing-content', 
                    '<p>We do not sell your personal information. We may share data only when:</p><ul><li>Required by law or regulatory authorities</li><li>Necessary to prevent fraud or security threats</li><li>With trusted service providers under strict confidentiality agreements</li><li>In connection with business transfers (with user notification)</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-user-rights">
                {getContent('privacy-rights-title', 'Your Rights')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-user-rights">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('privacy-rights-content', 
                    '<p>You have the right to:</p><ul><li>Access and review your personal information</li><li>Request corrections to inaccurate data</li><li>Request deletion of your data (subject to legal requirements)</li><li>Opt out of non-essential communications</li><li>Receive a copy of your data in a portable format</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-privacy-contact">
                {getContent('privacy-contact-title', 'Contact Us')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-privacy-contact">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('privacy-contact-content', 
                    '<p>For questions about this Privacy Policy or your data:</p><p><strong>Privacy Officer</strong><br/>Email: privacy@tsu-wallet.com<br/>Address: TSU Authority Privacy Office<br/>Phone: +1-555-TSU-PRVCY</p>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}