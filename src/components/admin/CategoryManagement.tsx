import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { Loader2, Edit2, Trash2, Tag, Save, X, Package } from "lucide-react";

interface CategoryInfo {
  name: string;
  productCount: number;
}

export const CategoryManagement = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();

    const channel = supabase
      .channel("categories-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("category");

      if (error) throw error;

      const categoryMap = new Map<string, number>();
      data?.forEach((product) => {
        const count = categoryMap.get(product.category) || 0;
        categoryMap.set(product.category, count + 1);
      });

      const categoriesArray = Array.from(categoryMap.entries())
        .map(([name, productCount]) => ({ name, productCount }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setCategories(categoriesArray);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (oldName: string) => {
    if (!newName.trim() || newName.trim() === oldName) {
      setEditingCategory(null);
      setNewName("");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ category: newName.trim() })
        .eq("category", oldName);

      if (error) throw error;

      toast({ title: "Success", description: `Category renamed to "${newName.trim()}"` });
      setEditingCategory(null);
      setNewName("");
      fetchCategories();
    } catch (error) {
      console.error("Error renaming category:", error);
      toast({ title: "Error", description: "Failed to rename category", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ category: "Uncategorized" })
        .eq("category", categoryToDelete.name);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Category "${categoryToDelete.name}" deleted. ${categoryToDelete.productCount} product(s) moved to "Uncategorized"`,
      });
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (category: CategoryInfo) => {
    setEditingCategory(category.name);
    setNewName(category.name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setNewName("");
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
        <div>
          <h2 className="text-xl font-semibold text-foreground">Category Management</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categories total</p>
        </div>
      </div>

      {/* Categories List */}
      <div className="grid gap-3">
        {categories.map((category) => (
          <Card key={category.name} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              {editingCategory === category.name ? (
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <Label className="sr-only">New category name</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter new name"
                      className="h-9"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(category.name);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRename(category.name)}
                    disabled={saving}
                    className="gap-1"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Tag className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground truncate">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.productCount} product{category.productCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => startEdit(category)} className="gap-1">
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Rename</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCategoryToDelete(category)}
                      className="gap-1"
                      disabled={category.name === "Uncategorized"}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No categories found. Add products to create categories.</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"?
              <br />
              <span className="font-medium text-foreground">
                {categoryToDelete?.productCount} product(s)
              </span>{" "}
              will be moved to "Uncategorized".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
