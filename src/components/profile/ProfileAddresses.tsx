import { useState } from "react";
import { useUserProfile, UserAddress } from "@/hooks/useUserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Star, 
  Home, 
  Building2, 
  Gift 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

const labelIcons: Record<string, React.ReactNode> = {
  Home: <Home className="w-4 h-4" />,
  Office: <Building2 className="w-4 h-4" />,
  Gift: <Gift className="w-4 h-4" />,
  Other: <MapPin className="w-4 h-4" />
};

const defaultAddress: Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Bangladesh",
  is_default: false,
  address_type: "shipping"
};

export function ProfileAddresses() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useUserProfile();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [formData, setFormData] = useState(defaultAddress);
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    setFormData(defaultAddress);
    setEditingAddress(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (address: UserAddress) => {
    setFormData({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone || "",
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state || "",
      postal_code: address.postal_code || "",
      country: address.country,
      is_default: address.is_default,
      address_type: address.address_type
    });
    setEditingAddress(address);
    setIsAddOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingAddress) {
      await updateAddress(editingAddress.id, formData);
    } else {
      await addAddress(formData);
    }

    setSaving(false);
    setIsAddOpen(false);
    setEditingAddress(null);
    setFormData(defaultAddress);
  };

  const handleDelete = async (id: string) => {
    await deleteAddress(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Saved Addresses</h2>
          <p className="text-sm text-muted-foreground">
            Manage your shipping and billing addresses
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Select
                    value={formData.label}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, label: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Gift">Gift</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_type">Address Type</Label>
                  <Select
                    value={formData.address_type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, address_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipping">Shipping</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1 *</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                  placeholder="Street address, P.O. box"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Division</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_default: checked === true }))
                  }
                />
                <Label htmlFor="is_default" className="text-sm cursor-pointer">
                  Set as default address
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No saved addresses</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your shipping addresses for faster checkout
            </p>
            <Button onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map(address => (
            <Card 
              key={address.id} 
              className={`bg-card/50 border-border/50 ${address.is_default ? 'ring-2 ring-primary' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-muted">
                      {labelIcons[address.label] || labelIcons.Other}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{address.label}</span>
                        {address.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {address.address_type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(address)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this address. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(address.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="font-medium">{address.full_name}</p>
                  {address.phone && (
                    <p className="text-muted-foreground">{address.phone}</p>
                  )}
                  <p className="text-muted-foreground">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </p>
                  <p className="text-muted-foreground">
                    {address.city}
                    {address.state && `, ${address.state}`}
                    {address.postal_code && ` - ${address.postal_code}`}
                  </p>
                  <p className="text-muted-foreground">{address.country}</p>
                </div>

                {!address.is_default && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={() => setDefaultAddress(address.id)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Set as Default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
