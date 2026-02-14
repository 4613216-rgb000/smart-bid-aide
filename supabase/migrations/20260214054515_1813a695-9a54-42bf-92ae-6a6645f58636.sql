
-- 爬取配置表
CREATE TABLE public.crawl_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 招标信息表
CREATE TABLE public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client TEXT,
  industry TEXT,
  budget TEXT,
  deadline TEXT,
  requirements TEXT,
  source_url TEXT,
  raw_content TEXT,
  crawl_config_id UUID REFERENCES public.crawl_configs(id),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'ignored')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 无用户系统，RLS 设置为公开访问
ALTER TABLE public.crawl_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to crawl_configs" ON public.crawl_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tenders" ON public.tenders FOR ALL USING (true) WITH CHECK (true);

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_crawl_configs_updated_at
  BEFORE UPDATE ON public.crawl_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenders_updated_at
  BEFORE UPDATE ON public.tenders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
