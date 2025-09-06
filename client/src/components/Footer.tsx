import { useTranslation } from "react-i18next";
import { MapPin, Mail, Phone, Globe } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-tsu-green text-white mt-auto" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* TSU Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/tsu-logo.png" 
                alt="TSU Logo" 
                className="w-12 h-12 rounded-full object-cover mr-3"
                data-testid="footer-logo"
              />
              <h3 className="text-2xl font-bold text-tsu-gold">TSU</h3>
            </div>
            <p className="text-gray-200 mb-4 max-w-md">
              Trade Settlement Unit - The reserve-backed digital currency for Africa-BRICS trade settlements, 
              reducing USD dependence and enabling transparent cross-border commerce.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span>Global Trade Network</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-tsu-gold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-200">
              <li>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="hover:text-tsu-gold transition-colors"
                  data-testid="footer-link-home"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/commodities'}
                  className="hover:text-tsu-gold transition-colors"
                  data-testid="footer-link-commodities"
                >
                  Commodities Program
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/currency'}
                  className="hover:text-tsu-gold transition-colors"
                  data-testid="footer-link-currency"
                >
                  Currency Program
                </button>
              </li>
              <li>
                <button 
                  onClick={() => window.location.href = '/admin'}
                  className="hover:text-tsu-gold transition-colors"
                  data-testid="footer-link-admin"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-tsu-gold mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-200">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-tsu-gold" />
                <span className="text-sm">authority@tsu.africa</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-tsu-gold" />
                <span className="text-sm">+27 (0) 11 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-tsu-gold" />
                <span className="text-sm">Johannesburg, South Africa</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-tsu-light-green mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            © 2024 Trade Settlement Unit Authority. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-gray-300">
            <button className="hover:text-tsu-gold transition-colors" data-testid="footer-link-privacy">
              Privacy Policy
            </button>
            <button className="hover:text-tsu-gold transition-colors" data-testid="footer-link-terms">
              Terms of Service
            </button>
            <button className="hover:text-tsu-gold transition-colors" data-testid="footer-link-audit">
              Monthly Audit Reports
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}