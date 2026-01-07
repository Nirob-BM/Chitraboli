import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

import type { Json } from "@/integrations/supabase/types";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Json;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const useActivityLogs = (limit: number = 50) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error("Error fetching activity logs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logActivity = async (
    action: string, 
    entityType?: string, 
    entityId?: string, 
    details?: Record<string, any>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("admin_activity_logs")
        .insert({
          user_id: user?.id || null,
          user_email: user?.email || null,
          action,
          entity_type: entityType || null,
          entity_id: entityId || null,
          details: details || {},
        });

      if (error) throw error;
      
      fetchLogs();
      return { success: true };
    } catch (err: any) {
      console.error("Error logging activity:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    logs,
    loading,
    error,
    logActivity,
    refetch: fetchLogs,
  };
};
