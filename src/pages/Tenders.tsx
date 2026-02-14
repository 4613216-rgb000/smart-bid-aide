import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { firecrawlApi, type ParsedTender } from '@/lib/api/firecrawl';
import { projectStore } from '@/lib/store';
import {
  Plus, Search, Settings2, Globe, Loader2, Check, X, RefreshCw, ExternalLink, SearchCheck,
} from 'lucide-react';

type CrawlConfig = {
  id: string;
  name: string;
  url: string;
  keywords: string[];
  enabled: boolean;
  last_crawled_at: string | null;
  created_at: string;
};

type TenderRecord = {
  id: string;
  title: string;
  client: string | null;
  industry: string | null;
  budget: string | null;
  deadline: string | null;
  requirements: string | null;
  source_url: string | null;
  status: string;
  created_at: string;
};

export default function Tenders() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<CrawlConfig[]>([]);
  const [tenders, setTenders] = useState<TenderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<string | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configForm, setConfigForm] = useState({ name: '', url: '', keywords: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [configRes, tenderRes] = await Promise.all([
      supabase.from('crawl_configs').select('*').order('created_at', { ascending: false }),
      supabase.from('tenders').select('*').order('created_at', { ascending: false }),
    ]);
    if (configRes.data) setConfigs(configRes.data as CrawlConfig[]);
    if (tenderRes.data) setTenders(tenderRes.data as TenderRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddConfig = async () => {
    if (!configForm.name || !configForm.url) {
      toast({ title: '请填写名称和URL', variant: 'destructive' });
      return;
    }
    const keywords = configForm.keywords.split(/[,，\s]+/).filter(Boolean);
    const { error } = await supabase.from('crawl_configs').insert({
      name: configForm.name,
      url: configForm.url,
      keywords,
    });
    if (error) {
      toast({ title: '添加失败', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '爬取配置已添加' });
      setConfigForm({ name: '', url: '', keywords: '' });
      setShowConfigDialog(false);
      fetchData();
    }
  };

  const handleToggleConfig = async (id: string, enabled: boolean) => {
    await supabase.from('crawl_configs').update({ enabled }).eq('id', id);
    fetchData();
  };

  const handleDeleteConfig = async (id: string) => {
    await supabase.from('crawl_configs').delete().eq('id', id);
    fetchData();
  };

  const handleScrape = async (config: CrawlConfig) => {
    setScraping(config.id);
    try {
      // Try scrape first
      let res = await firecrawlApi.scrape(config.url, config.keywords);
      let newTenders = res.tenders || [];

      // If scrape returned no results, fallback to search
      if (res.success && newTenders.length === 0) {
        const searchQ = `${config.name} 招标公告 ${config.keywords.join(' ')}`.trim();
        const searchRes = await firecrawlApi.search(searchQ, config.keywords, 10);
        if (searchRes.success) {
          newTenders = searchRes.tenders || [];
        }
      }

      if (!res.success) {
        // Direct scrape failed, try search as fallback
        const searchQ = `${config.name} 招标公告 ${config.keywords.join(' ')}`.trim();
        const searchRes = await firecrawlApi.search(searchQ, config.keywords, 10);
        if (!searchRes.success) {
          toast({ title: '抓取失败', description: searchRes.error, variant: 'destructive' });
          return;
        }
        newTenders = searchRes.tenders || [];
      }

      if (newTenders.length === 0) {
        toast({ title: '未发现招标信息', description: '未找到匹配的招标公告' });
      } else {
        const rows = newTenders.map((t: ParsedTender) => ({
          title: t.title,
          client: t.client,
          industry: t.industry,
          budget: t.budget,
          deadline: t.deadline,
          requirements: t.requirements,
          source_url: t.source_url || res.sourceUrl || config.url,
          crawl_config_id: config.id,
          status: 'new',
        }));
        await supabase.from('tenders').insert(rows);
        toast({ title: `发现 ${newTenders.length} 条招标信息` });
      }

      await supabase.from('crawl_configs').update({ last_crawled_at: new Date().toISOString() }).eq('id', config.id);
      fetchData();
    } catch (e) {
      toast({ title: '抓取出错', description: String(e), variant: 'destructive' });
    } finally {
      setScraping(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: '请输入搜索关键词', variant: 'destructive' });
      return;
    }
    setSearching(true);
    try {
      const enhancedQuery = `${searchQuery.trim()} 招标公告`;
      const res = await firecrawlApi.search(enhancedQuery, [], 10);
      if (!res.success) {
        toast({ title: '搜索失败', description: res.error, variant: 'destructive' });
        return;
      }
      const newTenders = res.tenders || [];
      if (newTenders.length === 0) {
        toast({ title: '未发现招标信息', description: '搜索未找到匹配的招标公告' });
      } else {
        const rows = newTenders.map((t: ParsedTender) => ({
          title: t.title,
          client: t.client,
          industry: t.industry,
          budget: t.budget,
          deadline: t.deadline,
          requirements: t.requirements,
          source_url: t.source_url,
          status: 'new',
        }));
        await supabase.from('tenders').insert(rows);
        toast({ title: `搜索发现 ${newTenders.length} 条招标信息` });
      }
      fetchData();
    } catch (e) {
      toast({ title: '搜索出错', description: String(e), variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmTender = async (tender: TenderRecord) => {
    // Create project from tender
    const newProject = {
      id: crypto.randomUUID(),
      name: tender.title,
      client: tender.client || '未知',
      industry: tender.industry || '未分类',
      budget: tender.budget || '待定',
      deadline: tender.deadline || new Date().toISOString().split('T')[0],
      status: 'pending' as const,
      source: 'crawled' as const,
      requirements: tender.requirements || '',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    projectStore.save(newProject);

    // Update tender status
    await supabase.from('tenders').update({ status: 'confirmed' }).eq('id', tender.id);
    toast({ title: '已确认立项', description: `项目「${tender.title}」已创建` });
    fetchData();
  };

  const handleIgnoreTender = async (id: string) => {
    await supabase.from('tenders').update({ status: 'ignored' }).eq('id', id);
    fetchData();
  };

  const newTenders = tenders.filter(t => t.status === 'new');
  const confirmedTenders = tenders.filter(t => t.status === 'confirmed');

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">招标信息</h1>
          <p className="text-muted-foreground text-sm mt-1">自动采集的招标公告与爬取配置</p>
        </div>
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              添加爬取源
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加爬取配置</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>名称</Label>
                <Input
                  placeholder="例：中国招标网"
                  value={configForm.name}
                  onChange={e => setConfigForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>网站 URL</Label>
                <Input
                  placeholder="https://www.example.com/tenders"
                  value={configForm.url}
                  onChange={e => setConfigForm(f => ({ ...f, url: e.target.value }))}
                />
              </div>
              <div>
                <Label>关键词过滤（用逗号分隔）</Label>
                <Input
                  placeholder="智慧交通, 信息化, 安防"
                  value={configForm.keywords}
                  onChange={e => setConfigForm(f => ({ ...f, keywords: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddConfig} className="w-full">保存配置</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Crawl Configs */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          爬取源配置
        </h2>
        {configs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Globe className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">暂无爬取配置</p>
              <p className="text-xs mt-1">点击"添加爬取源"开始配置</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {configs.map(config => (
              <Card key={config.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{config.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{config.url}</p>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={v => handleToggleConfig(config.id, v)}
                    />
                  </div>
                  {config.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {config.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {config.last_crawled_at
                        ? `上次抓取: ${new Date(config.last_crawled_at).toLocaleDateString()}`
                        : '尚未抓取'}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScrape(config)}
                        disabled={scraping === config.id || !config.enabled}
                        className="gap-1"
                      >
                        {scraping === config.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        抓取
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Search */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <SearchCheck className="h-4 w-4" />
            快速搜索招标信息
          </h2>
          <div className="flex gap-2">
            <Input
              placeholder="输入行业或项目关键词，例：学校 设计 扩建"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching} className="gap-1">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Search className="h-4 w-4" />
          新发现的招标 <Badge variant="secondary">{newTenders.length}</Badge>
        </h2>
        {newTenders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              暂无新招标信息，请配置爬取源并执行抓取
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {newTenders.map(tender => (
              <Card key={tender.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{tender.title}</h3>
                        {tender.source_url && (
                          <a href={tender.source_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                        {tender.client && <span>招标方: {tender.client}</span>}
                        {tender.industry && <span>行业: {tender.industry}</span>}
                        {tender.budget && <span>预算: {tender.budget}</span>}
                        {tender.deadline && <span>截止: {tender.deadline}</span>}
                      </div>
                      {tender.requirements && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{tender.requirements}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" onClick={() => handleConfirmTender(tender)} className="gap-1">
                        <Check className="h-3 w-3" />
                        确认立项
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleIgnoreTender(tender.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmed Tenders */}
      {confirmedTenders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">已确认立项 <Badge variant="secondary">{confirmedTenders.length}</Badge></h2>
          <div className="space-y-2">
            {confirmedTenders.map(tender => (
              <Card key={tender.id} className="opacity-70">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{tender.title}</p>
                    <p className="text-xs text-muted-foreground">{tender.client} · {tender.industry}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">已立项</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
