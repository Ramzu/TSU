import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, Clock, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SecurityAlert {
  id: string;
  type: 'login' | 'transaction' | 'kyc' | 'security';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}

interface KycStatus {
  status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  documentType?: string;
  submittedAt?: string;
}

export default function SecurityWidget() {
  const { data: notifications = [] } = useQuery<SecurityAlert[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: kycStatus } = useQuery<KycStatus>({
    queryKey: ["/api/kyc/status"],
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getSecurityLevel = () => {
    if (kycStatus?.status === 'approved') return 'high';
    if (kycStatus?.status === 'pending') return 'medium';
    return 'low';
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getKycBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Security Level Card */}
      <Card className="shadow-lg" data-testid="security-level-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-tsu-green">Account Security</CardTitle>
          <Shield className={`h-4 w-4 ${getSecurityColor(getSecurityLevel())}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-lg font-bold capitalize ${getSecurityColor(getSecurityLevel())}`} data-testid="security-level">
            {getSecurityLevel()} Security
          </div>
          <p className="text-xs text-muted-foreground">
            {getSecurityLevel() === 'high' 
              ? 'Your account is fully verified'
              : getSecurityLevel() === 'medium'
              ? 'KYC verification pending'
              : 'Complete KYC to secure your account'
            }
          </p>
        </CardContent>
      </Card>

      {/* KYC Status Card */}
      <Card className="shadow-lg" data-testid="kyc-status-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-tsu-green">KYC Verification</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getKycBadgeVariant(kycStatus?.status || 'not_submitted')} data-testid="kyc-status-badge">
              {kycStatus?.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
              {kycStatus?.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
              {kycStatus?.status === 'rejected' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {kycStatus?.status || 'Not Submitted'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {kycStatus?.status === 'not_submitted' ? (
            <Button 
              size="sm" 
              className="w-full bg-tsu-green hover:bg-tsu-light-green text-white"
              data-testid="button-start-kyc"
            >
              Start KYC Verification
            </Button>
          ) : (
            <div className="text-xs text-muted-foreground">
              {kycStatus?.status === 'approved' && 'Identity verified successfully'}
              {kycStatus?.status === 'pending' && 'Verification in progress'}
              {kycStatus?.status === 'rejected' && 'Verification failed - please resubmit'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card className="shadow-lg" data-testid="notifications-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-tsu-green">Notifications</CardTitle>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-tsu-gold" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs" data-testid="unread-count">
                {unreadCount}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-xs text-muted-foreground">No notifications</div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {notifications.slice(0, 3).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-2 rounded text-xs ${!notification.isRead ? 'bg-blue-50 border-l-2 border-blue-500' : 'bg-gray-50'}`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-muted-foreground">{notification.message}</div>
                </div>
              ))}
            </div>
          )}
          {notifications.length > 3 && (
            <Button variant="ghost" size="sm" className="w-full mt-2 text-tsu-gold" data-testid="view-all-notifications">
              View all notifications
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}