import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  MessageCircle, 
  Eye, 
  Reply, 
  Clock, 
  CheckCircle,
  Phone,
  User,
  Calendar,
  Send
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  adminResponse?: string;
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export default function ContactMessagesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch contact messages
  const { data: messages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/contact-messages"],
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest("PUT", `/api/contact-messages/${messageId}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-messages"] });
    },
  });

  // Send admin response mutation
  const respondMutation = useMutation({
    mutationFn: async ({ messageId, response }: { messageId: string; response: string }) => {
      return apiRequest("PUT", `/api/contact-messages/${messageId}`, {
        adminResponse: response,
        respondedAt: new Date().toISOString(),
        isRead: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Response Sent",
        description: "Your response has been saved to the message.",
        duration: 4000,
      });
      setAdminResponse("");
      setIsViewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/contact-messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to Send Response",
        description: error.message || "Could not save response",
        variant: "destructive",
      });
    },
  });

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setAdminResponse(message.adminResponse || "");
    setIsViewModalOpen(true);
    
    // Mark as read if not already
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleSendResponse = () => {
    if (!selectedMessage || !adminResponse.trim()) return;
    
    respondMutation.mutate({
      messageId: selectedMessage.id,
      response: adminResponse.trim(),
    });
  };

  const unreadCount = messages.filter(msg => !msg.isRead).length;
  const totalCount = messages.length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Loading Contact Messages...
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
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="total-messages-count">
                  {totalCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Eye className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-red-600" data-testid="unread-messages-count">
                  {unreadCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Responded</p>
                <p className="text-2xl font-bold text-green-600" data-testid="responded-messages-count">
                  {messages.filter(msg => msg.adminResponse).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contact Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No contact messages yet</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="contact-messages-list">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    !message.isRead ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'
                  }`}
                  onClick={() => handleViewMessage(message)}
                  data-testid={`message-card-${message.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{message.name}</h3>
                        {!message.isRead && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            New
                          </Badge>
                        )}
                        {message.adminResponse && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Responded
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Subject:</strong> {message.subject}
                      </p>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {message.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {message.email}
                        </span>
                        {message.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {message.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" data-testid={`button-view-message-${message.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Message Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="message-detail-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Message Details
            </DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-6">
              {/* Message Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedMessage.email}</p>
                  </div>
                  {selectedMessage.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedMessage.phone}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subject</label>
                    <p className="text-gray-900">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Received</label>
                    <p className="text-gray-900">
                      {formatDistanceToNow(new Date(selectedMessage.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="flex gap-2">
                      <Badge variant={selectedMessage.isRead ? "default" : "secondary"}>
                        {selectedMessage.isRead ? "Read" : "Unread"}
                      </Badge>
                      {selectedMessage.adminResponse && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Responded
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Original Message */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Message</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <Separator />

              {/* Admin Response */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Admin Response</label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Type your response to this inquiry..."
                  className="min-h-[120px]"
                  data-testid="textarea-admin-response"
                />
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-xs text-gray-500">
                    {selectedMessage.respondedAt && (
                      <span>Last responded: {formatDistanceToNow(new Date(selectedMessage.respondedAt), { addSuffix: true })}</span>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleSendResponse}
                    disabled={!adminResponse.trim() || respondMutation.isPending}
                    className="bg-tsu-green hover:bg-tsu-dark-green"
                    data-testid="button-send-admin-response"
                  >
                    {respondMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Save Response
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}