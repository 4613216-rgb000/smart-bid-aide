import { supabase } from '@/integrations/supabase/client';

export type ParsedTender = {
  title: string;
  client: string | null;
  industry: string | null;
  budget: string | null;
  deadline: string | null;
  requirements: string | null;
};

type ScrapeResponse = {
  success: boolean;
  error?: string;
  tenders?: ParsedTender[];
  rawMarkdown?: string;
  sourceUrl?: string;
};

export const firecrawlApi = {
  async scrape(url: string, keywords?: string[]): Promise<ScrapeResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, keywords },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
