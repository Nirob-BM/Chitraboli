import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText, Save, Loader2, Eye, EyeOff, Home, ShoppingBag, 
  Info, Phone, Map, RefreshCw, GripVertical, Image, Type, Link2
} from "lucide-react";
import { usePageContent } from "@/hooks/usePageContent";
import { toast } from "sonner";

interface ContentField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'url' | 'array';
  value: any;
}

export const PageContentEditor = () => {
  const { content: sections, loading, updateSection, toggleSectionVisibility, refetch } = usePageContent();
  
  const getSectionsByPage = (pageSlug: string) => sections.filter(s => s.page_slug === pageSlug);
  const toggleVisibility = toggleSectionVisibility;
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [editedContent, setEditedContent] = useState<{ [sectionId: string]: any }>({});
  const [saving, setSaving] = useState<string | null>(null);

  const pages = [
    { slug: 'home', label: 'Home Page', icon: Home },
    { slug: 'shop', label: 'Shop Page', icon: ShoppingBag },
    { slug: 'about', label: 'About Page', icon: Info },
    { slug: 'contact', label: 'Contact Page', icon: Phone },
    { slug: 'collections', label: 'Collections', icon: Map },
  ];

  useEffect(() => {
    // Initialize edited content from sections
    const initial: { [sectionId: string]: any } = {};
    sections.forEach(s => {
      initial[s.id] = s.content;
    });
    setEditedContent(initial);
  }, [sections]);

  const handleContentChange = (sectionId: string, field: string, value: any) => {
    setEditedContent(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));
  };

  const handleSaveSection = async (sectionId: string) => {
    setSaving(sectionId);
    try {
      const content = editedContent[sectionId];
      const result = await updateSection(sectionId, content);
      if (result.success) {
        toast.success("Section saved successfully");
      } else {
        toast.error("Failed to save section");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(null);
    }
  };

  const handleToggleVisibility = async (sectionId: string, currentVisibility: boolean) => {
    const result = await toggleVisibility(sectionId, !currentVisibility);
    if (result.success) {
      toast.success(`Section ${!currentVisibility ? 'shown' : 'hidden'}`);
    } else {
      toast.error("Failed to update visibility");
    }
  };

  const getContentFields = (content: any): ContentField[] => {
    if (!content || typeof content !== 'object') return [];
    
    return Object.entries(content).map(([key, value]) => {
      let type: ContentField['type'] = 'text';
      
      if (typeof value === 'string') {
        if (value.length > 100) type = 'textarea';
        else if (value.startsWith('http') && (value.includes('.jpg') || value.includes('.png') || value.includes('.webp'))) type = 'image';
        else if (value.startsWith('http')) type = 'url';
      } else if (Array.isArray(value)) {
        type = 'array';
      }
      
      return {
        key,
        label: key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
        type,
        value
      };
    });
  };

  const renderContentField = (sectionId: string, field: ContentField) => {
    const value = editedContent[sectionId]?.[field.key] ?? field.value;
    
    switch (field.type) {
      case 'textarea':
        return (
          <div className="space-y-2">
            <Label className="capitalize text-sm">{field.label}</Label>
            <Textarea
              value={value || ''}
              onChange={(e) => handleContentChange(sectionId, field.key, e.target.value)}
              rows={4}
              className="bg-background/50"
            />
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            <Label className="capitalize text-sm flex items-center gap-2">
              <Image className="w-3 h-3" />
              {field.label}
            </Label>
            <div className="flex gap-3">
              {value && (
                <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted flex-shrink-0">
                  <img src={value} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Input
                value={value || ''}
                onChange={(e) => handleContentChange(sectionId, field.key, e.target.value)}
                placeholder="https://..."
                className="bg-background/50"
              />
            </div>
          </div>
        );
      
      case 'url':
        return (
          <div className="space-y-2">
            <Label className="capitalize text-sm flex items-center gap-2">
              <Link2 className="w-3 h-3" />
              {field.label}
            </Label>
            <Input
              type="url"
              value={value || ''}
              onChange={(e) => handleContentChange(sectionId, field.key, e.target.value)}
              placeholder="https://..."
              className="bg-background/50"
            />
          </div>
        );
      
      case 'array':
        return (
          <div className="space-y-2">
            <Label className="capitalize text-sm">{field.label}</Label>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">
                {Array.isArray(value) ? `${value.length} items` : 'No items'}
              </p>
              <Textarea
                value={JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleContentChange(sectionId, field.key, parsed);
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                rows={4}
                className="font-mono text-xs bg-background/50"
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <Label className="capitalize text-sm">{field.label}</Label>
            <Input
              value={value || ''}
              onChange={(e) => handleContentChange(sectionId, field.key, e.target.value)}
              className="bg-background/50"
            />
          </div>
        );
    }
  };

  const pageSections = getSectionsByPage(selectedPage);

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
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Page Content Editor</h2>
            <p className="text-sm text-muted-foreground">
              Edit text, images, and sections for each page
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Page Selector */}
      <Tabs value={selectedPage} onValueChange={setSelectedPage} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-card/80 border border-border/50 p-1">
          {pages.map(page => (
            <TabsTrigger 
              key={page.slug} 
              value={page.slug}
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <page.icon className="w-4 h-4" />
              {page.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {pages.map(page => (
          <TabsContent key={page.slug} value={page.slug}>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <page.icon className="w-5 h-5 text-primary" />
                  {page.label} Sections
                </CardTitle>
                <CardDescription>
                  {pageSections.length} editable sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pageSections.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No content sections configured for this page.</p>
                  </div>
                ) : (
                  <Accordion type="multiple" className="space-y-3">
                    {pageSections.map((section) => (
                      <AccordionItem 
                        key={section.id} 
                        value={section.id}
                        className="border border-border/50 rounded-lg px-4 bg-background/30"
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium capitalize">
                              {section.section_key.replace(/_/g, ' ')}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={section.is_visible 
                                ? "bg-green-500/10 text-green-500 border-green-500/30" 
                                : "bg-red-500/10 text-red-500 border-red-500/30"
                              }
                            >
                              {section.is_visible ? (
                                <><Eye className="w-3 h-3 mr-1" /> Visible</>
                              ) : (
                                <><EyeOff className="w-3 h-3 mr-1" /> Hidden</>
                              )}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-6">
                          <div className="space-y-6">
                            {/* Visibility Toggle */}
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div>
                                <Label>Section Visibility</Label>
                                <p className="text-xs text-muted-foreground">
                                  Toggle to show/hide this section on the live site
                                </p>
                              </div>
                              <Switch
                                checked={section.is_visible}
                                onCheckedChange={() => handleToggleVisibility(section.id, section.is_visible)}
                              />
                            </div>

                            {/* Content Fields */}
                            <div className="space-y-4">
                              {getContentFields(editedContent[section.id] || section.content).map(field => (
                                <div key={field.key}>
                                  {renderContentField(section.id, field)}
                                </div>
                              ))}
                            </div>

                            {/* Save Button */}
                            <Button
                              onClick={() => handleSaveSection(section.id)}
                              disabled={saving === section.id}
                              className="gap-2"
                            >
                              {saving === section.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              Save Section
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
