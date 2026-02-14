export type ProjectStatus = 'pending' | 'designing' | 'quoting' | 'submitted' | 'archived';

export interface BidProject {
  id: string;
  name: string;
  client: string;
  industry: string;
  budget: string;
  deadline: string;
  status: ProjectStatus;
  source: 'crawled' | 'manual';
  requirements: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrawlConfig {
  id: string;
  url: string;
  keywords: string[];
  enabled: boolean;
}

export interface CaseRecord {
  id: string;
  projectId: string;
  name: string;
  industry: string;
  scale: string;
  finalQuote: number;
  result: 'won' | 'lost' | 'unknown';
  designSummary: string;
  archivedAt: string;
}

export interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  pending: '待确认',
  designing: '设计中',
  quoting: '报价中',
  submitted: '已提交',
  archived: '已归档',
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  designing: 'bg-blue-100 text-blue-800',
  quoting: 'bg-purple-100 text-purple-800',
  submitted: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
};
