import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PageContent {
  id: string;
  page_slug: string;
  section_key: string;
  content: Record<string, any>;
  is_visible: boolean;
  display_order: number;
}

export const usePageContent = (pageSlug?: string) => {
  const [content, setContent] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      let query = supabase
        .from("page_content")
        .select("*")
        .order("display_order", { ascending: true });

      if (pageSlug) {
        query = query.eq("page_slug", pageSlug);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const parsedContent = (data || []).map(c => ({
        ...c,
        content: typeof c.content === 'string' ? JSON.parse(c.content) : c.content
      }));
      
      setContent(parsedContent);
    } catch (err: any) {
      console.error("Error fetching page content:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pageSlug]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const getSection = useCallback((sectionKey: string) => {
    return content.find(c => c.section_key === sectionKey);
  }, [content]);

  const getSectionContent = useCallback((sectionKey: string) => {
    const section = content.find(c => c.section_key === sectionKey);
    return section?.content || {};
  }, [content]);

  const updateSection = async (sectionKey: string, newContent: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from("page_content")
        .update({ content: newContent })
        .eq("page_slug", pageSlug)
        .eq("section_key", sectionKey);

      if (error) throw error;
      
      setContent(prev => prev.map(c => 
        c.section_key === sectionKey ? { ...c, content: newContent } : c
      ));
      
      return { success: true };
    } catch (err: any) {
      console.error("Error updating section:", err);
      return { success: false, error: err.message };
    }
  };

  const toggleSectionVisibility = async (sectionKey: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from("page_content")
        .update({ is_visible: isVisible })
        .eq("page_slug", pageSlug)
        .eq("section_key", sectionKey);

      if (error) throw error;
      
      setContent(prev => prev.map(c => 
        c.section_key === sectionKey ? { ...c, is_visible: isVisible } : c
      ));
      
      return { success: true };
    } catch (err: any) {
      console.error("Error toggling visibility:", err);
      return { success: false, error: err.message };
    }
  };

  const updateDisplayOrder = async (sectionKey: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from("page_content")
        .update({ display_order: newOrder })
        .eq("page_slug", pageSlug)
        .eq("section_key", sectionKey);

      if (error) throw error;
      
      setContent(prev => prev.map(c => 
        c.section_key === sectionKey ? { ...c, display_order: newOrder } : c
      ));
      
      return { success: true };
    } catch (err: any) {
      console.error("Error updating display order:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    content,
    loading,
    error,
    getSection,
    getSectionContent,
    updateSection,
    toggleSectionVisibility,
    updateDisplayOrder,
    refetch: fetchContent,
  };
};
