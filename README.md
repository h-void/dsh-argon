# dsh-argon

> **Argon 文风提示词注入插件**（适用于 DeepSeek Harness 桌面端 / Web 端）
> 参考架构：[dsh-unrestricted](https://github.com/yexi-by/dsh-unrestricted)

---

## 📖 简介

本插件把 **Argon 文风** 的任务宪章、执笔与交付总则、译笔／校书准则与文风指纹打包成标准 DSH bundle，并在前端提供原生配置面板：

- **任务宪章 (`system.md`)**：虚构边界、角色描写、忠实叙事、首行锚定、禁语与稀释、一次做完、名字与设定照用户给的用等七条准则；当前 Argon 文风定稿。
- **执笔与交付总则 (`personality.md`)**：虚构框架声明 + 主笔定位，含 **Galgame · 漫画 · 小说译笔准则**、**校书准则**（轻中重三档 + 去翻译腔 + 改动说明）、**文风指纹**（八条 + 小说正文的呼吸与气韵）与**交付纪律**。当前为**零人设纯享版**，不含角色身份或称谓。
- **前端原生界面与配置卡片 (`lib/client.js`)**：
  - 插件管理页专属配置卡片，支持开启/关闭切换、各模块就绪状态查看及完整提示词实时预览。

---

## 📂 插件目录结构

```text
dsh-argon/
├── package.json               # 插件清单、DSH bundle 与客户端扩展声明
├── cordis.patch.yml           # Cordis 服务注入配置
├── README.md                  # 说明文档
├── lib/
│   └── client.js              # 前端 Client Bundle 产物（配置卡片）
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

## 🚀 安装与更新

### Web 端

适用于通过命令行运行 `dsh web` 的环境。

#### 安装
```sh
# 安装指定版本
dsh plugin --profile web add github:h-void/dsh-argon#v0.0.1

# 或安装 master 最新代码
dsh plugin --profile web add github:h-void/dsh-argon
```
安装后重启 `dsh web`，在浏览器打开界面进行启用（详见下方「使用说明」）。

#### 更新
```sh
dsh plugin --profile web remove dsh-argon
dsh plugin --profile web add github:h-void/dsh-argon#目标版本号
```
更新后重启 `dsh web`。

#### 卸载
```sh
dsh plugin --profile web remove dsh-argon
```

---

### 桌面端（Desktop App）

适用于 DeepSeek Harness 官方桌面客户端。

> **注意**：桌面端使用独立的 `desktop` profile，不能使用全局 `dsh` 命令，必须调用桌面端自带的 CLI 工具执行配置。

#### 1. 桌面端 CLI 路径
以 Windows 为例，默认路径为：
```text
%LOCALAPPDATA%\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd
```

> 如果桌面版安装在别的目录，把路径换成实际的 `...\resources\runtime\cli\bin\dsh.cmd`；也可以直接使用已在 PATH 中的 `dsh` 命令。

#### 2. 安装步骤
1. 完全退出正在运行的桌面客户端。
2. 打开 PowerShell 或 CMD，执行安装命令：
   ```powershell
   & "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:h-void/dsh-argon#v0.0.1
   ```
3. 启动桌面客户端，按下方说明启用插件与功能开关。

#### 3. 更新步骤
1. 完全退出桌面客户端。
2. 执行重新安装命令：
   ```powershell
   & "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-argon
   & "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add github:h-void/dsh-argon#目标版本号
   ```
3. 重新打开桌面客户端。

#### 4. 卸载步骤
```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-argon
```

---

### 本地源码安装

面向二次开发调试，使用 `file:` 协议安装本地源码目录：

```sh
# Web 端
dsh plugin --profile web add file:D:/ASUS/Documents/dsh-argon

# 桌面端
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add file:D:/ASUS/Documents/dsh-argon
```

本地源码安装后，插件运行时从安装目录读取 `assets/`；改 `node_modules/dsh-argon/assets/` 会热更新，改源码仓库的 `assets/` 后需重新执行 `dsh plugin --profile desktop install` 同步安装副本。`src/`、`lib/` 改动需要重启 DSH。

---

## 使用说明（双重开关确认）

> **特别注意：必须同时确保两处开关均已打开，插件才会真正生效！**
>
> 1. **第一步（插件加载开关）**：进入左侧侧边栏的 **「插件」** 管理页面，在已安装插件列表中找到 `dsh-argon`（Argon 模式），**点击打开/启用该插件**。如果未在插件列表开启，DSH 运行时根本不会加载该插件代码。
> 2. **第二步（Argon 功能开关）**：在 **「插件」** 管理页面点开 `dsh-argon` 进入详情配置页，在 **「Argon 模式」** 设置卡片中将顶部的 **「启用 Argon 文风注入」** 开关打开。
>
> 只有上述两个开关同时开启，Argon 规则才会实际注入到系统提示词流水线中。

### 「Argon 模式」设置面板功能

- **启用 Argon 文风注入**：一键切换注入状态，开启后下一次对话即刻生效。
- **各模式状态**：实时查看 Standard、PTC、Cordis、Minimal 四个模式的注入状态。显示 `已生效` 即表示特征校验通过并成功注入；若显示异常，请首先检查「插件」管理页面中插件是否已被打开。
- **提示词指纹**：展示当前注入规则的 SHA-256 哈希值（前 16 位），便于核对部署版本。
- **查看提示词预览**：点击各模式下的「查看预览」，可实时查看即将发送给模型的**完整系统提示词正文、总行数与字节数**。

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
