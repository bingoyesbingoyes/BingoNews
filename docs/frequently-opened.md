# Frequently Opened 功能说明

## 概述

"Frequently Opened" 是一个自动记录用户常用链接的功能，通过统计每个链接的打开次数，在侧边栏展示最常访问的源。

## 数据结构

### OpenCountRecord
```typescript
interface OpenCountRecord {
  count: number;      // 累计打开次数
  lastOpened: string; // 最后打开时间 (ISO 8601格式)
}
```

### 存储位置
- **localStorage**: `bingonews_open_counts` (本地缓存)
- **config.json**: `openCounts` 字段 (持久化 + 跨设备同步)

## 核心逻辑

### 1. 计数触发

当用户点击任意链接时，调用 `incrementOpenCount(sourceId)`:

```typescript
function incrementOpenCount(sourceId: string) {
  const now = new Date().toISOString();
  const current = openCounts.value[sourceId] || { count: 0, lastOpened: '' };
  openCounts.value[sourceId] = {
    count: current.count + 1,
    lastOpened: now,
  };
  saveOpenCounts();
}
```

### 2. 触发点

以下操作会触发计数:
- `SourceItem.vue`: 点击单个链接
- `CategoryCard.vue`: "Open All" 批量打开分类下所有链接
- `FrequentlyOpenedCard.vue`: 点击常用链接

### 3. 排序算法

`frequentlyOpenedSources` 计算属性的排序规则:

```typescript
// 1. 首先按打开次数降序
// 2. 次数相同时，按最后打开时间降序
return allSources.sort((a, b) => {
  const countDiff = (b.openCount || 0) - (a.openCount || 0);
  if (countDiff !== 0) return countDiff;
  return (b.lastOpened || '').localeCompare(a.lastOpened || '');
});
```

### 4. 展示数量

`FrequentlyOpenedCard.vue` 默认展示前 **15** 个最常打开的链接:

```typescript
const topSources = computed(() => {
  return newsStore.frequentlyOpenedSources.slice(0, 15);
});
```

## 数据流

```
用户点击链接
    ↓
incrementOpenCount(sourceId)
    ↓
更新 openCounts ref
    ↓
saveOpenCounts()
    ↓
┌─────────────────────────────────┐
│  localStorage (立即保存)         │
│  config.json (防抖1秒后同步)     │
└─────────────────────────────────┘
    ↓
frequentlyOpenedSources 自动重新计算
    ↓
UI 更新
```

## 数据同步

### 写入
- localStorage: 立即写入
- config.json: 防抖 1 秒后写入 (避免频繁IO)

### 读取
- 应用启动时从 config.json 加载
- 同时写入 localStorage 作为缓存
- 每 2 秒轮询 config.json 检测外部修改

## 示例数据

```json
{
  "openCounts": {
    "wn_1": { "count": 42, "lastOpened": "2025-01-11T10:30:00.000Z" },
    "fin_3": { "count": 28, "lastOpened": "2025-01-11T09:15:00.000Z" },
    "tech_2": { "count": 15, "lastOpened": "2025-01-10T18:00:00.000Z" }
  }
}
```

## 相关文件

| 文件 | 作用 |
|------|------|
| `src/stores/newsStore.ts` | 状态管理、计数逻辑 |
| `src/types/index.ts` | 类型定义 |
| `src/composables/useConfigFile.ts` | 配置文件读写 |
| `src/components/FrequentlyOpenedCard.vue` | UI展示组件 |
| `src/components/Sidebar.vue` | 侧边栏导航入口 |
