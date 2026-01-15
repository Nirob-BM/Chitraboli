import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  loyalty_tier: 'silver' | 'gold' | 'platinum' | 'vip';
  wallet_balance: number;
  store_credit: number;
  account_status: 'active' | 'suspended' | 'deactivated';
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  notification_preferences: {
    order_updates: boolean;
    price_drops: boolean;
    new_collections: boolean;
    promotions: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  address_type: 'shipping' | 'billing' | 'both';
  created_at: string;
  updated_at: string;
}

export interface LinkedAccount {
  id: string;
  user_id: string;
  provider: 'google' | 'facebook' | 'apple' | 'email';
  provider_account_id: string | null;
  email: string | null;
  is_primary: boolean;
  linked_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string | null;
  device_type: string | null;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  is_active: boolean;
  last_activity: string | null;
  created_at: string;
  expires_at: string | null;
}

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data as UserProfile | null);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    }
  }, []);

  const fetchAddresses = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data as UserAddress[]);
    } catch (err: any) {
      console.error('Error fetching addresses:', err);
    }
  }, []);

  const fetchLinkedAccounts = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('linked_accounts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setLinkedAccounts(data as LinkedAccount[]);
    } catch (err: any) {
      console.error('Error fetching linked accounts:', err);
    }
  }, []);

  const fetchSessions = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setSessions(data as UserSession[]);
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          Promise.all([
            fetchProfile(session.user.id),
            fetchAddresses(session.user.id),
            fetchLinkedAccounts(session.user.id),
            fetchSessions(session.user.id)
          ]).finally(() => setLoading(false));
        }, 0);
      } else {
        setProfile(null);
        setAddresses([]);
        setLinkedAccounts([]);
        setSessions([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchAddresses(session.user.id),
          fetchLinkedAccounts(session.user.id),
          fetchSessions(session.user.id)
        ]).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchAddresses, fetchLinkedAccounts, fetchSessions]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated successfully');
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to update profile');
      return { error: err.message };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: 'Not authenticated', url: null };

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });

      return { error: null, url: publicUrl };
    } catch (err: any) {
      toast.error('Failed to upload avatar');
      return { error: err.message, url: null };
    }
  };

  const addAddress = async (address: Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // If setting as default, unset other defaults first
      if (address.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .insert({ ...address, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setAddresses(prev => address.is_default ? [data as UserAddress, ...prev.map(a => ({ ...a, is_default: false }))] : [...prev, data as UserAddress]);
      toast.success('Address added successfully');
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to add address');
      return { error: err.message };
    }
  };

  const updateAddress = async (id: string, updates: Partial<UserAddress>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('user_addresses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setAddresses(prev => prev.map(addr => 
        addr.id === id ? { ...addr, ...updates } : 
        updates.is_default ? { ...addr, is_default: false } : addr
      ));
      toast.success('Address updated successfully');
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to update address');
      return { error: err.message };
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success('Address deleted successfully');
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to delete address');
      return { error: err.message };
    }
  };

  const setDefaultAddress = async (id: string) => {
    return updateAddress(id, { is_default: true });
  };

  const updateNotificationPreferences = async (preferences: Partial<UserProfile['notification_preferences']>) => {
    if (!profile) return { error: 'Profile not loaded' };

    const newPreferences = { ...profile.notification_preferences, ...preferences };
    return updateProfile({ notification_preferences: newPreferences });
  };

  const terminateSession = async (sessionId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session terminated');
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to terminate session');
      return { error: err.message };
    }
  };

  const terminateAllSessions = async () => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions([]);
      toast.success('All sessions terminated');
      
      // Sign out from current session
      await supabase.auth.signOut();
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to terminate sessions');
      return { error: err.message };
    }
  };

  const requestAccountDeactivation = async (reason: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Log the deactivation request
      await supabase.from('profile_audit_logs').insert({
        user_id: user.id,
        action: 'deactivation_request',
        field_changed: 'account_status',
        new_value: reason,
        changed_by: user.id
      });

      // Update profile status
      await updateProfile({ account_status: 'deactivated' });

      // Sign out
      await supabase.auth.signOut();
      
      toast.success('Account deactivation requested');
      return { error: null };
    } catch (err: any) {
      toast.error('Failed to request deactivation');
      return { error: err.message };
    }
  };

  return {
    user,
    profile,
    addresses,
    linkedAccounts,
    sessions,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    updateNotificationPreferences,
    terminateSession,
    terminateAllSessions,
    requestAccountDeactivation,
    refetch: () => {
      if (user) {
        fetchProfile(user.id);
        fetchAddresses(user.id);
        fetchLinkedAccounts(user.id);
        fetchSessions(user.id);
      }
    }
  };
}
