import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'tsu' | 'tsu-x';
}

export default function WhitepaperModal({ isOpen, onClose, type }: WhitepaperModalProps) {
  const isPdf = (url: string) => url.toLowerCase().endsWith('.pdf');
  
  const whitepaperInfo = {
    'tsu': {
      title: 'TSU Whitepaper',
      subtitle: 'Trade Settlement Unit: A Reserve-Backed Settlement Instrument for Africa & BRICS',
      description: 'Comprehensive document explaining the TSU ecosystem, reserve backing, governance structure, and implementation across Africa-BRICS trade corridors.',
      url: '/tsu-whitepaper.pdf',
      highlights: [
        'Reserve-backed digital settlement unit',
        'Currency, Commodities, and Beneficiary Programs',
        'Over-collateralized with gold, BRICS FX, and commodities',
        'Pilot corridors in Cameroon, Zimbabwe, Mozambique, and Russia-India-Africa',
        'Centralized CBDC-style architecture'
      ]
    },
    'tsu-x': {
      title: 'TSU-X Whitepaper',
      subtitle: 'The Utility Token Powering BRICS + Africa Trade Liquidity',
      description: 'Technical whitepaper for TSU-X, the blockchain-based utility token deployed on Polygon Mainnet that powers the TSU ecosystem.',
      url: '/tsu-x-whitepaper.pdf',
      highlights: [
        '100 billion TSU-X tokens minted on Polygon Mainnet',
        '20 billion allocated for public ICO',
        'Governance, staking, and fee reduction utilities',
        'Buy-back and burn mechanisms',
        'Smart contract integration with TSU settlement corridors'
      ]
    }
  };

  const info = whitepaperInfo[type];

  const handleView = () => {
    if (isPdf(info.url)) {
      // Open PDF in new tab for viewing
      window.open(info.url, '_blank');
    }
  };

  const handleDownload = () => {
    // Create a download link
    const link = document.createElement('a');
    link.href = info.url;
    link.download = `${type}-whitepaper.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid={`${type}-whitepaper-modal`}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-tsu-green" data-testid={`${type}-whitepaper-title`}>
            {info.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2" data-testid={`${type}-whitepaper-subtitle`}>
              {info.subtitle}
            </h3>
            <p className="text-gray-600 leading-relaxed" data-testid={`${type}-whitepaper-description`}>
              {info.description}
            </p>
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Key Highlights:</h4>
            <ul className="space-y-2">
              {info.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-tsu-green font-bold mt-1">•</span>
                  <span className="text-gray-700">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {isPdf(info.url) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">
                This whitepaper is available as a PDF document. You can view it in your browser or download it for offline reading.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={handleView}
                  className="bg-tsu-green hover:bg-tsu-dark-green text-white"
                  data-testid={`${type}-whitepaper-view-button`}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Browser
                </Button>
                <Button 
                  onClick={handleDownload}
                  variant="outline"
                  className="border-tsu-green text-tsu-green hover:bg-tsu-green hover:text-white"
                  data-testid={`${type}-whitepaper-download-button`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}