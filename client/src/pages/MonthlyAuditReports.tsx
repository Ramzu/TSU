import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Calendar, Shield } from "lucide-react";

interface ContentItem {
  key: string;
  title?: string;
  value: string;
  section?: string;
}

export default function MonthlyAuditReports() {
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
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-tsu-green rounded-full mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-tsu-green mb-4" data-testid="heading-audit-reports">
              {getContent('audit-title', 'Monthly Audit Reports')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="text-audit-intro">
              {getContent('audit-intro', 'Transparency and accountability are core to TSU operations. Our monthly audit reports provide detailed insights into reserve backing, transaction volumes, and platform security.')}
            </p>
          </div>

          {/* Audit Overview */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green flex items-center gap-2" data-testid="heading-audit-overview">
                <Shield className="w-6 h-6" />
                {getContent('audit-overview-title', 'Audit Overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-audit-overview">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('audit-overview-content', 
                    '<p>Our monthly audits are conducted by independent certified public accounting firms and include:</p><ul><li><strong>Reserve Verification:</strong> Confirmation of gold, BRICS currencies, and commodity backing</li><li><strong>Transaction Analysis:</strong> Volume, geographic distribution, and settlement patterns</li><li><strong>Security Assessment:</strong> Platform integrity, user protection measures, and compliance status</li><li><strong>Financial Health:</strong> TSU circulation, redemption ratios, and reserve adequacy</li></ul>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-current-status">
                {getContent('audit-status-title', 'Current Audit Status')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-4 bg-tsu-light-green/10 rounded-lg">
                  <div className="text-3xl font-bold text-tsu-green mb-2" data-testid="text-reserve-ratio">
                    {getContent('audit-reserve-ratio', '127%')}
                  </div>
                  <div className="text-sm text-gray-600" data-testid="text-reserve-label">
                    {getContent('audit-reserve-label', 'Reserve Coverage Ratio')}
                  </div>
                </div>
                <div className="text-center p-4 bg-tsu-gold/10 rounded-lg">
                  <div className="text-3xl font-bold text-tsu-green mb-2" data-testid="text-circulation">
                    {getContent('audit-circulation', '847,293 TSU')}
                  </div>
                  <div className="text-sm text-gray-600" data-testid="text-circulation-label">
                    {getContent('audit-circulation-label', 'Total Circulation')}
                  </div>
                </div>
              </div>
              <div className="prose max-w-none" data-testid="text-current-status">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('audit-status-content', 
                    '<p>Latest audit period: <strong>December 2024</strong></p><p>All reserve requirements exceeded with full regulatory compliance maintained. No material weaknesses identified in internal controls or security systems.</p>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Reports Archive */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green flex items-center gap-2" data-testid="heading-reports-archive">
                <Calendar className="w-6 h-6" />
                {getContent('audit-archive-title', 'Reports Archive')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-6" data-testid="text-archive-intro">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('audit-archive-intro', 
                    '<p>Access historical audit reports to track TSU\'s performance and transparency over time. All reports are independently verified and digitally signed.</p>'
                  )
                }} />
              </div>
              
              <div className="space-y-4">
                {/* Sample Reports - This would typically be dynamic data */}
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors" data-testid="report-december-2024">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-tsu-green" />
                    <div>
                      <h3 className="font-semibold text-gray-900">December 2024 Audit Report</h3>
                      <p className="text-sm text-gray-600">Comprehensive monthly audit - Published Jan 15, 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Latest</Badge>
                    <Button size="sm" variant="outline" className="gap-2" data-testid="button-download-december">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors" data-testid="report-november-2024">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-tsu-green" />
                    <div>
                      <h3 className="font-semibold text-gray-900">November 2024 Audit Report</h3>
                      <p className="text-sm text-gray-600">Monthly audit - Published Dec 15, 2024</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2" data-testid="button-download-november">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors" data-testid="report-october-2024">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-tsu-green" />
                    <div>
                      <h3 className="font-semibold text-gray-900">October 2024 Audit Report</h3>
                      <p className="text-sm text-gray-600">Monthly audit - Published Nov 15, 2024</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2" data-testid="button-download-october">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800" data-testid="text-archive-note">
                  {getContent('audit-archive-note', 'Reports older than 12 months are archived. Contact our compliance team for historical reports beyond this period.')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Audit Standards */}
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-audit-standards">
                {getContent('audit-standards-title', 'Audit Standards & Methodology')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-audit-standards">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('audit-standards-content', 
                    '<p>Our audits follow internationally recognized standards:</p><ul><li><strong>GAAP Compliance:</strong> Generally Accepted Accounting Principles</li><li><strong>IFRS Standards:</strong> International Financial Reporting Standards</li><li><strong>SOC 2 Type II:</strong> Security and availability controls</li><li><strong>ISO 27001:</strong> Information security management</li><li><strong>Regulatory Requirements:</strong> Central bank and financial authority guidelines</li></ul><p>All auditing firms are rotated every three years to maintain independence and objectivity.</p>'
                  )
                }} />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-tsu-green" data-testid="heading-audit-contact">
                {getContent('audit-contact-title', 'Questions About Our Audits?')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none" data-testid="text-audit-contact">
                <div dangerouslySetInnerHTML={{ 
                  __html: getContent('audit-contact-content', 
                    '<p>For inquiries about audit procedures, historical reports, or compliance questions:</p><p><strong>Compliance & Audit Team</strong><br/>Email: audits@tsu-wallet.com<br/>Address: TSU Authority Compliance Office<br/>Phone: +1-555-TSU-AUDIT</p><p>Public audit announcements and notifications are posted on our official channels and regulatory filings.</p>'
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