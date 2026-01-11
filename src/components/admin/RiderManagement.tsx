import { useState } from "react";
import { useDeliveryRiders, DeliveryRider } from "@/hooks/useDeliveryRiders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Bike, Truck, Phone, Mail, Edit, Trash2, Loader2, User, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

const VEHICLE_TYPES = [
  { value: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { value: 'bicycle', label: 'Bicycle', icon: Bike },
  { value: 'van', label: 'Van', icon: Truck },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'on_delivery', label: 'On Delivery', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'offline', label: 'Offline', color: 'bg-muted text-muted-foreground' },
];

export const RiderManagement = () => {
  const { riders, loading, addRider, updateRider, deleteRider, updateRiderLocation, refetch } = useDeliveryRiders();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<DeliveryRider | null>(null);
  const [riderToDelete, setRiderToDelete] = useState<DeliveryRider | null>(null);
  const [locationRider, setLocationRider] = useState<DeliveryRider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationData, setLocationData] = useState({ latitude: "", longitude: "" });
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle_type: "motorcycle",
    license_number: "",
    is_active: true,
    current_status: "available" as 'available' | 'on_delivery' | 'offline',
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      vehicle_type: "motorcycle",
      license_number: "",
      is_active: true,
      current_status: "available",
    });
  };

  const handleAddRider = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    setIsSubmitting(true);
    const result = await addRider({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      vehicle_type: formData.vehicle_type,
      license_number: formData.license_number.trim() || null,
      is_active: formData.is_active,
      current_status: formData.current_status,
      profile_image_url: null,
    });

    if (result.success) {
      toast.success("Rider added successfully");
      setIsAddDialogOpen(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to add rider");
    }
    setIsSubmitting(false);
  };

  const handleUpdateRider = async () => {
    if (!editingRider) return;
    
    setIsSubmitting(true);
    const result = await updateRider(editingRider.id, {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      vehicle_type: formData.vehicle_type,
      license_number: formData.license_number.trim() || null,
      is_active: formData.is_active,
      current_status: formData.current_status,
    });

    if (result.success) {
      toast.success("Rider updated successfully");
      setEditingRider(null);
      resetForm();
    } else {
      toast.error(result.error || "Failed to update rider");
    }
    setIsSubmitting(false);
  };

  const handleDeleteRider = async () => {
    if (!riderToDelete) return;
    
    const result = await deleteRider(riderToDelete.id);
    if (result.success) {
      toast.success("Rider deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete rider");
    }
    setRiderToDelete(null);
  };

  const openEditDialog = (rider: DeliveryRider) => {
    setFormData({
      name: rider.name,
      phone: rider.phone,
      email: rider.email || "",
      vehicle_type: rider.vehicle_type,
      license_number: rider.license_number || "",
      is_active: rider.is_active,
      current_status: rider.current_status,
    });
    setEditingRider(rider);
  };

  const openLocationDialog = (rider: DeliveryRider) => {
    setLocationData({ latitude: "", longitude: "" });
    setLocationRider(rider);
  };

  const handleUpdateLocation = async () => {
    if (!locationRider) return;
    
    const lat = parseFloat(locationData.latitude);
    const lng = parseFloat(locationData.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Invalid coordinates range");
      return;
    }

    setIsSubmitting(true);
    const result = await updateRiderLocation(locationRider.id, lat, lng);
    
    if (result.success) {
      toast.success("Location updated successfully");
      setLocationRider(null);
      refetch();
    } else {
      toast.error(result.error || "Failed to update location");
    }
    setIsSubmitting(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationData({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        toast.success("Location captured!");
      },
      (error) => {
        toast.error("Unable to get location: " + error.message);
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption?.color || 'bg-muted text-muted-foreground';
  };

  const VehicleIcon = (type: string) => {
    const vehicle = VEHICLE_TYPES.find(v => v.value === type);
    const Icon = vehicle?.icon || Bike;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Delivery Riders</h2>
          <p className="text-sm text-muted-foreground">Manage your delivery team</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Rider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Rider</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Rider name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rider@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="License number"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddRider} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Rider"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{riders.length}</div>
            <div className="text-sm text-muted-foreground">Total Riders</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">
              {riders.filter(r => r.current_status === 'available').length}
            </div>
            <div className="text-sm text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">
              {riders.filter(r => r.current_status === 'on_delivery').length}
            </div>
            <div className="text-sm text-muted-foreground">On Delivery</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">
              {riders.filter(r => r.current_status === 'offline').length}
            </div>
            <div className="text-sm text-muted-foreground">Offline</div>
          </CardContent>
        </Card>
      </div>

      {/* Riders List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {riders.map((rider) => (
          <Card key={rider.id} className="bg-card/80 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{rider.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {VehicleIcon(rider.vehicle_type)}
                      <span className="capitalize">{rider.vehicle_type}</span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusBadge(rider.current_status)}>
                  {STATUS_OPTIONS.find(s => s.value === rider.current_status)?.label}
                </Badge>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${rider.phone}`} className="hover:text-foreground">{rider.phone}</a>
                </div>
                {rider.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{rider.email}</span>
                  </div>
                )}
                {rider.license_number && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">License:</span>
                    <span>{rider.license_number}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openLocationDialog(rider)}
                  className="text-primary hover:bg-primary/10"
                  title="Update Location"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(rider)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRiderToDelete(rider)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {riders.length === 0 && (
        <div className="text-center py-12">
          <Bike className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">No riders yet</h3>
          <p className="text-muted-foreground">Add your first delivery rider to get started</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingRider} onOpenChange={(open) => !open && setEditingRider(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.current_status} 
                onValueChange={(v) => setFormData({ ...formData, current_status: v as 'available' | 'on_delivery' | 'offline' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-license">License Number</Label>
              <Input
                id="edit-license"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditingRider(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateRider} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!riderToDelete} onOpenChange={(open) => !open && setRiderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rider?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {riderToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRider} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Location Update Dialog */}
      <Dialog open={!!locationRider} onOpenChange={(open) => !open && setLocationRider(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Update Rider Location
            </DialogTitle>
            <DialogDescription>
              Update live location for {locationRider?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button 
              variant="outline" 
              onClick={useCurrentLocation} 
              className="w-full gap-2"
            >
              <Navigation className="w-4 h-4" />
              Use Current Location
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or enter manually</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="23.8103"
                  value={locationData.latitude}
                  onChange={(e) => setLocationData({ ...locationData, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="90.4125"
                  value={locationData.longitude}
                  onChange={(e) => setLocationData({ ...locationData, longitude: e.target.value })}
                />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Location will be visible to customers tracking their orders in real-time.
            </p>
            
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setLocationRider(null)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateLocation} 
                disabled={isSubmitting || !locationData.latitude || !locationData.longitude} 
                className="flex-1"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Location"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
