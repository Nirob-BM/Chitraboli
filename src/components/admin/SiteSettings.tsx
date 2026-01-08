import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, Globe, Palette, Mail, Phone, MapPin, Facebook, 
  Instagram, Save, Loader2, RefreshCw, Store, Search, Link2,
  Image, Type, ToggleLeft, Hash
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "sonner";

interface EditableSettings {
  [key: string]: any;
}

export const SiteSettings = () => {
  const { settings, loading, getSetting, getSettingsByCategory, updateMultipleSettings, refetch } = useSiteSettings();
  const [editedSettings, setEditedSettings] = useState<EditableSettings>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Initialize edited settings from loaded settings
    const initial: EditableSettings = {};
    settings.forEach(s => {
      initial[s.setting_key] = s.setting_value;
    });
    setEditedSettings(initial);
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editedSettings).map(([key, value]) => ({
        key,
        value
      }));
      
      const result = await updateMultipleSettings(updates);
      if (result.success) {
        toast.success("Settings saved successfully");
        setHasChanges(false);
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const initial: EditableSettings = {};
    settings.forEach(s => {
      initial[s.setting_key] = s.setting_value;
    });
    setEditedSettings(initial);
    setHasChanges(false);
    toast.info("Changes discarded");
  };

  const categories = [...new Set(settings.map(s => s.category))];

  const getIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'textarea': return <Type className="w-4 h-4" />;
      case 'url': return <Link2 className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'boolean': return <ToggleLeft className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'branding': return <Store className="w-4 h-4" />;
      case 'contact': return <Mail className="w-4 h-4" />;
      case 'social': return <Facebook className="w-4 h-4" />;
      case 'seo': return <Search className="w-4 h-4" />;
      case 'appearance': return <Palette className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const renderSettingInput = (setting: any) => {
    const value = editedSettings[setting.setting_key] ?? setting.setting_value;
    
    switch (setting.setting_type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div>
              <Label>{setting.label}</Label>
              {setting.description && (
                <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
              )}
            </div>
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleChange(setting.setting_key, checked)}
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div className="space-y-2">
            <Label>{setting.label}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
            <Textarea
              value={value || ''}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              rows={3}
              className="bg-background/50"
            />
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            <Label>{setting.label}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(setting.setting_key, parseFloat(e.target.value))}
              className="bg-background/50"
            />
          </div>
        );
      
      case 'url':
      case 'image':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {setting.setting_type === 'image' && <Image className="w-3 h-3" />}
              {setting.label}
            </Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
            <Input
              type="url"
              value={value || ''}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              placeholder="https://..."
              className="bg-background/50"
            />
            {setting.setting_type === 'image' && value && (
              <div className="mt-2 w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted">
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <Label>{setting.label}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
            <Input
              value={value || ''}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              className="bg-background/50"
            />
          </div>
        );
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Site Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage global website configuration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue={categories[0] || 'branding'} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-card/80 border border-border/50 p-1">
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="gap-2 capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {getCategoryIcon(category)}
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg capitalize">
                  {getCategoryIcon(category)}
                  {category} Settings
                </CardTitle>
                <CardDescription>
                  Configure {category} related options for your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {getSettingsByCategory(category).map(setting => (
                  <div key={setting.id} className="pb-4 border-b border-border/30 last:border-0 last:pb-0">
                    {renderSettingInput(setting)}
                  </div>
                ))}
                {getSettingsByCategory(category).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No settings configured for this category yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
