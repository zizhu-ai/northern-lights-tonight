# #21 / #23 清理交付（2026-09-11）

基线：最新 `origin/main`，`b11fef3`（PR #50）。分支：`fix/issues-21-23-cleanup`。

## 执行范围

- 目标：按 cleanup brief 和 2026-08-29 仲裁收尾 #21、#23。
- 范围：sitemap 注释与回归测试、上线文案维护规则、本报告；预计且实际为 4 个文件。
- 验收：无上游依赖、无不可信 lastModified、原上线冻结不再约束后续维护、死键保持删除、代码测试通过、打开 PR。
- 假设：没有已记录且可信的页面内容修订日期时，统一省略 lastModified。
- 风险：低。无运行行为变更，无依赖升级、生产操作或数据链路修改。
- 验证预算：针对性测试与现有 Node 单测；完整构建和其它测试交 CI。
- 边界：不修改 brief，不触及 #13 / #24 / LKG / health / Blob，不合并 PR，不手动关闭 issue。

## #21：锁定仲裁后的 sitemap 行为

main 的 `app/sitemap.ts` 已按 `ACQUISITION_ROUTES` 输出 24 个纯 URL。无需恢复 PR #33 的动态日期实现。

检查了路由清单、站点常量、指南内容及页面日期字段：没有适合映射到这些 URL 的已记录内容修订时间。快照的 updated_at / revision 属于实时数据；privacy 的「最后生产部署」表述也不是可信内容修订时间。运行时 git 不可用；文件 mtime 和构建时钟也未被当作内容修订依据。

因此保留全部 URL 省略 lastModified，在入口注明原因。新增 `lib/sitemap.test.ts`，直接执行真实 sitemap 入口：核对全部 24 个 URL 和无日期属性；模拟跨年后比较结果；限制依赖为静态路由/站点常量，并令 fetch 直接失败，覆盖模块加载和函数执行阶段。

未来只有引入可追溯的内容修订元数据后才应为相应 URL 添加 lastModified，并同步测试。不得使用请求时间、构建时间或 live forecast 刷新时间替代。

## #23：结束上线窗口冻结

更新 `上线｜执行方案.md` 的优先级条目、红线第 6 条、§7 和文件范围表，使「只追加」明确只适用于原上线窗口。上线后：在用文案不得随意改变含义，实质措辞变化优先新增键；确认无引用的闲置键可以删除。

在 app、components、lib 和 ui-copy 中搜索确认 `chrome.open` / `errors.search_not_us` 无引用，键保持删除。没有修改 `content/ui-copy.json`。#23 在此文档同步合并后可关闭。

## 验证与交付

- 基线 indexing integration：3/3 通过。
- `npm run test:unit`：113/113 通过，0 失败、0 跳过。
- 临时注入 `lastModified: new Date()` 和 fetch 两种错误：新测试分别失败，证明能拦截这两类回归；均已还原。
- 还原后 `node --experimental-strip-types --test lib/sitemap.test.ts`：1/1 通过。
- `git diff --check`：通过。
- Node 输出现有无 module type 警告及 MockTimers 实验性提示，不影响断言。
- PR 保持打开，待 CI 和 aurora-tonight 合并；两个 issue 保持打开。

工作在独立 worktree；原目录的未提交资料未改动。交付后在原请求目录保留本报告副本。
