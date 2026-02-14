import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { projectStore } from '@/lib/store';
import { STATUS_LABELS, STATUS_COLORS, type ProjectStatus } from '@/types/bid';
import { ArrowLeft, Clock, Building2, Banknote, FileText } from 'lucide-react';

const STEPS: { status: ProjectStatus; label: string }[] = [
  { status: 'pending', label: '确认项目' },
  { status: 'designing', label: '设计方案' },
  { status: 'quoting', label: '检查报价' },
  { status: 'submitted', label: '提交' },
];

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = useMemo(() => projectStore.getById(id || ''), [id]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">项目未找到</p>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mt-4">
          返回项目列表
        </Button>
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex(s => s.status === project.status);
  const progressPercent = project.status === 'submitted' ? 100 : ((currentStepIdx + 1) / STEPS.length) * 100;
  const days = daysUntil(project.deadline);

  const handleNextStep = () => {
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < STEPS.length) {
      projectStore.updateStatus(project.id, STEPS[nextIdx].status);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate('/projects')} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        返回项目列表
      </Button>

      {/* Title & Status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{project.client}</p>
        </div>
        <Badge className={STATUS_COLORS[project.status]} variant="secondary">
          {STATUS_LABELS[project.status]}
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between text-sm">
            {STEPS.map((step, i) => (
              <span
                key={step.status}
                className={i <= currentStepIdx ? 'font-medium text-primary' : 'text-muted-foreground'}
              >
                {step.label}
              </span>
            ))}
          </div>
          <Progress value={progressPercent} className="h-2" />
          {project.status !== 'submitted' && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleNextStep}>
                进入下一步：{STEPS[currentStepIdx + 1]?.label}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">行业</p>
              <p className="text-sm font-medium">{project.industry}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Banknote className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">预算</p>
              <p className="text-sm font-medium">{project.budget}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">截止日期</p>
              <p className="text-sm font-medium">{project.deadline}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">倒计时</p>
              <p className={`text-sm font-medium ${days <= 7 ? 'text-destructive' : ''}`}>
                {days <= 0 ? '已过期' : `${days}天`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            项目需求
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{project.requirements}</p>
        </CardContent>
      </Card>
    </div>
  );
}
