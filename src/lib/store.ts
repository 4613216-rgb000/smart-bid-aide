import { BidProject, CaseRecord, CrawlConfig, ProjectStatus } from '@/types/bid';

const STORAGE_KEYS = {
  projects: 'bidsmart_projects',
  cases: 'bidsmart_cases',
  crawlConfigs: 'bidsmart_crawl_configs',
};

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Demo data
const DEMO_PROJECTS: BidProject[] = [
  {
    id: '1',
    name: '市政道路智慧交通监控系统',
    client: '某市交通管理局',
    industry: '智慧交通',
    budget: '500-800万',
    deadline: '2026-03-15',
    status: 'designing',
    source: 'crawled',
    requirements: '建设覆盖全市主要道路的智慧交通监控系统，包含视频监控、流量分析、信号控制等模块。',
    createdAt: '2026-02-10',
    updatedAt: '2026-02-13',
  },
  {
    id: '2',
    name: '产业园区综合能源管理平台',
    client: '某经济开发区管委会',
    industry: '能源管理',
    budget: '300-500万',
    deadline: '2026-03-01',
    status: 'quoting',
    source: 'crawled',
    requirements: '建设园区综合能源管理平台，实现能耗监测、节能优化、碳排放管理等功能。',
    createdAt: '2026-02-05',
    updatedAt: '2026-02-12',
  },
  {
    id: '3',
    name: '医院信息化升级改造项目',
    client: '某三甲医院',
    industry: '医疗信息化',
    budget: '200-400万',
    deadline: '2026-04-10',
    status: 'pending',
    source: 'crawled',
    requirements: 'HIS系统升级、电子病历系统建设、远程会诊平台搭建。',
    createdAt: '2026-02-14',
    updatedAt: '2026-02-14',
  },
  {
    id: '4',
    name: '智慧校园安防系统建设',
    client: '某大学',
    industry: '智慧校园',
    budget: '150-250万',
    deadline: '2026-02-28',
    status: 'pending',
    source: 'crawled',
    requirements: '校园安防监控系统、人脸识别门禁、访客管理系统建设。',
    createdAt: '2026-02-13',
    updatedAt: '2026-02-13',
  },
  {
    id: '5',
    name: '水务集团SCADA系统',
    client: '某水务集团',
    industry: '水务',
    budget: '400-600万',
    deadline: '2026-05-01',
    status: 'submitted',
    source: 'manual',
    requirements: '供水管网SCADA系统建设，含远程监控、压力调度、漏损检测等。',
    createdAt: '2026-01-20',
    updatedAt: '2026-02-11',
  },
];

export const projectStore = {
  getAll(): BidProject[] {
    return load<BidProject>(STORAGE_KEYS.projects, DEMO_PROJECTS);
  },
  getById(id: string): BidProject | undefined {
    return this.getAll().find(p => p.id === id);
  },
  save(project: BidProject) {
    const all = this.getAll();
    const idx = all.findIndex(p => p.id === project.id);
    if (idx >= 0) all[idx] = project;
    else all.push(project);
    save(STORAGE_KEYS.projects, all);
  },
  updateStatus(id: string, status: ProjectStatus) {
    const project = this.getById(id);
    if (project) {
      project.status = status;
      project.updatedAt = new Date().toISOString().split('T')[0];
      this.save(project);
    }
  },
  getByStatus(status: ProjectStatus): BidProject[] {
    return this.getAll().filter(p => p.status === status);
  },
  getUpcoming(days = 7): BidProject[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return this.getAll().filter(p => {
      if (p.status === 'submitted' || p.status === 'archived') return false;
      return new Date(p.deadline) <= cutoff;
    });
  },
};

export const caseStore = {
  getAll(): CaseRecord[] {
    return load<CaseRecord>(STORAGE_KEYS.cases, []);
  },
  save(record: CaseRecord) {
    const all = this.getAll();
    all.push(record);
    save(STORAGE_KEYS.cases, all);
  },
};
