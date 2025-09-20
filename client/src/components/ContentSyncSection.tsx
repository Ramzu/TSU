import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function ContentSyncSection() {
  const [exportData, setExportData] = useState<string>("");
  const [importData, setImportData] = useState<string>("");
  const [overwrite, setOverwrite] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Use fetch directly to handle file download
      const response = await fetch('/api/content/export', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      const formattedData = JSON.stringify(data, null, 2);
      setExportData(formattedData);

      // Also trigger download
      const blob = new Blob([formattedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${data.contentCount} content items`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export content",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast({
        title: "Import Error",
        description: "Please paste the content export data",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    
    try {
      const parsedData = JSON.parse(importData);
      
      if (!parsedData.content || !Array.isArray(parsedData.content)) {
        throw new Error("Invalid export format - content array not found");
      }

      const response = await fetch('/api/content/import', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: parsedData.content,
          overwrite
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      
      toast({
        title: "Import Complete",
        description: `Imported ${result.stats.imported} items, skipped ${result.stats.skipped}`,
      });

      // Clear import data on success
      if (result.stats.errors === 0) {
        setImportData("");
      }
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to import content";
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-tsu-green mb-2">Content Synchronization</h3>
        <p className="text-gray-600 text-sm">
          Export content from this environment and import to production to sync changes.
        </p>
      </div>

      {/* Export Section */}
      <Card data-testid="content-export-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-tsu-green">
            <Download className="h-5 w-5" />
            Export Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Export all content from this environment to sync with production.
          </p>
          
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-tsu-green text-white hover:bg-tsu-light-green"
            data-testid="button-export-content"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Content
              </>
            )}
          </Button>

          {exportData && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Export Preview (also downloaded as file):
              </label>
              <Textarea
                value={exportData}
                readOnly
                className="h-32 font-mono text-xs"
                data-testid="export-preview"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card data-testid="content-import-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-tsu-green">
            <Upload className="h-5 w-5" />
            Import Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Paste the exported content JSON here to import to this environment.
              Use the overwrite option carefully as it will replace existing content.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Content Export Data:
            </label>
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste the exported content JSON here..."
              className="h-32 font-mono text-xs"
              data-testid="import-data-input"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="overwrite"
              checked={overwrite}
              onCheckedChange={(checked) => setOverwrite(!!checked)}
              data-testid="checkbox-overwrite"
            />
            <label htmlFor="overwrite" className="text-sm text-gray-700">
              Overwrite existing content (replaces content with same keys)
            </label>
          </div>

          <Button
            onClick={handleImport}
            disabled={isImporting || !importData.trim()}
            className="bg-tsu-gold text-tsu-green hover:bg-yellow-400"
            data-testid="button-import-content"
          >
            {isImporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Content
              </>
            )}
          </Button>

          {importResult && (
            <Alert className={importResult.stats.errors > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"} data-testid="import-result">
              <CheckCircle className={`h-4 w-4 ${importResult.stats.errors > 0 ? "text-red-600" : "text-green-600"}`} />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">{importResult.message}</p>
                  <div className="text-sm">
                    <p>Total items: {importResult.stats.total}</p>
                    <p>Imported: {importResult.stats.imported}</p>
                    <p>Skipped: {importResult.stats.skipped}</p>
                    {importResult.stats.errors > 0 && (
                      <p className="text-red-600">Errors: {importResult.stats.errors}</p>
                    )}
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-red-600">Errors:</p>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {importResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 text-base">How to Sync Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-700">
          <p><strong>Step 1:</strong> Export content from your development environment (this environment)</p>
          <p><strong>Step 2:</strong> Navigate to your production environment admin panel</p>
          <p><strong>Step 3:</strong> Paste the exported data in the import section</p>
          <p><strong>Step 4:</strong> Check "overwrite" if you want to replace existing content</p>
          <p><strong>Step 5:</strong> Click import to sync your changes</p>
        </CardContent>
      </Card>
    </div>
  );
}