import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ResetPasswordModal from "@/components/ResetPasswordModal";

export default function ResetPassword() {
  const [location, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Extract token from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (resetToken) {
      setToken(resetToken);
      setIsModalOpen(true);
    } else {
      // No token, redirect to home
      setLocation('/');
    }
  }, [setLocation]);

  const handleClose = () => {
    setIsModalOpen(false);
    setLocation('/');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h1>
          <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
          <button
            onClick={() => setLocation('/')}
            className="bg-tsu-green text-white px-6 py-2 rounded-lg hover:bg-tsu-dark-green"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Background content - will be hidden by modal */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-tsu-green mb-4">Reset Your Password</h1>
            <p className="text-gray-600">Please wait while we load the password reset form...</p>
          </div>
        </div>
      </div>
      
      {/* Reset password modal */}
      <ResetPasswordModal
        isOpen={isModalOpen}
        onClose={handleClose}
        token={token}
      />
    </>
  );
}