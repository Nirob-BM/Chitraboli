-- Create user_profiles table for extended user data
CREATE TABLE public.user_profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  loyalty_tier TEXT DEFAULT 'silver' CHECK (loyalty_tier IN ('silver', 'gold', 'platinum', 'vip')),
  wallet_balance NUMERIC DEFAULT 0,
  store_credit NUMERIC DEFAULT 0,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated')),
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip TEXT,
  notification_preferences JSONB DEFAULT '{"order_updates": true, "price_drops": true, "new_collections": true, "promotions": true, "email": true, "sms": false, "whatsapp": false}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all profiles"
  ON public.user_profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_addresses table
CREATE TABLE public.user_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Bangladesh',
  is_default BOOLEAN DEFAULT false,
  address_type TEXT DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for user_addresses
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_addresses
CREATE POLICY "Users can view their own addresses"
  ON public.user_addresses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own addresses"
  ON public.user_addresses FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all addresses"
  ON public.user_addresses FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all addresses"
  ON public.user_addresses FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  price_at_add NUMERIC,
  notify_price_drop BOOLEAN DEFAULT true,
  notify_stock BOOLEAN DEFAULT true,
  UNIQUE(user_id, product_id)
);

-- Enable RLS for wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist
CREATE POLICY "Users can view their own wishlist"
  ON public.wishlist FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own wishlist"
  ON public.wishlist FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all wishlists"
  ON public.wishlist FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'refund', 'promotional', 'cashback')),
  description TEXT,
  reference_id TEXT,
  reference_type TEXT,
  balance_after NUMERIC NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON public.wallet_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create user_sessions table for tracking login sessions
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT,
  device_type TEXT,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all sessions"
  ON public.user_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create linked_accounts table for social providers
CREATE TABLE public.linked_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'apple', 'email')),
  provider_account_id TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT false,
  linked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS for linked_accounts
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for linked_accounts
CREATE POLICY "Users can view their own linked accounts"
  ON public.linked_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own linked accounts"
  ON public.linked_accounts FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all linked accounts"
  ON public.linked_accounts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create profile_audit_logs for tracking profile changes
CREATE TABLE public.profile_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for profile_audit_logs
ALTER TABLE public.profile_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_audit_logs
CREATE POLICY "Users can view their own audit logs"
  ON public.profile_audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.profile_audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
  ON public.profile_audit_logs FOR INSERT
  WITH CHECK (true);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'email_verified')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = now();
  
  -- Also insert email as linked account
  INSERT INTO public.linked_accounts (user_id, provider, email, is_primary)
  VALUES (NEW.id, 'email', NEW.email, true)
  ON CONFLICT (user_id, provider) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Create function to update profile timestamps
CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_updated_at();

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add indexes for performance
CREATE INDEX idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON public.wishlist(product_id);
CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_linked_accounts_user_id ON public.linked_accounts(user_id);
CREATE INDEX idx_profile_audit_logs_user_id ON public.profile_audit_logs(user_id);