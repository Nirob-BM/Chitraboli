import { useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Key, 
  Smartphone, 
  Monitor, 
  LogOut, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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

export function ProfileSecurity() {
  const { profile, linkedAccounts, sessions, terminateSession, terminateAllSessions, updateProfile, user } = useUserProfile();
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);

  if (!profile) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setChangingPassword(false);
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'apple':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
          </svg>
        );
      default:
        return <Key className="w-5 h-5" />;
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingProvider('google');
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`
        }
      });
      
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to link Google account");
      setLinkingProvider(null);
    }
  };

  const handleUnlinkProvider = async (provider: string) => {
    // Check if this is the last login method
    if (linkedAccounts.length <= 1) {
      toast.error("You must keep at least one login method active");
      return;
    }
    
    setUnlinkingProvider(provider);
    try {
      const linkedAccount = linkedAccounts.find(a => a.provider === provider);
      if (!linkedAccount) {
        toast.error("Account not found");
        return;
      }

      // Remove from linked_accounts table
      const { error } = await supabase
        .from('linked_accounts')
        .delete()
        .eq('id', linkedAccount.id);
      
      if (error) throw error;
      
      toast.success(`${provider} account unlinked successfully`);
      // Reload to refresh linked accounts
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || `Failed to unlink ${provider} account`);
    } finally {
      setUnlinkingProvider(null);
    }
  };

  // LinkedAccountRow component
  const LinkedAccountRow = ({ 
    provider, 
    linked, 
    onLink, 
    onUnlink, 
    icon, 
    linkedAccountsCount 
  }: { 
    provider: string;
    linked: any;
    onLink: () => void;
    onUnlink: () => void;
    icon: React.ReactNode;
    linkedAccountsCount: number;
  }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium text-sm capitalize">{provider}</p>
          {linked && (
            <p className="text-xs text-muted-foreground">{linked.email}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {linked ? (
          <>
            <Badge variant="default">Connected</Badge>
            {linkedAccountsCount > 1 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onUnlink}
                disabled={unlinkingProvider === provider}
                className="text-destructive hover:text-destructive"
              >
                {unlinkingProvider === provider ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Unlink"
                )}
              </Button>
            )}
          </>
        ) : (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLink}
            disabled={linkingProvider === provider}
          >
            {linkingProvider === provider ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Connect
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Verification Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {profile.email_verified ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium text-sm">Email Verification</p>
                <p className="text-xs text-muted-foreground">
                  {profile.email_verified ? "Your email is verified" : "Verify your email for better security"}
                </p>
              </div>
            </div>
            <Badge variant={profile.email_verified ? "default" : "secondary"}>
              {profile.email_verified ? "Verified" : "Pending"}
            </Badge>
          </div>

          {/* 2FA Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
            </div>
            <Switch
              checked={profile.two_factor_enabled}
              onCheckedChange={(checked) => {
                // 2FA would need more complex implementation
                toast.info("2FA setup requires additional configuration");
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Password
          </CardTitle>
          <CardDescription>
            Change your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {changingPassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.new}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type={showPasswords ? "text" : "password"}
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update Password
                </Button>
                <Button type="button" variant="outline" onClick={() => setChangingPassword(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setChangingPassword(true)}>
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Linked Accounts */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>
            Manage connected social accounts for easier sign-in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Google */}
          <LinkedAccountRow
            provider="google"
            linked={linkedAccounts.find(a => a.provider === 'google')}
            onLink={handleLinkGoogle}
            onUnlink={() => handleUnlinkProvider('google')}
            icon={getProviderIcon('google')}
            linkedAccountsCount={linkedAccounts.length}
          />
          
          {/* Facebook - Not supported in Lovable Cloud */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 opacity-60">
            <div className="flex items-center gap-3">
              {getProviderIcon('facebook')}
              <div>
                <p className="font-medium text-sm capitalize">Facebook</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
            <Badge variant="outline">Not Available</Badge>
          </div>
          
          {/* Apple - Not supported in Lovable Cloud */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 opacity-60">
            <div className="flex items-center gap-3">
              {getProviderIcon('apple')}
              <div>
                <p className="font-medium text-sm capitalize">Apple</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
            <Badge variant="outline">Not Available</Badge>
          </div>

          {/* Email/Password */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {getProviderIcon('email')}
              <div>
                <p className="font-medium text-sm">Email & Password</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <Badge variant="default">Primary</Badge>
          </div>
          
          <p className="text-xs text-muted-foreground pt-2">
            You must keep at least one login method active. Linking accounts with the same email will automatically merge your data.
          </p>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Devices currently logged into your account
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Log out from all devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out from all devices including this one. You'll need to log in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={terminateAllSessions}>
                    Log Out All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active sessions found
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {session.device_name || session.browser || 'Unknown Device'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.location && `${session.location} • `}
                        {session.ip_address && `${session.ip_address} • `}
                        Last active: {session.last_activity 
                          ? format(new Date(session.last_activity), 'MMM d, h:mm a')
                          : 'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => terminateSession(session.id)}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-destructive/5 border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible account actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Deactivate Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate your account. Your data will be preserved but you won't be able to access your account until it's reactivated by our support team.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground">
                  Deactivate Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
