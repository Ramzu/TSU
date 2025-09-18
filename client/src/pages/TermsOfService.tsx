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

export default function TermsOfService() {
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
            <h1 className="text-4xl font-bold text-tsu-green mb-4" data-testid="heading-terms-of-service">
              {getContent('terms-title', 'Terms of Service')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="text-terms-intro">
              {getContent('terms-intro', 'These terms govern your use of the TSU digital wallet platform and related services. By using our platform, you agree to these terms.')}
            </p>
            <p className="text-sm text-gray-500 mt-4" data-testid="text-terms-updated">
              {getContent('terms-updated', 'Last Updated: January 2025')}
            </p>
          </div>

          {/* Acceptance of Terms */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-acceptance">
                {getContent('terms-acceptance-title', 'Acceptance of Terms')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-acceptance">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('terms-acceptance-content', 
                    '<p>By accessing or using the TSU digital wallet platform, you agree to be bound by these Terms of Service and all applicable laws. If you do not agree to these terms, you may not use our services.</p><p>These terms may be updated from time to time. Continued use of the platform constitutes acceptance of any changes.</p>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-service-description">
                {getContent('terms-service-title', 'Service Description')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-service-description">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('terms-service-content', 
                    '<p>TSU provides a digital wallet platform for the Trade Settlement Unit, a reserve-backed digital currency designed for Africa-BRICS trade settlements. Our services include:</p><ul><li>Digital wallet creation and management</li><li>TSU token transactions and transfers</li><li>Commodities and currency program participation</li><li>Transaction history and reporting</li><li>Customer support services</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-user-responsibilities">
                {getContent('terms-responsibilities-title', 'User Responsibilities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-user-responsibilities">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('terms-responsibilities-content', 
                    '<p>As a user of the TSU platform, you agree to:</p><ul><li>Provide accurate and complete information during registration</li><li>Maintain the security of your account credentials</li><li>Comply with all applicable laws and regulations</li><li>Not use the platform for illegal or unauthorized purposes</li><li>Report any suspicious activity or security breaches</li><li>Not attempt to manipulate or compromise the platform</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Activities */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-prohibited-activities">
                {getContent('terms-prohibited-title', 'Prohibited Activities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-prohibited-activities">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('terms-prohibited-content', 
                    '<p>The following activities are strictly prohibited:</p><ul><li>Money laundering or terrorist financing</li><li>Trading with sanctioned entities or individuals</li><li>Fraudulent transactions or misrepresentation</li><li>Unauthorized access to other user accounts</li><li>Attempting to reverse engineer or hack the platform</li><li>Creating multiple accounts to circumvent limits</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Risk Disclosures */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-risk-disclosures">
                {getContent('terms-risks-title', 'Risk Disclosures')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-risk-disclosures">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('terms-risks-content', 
                    '<p>Digital currency transactions involve inherent risks:</p><ul><li>Value fluctuations despite reserve backing</li><li>Regulatory changes that may affect services</li><li>Technology risks including system outages</li><li>Irreversibility of transactions</li><li>Potential loss of access due to forgotten credentials</li></ul><p>You acknowledge these risks and use the platform at your own discretion.</p>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-liability">
                {getContent('terms-liability-title', 'Limitation of Liability')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-liability">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('terms-liability-content', 
                    '<p>TSU\'s liability is limited to the maximum extent permitted by law. We are not liable for:</p><ul><li>Indirect, incidental, or consequential damages</li><li>Loss of profits or business opportunities</li><li>Damages resulting from third-party actions</li><li>Technical failures beyond our control</li><li>Market losses or currency fluctuations</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-termination">
                {getContent('terms-termination-title', 'Account Termination')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-termination">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('terms-termination-content', 
                    '<p>We may suspend or terminate your account if:</p><ul><li>You violate these terms of service</li><li>You engage in prohibited activities</li><li>Required by law or regulatory directive</li><li>To protect the platform or other users</li></ul><p>You may close your account at any time by contacting support. TSU balances will be handled according to applicable regulations.</p>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-terms-contact">
                {getContent('terms-contact-title', 'Contact Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-terms-contact">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('terms-contact-content', 
                    '<p>For questions about these Terms of Service:</p><p><strong>Legal Department</strong><br/>Email: legal@tsunit.com</p>'
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