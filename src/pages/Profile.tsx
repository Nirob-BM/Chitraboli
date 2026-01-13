import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  ShoppingBag, 
  Heart, 
  Wallet, 
  Shield, 
  Settings, 
  MapPin 
} from "lucide-react";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { ProfileOrders } from "@/components/profile/ProfileOrders";
import { ProfileWishlist } from "@/components/profile/ProfileWishlist";
import { ProfileWallet } from "@/components/profile/ProfileWallet";
import { ProfileSecurity } from "@/components/profile/ProfileSecurity";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { ProfileAddresses } from "@/components/profile/ProfileAddresses";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useUserProfile();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 pt-24">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              My Account
            </h1>
            <p className="text-muted-foreground">
              Manage your profile, orders, and preferences
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl mb-6">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary flex-1 min-w-[120px]"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary flex-1 min-w-[120px]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger 
                value="wishlist" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary flex-1 min-w-[120px]"
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Wishlist</span>
              </TabsTrigger>
              <TabsTrigger 
                value="wallet" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary flex-1 min-w-[120px]"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
              <TabsTrigger 
                value="addresses" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary flex-1 min-w-[120px]"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Addresses</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary flex-1 min-w-[120px]"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary flex-1 min-w-[120px]"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <ProfileOverview />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <ProfileOrders />
            </TabsContent>

            <TabsContent value="wishlist" className="mt-0">
              <ProfileWishlist />
            </TabsContent>

            <TabsContent value="wallet" className="mt-0">
              <ProfileWallet />
            </TabsContent>

            <TabsContent value="addresses" className="mt-0">
              <ProfileAddresses />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <ProfileSecurity />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <ProfileSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
