import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { projectStore } from '@/lib/store';
import { STATUS_LABELS, STATUS_COLORS, type ProjectStatus, type BidProject } from '@/types/bid';
import { AlertTriangle, Clock, FolderOpen, Plus, ArrowRight } from 'lucide-react';

const KANBAN_COLUMNS: ProjectStatus[] = ['pending', 'designing', 'quoting', 'submitted'];

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const projects = useMemo(() => projectStore.getAll(), []);
  const upcoming = useMemo(() => projectStore.getUpcoming(7), []);

  const active = projects.filter(p => p.status !== 'archived' && p.status !== 'submitted');
  const grouped = KANBAN_COLUMNS.reduce((acc, status) => {
    acc[status] = projects.filter(p => p.status === status);
    return acc;
  }, {} as Record<ProjectStatus, BidProject[]>);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-muted-foreground text-sm mt-1">投标项目总览与快速操作</p>
        </div>
        <Button onClick={() => navigate('/projects')} className="gap-2">
          <Plus className="h-4 w-4" />
          新建项目
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">进行中项目</p>
              <p className="text-2xl font-bold">{active.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">7天内截止</p>
              <p className="text-2xl font-bold">{upcoming.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已提交</p>
              <p className="text-2xl font-bold">{grouped.submitted.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent deadlines */}
      {upcoming.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              即将截止
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map(p => {
              const days = daysUntil(p.deadline);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-card p-3 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.client}</p>
                  </div>
                  <Badge variant={days <= 3 ? 'destructive' : 'secondary'}>
                    {days <= 0 ? '已过期' : `${days}天`}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Kanban */}
      <div>
        <h2 className="text-lg font-semibold mb-4">项目看板</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map(status => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">{STATUS_LABELS[status]}</h3>
                <Badge variant="secondary" className="text-xs">{grouped[status].length}</Badge>
              </div>
              <div className="space-y-2 min-h-[120px] rounded-xl bg-muted/50 p-2">
                {grouped[status].map(project => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <p className="font-medium text-sm leading-tight">{project.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{project.client}</span>
                        <span className="text-xs text-muted-foreground">{project.budget}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{project.industry}</Badge>
                        <span className="text-xs text-muted-foreground">截止 {project.deadline}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {grouped[status].length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">暂无项目</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
