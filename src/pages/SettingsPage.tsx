import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground text-sm mt-1">系统配置与爬取规则</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Settings className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">设置页面开发中</p>
          <p className="text-xs mt-1">后续可配置爬取规则和系统参数</p>
        </CardContent>
      </Card>
    </div>
  );
}
