import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-tsu-green mb-8" data-testid="heading-privacy-policy">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600" data-testid="text-privacy-contact">
              Email: privacy@tsunit.com
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}