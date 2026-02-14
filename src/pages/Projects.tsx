import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { projectStore } from '@/lib/store';
import { STATUS_LABELS, STATUS_COLORS } from '@/types/bid';
import { Plus, ArrowRight } from 'lucide-react';

export default function Projects() {
  const navigate = useNavigate();
  const projects = useMemo(() => projectStore.getAll(), []);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">投标项目</h1>
          <p className="text-muted-foreground text-sm mt-1">管理所有投标项目</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          新建项目
        </Button>
      </div>

      <div className="space-y-3">
        {projects.map(project => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{project.name}</h3>
                  <Badge className={STATUS_COLORS[project.status]} variant="secondary">
                    {STATUS_LABELS[project.status]}
                  </Badge>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{project.client}</span>
                  <span>{project.industry}</span>
                  <span>预算 {project.budget}</span>
                  <span>截止 {project.deadline}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
