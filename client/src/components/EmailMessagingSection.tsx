import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, Users, User, CheckCircle2 } from "lucide-react";

interface UserEmail {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function EmailMessagingSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isHtml, setIsHtml] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState("");

  // Fetch users for email targeting
  const { data: users = [], isLoading: loadingUsers } = useQuery<UserEmail[]>({
    queryKey: ["/api/admin/users/emails"],
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: {
      recipients: string[];
      subject: string;
      message: string;
      isHtml: boolean;
    }) => {
      return apiRequest("POST", "/api/admin/send-email", emailData);
    },
    onSuccess: (response: any) => {
      toast({
        title: "✅ Email Campaign Sent!",
        description: response?.message || "Emails have been sent successfully",
        duration: 5000,
      });
      setSubject("");
      setMessage("");
      setSelectedUsers([]);
      setCustomEmails("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Email Failed",
        description: error.message || "Failed to send emails",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.email));
    }
  };

  const handleUserToggle = (email: string) => {
    if (selectedUsers.includes(email)) {
      setSelectedUsers(selectedUsers.filter(u => u !== email));
    } else {
      setSelectedUsers([...selectedUsers, email]);
    }
  };

  const handleSendEmail = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both subject and message",
        variant: "destructive",
      });
      return;
    }

    // Get all recipients from selected users and custom emails
    const customEmailList = customEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const allRecipients = [...selectedUsers, ...customEmailList];

    if (allRecipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select users or enter custom email addresses",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      recipients: allRecipients,
      subject,
      message,
      isHtml,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="h-5 w-5 text-tsu-gold" />
        <h3 className="text-xl font-semibold text-tsu-green">Email Messaging System</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-tsu-gold" />
              Select Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  data-testid="button-select-all-users"
                >
                  {selectedUsers.length === users.length ? "Deselect All" : "Select All"}
                  <Badge variant="secondary" className="ml-2">
                    {users.length}
                  </Badge>
                </Button>
                <Badge variant="default" className="bg-tsu-green">
                  {selectedUsers.length} selected
                </Badge>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {loadingUsers ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-gray-500">No users found</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                      data-testid={`user-email-${user.id}`}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.email)}
                        onCheckedChange={() => handleUserToggle(user.email)}
                        data-testid={`checkbox-user-${user.id}`}
                      />
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.email.split('@')[0]
                          }
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                      <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  ))
                )}
              </div>

              <Separator />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Email Addresses (comma-separated)
                </label>
                <Textarea
                  placeholder="user1@example.com, user2@example.com"
                  value={customEmails}
                  onChange={(e) => setCustomEmails(e.target.value)}
                  rows={3}
                  data-testid="textarea-custom-emails"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter additional email addresses separated by commas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-tsu-gold" />
              Compose Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <Input
                  placeholder="Email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  data-testid="input-email-subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <Textarea
                  placeholder="Email message content"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  data-testid="textarea-email-message"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isHtml}
                  onCheckedChange={(checked) => setIsHtml(checked as boolean)}
                  data-testid="checkbox-html-email"
                />
                <label className="text-sm font-medium">HTML Email</label>
                <Badge variant="outline" className="text-xs">
                  Advanced
                </Badge>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  Email will be sent using your configured SMTP server or SendGrid if available.
                </p>
              </div>

              <Button
                onClick={handleSendEmail}
                disabled={sendEmailMutation.isPending}
                className="w-full bg-tsu-green hover:bg-tsu-light-green"
                data-testid="button-send-email"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Preview */}
      {subject && message && (
        <Card className="border-tsu-gold border-2">
          <CardHeader>
            <CardTitle className="text-tsu-green">Email Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <strong>To:</strong> {selectedUsers.length + (customEmails.split(',').filter(e => e.trim()).length)} recipients
              </div>
              <div>
                <strong>Subject:</strong> {subject}
              </div>
              <div className="border-t pt-3">
                <strong>Message:</strong>
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  {isHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: message }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm">{message}</pre>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}