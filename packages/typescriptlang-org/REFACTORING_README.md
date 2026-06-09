# Documentation Markdown 渲染逻辑重构

## 概述

本次重构将原本耦合在 `documentation.tsx` 组件中的 Markdown 渲染逻辑拆分为独立的 hooks 和工具函数，提高了代码的可维护性和可复用性。

## 重构内容

### 1. 自定义 Hooks

#### useTableOfContents
**位置**: `src/hooks/useTableOfContents.ts`

**功能**:
- 处理文档目录（Table of Contents）的生成逻辑
- 将扁平的标题列表转换为树形结构
- 提供标题 slug 生成功能

**API**:
```typescript
const tableOfContents = useTableOfContents(post.headings)
// 返回: HeadingNode[] 树形结构的目录数据
```

**导出**:
- `useTableOfContents` - 主 hook
- `buildHeadingTree` - 构建标题树的工具函数
- `useHeadingSlug` - 生成标题 slug 的 hook
- `flattenHeadingTree` - 扁平化标题树的工具函数

#### useTwoslashHighlight
**位置**: `src/hooks/useTwoslashHighlight.ts`

**功能**:
- 处理 Twoslash 代码块的交互功能
- 代码复制到剪贴板
- 错误提示高亮
- 悬停信息显示
- Try 按钮功能（在 Playground 中打开代码）

**API**:
```typescript
const {
  copiedCode,
  copyToClipboard,
  setupCodeBlockInteractions,
  highlightErrors,
  setupHoverInfo,
} = useTwoslashHighlight()
```

#### useScrollNavigation
**位置**: `src/hooks/useScrollNavigation.ts`

**功能**:
- 处理滚动时的导航高亮
- 实现平滑滚动
- 自动更新当前活动链接

**API**:
```typescript
const {
  currentAnchor,
  updateActiveLink,
  setupSmoothScroll,
} = useScrollNavigation({
  offset: 100,
  passive: true,
})
```

#### useDeprecation
**位置**: `src/hooks/useDeprecation.ts`

**功能**:
- 处理文档废弃警告
- 管理废弃重定向逻辑
- 根据 URL hash 处理特定重定向

**API**:
```typescript
const deprecationInfo = useDeprecation(
  frontmatter.deprecated_by,
  frontmatter.deprecation_redirects
)
// 返回: { deprecatedBy, deprecationRedirects, shouldRedirect, redirectURL }
```

#### useLikeDislike
**位置**: `src/hooks/useLikeDislike.ts`

**功能**:
- 处理页面喜欢/不喜欢按钮
- 管理反馈状态
- 处理滚动到底部时的弹窗显示

**API**:
```typescript
const result = useLikeDislike(slug, intl)
// 返回: { liked, disliked, feedback }
```

### 2. 工具函数

#### markdownHelpers
**位置**: `src/utils/markdownHelpers.ts`

**功能**:
- `renderMarkdownContent` - 渲染 Markdown 内容
- `extractFrontmatter` - 提取并验证 frontmatter
- `processPreamble` - 处理前言内容
- `getDocumentPrefix` - 获取文档前缀（Handbook/Documentation）
- `shouldShowTableOfContents` - 判断是否显示目录
- `isExperimentalDocument` - 判断是否为实验性文档
- `buildCanonicalURL` - 构建规范 URL

### 3. 组件

#### MarkdownHeadingTree
**位置**: `src/components/MarkdownHeadingTree.tsx`

**功能**:
- 递归渲染标题树
- 支持嵌套的目录结构
- 自动生成锚点链接

**使用示例**:
```tsx
<MarkdownHeadingTree
  tree={tableOfContents}
  className="handbook-on-this-page-section-list"
/>
```

## 重构后的主组件

重构后的主组件位于 `src/templates/documentation-refactored.tsx`，相比原组件有以下改进：

### 改进点

1. **关注点分离**: 每个功能模块都有独立的 hook 或工具函数
2. **可测试性**: 各个 hook 和工具函数可以独立测试
3. **可复用性**: hooks 可以在其他组件中复用
4. **可维护性**: 代码结构清晰，易于理解和修改
5. **类型安全**: 完整的 TypeScript 类型定义

### 使用示例

```tsx
const HandbookTemplate: React.FC<Props> = (props) => {
  // 提取 frontmatter
  const frontmatter = extractFrontmatter(post.frontmatter)
  
  // 使用自定义 hooks
  const deprecationInfo = useDeprecation(
    frontmatter.deprecated_by,
    frontmatter.deprecation_redirects
  )
  
  const tableOfContents = useTableOfContents(post.headings)
  const showSidebar = shouldShowTableOfContents(frontmatter.disable_toc)
  
  // 设置交互功能
  useScrollNavigation({ offset: 100 })
  useLikeDislike(props.pageContext.slug, i)
  useTwoslashHighlight()
  
  // 渲染
  return (
    <Layout>
      {/* ... */}
      <MarkdownHeadingTree tree={tableOfContents} />
      {/* ... */}
    </Layout>
  )
}
```

## 文件结构

```
packages/typescriptlang-org/src/
├── hooks/
│   ├── index.ts                    # Hooks 导出索引
│   ├── useTableOfContents.ts       # 目录生成 hook
│   ├── useTwoslashHighlight.ts     # Twoslash 高亮 hook
│   ├── useScrollNavigation.ts      # 滚动导航 hook
│   ├── useDeprecation.ts           # 废弃处理 hook
│   └── useLikeDislike.ts           # 喜欢/不喜欢 hook
├── utils/
│   ├── index.ts                    # 工具函数导出索引
│   └── markdownHelpers.ts          # Markdown 辅助函数
├── components/
│   └── MarkdownHeadingTree.tsx     # 标题树组件
└── templates/
    ├── documentation.tsx           # 原始组件（保留）
    └── documentation-refactored.tsx # 重构后的组件
```

## 迁移指南

要从原始组件迁移到重构版本：

1. 导入新的 hooks 和工具函数：
```typescript
import { useTableOfContents, useScrollNavigation, useDeprecation, useLikeDislike, useTwoslashHighlight } from "../hooks"
import { MarkdownHeadingTree } from "../components/MarkdownHeadingTree"
import { extractFrontmatter, getDocumentPrefix, shouldShowTableOfContents } from "../utils/markdownHelpers"
```

2. 替换原有的内联逻辑为 hook 调用

3. 使用 `MarkdownHeadingTree` 组件替换原有的 `headerListToTree` 函数和 `MarkdownHeadingTree` 组件

4. 测试所有功能确保无回归

## 性能优化

重构后的代码包含以下性能优化：

1. **useMemo**: 在 `useTableOfContents` 中使用 `useMemo` 缓存目录树计算
2. **useCallback**: 在各个 hooks 中使用 `useCallback` 缓存回调函数
3. **事件清理**: 所有 hooks 都正确清理事件监听器，避免内存泄漏

## 测试建议

建议为以下内容编写单元测试：

1. `buildHeadingTree` - 测试标题树的构建逻辑
2. `useTableOfContents` - 测试目录生成
3. `useDeprecation` - 测试废弃逻辑
4. `markdownHelpers` - 测试各种辅助函数

## 后续改进

可能的后续改进方向：

1. 为所有 hooks 添加单元测试
2. 添加 Storybook 来展示各个组件
3. 考虑将 `MarkdownHeadingTree` 组件虚拟化以处理大型文档
4. 添加更多的配置选项到各个 hooks