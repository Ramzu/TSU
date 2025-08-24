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
    queryKey: ["/api/content"],
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
