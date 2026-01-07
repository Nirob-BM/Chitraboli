import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  category: string;
  label: string;
  description: string | null;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      
      const parsedSettings = (data || []).map(s => ({
        ...s,
        setting_value: typeof s.setting_value === 'string' 
          ? JSON.parse(s.setting_value) 
          : s.setting_value
      }));
      
      setSettings(parsedSettings);
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback((key: string) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value;
  }, [settings]);

  const getSettingsByCategory = useCallback((category: string) => {
    return settings.filter(s => s.category === category);
  }, [settings]);

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({ setting_value: JSON.stringify(value) })
        .eq("setting_key", key);

      if (error) throw error;
      
      setSettings(prev => prev.map(s => 
        s.setting_key === key ? { ...s, setting_value: value } : s
      ));
      
      return { success: true };
    } catch (err: any) {
      console.error("Error updating setting:", err);
      return { success: false, error: err.message };
    }
  };

  const updateMultipleSettings = async (updates: { key: string; value: any }[]) => {
    try {
      for (const update of updates) {
        const { error } = await supabase
          .from("site_settings")
          .update({ setting_value: JSON.stringify(update.value) })
          .eq("setting_key", update.key);

        if (error) throw error;
      }
      
      setSettings(prev => prev.map(s => {
        const update = updates.find(u => u.key === s.setting_key);
        return update ? { ...s, setting_value: update.value } : s;
      }));
      
      return { success: true };
    } catch (err: any) {
      console.error("Error updating settings:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    settings,
    loading,
    error,
    getSetting,
    getSettingsByCategory,
    updateSetting,
    updateMultipleSettings,
    refetch: fetchSettings,
  };
};
