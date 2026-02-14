import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderSearch } from 'lucide-react';

export default function Tenders() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">招标信息</h1>
        <p className="text-muted-foreground text-sm mt-1">自动采集的招标公告与爬取配置</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FolderSearch className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">招标信息采集功能即将上线</p>
          <p className="text-xs mt-1">配置Firecrawl连接后可自动抓取招标公告</p>
        </CardContent>
      </Card>
    </div>
  );
}
