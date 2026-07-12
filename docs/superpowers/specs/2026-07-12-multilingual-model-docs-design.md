# DimiLinks 三语开发文档与模型更新设计

## 目标

- 将 Mintlify 开发文档从单一简体中文扩展为简体中文、英文和日文。
- 三种语言拥有相同的信息架构、页面集合、示例和 API 边界。
- 按 2026-07-12 线上 `/api/pricing` 快照更新模型示例，不把厂商公开能力直接当作 DimiLinks 已接通能力。

## 信息架构

- Mintlify 顶层导航改为 `navigation.languages`，语言代码使用 `cn`、`en`、`jp`。
- 中文内容继续保留现有无前缀路径，英文与日文分别使用 `/en/*`、`/jp/*`。
- 在基础 API 分组增加“模型选择与更新”页面，解释推荐读取顺序、近期模型和能力判断方式。

## 模型事实源

- `data/supported-models.json` 保存本次发布使用的线上快照、校验日期和 `pricing_version`。
- 示例中出现的模型 ID 必须存在于快照；图片和视频专用链路按已验证 API 文档保留。
- 文档明确提示开发者运行时查询 `/v1/models`，定价和分组读取 `/api/pricing`，不要长期缓存硬编码清单。

## 质量门槛

- `scripts/verify-docs.mjs` 校验三语导航顺序、页面集合、文件存在性、frontmatter 和模型 ID。
- `jq` 校验 `docs.json`、模型快照与 OpenAPI JSON。
- `mint broken-links` 校验跨语言和站内链接；本地预览抽查三种语言桌面与移动页面。
- 推送后检查三种语言线上 URL、语言切换、模型选择页和 API Reference。

## 边界

- 不改公开 API 行为、不增加未经线上证据确认的参数。
- 不把 DimiLinks 模型 ID 描述为厂商官方命名或发布日期。
- 本次不引入自动机器翻译发布流程；三语内容由仓库版本控制并通过页面集合校验保持同步。
