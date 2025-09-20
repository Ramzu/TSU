import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  Eye, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  User,
  Calendar,
  MapPin,
  FileText
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommodityRegistration {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  location: string;
  country: string;
  commodityType: string;
  quantity: string;
  additionalInfo?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800", 
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
};

const statusIcons = {
  pending: Clock,
  under_review: AlertTriangle,
  approved: CheckCircle,
  rejected: XCircle
};

export default function CommodityRegistrationsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRegistration, setSelectedRegistration] = useState<CommodityRegistration | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch commodity registrations
  const { data: registrations = [], isLoading } = useQuery<CommodityRegistration[]>({
    queryKey: ["/api/commodity-registrations"],
  });

  // Update registration status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return apiRequest("PUT", `/api/commodity-registrations/${id}`, {
        status,
        adminNotes: notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Status Updated",
        description: "Registration status has been successfully updated.",
        duration: 4000,
      });
      setAdminNotes("");
      setSelectedStatus("");
      setIsViewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/commodity-registrations"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to Update Status",
        description: error.message || "Could not update registration status",
        variant: "destructive",
      });
    },
  });

  const handleViewRegistration = (registration: CommodityRegistration) => {
    setSelectedRegistration(registration);
    setAdminNotes(registration.adminNotes || "");
    setSelectedStatus(registration.status);
    setIsViewModalOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedRegistration || !selectedStatus) return;
    
    updateStatusMutation.mutate({
      id: selectedRegistration.id,
      status: selectedStatus,
      notes: adminNotes.trim(),
    });
  };

  const pendingCount = registrations.filter(reg => reg.status === 'pending').length;
  const totalCount = registrations.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Loading Commodity Registrations...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-tsu-green border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-tsu-green" />
              Commodity Registrations
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
                {pendingCount} pending
              </Badge>
              <Badge variant="outline">
                {totalCount} total
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalCount === 0 ? (
            <div className="text-center py-8" data-testid="no-commodity-registrations">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No commodity registrations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => {
                const StatusIcon = statusIcons[registration.status];
                return (
                  <div
                    key={registration.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`commodity-registration-${registration.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900" data-testid={`commodity-company-${registration.id}`}>
                            {registration.companyName}
                          </h4>
                          <Badge className={statusColors[registration.status]} data-testid={`commodity-status-${registration.id}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {registration.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {registration.commodityType} - {registration.quantity}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {registration.location}, {registration.country}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {registration.contactEmail}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(registration.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRegistration(registration)}
                          data-testid={`button-view-commodity-${registration.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Registration Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="commodity-registration-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-tsu-green">
              Commodity Registration Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRegistration && (
            <div className="space-y-6">
              {/* Company Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Company Information
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Company:</span> {selectedRegistration.companyName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedRegistration.contactEmail}
                  </div>
                  {selectedRegistration.contactPhone && (
                    <div>
                      <span className="font-medium">Phone:</span> {selectedRegistration.contactPhone}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Location:</span> {selectedRegistration.location}, {selectedRegistration.country}
                  </div>
                </div>
              </div>

              {/* Commodity Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Commodity Details
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {selectedRegistration.commodityType}
                  </div>
                  <div>
                    <span className="font-medium">Quantity:</span> {selectedRegistration.quantity}
                  </div>
                </div>
                {selectedRegistration.additionalInfo && (
                  <div className="mt-3">
                    <span className="font-medium">Additional Information:</span>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedRegistration.additionalInfo}</p>
                  </div>
                )}
              </div>

              {/* Status Management */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Status Management
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Registration Status</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger data-testid="select-commodity-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Admin Notes</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this registration..."
                      rows={3}
                      data-testid="textarea-commodity-admin-notes"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={updateStatusMutation.isPending || !selectedStatus}
                      className="bg-tsu-green text-white hover:bg-tsu-light-green"
                      data-testid="button-update-commodity-status"
                    >
                      {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Registration Timeline */}
              <div className="text-xs text-gray-500 border-t pt-3">
                <div className="flex items-center gap-4">
                  <span>Submitted: {new Date(selectedRegistration.createdAt).toLocaleDateString()}</span>
                  {selectedRegistration.updatedAt !== selectedRegistration.createdAt && (
                    <span>Updated: {new Date(selectedRegistration.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}