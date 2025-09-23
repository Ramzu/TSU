import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Save, RefreshCw, Globe, Share2, Upload, Image } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const metadataSchema = z.object({
  title: z.string().min(1, "Title is required").max(60, "Title should be under 60 characters"),
  description: z.string().min(1, "Description is required").max(160, "Description should be under 160 characters"),
  keywords: z.string().optional(),
  ogImage: z.string().regex(/^(https?:\/\/|\/|$).*$/, "Must be a valid URL or site-relative path").optional().or(z.literal("")),
  ogType: z.string().default("website"),
  ogUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitterCard: z.enum(["summary", "summary_large_image"]).default("summary_large_image"),
  siteName: z.string().min(1, "Site name is required"),
  fbAppId: z.string().optional(),
});

type MetadataFormData = z.infer<typeof metadataSchema>;

export default function MetadataEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: metadata, isLoading } = useQuery({
    queryKey: ["/api/admin/metadata"],
    retry: false,
  });

  const form = useForm<MetadataFormData>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      title: "TSU - Trade Settlement Unit | Africa-BRICS Digital Currency",
      description: "The future of Africa-BRICS trade settlements. A stable, reserve-backed digital currency freeing African nations from USD dependence.",
      keywords: "TSU, Trade Settlement Unit, digital currency, Africa, BRICS, cryptocurrency, wallet, blockchain, reserve-backed",
      ogImage: "/tsu-logo.png",
      ogType: "website",
      ogUrl: "",
      twitterCard: "summary_large_image",
      siteName: "TSU",
      fbAppId: "966242223397117",
    },
  });

  // Function to update meta tags in document head
  const updateMetaTags = (data: MetadataFormData) => {
    // Update page title
    document.title = data.title;

    // Helper function to update or create meta tag
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('fb:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update basic meta tags
    updateMetaTag('title', data.title);
    updateMetaTag('description', data.description);
    if (data.keywords) updateMetaTag('keywords', data.keywords);

    // Update Open Graph tags
    updateMetaTag('og:type', data.ogType || 'website');
    updateMetaTag('og:title', data.title);
    updateMetaTag('og:description', data.description);
    updateMetaTag('og:site_name', data.siteName);
    if (data.fbAppId) updateMetaTag('fb:app_id', data.fbAppId);

    // Update og:url (use current URL if not specified)
    const ogUrl = data.ogUrl || window.location.href;
    updateMetaTag('og:url', ogUrl);

    // Update og:image (convert relative paths to absolute)
    if (data.ogImage) {
      const imageUrl = data.ogImage.startsWith('http') 
        ? data.ogImage 
        : `${window.location.origin}${data.ogImage.startsWith('/') ? '' : '/'}${data.ogImage}`;
      updateMetaTag('og:image', imageUrl);
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
      updateMetaTag('og:image:type', 'image/jpeg');
    }

    // Update Twitter Card tags
    updateMetaTag('twitter:card', data.twitterCard);
    updateMetaTag('twitter:title', data.title);
    updateMetaTag('twitter:description', data.description);
    updateMetaTag('twitter:url', ogUrl);
    if (data.ogImage) {
      const imageUrl = data.ogImage.startsWith('http') 
        ? data.ogImage 
        : `${window.location.origin}${data.ogImage.startsWith('/') ? '' : '/'}${data.ogImage}`;
      updateMetaTag('twitter:image', imageUrl);
    }
  };

  useEffect(() => {
    if (metadata && typeof metadata === 'object') {
      const metadataValues = {
        title: (metadata as any).title || "",
        description: (metadata as any).description || "",
        keywords: (metadata as any).keywords || "",
        ogImage: (metadata as any).ogImage || "",
        ogType: (metadata as any).ogType || "website",
        ogUrl: (metadata as any).ogUrl || "",
        twitterCard: (metadata as any).twitterCard || "summary_large_image",
        siteName: (metadata as any).siteName || "TSU",
        fbAppId: (metadata as any).fbAppId || "966242223397117",
      };
      form.reset(metadataValues);
      // Update meta tags immediately when metadata loads
      updateMetaTags(metadataValues);
    }
  }, [metadata, form]);

  // Watch form values and update meta tags in real-time during editing
  const watchedValues = form.watch();
  useEffect(() => {
    // Only update if we have valid values (avoid initial empty state)
    if (watchedValues.title && watchedValues.description) {
      updateMetaTags(watchedValues);
    }
  }, [watchedValues]);

  const updateMetadata = useMutation({
    mutationFn: async (data: MetadataFormData) => {
      const response = await apiRequest("POST", "/api/admin/metadata", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Metadata Updated",
        description: "Social media metadata has been successfully updated!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/metadata"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update metadata. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Get presigned URL from backend
      const urlResponse = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });
      
      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadUrl, objectPath } = await urlResponse.json();
      
      // Step 2: Upload file directly to object storage using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to storage');
      }
      
      return { objectPath };
    },
    onSuccess: (data) => {
      form.setValue('ogImage', data.objectPath);
      toast({
        title: "Image Uploaded",
        description: "Thumbnail image has been successfully uploaded!",
      });
      setUploadingImage(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setUploadingImage(false);
    },
  });

  const handleSubmit = (data: MetadataFormData) => {
    updateMetadata.mutate(data);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    uploadImage.mutate(file);
  };

  const titleLength = form.watch("title")?.length || 0;
  const descriptionLength = form.watch("description")?.length || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="pt-16">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="mb-8">
        <h1 className="text-3xl font-bold text-tsu-green mb-2">
          Social Media Metadata Editor
        </h1>
        <p className="text-gray-600">
          Control how your TSU appears when shared on social media platforms like Facebook, Twitter, LinkedIn, and WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Edit Metadata
            </CardTitle>
            <CardDescription>
              Customize how your site appears when shared on social media
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your page title"
                          data-testid="input-title"
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <FormDescription>
                          Appears as the main headline when shared
                        </FormDescription>
                        <Badge variant={titleLength > 60 ? "destructive" : "secondary"}>
                          {titleLength}/60
                        </Badge>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Brief description of your page"
                          className="min-h-[100px]"
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <FormDescription>
                          Short summary shown below the title
                        </FormDescription>
                        <Badge variant={descriptionLength > 160 ? "destructive" : "secondary"}>
                          {descriptionLength}/160
                        </Badge>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ogImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail Image</FormLabel>
                      <div className="space-y-4">
                        {/* Current image preview */}
                        {field.value && (
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="text-sm text-gray-600 mb-2">Current thumbnail:</div>
                            <img 
                              src={field.value} 
                              alt="Current thumbnail" 
                              className="max-w-full h-32 object-contain rounded border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Upload button and URL input */}
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="flex-1"
                              data-testid="button-upload-image"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingImage ? "Uploading..." : "Upload Image"}
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </div>
                          
                          <div className="text-center text-sm text-gray-500">or</div>
                          
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter image URL (e.g., /tsu-logo.png)"
                              data-testid="input-ogimage"
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormDescription>
                        Upload an image or enter a URL. Recommended size: 1200x630px (JPG/PNG, max 5MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="tsu, digital currency, africa, brics"
                          data-testid="input-keywords"
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords for SEO
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ogUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canonical URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://your-site.com/current-page"
                          data-testid="input-og-url"
                        />
                      </FormControl>
                      <FormDescription>
                        The canonical URL for this page (leave empty to use current page URL)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ogType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-og-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Card Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-twitter-card">
                              <SelectValue placeholder="Select card type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="summary">Summary Card</SelectItem>
                            <SelectItem value="summary_large_image">Large Image Card</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="TSU"
                            data-testid="input-sitename"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fbAppId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook App ID (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="966242223397117"
                          data-testid="input-fb-app-id"
                        />
                      </FormControl>
                      <FormDescription>
                        Facebook App ID for social sharing (pre-filled with a default value to silence debugger warnings)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex-1"
                    data-testid="button-preview"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? "Hide Preview" : "Show Preview"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMetadata.isPending}
                    className="flex-1 bg-tsu-green hover:bg-tsu-light-green"
                    data-testid="button-save"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMetadata.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Social Media Preview
              </CardTitle>
              <CardDescription>
                How your content will appear when shared
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Facebook/LinkedIn Preview */}
              <div className="border rounded-lg overflow-hidden mb-4">
                <div className="bg-gray-100 p-2 text-xs text-gray-600">
                  Facebook / LinkedIn Preview
                </div>
                {form.watch("ogImage") && (
                  <img 
                    src={form.watch("ogImage")} 
                    alt="Preview" 
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    {form.watch("siteName")}
                  </div>
                  <div className="font-semibold text-sm mb-1 line-clamp-2">
                    {form.watch("title")}
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2">
                    {form.watch("description")}
                  </div>
                </div>
              </div>

              {/* Twitter Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-2 text-xs text-gray-600">
                  Twitter Preview
                </div>
                {form.watch("ogImage") && (
                  <img 
                    src={form.watch("ogImage")} 
                    alt="Preview" 
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="p-3">
                  <div className="font-medium text-sm mb-1 line-clamp-2">
                    {form.watch("title")}
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2 mb-1">
                    {form.watch("description")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {form.watch("siteName")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-blue-900">💡 Tips for Better Sharing</h3>
              <ul className="text-sm space-y-1 text-blue-800">
                <li>• Keep titles under 60 characters for best display</li>
                <li>• Descriptions should be 120-160 characters</li>
                <li>• Use high-quality images (1200x630px recommended)</li>
                <li>• Test your links with Facebook's Sharing Debugger</li>
                <li>• Images should be in JPG or PNG format</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}