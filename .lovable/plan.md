

# 修复招标搜索关键词问题

## 问题分析

当用户输入 "学校"、"设计"、"扩建" 等关键词搜索时，系统将原始关键词直接发送给 Firecrawl 搜索引擎。由于关键词过于宽泛，搜索结果返回的是普通网页（学校官网、设计教程等），而非招标公告。AI 解析这些非招标内容后自然返回空数组。

**验证结果**：使用 "学校 招标公告" 搜索时，成功返回了 6 条招标信息。

## 修复方案

### 1. 前端搜索自动补充招标关键词

修改 `src/pages/Tenders.tsx` 中的 `handleSearch` 函数，在发送搜索请求前自动为用户输入追加 "招标公告" 限定词。

### 2. 后端搜索增强

修改 `supabase/functions/firecrawl-search/index.ts`：
- 在构建搜索查询时，自动追加 "招标公告" 作为上下文限定词
- 添加调试日志输出 AI 原始响应，便于后续排查
- 优化 AI 提示词，放宽提取标准，对于可能相关的信息也尝试提取

### 3. 具体改动

**文件 1: `src/pages/Tenders.tsx`**
- `handleSearch` 中将 `searchQuery` 改为 `searchQuery + " 招标公告"`，确保搜索结果聚焦招标信息
- 在搜索输入框的 placeholder 中提示用户可以直接输入行业或项目关键词

**文件 2: `supabase/functions/firecrawl-search/index.ts`**
- 在构建 `searchQuery` 时自动追加 "招标公告" 后缀
- 添加 `console.log` 输出 AI 返回的原始内容，方便调试
- 增加 `scrapeOptions` 参数让 Firecrawl 返回更多页面内容

### 改动影响

- 用户只需输入行业关键词（如 "学校"、"设计"），系统自动定位招标信息
- 不影响爬取源配置中的抓取功能（`handleScrape` 已有类似逻辑）
- 改动范围小，仅涉及搜索查询构建逻辑

