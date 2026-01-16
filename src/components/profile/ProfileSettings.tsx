import { useUserProfile } from "@/hooks/useUserProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone, 
  Tag, 
  Gift, 
  Sparkles,
  ShoppingBag
} from "lucide-react";

export function ProfileSettings() {
  const { profile, updateNotificationPreferences } = useUserProfile();

  // Default notification preferences if not set
  const defaultPrefs = {
    order_updates: true,
    price_drops: true,
    new_collections: true,
    promotions: false,
    email: true,
    sms: false,
    whatsapp: false
  };

  const prefs = profile?.notification_preferences ?? defaultPrefs;

  const handlePreferenceChange = (key: keyof typeof defaultPrefs, checked: boolean) => {
    if (!profile) return;
    updateNotificationPreferences({ [key]: checked });
  };

  const notificationOptions = [
    {
      key: 'order_updates' as const,
      icon: <ShoppingBag className="w-4 h-4" />,
      title: 'Order Updates',
      description: 'Get notified about order status changes and delivery updates'
    },
    {
      key: 'price_drops' as const,
      icon: <Tag className="w-4 h-4" />,
      title: 'Price Drop Alerts',
      description: 'Be notified when items in your wishlist go on sale'
    },
    {
      key: 'new_collections' as const,
      icon: <Sparkles className="w-4 h-4" />,
      title: 'New Collection Launches',
      description: 'Get updates about our latest jewelry collections'
    },
    {
      key: 'promotions' as const,
      icon: <Gift className="w-4 h-4" />,
      title: 'Promotional Offers',
      description: 'Receive exclusive deals and discount offers'
    }
  ];

  const channelOptions = [
    {
      key: 'email' as const,
      icon: <Mail className="w-4 h-4" />,
      title: 'Email',
      description: 'Receive notifications via email'
    },
    {
      key: 'sms' as const,
      icon: <Phone className="w-4 h-4" />,
      title: 'SMS',
      description: 'Get text message notifications'
    },
    {
      key: 'whatsapp' as const,
      icon: <MessageSquare className="w-4 h-4" />,
      title: 'WhatsApp',
      description: 'Receive updates on WhatsApp'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Notification Types */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose what updates you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationOptions.map((option, index) => (
            <div key={option.key}>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-muted text-muted-foreground">
                    {option.icon}
                  </span>
                  <div>
                    <Label htmlFor={option.key} className="font-medium cursor-pointer">
                      {option.title}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={option.key}
                  checked={prefs[option.key]}
                  disabled={!profile}
                  onCheckedChange={(checked) => handlePreferenceChange(option.key, checked)}
                />
              </div>
              {index < notificationOptions.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channelOptions.map((option, index) => (
            <div key={option.key}>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-muted text-muted-foreground">
                    {option.icon}
                  </span>
                  <div>
                    <Label htmlFor={`channel-${option.key}`} className="font-medium cursor-pointer">
                      {option.title}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`channel-${option.key}`}
                  checked={prefs[option.key]}
                  disabled={!profile}
                  onCheckedChange={(checked) => handlePreferenceChange(option.key, checked)}
                />
              </div>
              {index < channelOptions.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy Note */}
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Privacy Note:</strong> We respect your privacy and will never share your personal information. 
            You can update these preferences at any time. Transactional notifications (like order confirmations) 
            will always be sent regardless of these settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
