import { supabase } from '@/integrations/supabase/client';

export type ParsedTender = {
  title: string;
  client: string | null;
  industry: string | null;
  budget: string | null;
  deadline: string | null;
  requirements: string | null;
  source_url?: string | null;
};

type ScrapeResponse = {
  success: boolean;
  error?: string;
  tenders?: ParsedTender[];
  rawMarkdown?: string;
  sourceUrl?: string;
};

type SearchResponse = {
  success: boolean;
  error?: string;
  tenders?: ParsedTender[];
  searchResultCount?: number;
};

export const firecrawlApi = {
  async scrape(url: string, keywords?: string[]): Promise<ScrapeResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, keywords },
    });
    if (error) return { success: false, error: error.message };
    return data;
  },

  async search(query: string, keywords?: string[], limit?: number): Promise<SearchResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-search', {
      body: { query, keywords, limit },
    });
    if (error) return { success: false, error: error.message };
    return data;
  },
};
