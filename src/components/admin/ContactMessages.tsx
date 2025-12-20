import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, Phone, Calendar, Trash2, Check, Loader2, MessageSquare, 
  User, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel('contact-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_messages' },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setMessages(prev => 
        prev.map(m => m.id === id ? { ...m, is_read: true } : m)
      );
      toast.success('Marked as read');
    }
  };

  const deleteMessage = async (message: ContactMessage) => {
    setDeleting(message.id);
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', message.id);

    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== message.id));
      toast.success('Message deleted');
    } else {
      toast.error('Failed to delete message');
    }
    setDeleting(null);
    setMessageToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Contact Messages</h2>
            <p className="text-sm text-muted-foreground">
              {messages.length} total • {unreadCount} unread
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRefreshing(true);
            fetchMessages();
          }}
          disabled={refreshing}
          className="gap-2 rounded-full"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-display text-foreground mb-2">No Messages Yet</h3>
            <p className="text-muted-foreground text-center">
              Contact form submissions will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card 
              key={message.id} 
              className={`bg-card/80 backdrop-blur-sm border-border/50 transition-all ${
                !message.is_read ? 'border-l-4 border-l-primary' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-display flex items-center gap-2">
                        {message.name}
                        {!message.is_read && (
                          <Badge className="bg-primary/20 text-primary text-xs">New</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!message.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(message.id)}
                        className="gap-1.5 rounded-full text-xs"
                      >
                        <Check className="w-3 h-3" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessageToDelete(message)}
                      disabled={deleting === message.id}
                      className="gap-1.5 rounded-full text-xs text-destructive hover:text-destructive"
                    >
                      {deleting === message.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <a 
                    href={`mailto:${message.email}`}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {message.email}
                  </a>
                  {message.phone && (
                    <a 
                      href={`tel:${message.phone}`}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {message.phone}
                    </a>
                  )}
                </div>

                {/* Subject & Message */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">{message.subject}</h4>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`mailto:${message.email}?subject=Re: ${message.subject}`, '_self')}
                    className="gap-1.5 rounded-full text-xs"
                  >
                    <Mail className="w-3 h-3" />
                    Reply via Email
                  </Button>
                  {message.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`tel:${message.phone}`, '_self')}
                      className="gap-1.5 rounded-full text-xs"
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the message from {messageToDelete?.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => messageToDelete && deleteMessage(messageToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
