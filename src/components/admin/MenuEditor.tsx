import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Menu, Plus, Edit2, Trash2, Loader2, Save, GripVertical, 
  Eye, EyeOff, ExternalLink, Link2, RefreshCw, MoveUp, MoveDown
} from "lucide-react";
import { useMenuItems, MenuItem } from "@/hooks/useMenuItems";
import { toast } from "sonner";

export const MenuEditor = () => {
  const { 
    items: menuItems, 
    loading, 
    addItem: addMenuItem, 
    updateItem: updateMenuItem, 
    deleteItem: deleteMenuItem,
    refetch 
  } = useMenuItems();

  const reorderItems = async (updates: { id: string; display_order: number }[]) => {
    for (const update of updates) {
      await updateMenuItem(update.id, { display_order: update.display_order });
    }
  };

  const [selectedLocation, setSelectedLocation] = useState<'header' | 'footer'>('header');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    url: '',
    icon: '',
    is_visible: true,
    open_in_new_tab: false,
    menu_location: 'header' as 'header' | 'footer',
  });

  const locationItems = menuItems.filter(item => item.menu_location === selectedLocation);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      label: '',
      url: '',
      icon: '',
      is_visible: true,
      open_in_new_tab: false,
      menu_location: selectedLocation,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      url: item.url,
      icon: item.icon || '',
      is_visible: item.is_visible,
      open_in_new_tab: item.open_in_new_tab,
      menu_location: item.menu_location,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.url.trim()) {
      toast.error("Label and URL are required");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const result = await updateMenuItem(editingItem.id, {
          label: formData.label,
          url: formData.url,
          icon: formData.icon || null,
          is_visible: formData.is_visible,
          open_in_new_tab: formData.open_in_new_tab,
          menu_location: formData.menu_location as 'header' | 'footer',
        });
        if (result.success) {
          toast.success("Menu item updated");
          setIsModalOpen(false);
        } else {
          toast.error("Failed to update menu item");
        }
      } else {
        const result = await addMenuItem({
          label: formData.label,
          url: formData.url,
          icon: formData.icon || null,
          is_visible: formData.is_visible,
          open_in_new_tab: formData.open_in_new_tab,
          menu_location: formData.menu_location,
          display_order: locationItems.length,
          parent_id: null,
        });
        if (result.success) {
          toast.success("Menu item added");
          setIsModalOpen(false);
        } else {
          toast.error("Failed to add menu item");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.label}" from the menu?`)) return;
    
    setDeletingId(item.id);
    const result = await deleteMenuItem(item.id);
    if (result.success) {
      toast.success("Menu item deleted");
    } else {
      toast.error("Failed to delete menu item");
    }
    setDeletingId(null);
  };

  const handleToggleVisibility = async (item: MenuItem) => {
    const result = await updateMenuItem(item.id, { is_visible: !item.is_visible });
    if (result.success) {
      toast.success(`${item.label} is now ${!item.is_visible ? 'visible' : 'hidden'}`);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newItems = [...locationItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    await reorderItems(newItems.map((item, i) => ({ id: item.id, display_order: i })));
  };

  const handleMoveDown = async (index: number) => {
    if (index === locationItems.length - 1) return;
    const newItems = [...locationItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    await reorderItems(newItems.map((item, i) => ({ id: item.id, display_order: i })));
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
            <Menu className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Menu Editor</h2>
            <p className="text-sm text-muted-foreground">
              Manage navigation menus
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={openAddModal} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Location Tabs */}
      <div className="flex gap-2">
        <Button
          variant={selectedLocation === 'header' ? 'default' : 'outline'}
          onClick={() => setSelectedLocation('header')}
          className="gap-2"
        >
          Header Menu
          <Badge variant="secondary">{menuItems.filter(i => i.menu_location === 'header').length}</Badge>
        </Button>
        <Button
          variant={selectedLocation === 'footer' ? 'default' : 'outline'}
          onClick={() => setSelectedLocation('footer')}
          className="gap-2"
        >
          Footer Menu
          <Badge variant="secondary">{menuItems.filter(i => i.menu_location === 'footer').length}</Badge>
        </Button>
      </div>

      {/* Menu Items */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="capitalize">{selectedLocation} Navigation</CardTitle>
          <CardDescription>
            Drag to reorder, click to edit menu items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locationItems.length === 0 ? (
            <div className="text-center py-12">
              <Menu className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No menu items yet</p>
              <Button onClick={openAddModal} variant="outline" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {locationItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    item.is_visible 
                      ? 'bg-background/50 border-border/50' 
                      : 'bg-muted/30 border-border/30 opacity-60'
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.label}</span>
                      {item.open_in_new_tab && (
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      )}
                      {!item.is_visible && (
                        <Badge variant="outline" className="text-xs">Hidden</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <MoveUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === locationItems.length - 1}
                      className="h-8 w-8"
                    >
                      <MoveDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleVisibility(item)}
                      className="h-8 w-8"
                    >
                      {item.is_visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(item)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the menu item details' : 'Add a new item to the navigation menu'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., About Us"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="e.g., /about or https://..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Lucide icon name)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., home, shopping-bag"
              />
            </div>

            <div className="space-y-2">
              <Label>Menu Location</Label>
              <Select
                value={formData.menu_location}
                onValueChange={(value: 'header' | 'footer') => setFormData({ ...formData, menu_location: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="visible">Visible</Label>
              <Switch
                id="visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="newtab">Open in New Tab</Label>
              <Switch
                id="newtab"
                checked={formData.open_in_new_tab}
                onCheckedChange={(checked) => setFormData({ ...formData, open_in_new_tab: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingItem ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
