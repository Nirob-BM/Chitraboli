import { useState, useRef } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserOrders } from "@/hooks/useUserOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, 
  Edit2, 
  Check, 
  X, 
  Mail, 
  Phone, 
  Calendar,
  Award,
  Wallet,
  ShoppingBag,
  Clock
} from "lucide-react";
import { format } from "date-fns";

export function ProfileOverview() {
  const { profile, user, updateProfile, uploadAvatar } = useUserProfile();
  const { getOrderStats } = useUserOrders();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || ""
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orderStats = getOrderStats();

  if (!profile || !user) return null;

  const loyaltyColors = {
    silver: "bg-gray-400",
    gold: "bg-yellow-500",
    platinum: "bg-purple-500",
    vip: "bg-gradient-to-r from-gold to-gold-light"
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await uploadAvatar(file);
    setUploading(false);
  };

  const handleSave = async () => {
    await updateProfile(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      full_name: profile.full_name || "",
      phone: profile.phone || ""
    });
    setIsEditing(false);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Profile Card */}
      <Card className="md:col-span-1 bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative group mb-4">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Name & Email */}
            {isEditing ? (
              <div className="w-full space-y-3 mb-4">
                <Input
                  value={editData.full_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Full Name"
                  className="text-center"
                />
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone Number"
                  className="text-center"
                />
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-xl font-semibold">
                    {profile.full_name || "Set your name"}
                  </h3>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              </>
            )}

            {/* Loyalty Badge */}
            <Badge 
              className={`${loyaltyColors[profile.loyalty_tier]} text-white mb-4 capitalize`}
            >
              <Award className="w-3 h-3 mr-1" />
              {profile.loyalty_tier} Member
            </Badge>

            {/* Email Verified Status */}
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className={profile.email_verified ? "text-green-500" : "text-yellow-500"}>
                {profile.email_verified ? "Email Verified" : "Email Not Verified"}
              </span>
            </div>

            {profile.phone && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            )}

            <Separator className="my-4" />

            {/* Account Info */}
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Member since {format(new Date(profile.created_at), 'MMM yyyy')}</span>
              </div>
              {profile.last_login_at && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last login {format(new Date(profile.last_login_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
        {/* Order Stats */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {orderStats.active} active • {orderStats.completed} completed
            </p>
          </CardContent>
        </Card>

        {/* Wallet Balance */}
        <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gold" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">৳{profile.wallet_balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              + ৳{profile.store_credit.toLocaleString()} store credit
            </p>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-green-500" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">৳{orderStats.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              On {orderStats.completed} completed orders
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm" asChild>
              <a href="/shop">Browse Shop</a>
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm" asChild>
              <a href="/track-order">Track Order</a>
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm" asChild>
              <a href="/contact">Contact Support</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
