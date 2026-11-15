import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Loader2, ImagePlus, Package, PlusCircle, X, AlertTriangle, RefreshCw } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  images: string[] | null;
  category: string;
  description: string | null;
  featured: boolean | null;
  in_stock: boolean | null;
  facebook_post_id: string | null;
  created_at: string;
  sizes: string[] | null;
  colors: string[] | null;
  stock_quantity: number | null;
  sku: string | null;
}

/** One photo slot in the form: either already saved, or newly picked and not uploaded yet. */
type ImageEntry =
  | { key: string; kind: "saved"; url: string }
  | { key: string; kind: "new"; file: File; preview: string };

const MAX_IMAGES = 4;
const DEFAULT_CATEGORIES = ["Rings", "Necklaces", "Earrings", "Bangles", "Bracelets", "Anklets", "Sets"];

const emptyForm = {
  name: "",
  price: "",
  category: "Rings",
  description: "",
  featured: false,
  in_stock: true,
  sizes: "",
  colors: "",
  stock_quantity: "",
  sku: "",
};

const splitList = (value: string) =>
  Array.from(new Set(value.split(",").map(v => v.trim()).filter(Boolean)));

const errorMessage = (error: unknown) => {
  const e = error as { message?: string; code?: string };
  if (e?.code === "23505") return "Another product already uses this SKU or name link.";
  return e?.message || "Unknown error";
};

let entryCounter = 0;
const nextKey = () => `img-${++entryCounter}`;

export const ProductManagement = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [nameError, setNameError] = useState<string | null>(null);
  const imagesRef = useRef<ImageEntry[]>([]);
  imagesRef.current = images;

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...products.map((p) => p.category)])
  ).sort();

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(error.message || "Products could not be loaded");
    } else {
      setLoadError(null);
      setProducts((data || []) as Product[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchProducts();
    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void fetchProducts();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  // Release preview memory when the component unmounts
  useEffect(() => () => {
    imagesRef.current.forEach(img => img.kind === "new" && URL.revokeObjectURL(img.preview));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast({ title: "Photo limit reached", description: `A product can have up to ${MAX_IMAGES} photos.`, variant: "destructive" });
      return;
    }
    const accepted = files.slice(0, room);
    if (files.length > room) {
      toast({
        title: "Some photos were not added",
        description: `Only ${room} more photo${room === 1 ? "" : "s"} fit (limit ${MAX_IMAGES}).`,
        variant: "destructive",
      });
    }
    // Previews are created synchronously so they always appear in the order picked.
    setImages(prev => [
      ...prev,
      ...accepted.map(file => ({ key: nextKey(), kind: "new" as const, file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removeImage = (key: string) => {
    setImages(prev => {
      const target = prev.find(img => img.key === key);
      if (target?.kind === "new") URL.revokeObjectURL(target.preview);
      return prev.filter(img => img.key !== key);
    });
  };

  const uploadImage = async (file: File): Promise<{ url: string; path: string }> => {
    const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const { error } = await supabase.storage.from("products").upload(filePath, file);
    if (error) throw new Error(`Photo "${file.name}" could not be uploaded: ${error.message}`);

    const { data } = supabase.storage.from("products").getPublicUrl(filePath);
    return { url: data.publicUrl, path: filePath };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      setNameError("Enter a product name (spaces alone are not allowed).");
      return;
    }
    setNameError(null);

    const price = Number(formData.price);
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: "Check the price", description: "Enter a price of 0 or more.", variant: "destructive" });
      return;
    }
    const stockText = formData.stock_quantity.trim();
    const stock = stockText === "" ? null : Number(stockText);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      toast({ title: "Check the stock", description: "Stock must be a whole number of 0 or more, or left empty.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const uploadedPaths: string[] = [];
    try {
      // Upload new photos in order; stop and save nothing if any upload fails.
      const finalUrls: string[] = [];
      for (const img of images) {
        if (img.kind === "saved") {
          finalUrls.push(img.url);
        } else {
          const uploaded = await uploadImage(img.file);
          uploadedPaths.push(uploaded.path);
          finalUrls.push(uploaded.url);
        }
      }

      const productData = {
        name,
        price,
        category: formData.category.trim() || "Rings",
        description: formData.description.trim() || null,
        image_url: finalUrls[0] ?? null,
        images: finalUrls,
        featured: formData.featured,
        in_stock: stock === 0 ? false : formData.in_stock,
        sizes: splitList(formData.sizes),
        colors: splitList(formData.colors),
        stock_quantity: stock,
        sku: formData.sku.trim() || null,
      };

      if (editingProduct) {
        const { data, error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("The product was not changed. It may have been deleted.");
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        const { data, error } = await supabase.from("products").insert([productData]).select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("The product was not saved.");
        toast({ title: "Success", description: "Product added successfully" });
      }

      closeModal();
      window.dispatchEvent(new Event("admin-changes-saved"));
      void fetchProducts();
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("products").remove(uploadedPaths).catch(() => undefined);
      }
      toast({ title: "Product not saved", description: errorMessage(error), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const product = productToDelete;
    if (!product) return;
    setDeletingId(product.id);
    try {
      const { data, error } = await supabase.from("products").delete().eq("id", product.id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Nothing was deleted. You may not have permission.");
      toast({ title: "Deleted", description: `"${product.name}" was deleted` });
      void fetchProducts();
    } catch (error) {
      toast({ title: "Product not deleted", description: errorMessage(error), variant: "destructive" });
    } finally {
      setDeletingId(null);
      setProductToDelete(null);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const existing = product.images?.length ? product.images : product.image_url ? [product.image_url] : [];
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description || "",
      featured: !!product.featured,
      in_stock: product.in_stock !== false,
      sizes: (product.sizes || []).join(", "),
      colors: (product.colors || []).join(", "),
      stock_quantity: product.stock_quantity === null || product.stock_quantity === undefined ? "" : String(product.stock_quantity),
      sku: product.sku || "",
    });
    setImages(existing.slice(0, MAX_IMAGES).map(url => ({ key: nextKey(), kind: "saved" as const, url })));
    setNameError(null);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setImages([]);
    setNameError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    images.forEach(img => img.kind === "new" && URL.revokeObjectURL(img.preview));
    setIsModalOpen(false);
    setEditingProduct(null);
    setImages([]);
    setShowCustomCategory(false);
    setCustomCategory("");
    setNameError(null);
    setFormData(emptyForm);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <div>
          <p className="font-display text-xl text-foreground">Products could not be loaded</p>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => { setLoading(true); void fetchProducts(); }}>
          <RefreshCw className="w-4 h-4" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Product Management</h2>
          <p className="text-sm text-muted-foreground">{products.length} products total</p>
        </div>
        <Button onClick={openAddModal} className="bg-gold hover:bg-gold-dark text-background">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
            <div className="aspect-square relative bg-muted">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              {product.featured && (
                <span className="absolute top-2 left-2 bg-gold text-background text-xs px-2 py-1 rounded">Featured</span>
              )}
              {(product.in_stock === false || product.stock_quantity === 0) && (
                <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                  Out of Stock
                </span>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground truncate">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.category}</p>
              <p className="text-gold font-semibold mt-1">৳{product.price.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {product.stock_quantity === null ? "Stock not tracked" : `${product.stock_quantity} in stock`}
                {product.sku ? ` · SKU ${product.sku}` : ""}
              </p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => openEditModal(product)} className="flex-1">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setProductToDelete(product)}
                  disabled={deletingId === product.id}
                  aria-label={`Delete ${product.name}`}
                >
                  {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No products yet. Add your first product!</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && !submitting && closeModal()}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update the product details below" : "Fill in the details to add a new product"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4" noValidate>
            {/* Images */}
            <div className="space-y-2">
              <Label>Product Images (up to {MAX_IMAGES})</Label>
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => (
                  <div key={img.key} className="relative aspect-square rounded-lg border border-border bg-muted overflow-hidden">
                    <img
                      src={img.kind === "saved" ? img.url : img.preview}
                      alt={`Photo ${index + 1}${index === 0 ? " (cover)" : ""}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-background/80 text-foreground">Cover</span>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeImage(img.key)}
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute top-1 right-1 h-8 w-8 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring transition-colors">
                    <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="sr-only"
                      aria-label="Add product photos"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {images.length}/{MAX_IMAGES} photos · The first photo is the cover
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                required
                value={formData.name}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? "product-name-error" : undefined}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setNameError(null); }}
                placeholder="Enter product name"
              />
              {nameError && <p id="product-name-error" className="text-xs text-destructive">{nameError}</p>}
            </div>

            {/* Price & stock */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price (৳) *</Label>
                <Input
                  id="product-price"
                  type="number"
                  inputMode="decimal"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-stock">Stock quantity</Label>
                <Input
                  id="product-stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="Not tracked"
                  aria-describedby="product-stock-help"
                />
              </div>
            </div>
            <p id="product-stock-help" className="text-xs text-muted-foreground -mt-2">
              Leave stock empty if you don't count it. 0 marks the product sold out.
            </p>

            {/* Sizes / colors / SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-sizes">Sizes</Label>
                <Input
                  id="product-sizes"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  placeholder="e.g. 6, 7, 8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-colors">Colors</Label>
                <Input
                  id="product-colors"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  placeholder="e.g. Gold, Silver"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Optional product code"
              />
              <p className="text-xs text-muted-foreground">Separate sizes and colors with commas.</p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor={showCustomCategory ? "product-custom-category" : "product-category"}>Category *</Label>
              {showCustomCategory ? (
                <div className="flex gap-2">
                  <Input
                    id="product-custom-category"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      setFormData({ ...formData, category: e.target.value });
                    }}
                    placeholder="Enter new category name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Cancel new category"
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCustomCategory("");
                      setFormData({ ...formData, category: allCategories[0] || "Rings" });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger id="product-category" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCustomCategory(true)}
                    aria-label="Add new category"
                    title="Add new category"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
              />
            </div>

            {/* Switches */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="in_stock"
                  checked={formData.in_stock && formData.stock_quantity.trim() !== "0"}
                  disabled={formData.stock_quantity.trim() === "0"}
                  onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                />
                <Label htmlFor="in_stock">Available to buy</Label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal} disabled={submitting} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 bg-gold hover:bg-gold-dark text-background">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{productToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the product from your shop. Past orders keep their details. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
