import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WhitepaperUploadSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tsuFile, setTsuFile] = useState<File | null>(null);
  const [tsuXFile, setTsuXFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'tsu' | 'tsu-x' }) => {
      const formData = new FormData();
      formData.append('whitepaper', file);
      formData.append('type', type);
      
      const response = await fetch('/api/admin/whitepaper/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Whitepaper uploaded successfully",
        description: `${variables.type.toUpperCase()} whitepaper has been updated`,
      });
      // Reset file input
      if (variables.type === 'tsu') {
        setTsuFile(null);
      } else {
        setTsuXFile(null);
      }
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload whitepaper",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'tsu' | 'tsu-x') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      if (type === 'tsu') {
        setTsuFile(file);
      } else {
        setTsuXFile(file);
      }
    }
  };

  const handleUpload = (type: 'tsu' | 'tsu-x') => {
    const file = type === 'tsu' ? tsuFile : tsuXFile;
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate({ file, type });
  };

  const handleDownload = (type: 'tsu' | 'tsu-x') => {
    const url = type === 'tsu' ? '/tsu-whitepaper.pdf' : '/tsu-x-whitepaper.pdf';
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-tsu-green mb-2">Whitepaper Management</h3>
        <p className="text-gray-600 text-sm">
          Upload and manage TSU and TSU-X whitepapers. Files must be PDF format and under 10MB.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* TSU Whitepaper */}
        <Card data-testid="tsu-whitepaper-upload-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-tsu-green">
              <FileText className="h-5 w-5" />
              TSU Whitepaper
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="tsu-file" className="block text-sm font-medium text-gray-700 mb-2">
                Upload new TSU whitepaper
              </label>
              <Input
                id="tsu-file"
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e, 'tsu')}
                className="cursor-pointer"
                data-testid="tsu-whitepaper-file-input"
              />
              {tsuFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {tsuFile.name} ({(tsuFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleUpload('tsu')}
                disabled={!tsuFile || uploadMutation.isPending}
                className="flex-1 bg-tsu-green hover:bg-tsu-dark-green"
                data-testid="tsu-whitepaper-upload-button"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadMutation.isPending && uploadMutation.variables?.type === 'tsu' ? 'Uploading...' : 'Upload'}
              </Button>
              <Button 
                onClick={() => handleDownload('tsu')}
                variant="outline"
                className="px-3"
                data-testid="tsu-whitepaper-download-button"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Current: Trade Settlement Unit whitepaper explaining reserve-backed architecture
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* TSU-X Whitepaper */}
        <Card data-testid="tsu-x-whitepaper-upload-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <FileText className="h-5 w-5" />
              TSU-X Whitepaper
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="tsu-x-file" className="block text-sm font-medium text-gray-700 mb-2">
                Upload new TSU-X whitepaper
              </label>
              <Input
                id="tsu-x-file"
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e, 'tsu-x')}
                className="cursor-pointer"
                data-testid="tsu-x-whitepaper-file-input"
              />
              {tsuXFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {tsuXFile.name} ({(tsuXFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleUpload('tsu-x')}
                disabled={!tsuXFile || uploadMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                data-testid="tsu-x-whitepaper-upload-button"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadMutation.isPending && uploadMutation.variables?.type === 'tsu-x' ? 'Uploading...' : 'Upload'}
              </Button>
              <Button 
                onClick={() => handleDownload('tsu-x')}
                variant="outline"
                className="px-3"
                data-testid="tsu-x-whitepaper-download-button"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Current: TSU-X utility token whitepaper with Polygon smart contract details
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Uploaded whitepapers will immediately replace the current versions on the website. 
          Make sure to review the documents before uploading.
        </AlertDescription>
      </Alert>
    </div>
  );
}