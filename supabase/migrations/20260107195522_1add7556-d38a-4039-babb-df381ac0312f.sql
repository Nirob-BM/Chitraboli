-- Create additional app_role values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'order_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_agent';

-- Site Settings table for global website configuration
CREATE TABLE public.site_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}',
    setting_type TEXT NOT NULL DEFAULT 'text',
    category TEXT NOT NULL DEFAULT 'general',
    label TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Page Content table for CMS
CREATE TABLE public.page_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_slug TEXT NOT NULL,
    section_key TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(page_slug, section_key)
);

-- Menu Items table for navigation management
CREATE TABLE public.menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_location TEXT NOT NULL DEFAULT 'header',
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    parent_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    open_in_new_tab BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Media Library table
CREATE TABLE public.media_library (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    alt_text TEXT,
    folder TEXT DEFAULT 'general',
    uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Activity Logs table
CREATE TABLE public.admin_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Sessions table for session tracking
CREATE TABLE public.admin_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- Customer Notes table
CREATE TABLE public.customer_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    note TEXT NOT NULL,
    note_type TEXT DEFAULT 'general',
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers table for customer management
CREATE TABLE public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT,
    name TEXT,
    address TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    is_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification Settings table
CREATE TABLE public.notification_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    whatsapp_enabled BOOLEAN DEFAULT false,
    recipients TEXT[] DEFAULT '{}',
    template JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backup History table
CREATE TABLE public.backup_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type TEXT NOT NULL,
    file_name TEXT,
    file_url TEXT,
    file_size INTEGER,
    status TEXT DEFAULT 'pending',
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_settings (public read, admin write)
CREATE POLICY "Site settings are publicly readable" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for page_content (public read, admin/content_manager write)
CREATE POLICY "Page content is publicly readable" ON public.page_content FOR SELECT USING (true);
CREATE POLICY "Admins can manage page content" ON public.page_content FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for menu_items (public read, admin write)
CREATE POLICY "Menu items are publicly readable" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage menu items" ON public.menu_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for media_library (public read, admin write)
CREATE POLICY "Media is publicly readable" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "Admins can manage media" ON public.media_library FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for admin_activity_logs (admin only)
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can create activity logs" ON public.admin_activity_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for admin_sessions (admin only)
CREATE POLICY "Admins can view sessions" ON public.admin_sessions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage sessions" ON public.admin_sessions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for customer_notes (admin only)
CREATE POLICY "Admins can view customer notes" ON public.customer_notes FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage customer notes" ON public.customer_notes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for customers (admin only)
CREATE POLICY "Admins can view customers" ON public.customers FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notification_settings (admin only)
CREATE POLICY "Admins can view notification settings" ON public.notification_settings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage notification settings" ON public.notification_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for backup_history (admin only)
CREATE POLICY "Admins can view backup history" ON public.backup_history FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage backups" ON public.backup_history FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, category, label, description) VALUES
('site_name', '"Chitraboli"', 'text', 'general', 'Site Name', 'The name of your website'),
('site_tagline', '"Exclusive Jewelry Collection"', 'text', 'general', 'Tagline', 'A short description of your website'),
('site_logo', '""', 'image', 'branding', 'Logo', 'Main website logo'),
('site_favicon', '""', 'image', 'branding', 'Favicon', 'Browser tab icon'),
('primary_color', '"#d4af37"', 'color', 'theme', 'Primary Color', 'Main brand color'),
('secondary_color', '"#1a1a2e"', 'color', 'theme', 'Secondary Color', 'Secondary brand color'),
('accent_color', '"#f5f5dc"', 'color', 'theme', 'Accent Color', 'Accent color for highlights'),
('currency_symbol', '"৳"', 'text', 'general', 'Currency Symbol', 'Currency symbol for prices'),
('currency_code', '"BDT"', 'text', 'general', 'Currency Code', 'ISO currency code'),
('timezone', '"Asia/Dhaka"', 'text', 'general', 'Timezone', 'Default timezone'),
('maintenance_mode', 'false', 'boolean', 'system', 'Maintenance Mode', 'Enable to show maintenance page'),
('maintenance_message', '"We are currently performing maintenance. Please check back soon."', 'textarea', 'system', 'Maintenance Message', 'Message shown during maintenance'),
('contact_email', '"info.chitraboli@gmail.com"', 'text', 'contact', 'Contact Email', 'Primary contact email'),
('contact_phone', '"+880 1234-567890"', 'text', 'contact', 'Contact Phone', 'Primary contact phone'),
('contact_address', '"Dhaka, Bangladesh"', 'textarea', 'contact', 'Address', 'Business address'),
('social_facebook', '"https://facebook.com/chitraboli"', 'text', 'social', 'Facebook URL', 'Facebook page URL'),
('social_instagram', '"https://instagram.com/chitraboli"', 'text', 'social', 'Instagram URL', 'Instagram profile URL'),
('social_whatsapp', '"+8801234567890"', 'text', 'social', 'WhatsApp Number', 'WhatsApp contact number'),
('footer_copyright', '"© 2024 Chitraboli. All rights reserved."', 'text', 'footer', 'Copyright Text', 'Footer copyright text'),
('seo_title', '"Chitraboli - Exclusive Jewelry Collection"', 'text', 'seo', 'Default SEO Title', 'Default page title for SEO'),
('seo_description', '"Discover exquisite handcrafted jewelry at Chitraboli. Premium quality necklaces, earrings, bangles and more."', 'textarea', 'seo', 'Default SEO Description', 'Default meta description'),
('seo_keywords', '"jewelry, gold, silver, necklace, earrings, bangles, chitraboli, bangladesh"', 'text', 'seo', 'SEO Keywords', 'Default meta keywords'),
('google_analytics_id', '""', 'text', 'analytics', 'Google Analytics ID', 'GA tracking ID'),
('facebook_pixel_id', '""', 'text', 'analytics', 'Facebook Pixel ID', 'FB Pixel tracking ID'),
('low_stock_threshold', '5', 'number', 'inventory', 'Low Stock Alert Threshold', 'Alert when stock falls below this number'),
('auto_confirm_orders', 'false', 'boolean', 'orders', 'Auto Confirm Orders', 'Automatically confirm new orders'),
('order_notification_email', '"info.chitraboli@gmail.com"', 'text', 'notifications', 'Order Notification Email', 'Email to receive order notifications');

-- Insert default notification settings
INSERT INTO public.notification_settings (notification_type, is_enabled, email_enabled, template) VALUES
('new_order', true, true, '{"subject": "New Order Received", "body": "You have received a new order #{{order_id}}"}'),
('order_status_change', true, true, '{"subject": "Order Status Updated", "body": "Order #{{order_id}} status changed to {{status}}"}'),
('low_stock', true, true, '{"subject": "Low Stock Alert", "body": "{{product_name}} is running low on stock ({{quantity}} remaining)"}'),
('new_contact_message', true, true, '{"subject": "New Contact Message", "body": "You have a new message from {{name}}"}'),
('payment_received', true, true, '{"subject": "Payment Received", "body": "Payment confirmed for order #{{order_id}}"}');

-- Insert default menu items
INSERT INTO public.menu_items (menu_location, label, url, display_order, is_visible) VALUES
('header', 'Home', '/', 1, true),
('header', 'Shop', '/shop', 2, true),
('header', 'Collections', '/collections', 3, true),
('header', 'About', '/about', 4, true),
('header', 'Contact', '/contact', 5, true),
('footer', 'Privacy Policy', '/privacy', 1, true),
('footer', 'Terms of Service', '/terms', 2, true),
('footer', 'Shipping Policy', '/shipping', 3, true),
('footer', 'Return Policy', '/returns', 4, true);

-- Insert default page content
INSERT INTO public.page_content (page_slug, section_key, content, display_order, is_visible) VALUES
('home', 'hero', '{"title": "Discover Exquisite Jewelry", "subtitle": "Handcrafted with Love & Precision", "cta_text": "Shop Now", "cta_link": "/shop", "background_image": ""}', 1, true),
('home', 'featured_title', '{"title": "Featured Products", "subtitle": "Our most popular pieces"}', 2, true),
('home', 'new_arrivals_title', '{"title": "New Arrivals", "subtitle": "Fresh designs just for you"}', 3, true),
('home', 'special_offers_title', '{"title": "Special Offers", "subtitle": "Limited time deals"}', 4, true),
('about', 'hero', '{"title": "About Chitraboli", "subtitle": "Our Story"}', 1, true),
('about', 'story', '{"title": "Our Story", "content": "Chitraboli is a premier jewelry destination offering exquisite handcrafted pieces that blend traditional craftsmanship with modern elegance."}', 2, true),
('about', 'mission', '{"title": "Our Mission", "content": "To provide high-quality, beautifully designed jewelry that celebrates your unique style and special moments."}', 3, true),
('contact', 'hero', '{"title": "Contact Us", "subtitle": "Get in touch with us"}', 1, true),
('contact', 'info', '{"title": "Contact Information", "content": "We would love to hear from you. Reach out to us through any of the following channels."}', 2, true);