# dsh-argon

> **Argon 文风提示词注入插件**（适用于 DeepSeek Harness 桌面端 / Web 端）
> 参考架构：[dsh-unrestricted](https://github.com/yexi-by/dsh-unrestricted)

---

## 📖 简介

本插件把 **Argon 文风** 的任务宪章、执笔与交付总则、译笔／校书准则与文风指纹打包成标准 DSH bundle，并在前端提供原生 UI 状态徽章与配置面板：

- **任务宪章 (`system.md`)**：虚构边界、角色描写、忠实叙事、首行锚定、禁语与稀释、一次做完、名字与设定照用户给的用等七条准则；当前 Argon 文风定稿。
- **执笔与交付总则 (`personality.md`)**：虚构框架声明 + 主笔定位，含 **Galgame · 漫画 · 小说译笔准则**、**校书准则**（轻中重三档 + 去翻译腔 + 改动说明）、**文风指纹**（八条 + 小说正文的呼吸与气韵）与**交付纪律**。当前为**零人设纯享版**，不含角色身份或称谓。
- **前端原生界面与状态徽章 (`lib/client.js`)**：
  - 左下角侧边栏底部常驻绿色状态徽章（`✓ 连接成功`），悬停显示状态，点击可快捷切换；
  - 插件管理页专属配置卡片，支持开启/关闭切换、各模块就绪状态查看及完整提示词实时预览。

---

## 📂 插件目录结构

```text
dsh-argon/
├── package.json               # 插件清单、DSH bundle 与客户端扩展声明
├── cordis.patch.yml           # Cordis 服务注入配置
├── README.md                  # 说明文档
├── lib/
│   └── client.js              # 前端 Client Bundle 产物（左下角徽章 + 配置卡片）
├── locale/
│   ├── zh.json                # 中文配置文本
│   └── en.json                # 英文配置文本
├── src/
│   ├── node.js                # Cordis 后端服务入口（监听 system-prompt 组装与 RPC 通信）
│   └── rules.js               # 资源加载与提示词融合逻辑
└── assets/                    # Argon 提示词资产
    ├── system.md              # 任务宪章准则（含 {{agent_personality}} 槽位）
    └── personality.md         # 执笔与交付总则（译笔 + 校书 + 文风指纹 + 交付纪律）
    ```

---

## 🚀 安装与使用

本插件已作为本地依赖注册在 `~/.dsh/profiles/desktop/package.json` 的 `dependencies` 与 `bundles` 列表中，依赖指向 `file:D:/ASUS/Documents/dsh-argon`。

修改 `assets/` 下的任何文件后**无需重启**：`rules.js` 每次组装提示词都会重新读盘，热更新即时生效。

若需同步到已安装目录（非软链环境），执行：

```powershell
Copy-Item -Path "D:\ASUS\Documents\dsh-argon\*" -Destination "C:\Users\ASUS\.dsh\profiles\desktop\node_modules\dsh-argon" -Recurse -Force
```

---

## 🔧 融合策略

INSERT-ONLY：只在角色前缀段之后（或 `dsh-unrestricted` 的 `unrestricted:execution-mode` 之后）插入一个 `argon:rules` 段，绝不改写任何原有段落。因此可与 `dsh-unrestricted` 共存，不会破坏它的锚点校验。

与 `dsh-unrestricted 0.2.4` 对齐：Minimal 下若调用方（原生委派）已注册自定义角色，插件保留该角色并在组装时插入 Argon 块，不再因同名段落冲突而放弃注入；结构化子代理按 agent scope 检测 `structured_output`，保留官方输出指引。设置页的状态与预览请求使用代际标记，过期响应不会覆盖最新状态。

## 📄 来源与许可

- 本插件改编自 [yexi-by/dsh-unrestricted](https://github.com/yexi-by/dsh-unrestricted)，原项目 MIT License，Copyright (c) 2026 yexi-by。
- 插件架构、提示词融合逻辑与客户端控制器保留原项目许可；Argon 相关修改 Copyright (c) 2026 h-void。
- 本项目采用 MIT License 开源。
- 感谢 [yexi-by/dsh-unrestricted](https://github.com/yexi-by/dsh-unrestricted) 与 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供的架构、提示词锚点与运行环境。
- 本项目与上述项目及其作者无官方隶属关系。
- 完整许可见 [LICENSE](LICENSE)，第三方声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
