import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ContentItem {
  id: string;
  key: string;
  title?: string;
  value: string;
  section?: string;
}

interface ContentEditorProps {
  onClose: () => void;
}

export default function ContentEditor({ onClose }: ContentEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: content = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content", Date.now()], // Force fresh fetch
    staleTime: 0,
    gcTime: 0,
    select: (response: any) => response.data || response, // Handle new response format
  });

  const form = useForm({
    defaultValues: {
      'hero-title': 'Trade Settlement Unit',
      'hero-subtitle': 'The future of Africa-BRICS trade settlements. A stable, reserve-backed digital currency freeing African nations from USD dependence.',
      'features-title': 'Why Choose TSU?',
      'features-subtitle': 'Built for the future of African trade, backed by real reserves and designed for stability.',
      'feature-1-title': 'Reserve-Backed Stability',
      'feature-1-desc': 'Backed by 40% gold, 30% BRICS currencies, 20% African commodities, and 10% African currencies for maximum stability.',
      'feature-2-title': 'Africa-BRICS Focus',
      'feature-2-desc': 'Specifically designed to facilitate trade between African nations and BRICS partners, reducing USD dependence.',
      'feature-3-title': 'Instant Settlement',
      'feature-3-desc': 'Fast, secure transactions with immediate settlement for petroleum, gold, and currency exchanges.',
      'about-title': 'About the Trade Settlement Unit',
      'about-intro': 'A revolutionary approach to African-BRICS trade settlements',
      'problem-title': 'The Problem',
      'problem-desc': 'USD dependence exposes African nations to sanctions, high transaction costs, and currency volatility. Traditional banking systems create barriers to efficient trade settlements between Africa and BRICS partners.',
      'solution-title': 'Our Solution',
      'solution-desc': 'TSU is a centralized CBDC-style digital currency, pegged to a diversified basket of reserves. Starting with petroleum exports to Africa, TSU provides immediate real-world utility while building trust and adoption across the continent.',
      'cta-title': 'Ready to Join the Future of Trade?',
      'cta-subtitle': 'Join thousands of businesses already using TSU for seamless Africa-BRICS trade settlements.',
      // Commodities Program Content
      'commodities-hero-title': 'TSU Commodities Program',
      'commodities-hero-subtitle': 'Transform your valuable resources into global trade liquidity. Turn unsold commodities into usable Trade Settlement Units backed by real reserves.',
      'commodities-overview-title': 'Unlock the True Value of Your Resources',
      'commodities-overview-desc': 'The TSU Commodities Program is designed for producers, exporters, and traders who hold valuable resources but face challenges converting them into stable liquidity. By registering unsold or allocated commodities with the TSU Authority, you gain access to Trade Settlement Units backed by real reserves.',
      'commodities-process-title': 'How It Works',
      'commodities-process-subtitle': 'Simple, secure, and transparent process from commodity registration to TSU access',
      // Currency Program Content
      'currency-hero-title': 'TSU Currency Program',
      'currency-hero-subtitle': 'Transform illiquid local currency into stable, usable Trade Settlement Units. Convert trapped funds into global trade power across Africa and BRICS networks.',
      'currency-overview-title': 'Transform Local Currency Into Global Trade Power',
      'currency-overview-problem': 'Many companies, cooperatives, and governments hold large balances of local currency that are hard to redeem for USD or other foreign exchange. Inflation, capital controls, and liquidity shortages mean those funds often sit idle while businesses struggle to import critical goods.',
      'currency-overview-solution': 'The TSU Currency Program solves this problem by converting illiquid local currency into Trade Settlement Units — a stable, reserve-backed settlement instrument usable across Africa and BRICS trade corridors.',
      'currency-process-title': 'How It Works',
      'currency-process-subtitle': 'Simple conversion process from local currency to globally accepted TSU',
      // Privacy Policy Content
      'privacy-title': 'Privacy Policy',
      'privacy-intro': 'Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use the TSU digital wallet platform.',
      'privacy-updated': 'Last Updated: January 2025',
      'privacy-collection-title': 'Information We Collect',
      'privacy-collection-content': '<p>We collect information necessary to provide secure digital wallet services:</p><ul><li><strong>Personal Information:</strong> Name, email address, phone number, and verification documents</li><li><strong>Transaction Data:</strong> Details of TSU transactions, wallet balances, and trading activity</li><li><strong>Technical Data:</strong> IP address, device information, and usage analytics</li><li><strong>Communication Data:</strong> Support inquiries and correspondence</li></ul>',
      'privacy-use-title': 'How We Use Your Information',
      'privacy-use-content': '<p>Your information is used to:</p><ul><li>Process transactions and maintain wallet functionality</li><li>Verify identity and comply with regulatory requirements</li><li>Provide customer support and respond to inquiries</li><li>Improve our services and detect fraudulent activity</li><li>Send important updates about your account and services</li></ul>',
      'privacy-security-title': 'Data Security',
      'privacy-security-content': '<p>We implement robust security measures to protect your information:</p><ul><li>End-to-end encryption for all transactions</li><li>Multi-factor authentication requirements</li><li>Regular security audits and penetration testing</li><li>Secure data centers with 24/7 monitoring</li><li>Employee background checks and access controls</li></ul>',
      'privacy-sharing-title': 'Information Sharing',
      'privacy-sharing-content': '<p>We do not sell your personal information. We may share data only when:</p><ul><li>Required by law or regulatory authorities</li><li>Necessary to prevent fraud or security threats</li><li>With trusted service providers under strict confidentiality agreements</li><li>In connection with business transfers (with user notification)</li></ul>',
      'privacy-rights-title': 'Your Rights',
      'privacy-rights-content': '<p>You have the right to:</p><ul><li>Access and review your personal information</li><li>Request corrections to inaccurate data</li><li>Request deletion of your data (subject to legal requirements)</li><li>Opt out of non-essential communications</li><li>Receive a copy of your data in a portable format</li></ul>',
      'privacy-contact-title': 'Contact Us',
      'privacy-contact-content': '<p>For questions about this Privacy Policy or your data:</p><p><strong>Privacy Officer</strong><br/>Email: privacy@tsu-wallet.com<br/>Address: TSU Authority Privacy Office<br/>Phone: +1-555-TSU-PRVCY</p>',
      // Terms of Service Content
      'terms-title': 'Terms of Service',
      'terms-intro': 'These terms govern your use of the TSU digital wallet platform and related services. By using our platform, you agree to these terms.',
      'terms-updated': 'Last Updated: January 2025',
      'terms-acceptance-title': 'Acceptance of Terms',
      'terms-acceptance-content': '<p>By accessing or using the TSU digital wallet platform, you agree to be bound by these Terms of Service and all applicable laws. If you do not agree to these terms, you may not use our services.</p><p>These terms may be updated from time to time. Continued use of the platform constitutes acceptance of any changes.</p>',
      'terms-service-title': 'Service Description',
      'terms-service-content': '<p>TSU provides a digital wallet platform for the Trade Settlement Unit, a reserve-backed digital currency designed for Africa-BRICS trade settlements. Our services include:</p><ul><li>Digital wallet creation and management</li><li>TSU token transactions and transfers</li><li>Commodities and currency program participation</li><li>Transaction history and reporting</li><li>Customer support services</li></ul>',
      'terms-responsibilities-title': 'User Responsibilities',
      'terms-responsibilities-content': '<p>As a user of the TSU platform, you agree to:</p><ul><li>Provide accurate and complete information during registration</li><li>Maintain the security of your account credentials</li><li>Comply with all applicable laws and regulations</li><li>Not use the platform for illegal or unauthorized purposes</li><li>Report any suspicious activity or security breaches</li><li>Not attempt to manipulate or compromise the platform</li></ul>',
      'terms-prohibited-title': 'Prohibited Activities',
      'terms-prohibited-content': '<p>The following activities are strictly prohibited:</p><ul><li>Money laundering or terrorist financing</li><li>Trading with sanctioned entities or individuals</li><li>Fraudulent transactions or misrepresentation</li><li>Unauthorized access to other user accounts</li><li>Attempting to reverse engineer or hack the platform</li><li>Creating multiple accounts to circumvent limits</li></ul>',
      'terms-risks-title': 'Risk Disclosures',
      'terms-risks-content': '<p>Digital currency transactions involve inherent risks:</p><ul><li>Value fluctuations despite reserve backing</li><li>Regulatory changes that may affect services</li><li>Technology risks including system outages</li><li>Irreversibility of transactions</li><li>Potential loss of access due to forgotten credentials</li></ul><p>You acknowledge these risks and use the platform at your own discretion.</p>',
      'terms-liability-title': 'Limitation of Liability',
      'terms-liability-content': '<p>TSU\'s liability is limited to the maximum extent permitted by law. We are not liable for:</p><ul><li>Indirect, incidental, or consequential damages</li><li>Loss of profits or business opportunities</li><li>Damages resulting from third-party actions</li><li>Technical failures beyond our control</li><li>Market losses or currency fluctuations</li></ul>',
      'terms-termination-title': 'Account Termination',
      'terms-termination-content': '<p>We may suspend or terminate your account if:</p><ul><li>You violate these terms of service</li><li>You engage in prohibited activities</li><li>Required by law or regulatory directive</li><li>To protect the platform or other users</li></ul><p>You may close your account at any time by contacting support. TSU balances will be handled according to applicable regulations.</p>',
      'terms-contact-title': 'Contact Information',
      'terms-contact-content': '<p>For questions about these Terms of Service:</p><p><strong>Legal Department</strong><br/>Email: legal@tsu-wallet.com<br/>Address: TSU Authority Legal Office<br/>Phone: +1-555-TSU-LEGAL</p>',
      // Monthly Audit Reports Content
      'audit-title': 'Monthly Audit Reports',
      'audit-intro': 'Transparency and accountability are core to TSU operations. Our monthly audit reports provide detailed insights into reserve backing, transaction volumes, and platform security.',
      'audit-overview-title': 'Audit Overview',
      'audit-overview-content': '<p>Our monthly audits are conducted by independent certified public accounting firms and include:</p><ul><li><strong>Reserve Verification:</strong> Confirmation of gold, BRICS currencies, and commodity backing</li><li><strong>Transaction Analysis:</strong> Volume, geographic distribution, and settlement patterns</li><li><strong>Security Assessment:</strong> Platform integrity, user protection measures, and compliance status</li><li><strong>Financial Health:</strong> TSU circulation, redemption ratios, and reserve adequacy</li></ul>',
      'audit-status-title': 'Current Audit Status',
      'audit-reserve-ratio': '127%',
      'audit-reserve-label': 'Reserve Coverage Ratio',
      'audit-circulation': '847,293 TSU',
      'audit-circulation-label': 'Total Circulation',
      'audit-status-content': '<p>Latest audit period: <strong>December 2024</strong></p><p>All reserve requirements exceeded with full regulatory compliance maintained. No material weaknesses identified in internal controls or security systems.</p>',
      'audit-archive-title': 'Reports Archive',
      'audit-archive-intro': '<p>Access historical audit reports to track TSU\'s performance and transparency over time. All reports are independently verified and digitally signed.</p>',
      'audit-archive-note': 'Reports older than 12 months are archived. Contact our compliance team for historical reports beyond this period.',
      'audit-standards-title': 'Audit Standards & Methodology',
      'audit-standards-content': '<p>Our audits follow internationally recognized standards:</p><ul><li><strong>GAAP Compliance:</strong> Generally Accepted Accounting Principles</li><li><strong>IFRS Standards:</strong> International Financial Reporting Standards</li><li><strong>SOC 2 Type II:</strong> Security and availability controls</li><li><strong>ISO 27001:</strong> Information security management</li><li><strong>Regulatory Requirements:</strong> Central bank and financial authority guidelines</li></ul><p>All auditing firms are rotated every three years to maintain independence and objectivity.</p>',
      'audit-contact-title': 'Questions About Our Audits?',
      'audit-contact-content': '<p>For inquiries about audit procedures, historical reports, or compliance questions:</p><p><strong>Compliance & Audit Team</strong><br/>Email: audits@tsu-wallet.com<br/>Address: TSU Authority Compliance Office<br/>Phone: +1-555-TSU-AUDIT</p><p>Public audit announcements and notifications are posted on our official channels and regulatory filings.</p>',
    },
  });

  // Update form with existing content when data loads
  useEffect(() => {
    if (content.length > 0) {
      const contentMap = content.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
      
      form.reset(contentMap);
    }
  }, [content, form]);

  const saveContentMutation = useMutation({
    mutationFn: async (formData: Record<string, string>) => {
      // Save each content item individually
      const promises = Object.entries(formData).map(([key, value]) =>
        apiRequest("POST", "/api/content", {
          key,
          value,
          section: getSectionForKey(key),
        })
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Content Saved",
        description: "All content has been successfully updated.",
      });
      
      // Invalidate content query to refresh landing page
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getSectionForKey = (key: string): string => {
    if (key.startsWith('hero-')) return 'hero';
    if (key.startsWith('features-') || key.startsWith('feature-')) return 'features';
    if (key.startsWith('about-') || key.startsWith('problem-') || key.startsWith('solution-')) return 'about';
    if (key.startsWith('cta-')) return 'cta';
    if (key.startsWith('commodities-')) return 'commodities';
    if (key.startsWith('currency-')) return 'currency';
    if (key.startsWith('privacy-')) return 'privacy';
    if (key.startsWith('terms-')) return 'terms';
    if (key.startsWith('audit-')) return 'audit';
    return 'general';
  };

  const handleSubmit = (data: Record<string, string>) => {
    saveContentMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-tsu-green">Loading content editor...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="content-editor">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-tsu-green" data-testid="editor-title">
            Content Editor
          </DialogTitle>
          <p className="text-gray-600">Edit landing page content and messaging</p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-tsu-green">Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hero-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-hero-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hero-subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-hero-subtitle" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Features Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-tsu-green">Features Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="features-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-features-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="features-subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Subtitle</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-features-subtitle" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Separator />
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="feature-1-title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feature 1 Title</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-feature-1-title" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="feature-1-desc"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>Feature 1 Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-feature-1-desc" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="feature-2-title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feature 2 Title</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-feature-2-title" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="feature-2-desc"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>Feature 2 Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-feature-2-desc" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="feature-3-title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feature 3 Title</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-feature-3-title" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="feature-3-desc"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>Feature 3 Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="textarea-feature-3-desc" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-tsu-green">About Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="about-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-about-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="about-intro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Introduction</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-about-intro" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="problem-title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Problem Title</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-problem-title" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="problem-desc"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>Problem Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} data-testid="textarea-problem-desc" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <FormField
                      control={form.control}
                      name="solution-title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Solution Title</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-solution-title" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="solution-desc"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>Solution Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} data-testid="textarea-solution-desc" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-tsu-green">Call to Action Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="cta-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-cta-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cta-subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA Subtitle</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-cta-subtitle" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Commodities Program Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-tsu-green">Commodities Program Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="commodities-hero-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-commodities-hero-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commodities-hero-subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Subtitle</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-commodities-hero-subtitle" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commodities-overview-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overview Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-commodities-overview-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commodities-overview-desc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overview Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} data-testid="textarea-commodities-overview-desc" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commodities-process-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Process Section Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-commodities-process-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commodities-process-subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Process Section Subtitle</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-commodities-process-subtitle" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Currency Program Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-tsu-green">Currency Program Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currency-hero-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-currency-hero-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency-hero-subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero Subtitle</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-currency-hero-subtitle" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency-overview-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overview Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-currency-overview-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency-overview-problem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Statement</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} data-testid="textarea-currency-overview-problem" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency-overview-solution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solution Statement</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-currency-overview-solution" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency-process-title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Process Section Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-currency-process-title" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency-process-subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Process Section Subtitle</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-currency-process-subtitle" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saveContentMutation.isPending}
                data-testid="button-cancel-content"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveContentMutation.isPending}
                className="bg-tsu-green hover:bg-tsu-light-green"
                data-testid="button-save-content"
              >
                {saveContentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
