import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, Mail, MessageSquare, Phone, Save, Loader2, Plus, X,
  ShoppingBag, Package, AlertTriangle, CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationSetting {
  id: string;
  notification_type: string;
  is_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  recipients: string[];
}

export const NotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newRecipient, setNewRecipient] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('notification_type');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, field: keyof NotificationSetting, value: boolean) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      setSettings(prev => prev.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      ));
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(null);
    }
  };

  const handleAddRecipient = async (setting: NotificationSetting) => {
    const email = newRecipient[setting.id]?.trim();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    if (setting.recipients?.includes(email)) {
      toast.error('Email already added');
      return;
    }

    const updatedRecipients = [...(setting.recipients || []), email];

    setSaving(setting.id);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ recipients: updatedRecipients })
        .eq('id', setting.id);

      if (error) throw error;

      setSettings(prev => prev.map(s => 
        s.id === setting.id ? { ...s, recipients: updatedRecipients } : s
      ));
      setNewRecipient(prev => ({ ...prev, [setting.id]: '' }));
      toast.success('Recipient added');
    } catch (error) {
      toast.error('Failed to add recipient');
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveRecipient = async (setting: NotificationSetting, email: string) => {
    const updatedRecipients = setting.recipients?.filter(r => r !== email) || [];

    setSaving(setting.id);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ recipients: updatedRecipients })
        .eq('id', setting.id);

      if (error) throw error;

      setSettings(prev => prev.map(s => 
        s.id === setting.id ? { ...s, recipients: updatedRecipients } : s
      ));
      toast.success('Recipient removed');
    } catch (error) {
      toast.error('Failed to remove recipient');
    } finally {
      setSaving(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <ShoppingBag className="w-5 h-5" />;
      case 'order_status': return <Package className="w-5 h-5" />;
      case 'low_stock': return <AlertTriangle className="w-5 h-5" />;
      case 'payment_received': return <CheckCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">Notification Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure how you receive alerts
          </p>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-4">
        {settings.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notification settings configured</p>
            </CardContent>
          </Card>
        ) : (
          settings.map((setting) => (
            <Card key={setting.id} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${setting.is_enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {getNotificationIcon(setting.notification_type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{formatType(setting.notification_type)}</CardTitle>
                      <CardDescription>
                        {setting.recipients?.length || 0} recipients configured
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`enable-${setting.id}`} className="text-sm mr-2">
                      {setting.is_enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id={`enable-${setting.id}`}
                      checked={setting.is_enabled}
                      onCheckedChange={(checked) => handleToggle(setting.id, 'is_enabled', checked)}
                      disabled={saving === setting.id}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Channels */}
                <div className="flex flex-wrap gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`email-${setting.id}`}
                      checked={setting.email_enabled}
                      onCheckedChange={(checked) => handleToggle(setting.id, 'email_enabled', checked)}
                      disabled={saving === setting.id || !setting.is_enabled}
                    />
                    <Label htmlFor={`email-${setting.id}`} className="flex items-center gap-1 text-sm">
                      <Mail className="w-4 h-4" /> Email
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`sms-${setting.id}`}
                      checked={setting.sms_enabled}
                      onCheckedChange={(checked) => handleToggle(setting.id, 'sms_enabled', checked)}
                      disabled={saving === setting.id || !setting.is_enabled}
                    />
                    <Label htmlFor={`sms-${setting.id}`} className="flex items-center gap-1 text-sm">
                      <Phone className="w-4 h-4" /> SMS
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`whatsapp-${setting.id}`}
                      checked={setting.whatsapp_enabled}
                      onCheckedChange={(checked) => handleToggle(setting.id, 'whatsapp_enabled', checked)}
                      disabled={saving === setting.id || !setting.is_enabled}
                    />
                    <Label htmlFor={`whatsapp-${setting.id}`} className="flex items-center gap-1 text-sm">
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </Label>
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-2">
                  <Label className="text-sm">Email Recipients</Label>
                  <div className="flex flex-wrap gap-2">
                    {setting.recipients?.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1 pr-1">
                        {email}
                        <button
                          onClick={() => handleRemoveRecipient(setting, email)}
                          className="ml-1 hover:text-destructive"
                          disabled={saving === setting.id}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Add recipient email"
                      value={newRecipient[setting.id] || ''}
                      onChange={(e) => setNewRecipient(prev => ({ ...prev, [setting.id]: e.target.value }))}
                      className="bg-background/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRecipient(setting);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddRecipient(setting)}
                      disabled={saving === setting.id}
                    >
                      {saving === setting.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
