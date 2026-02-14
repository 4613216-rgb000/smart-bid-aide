import { Card, CardContent } from '@/components/ui/card';
import { Archive } from 'lucide-react';

export default function Cases() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">案例库</h1>
        <p className="text-muted-foreground text-sm mt-1">历史投标项目归档与查询</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Archive className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">暂无归档案例</p>
          <p className="text-xs mt-1">项目提交后将自动归档至此</p>
        </CardContent>
      </Card>
    </div>
  );
}
