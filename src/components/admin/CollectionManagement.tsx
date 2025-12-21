import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Edit2, Trash2, FolderOpen, Plus, Image, GripVertical, Upload, X } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  link_category: string | null;
  display_order: number;
  is_active: boolean;
}

export const CollectionManagement = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    link_category: "",
    is_active: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchCollections();
    fetchCategories();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast({ title: "Error", description: "Failed to load collections", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .order("category");

      if (error) throw error;

      const uniqueCategories = [...new Set(data?.map((p) => p.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const openAddModal = () => {
    setEditingCollection(null);
    setFormData({
      name: "",
      description: "",
      image_url: "",
      link_category: "",
      is_active: true,
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || "",
      image_url: collection.image_url || "",
      link_category: collection.link_category || "",
      is_active: collection.is_active,
    });
    setImagePreview(collection.image_url || null);
    setShowModal(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `collections/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      setImagePreview(publicUrl);
      toast({ title: "Success", description: "Image uploaded" });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image_url: "" });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Collection name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingCollection) {
        const { error } = await supabase
          .from("collections")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            image_url: formData.image_url.trim() || null,
            link_category: formData.link_category || null,
            is_active: formData.is_active,
          })
          .eq("id", editingCollection.id);

        if (error) throw error;
        toast({ title: "Success", description: "Collection updated" });
      } else {
        const maxOrder = collections.length > 0 ? Math.max(...collections.map((c) => c.display_order)) + 1 : 0;
        const { error } = await supabase.from("collections").insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null,
          link_category: formData.link_category || null,
          is_active: formData.is_active,
          display_order: maxOrder,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Collection created" });
      }

      setShowModal(false);
      fetchCollections();
    } catch (error: any) {
      console.error("Error saving collection:", error);
      toast({
        title: "Error",
        description: error.message?.includes("duplicate") ? "Collection name already exists" : "Failed to save collection",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!collectionToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("collections").delete().eq("id", collectionToDelete.id);

      if (error) throw error;
      toast({ title: "Success", description: "Collection deleted" });
      setCollectionToDelete(null);
      fetchCollections();
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast({ title: "Error", description: "Failed to delete collection", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (collection: Collection) => {
    try {
      const { error } = await supabase
        .from("collections")
        .update({ is_active: !collection.is_active })
        .eq("id", collection.id);

      if (error) throw error;
      fetchCollections();
    } catch (error) {
      console.error("Error toggling collection:", error);
      toast({ title: "Error", description: "Failed to update collection", variant: "destructive" });
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Collection Management</h2>
            <p className="text-sm text-muted-foreground">{collections.length} collections</p>
          </div>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Collection
        </Button>
      </div>

      {/* Collections List */}
      {collections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No collections yet. Create your first collection!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map((collection) => (
            <Card key={collection.id} className={`transition-opacity ${!collection.is_active ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground/50 cursor-grab" />

                  {/* Image Preview */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {collection.image_url ? (
                      <img src={collection.image_url} alt={collection.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground truncate">{collection.description}</p>
                    )}
                    {collection.link_category && (
                      <p className="text-xs text-primary mt-1">Links to: {collection.link_category}</p>
                    )}
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${collection.id}`} className="text-sm text-muted-foreground">
                      Active
                    </Label>
                    <Switch
                      id={`active-${collection.id}`}
                      checked={collection.is_active}
                      onCheckedChange={() => toggleActive(collection)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEditModal(collection)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setCollectionToDelete(collection)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCollection ? "Edit Collection" : "Add Collection"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Summer Collection"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description of this collection"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Collection Image</Label>
              <div className="space-y-3">
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload image</p>
                        <p className="text-xs text-muted-foreground/70">Max 5MB</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_category">Link to Category</Label>
              <Select
                value={formData.link_category || "none"}
                onValueChange={(value) => setFormData({ ...formData, link_category: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.filter((cat) => cat && cat.trim() !== "").map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingCollection ? "Save Changes" : "Create Collection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!collectionToDelete} onOpenChange={() => setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{collectionToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
