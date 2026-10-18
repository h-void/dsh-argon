window.__ModuleLoader__.load({
	id: "dsh-argon",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");

		const RPC_CHANNEL = "/dsh-argon";
		const SETTINGS_NS = "argon";
		const NS = "settings.argon";

		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}

		const zh = {
			title: "Argon 模式",
			summaryEnabled: "已开启",
			summaryDisabled: "已关闭",
			summaryLoading: "读取中",
			summaryUnavailable: "设置不可用",
			summaryValidationFailed: "部分模式校验未通过",
			description: "开启后，向各模式的系统提示词注入 Argon 文风的任务宪章、执笔与交付总则、译笔／校书准则与文风指纹；零人设，不含角色身份或称谓。关闭即恢复原版提示词。从下一次请求和新建子代理开始生效。",
			toggle: "启用 Argon 文风注入",
			statusTitle: "各模式状态",
			modulesTitle: "核心模块资产状态",
			modeStandard: "Standard 标准模式",
			modePtc: "PTC 模式",
			modeCordis: "Cordis 创造模式",
			modeMinimal: "Minimal 极简模式",
			subagentNote: "子代理随所属模式一并生效。",
			stateActive: "已生效",
			stateOff: "已关闭",
			stateChecking: "校验中",
			stateValidationFailed: "校验未通过，已保持原版",
			recheck: "重新校验",
			refresh: "刷新",
			preflightTitle: "本次即将写入的内容",
			fingerprint: "契约指纹",
			fingerprintNote: "与当前 Argon 资产内容一一对应，修改磁盘资产文件将自动更新指纹与注入内容。",
			presetStandard: "standard",
			presetPtc: "ptc",
			presetCordis: "cordis",
			presetMinimal: "minimal",
			showPreview: "查看预览",
			hidePreview: "收起预览",
			previewLoading: "正在组装当前提示词…",
			previewUnavailable: "暂不可预览：",
			previewSize: "行",
			chars: "字符",
			previewSourceLive: "实时会话",
			previewSourceStanding: "静态预设",
			settingsUnavailable: "当前连接不可写设置（远程浏览器只读）。",
			settingsLoading: "正在读取设置…",
			operationFailed: "操作失败：",
			issueIdentity: "DSH 身份开场白已变更",
			issuePersona: "预设角色前缀已变更",
			issuePlan: "计划模式段落已变更",
			issuePtcOnly: "PTC 模式 run_code 规则已变更",
			issueStructuredOutput: "结构化输出指令已变更"
		};

		const en = {
			title: "Argon Mode",
			summaryEnabled: "Enabled",
			summaryDisabled: "Disabled",
			summaryLoading: "Loading",
			summaryUnavailable: "Settings unavailable",
			summaryValidationFailed: "Some mode checks failed",
			description: "When enabled, injects the Argon task charter, writing/delivery rules, translation and polishing rules, and style fingerprint into each mode's DSH prompt. Zero persona; no character identity or forms of address. Disabling restores stock prompts. Applies from the next request and new subagents.",
			toggle: "Enable Argon Writing-Style Injection",
			statusTitle: "Per-mode status",
			modulesTitle: "Core Asset Modules",
			modeStandard: "Standard",
			modePtc: "PTC",
			modeCordis: "Cordis",
			modeMinimal: "Minimal",
			subagentNote: "Subagents follow their parent's mode.",
			stateActive: "Active",
			stateOff: "Off",
			stateChecking: "Checking",
			stateValidationFailed: "Check failed — stock prompt kept",
			recheck: "Re-check",
			refresh: "Refresh",
			preflightTitle: "What this deployment writes",
			fingerprint: "Contract fingerprint",
			fingerprintNote: "One-to-one with current Argon asset files on disk.",
			presetStandard: "standard",
			presetPtc: "ptc",
			presetCordis: "cordis",
			presetMinimal: "minimal",
			showPreview: "Show preview",
			hidePreview: "Hide preview",
			previewLoading: "Assembling the current prompt…",
			previewUnavailable: "No preview available: ",
			previewSize: "lines",
			chars: "chars",
			previewSourceLive: "live session",
			previewSourceStanding: "standing preset",
			settingsUnavailable: "This connection cannot write settings (remote browser is read-only).",
			settingsLoading: "Reading settings…",
			operationFailed: "Operation failed: ",
			issueIdentity: "harness identity opening changed",
			issuePersona: "preset persona changed",
			issuePlan: "plan-mode section changed",
			issuePtcOnly: "ptc-mode run_code rule changed",
			issueStructuredOutput: "structured-output instruction changed"
		};

		function ensureStyles() {
			const tagId = "dsh-argon-styles";
			if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-argon";
				tag.dataset.pluginCss = tagId;
				tag.textContent = `
.dsh-argon-card {
  display: block;
  width: 100%;
  max-width: 760px;
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
}
.dsh-argon-summary {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
  padding: 12px 14px;
  cursor: pointer;
  list-style: none;
  touch-action: manipulation;
  user-select: none;
}
.dsh-argon-summary::-webkit-details-marker { display: none; }
.dsh-argon-summary:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-argon-summary:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}
.dsh-argon-summary::after {
  width: 8px;
  height: 8px;
  flex: none;
  border-right: 2px solid var(--dsw-alias-label-tertiary);
  border-bottom: 2px solid var(--dsw-alias-label-tertiary);
  content: '';
  transform: rotate(45deg);
  transition: transform 160ms ease;
}
.dsh-argon-card[open] > .dsh-argon-summary {
  border-bottom: 1px solid var(--dsw-alias-border-l2);
}
.dsh-argon-card[open] > .dsh-argon-summary::after {
  transform: rotate(225deg);
}
.dsh-argon-summaryText {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.dsh-argon-summaryStatus {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  padding: 1px 7px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.dsh-argon-summaryStatus[data-state='active'] {
  color: var(--dsw-alias-state-success-primary);
}
.dsh-argon-summaryStatus[data-state='pending'] {
  color: var(--dsw-alias-state-business-primary);
}
.dsh-argon-summaryStatus[data-state='error'] {
  color: var(--dsw-alias-state-error-primary);
}
.dsh-argon-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}
.dsh-argon-title {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}
.dsh-argon-statusTitle {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
}
.dsh-argon-description,
.dsh-argon-note {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-argon-note {
  font-size: 12px;
  line-height: 18px;
}
.dsh-argon-error {
  margin: 0;
  border: 1px solid var(--dsw-alias-state-error-primary);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--dsw-alias-state-error-primary);
  font-size: 13px;
  line-height: 20px;
  overflow-wrap: anywhere;
}
.dsh-argon-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}
.dsh-argon-toggle input {
  accent-color: var(--dsw-alias-state-business-primary);
}
.dsh-argon-modes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.dsh-argon-mode {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  line-height: 18px;
}
.dsh-argon-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 999px;
  background: var(--dsw-alias-label-tertiary);
}
.dsh-argon-dot[data-state='active'] {
  background: var(--dsw-alias-state-success-primary);
}
.dsh-argon-dot[data-state='checking'] {
  background: var(--dsw-alias-state-business-primary);
}
.dsh-argon-dot[data-state='failed'] {
  background: var(--dsw-alias-state-error-primary);
}
.dsh-argon-modeName {
  color: var(--dsw-alias-label-primary);
}
.dsh-argon-modeState {
  color: var(--dsw-alias-label-secondary);
}
.dsh-argon-presetId,
.dsh-argon-fingerprint {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 4px;
  padding: 1px 5px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 16px;
}
.dsh-argon-fingerprint {
  color: var(--dsw-alias-label-primary);
  letter-spacing: 0.4px;
}
.dsh-argon-inlineAction {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  padding: 1px 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dsh-argon-inlineAction:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsh-argon-inlineAction:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
.dsh-argon-preview {
  display: flex;
  flex-basis: 100%;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
  padding-left: 15px;
}
.dsh-argon-previewText {
  max-height: 320px;
  margin: 0;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 17px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.dsh-argon-issues {
  flex-basis: 100%;
  padding-left: 15px;
  color: var(--dsw-alias-state-error-primary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
.dsh-argon-modules {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.dsh-argon-module {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--dsw-alias-bg-layer-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}
.dsh-argon-module-name {
  color: var(--dsw-alias-label-primary);
}
.dsh-argon-module-meta {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
}
.dsh-argon-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dsh-argon-actions button {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  padding: 4px 12px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.dsh-argon-actions button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-argon-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.dsh-argon-actions button:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .dsh-argon-summary::after { transition: none; }
}
				`;
				document.head.appendChild(tag);
			}
		}

		function createArgonController(ctx) {
			const connection = ctx.get("connection");
			const settings = ctx.configForms.get(SETTINGS_NS);
			let snapshot = {
				enabled: false,
				writable: false,
				settingsStatus: "loading",
				status: null,
				previews: {},
				busy: false
			};
			const listeners = /* @__PURE__ */ new Set();
			// 每个预设只接收最近一次请求；清空标记同时废弃所有在途旧预览。
			const previewRequests = /* @__PURE__ */ new Map();
			let statusGeneration = 0;
			let pendingOperations = 0;
			const view = {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => listeners.delete(listener);
				}
			};
			function publish() {
				const settingsSnapshot = settings.getSnapshot();
				const enabled = settingsSnapshot.value?.enabled === true;
				if (enabled !== snapshot.enabled) invalidatePreviews();
				snapshot = {
					enabled,
					writable: settingsSnapshot.writable,
					settingsStatus: settingsSnapshot.status,
					status: snapshot.status,
					previews: snapshot.previews,
					busy: pendingOperations > 0,
					message: snapshot.message
				};
				for (const listener of listeners) listener();
			}
			function invalidatePreviews() {
				previewRequests.clear();
				snapshot = { ...snapshot, previews: {} };
			}
			async function call(endpoint, payload) {
				const result = await connection.rpc.call(RPC_CHANNEL, endpoint, payload);
				if (!result.ok) throw new Error(result.error.message);
				return result.value;
			}
			async function whileBusy(action) {
				pendingOperations++;
				publish();
				try {
					await action();
				} finally {
					pendingOperations--;
					publish();
				}
			}
			function readStatus(endpoint, clearPreviews) {
				const generation = ++statusGeneration;
				return whileBusy(async () => {
					try {
						const status = await call(endpoint, {});
						if (generation !== statusGeneration) return;
						if (clearPreviews) invalidatePreviews();
						snapshot = { ...snapshot, status, message: void 0 };
					} catch (error) {
						if (generation !== statusGeneration) return;
						snapshot = { ...snapshot, message: messageOf(error) };
					}
				});
			}
			function refresh(clearPreviews = false) {
				return readStatus("status", clearPreviews);
			}
			function setEnabled(enabled) {
				return whileBusy(async () => {
					try {
						await settings.set("enabled", enabled);
						await refresh(true);
					} catch (error) {
						snapshot = { ...snapshot, message: messageOf(error) };
					}
				});
			}
			function recheck() {
				return readStatus("recheck", true);
			}
			async function loadPreview(presetId) {
				const request = Symbol(presetId);
				previewRequests.set(presetId, request);
				snapshot = {
					...snapshot,
					previews: {
						...snapshot.previews,
						[presetId]: { status: "loading" }
					}
				};
				publish();
				try {
					const preview = await call("preview", { presetId });
					if (previewRequests.get(presetId) !== request) return;
					snapshot = {
						...snapshot,
						previews: {
							...snapshot.previews,
							[presetId]: {
								status: "ready",
								preview
							}
						}
					};
				} catch (error) {
					if (previewRequests.get(presetId) !== request) return;
					snapshot = {
						...snapshot,
						previews: {
							...snapshot.previews,
							[presetId]: {
								status: "failed",
								message: messageOf(error)
							}
						}
					};
				}
				publish();
			}
			ctx.effect(() => settings.subscribe(publish), "dsh-argon: settings mirror");
			ctx.effect(() => ctx.remote.$on("settings/document-updated", (namespace) => {
				if (namespace === void 0 || namespace === SETTINGS_NS) void refresh(true);
			}), "dsh-argon: settings invalidations");
			publish();
			void refresh();
			return {
				face: () => ({
					hooks: { view },
					setEnabled,
					recheck,
					refresh: () => refresh(true),
					loadPreview
				})
			};
		}
		const MODE_ROWS = [
			{
				id: "standard",
				labelKey: "modeStandard",
				presetKey: "presetStandard"
			},
			{
				id: "ptc",
				labelKey: "modePtc",
				presetKey: "presetPtc"
			},
			{
				id: "cordis",
				labelKey: "modeCordis",
				presetKey: "presetCordis"
			},
			{
				id: "minimal",
				labelKey: "modeMinimal",
				presetKey: "presetMinimal"
			}
		];

		const ISSUE_LOCALE_KEYS = {
			"harness identity opening changed": "issueIdentity",
			"preset persona changed": "issuePersona",
			"plan-mode section changed": "issuePlan",
			"ptc-mode run_code rule changed": "issuePtcOnly",
			"structured-output instruction changed": "issueStructuredOutput"
		};

		function stateKey(mode) {
			switch (mode?.state) {
				case "active": return "stateActive";
				case "checking": return "stateChecking";
				case "failed": return "stateValidationFailed";
				default: return "stateOff";
			}
		}

		function ArgonCard(props) {
			const { t, loadPreview } = props;
			const view = props.useView((snapshot) => snapshot);
			const status = view.status;
			const [openPreview, setOpenPreview] = (0, react.useState)(null);
			const openEntry = openPreview === null ? void 0 : view.previews[openPreview];
			(0, react.useEffect)(() => {
				if (openPreview !== null && openEntry === void 0) void loadPreview(openPreview);
			}, [
				openPreview,
				openEntry,
				loadPreview
			]);
			const hasFailedMode = status !== null && status.modes && Object.values(status.modes).some((mode) => mode.state === "failed");
			const summaryKey = view.settingsStatus === "loading" ? "summaryLoading" : view.settingsStatus === "unavailable" ? "summaryUnavailable" : hasFailedMode ? "summaryValidationFailed" : view.enabled ? "summaryEnabled" : "summaryDisabled";
			const summaryState = view.settingsStatus === "ready" ? hasFailedMode ? "error" : view.enabled ? "active" : "off" : "pending";

			function togglePreview(presetId) {
				if (openPreview === presetId) {
					setOpenPreview(null);
					return;
				}
				setOpenPreview(presetId);
				const entry = view.previews[presetId];
				if (entry === void 0 || entry.status === "failed") void props.loadPreview(presetId);
			}

			function formatIssues(issues) {
				return issues.map((issue) => {
					const key = ISSUE_LOCALE_KEYS[issue];
					return key !== void 0 ? t(key) : issue;
				}).join("; ");
			}

			return (0, react_jsx_runtime.jsxs)("details", {
				open: true,
				className: "dsh-argon-card",
				children: [
					(0, react_jsx_runtime.jsx)("summary", {
						className: "dsh-argon-summary",
						children: (0, react_jsx_runtime.jsxs)("span", {
							className: "dsh-argon-summaryText",
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: "dsh-argon-title",
									role: "heading",
									"aria-level": 3,
									children: t("title")
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: "dsh-argon-summaryStatus",
									"data-state": summaryState,
									children: t(summaryKey)
								})
							]
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-argon-content",
						children: [
							(0, react_jsx_runtime.jsx)("p", {
								className: "dsh-argon-description",
								children: t("description")
							}),
							(0, react_jsx_runtime.jsxs)("label", {
								className: "dsh-argon-toggle",
								children: [
									(0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: view.enabled,
										disabled: !view.writable || view.settingsStatus !== "ready" || view.busy,
										onChange: (event) => {
											void props.setEnabled(event.target.checked);
										}
									}),
									(0, react_jsx_runtime.jsx)("span", {
										children: t("toggle")
									})
								]
							}),
							view.settingsStatus === "unavailable" && (0, react_jsx_runtime.jsx)("p", {
								className: "dsh-argon-note",
								children: t("settingsUnavailable")
							}),
							view.message !== void 0 && (0, react_jsx_runtime.jsxs)("p", {
								className: "dsh-argon-error",
								children: [t("operationFailed"), view.message]
							}),
							(0, react_jsx_runtime.jsx)("h4", {
								className: "dsh-argon-statusTitle",
								children: t("statusTitle")
							}),
							(0, react_jsx_runtime.jsx)("ul", {
								className: "dsh-argon-modes",
								children: MODE_ROWS.map((row) => {
									const mode = status?.modes?.[row.id];
									const entry = view.previews[row.id];
									const isOpen = openPreview === row.id;
									return (0, react_jsx_runtime.jsxs)("li", {
										className: "dsh-argon-mode",
										children: [
											(0, react_jsx_runtime.jsx)("span", {
												className: "dsh-argon-dot",
												"data-state": mode?.state ?? "off"
											}),
											(0, react_jsx_runtime.jsx)("span", {
												className: "dsh-argon-modeName",
												children: t(row.labelKey)
											}),
											(0, react_jsx_runtime.jsx)("span", {
												className: "dsh-argon-modeState",
												children: t(stateKey(mode))
											}),
											(0, react_jsx_runtime.jsx)("code", {
												className: "dsh-argon-presetId",
												children: t(row.presetKey)
											}),
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dsh-argon-inlineAction",
												onClick: () => {
													togglePreview(row.id);
												},
												children: t(isOpen ? "hidePreview" : "showPreview")
											}),
											mode !== void 0 && mode.issues.length > 0 && (0, react_jsx_runtime.jsx)("span", {
												className: "dsh-argon-issues",
												children: formatIssues(mode.issues)
											}),
											isOpen && (0, react_jsx_runtime.jsx)("div", {
												className: "dsh-argon-preview",
												children: entry === void 0 || entry.status === "loading" ? (0, react_jsx_runtime.jsx)("p", {
													className: "dsh-argon-note",
													children: t("previewLoading")
												}) : entry.status === "failed" ? (0, react_jsx_runtime.jsxs)("p", {
													className: "dsh-argon-error",
													children: [t("previewUnavailable"), entry.message]
												}) : entry.preview?.available === false ? (0, react_jsx_runtime.jsxs)("p", {
													className: "dsh-argon-error",
													children: [t("previewUnavailable"), entry.preview.reason]
												}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
													children: [
														(0, react_jsx_runtime.jsxs)("p", {
															className: "dsh-argon-note",
															children: [
																entry.preview?.lines,
																" ",
																t("previewSize"),
																" · ",
																entry.preview?.bytes,
																" B",
																entry.preview?.source !== void 0 && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
																	children: [" · ", t(entry.preview.source === "live" ? "previewSourceLive" : "previewSourceStanding")]
																})
															]
														}),
														(0, react_jsx_runtime.jsx)("pre", {
															className: "dsh-argon-previewText",
															children: entry.preview?.text
														})
													]
												})
											})
										]
									}, row.id);
								})
							}),
							(0, react_jsx_runtime.jsx)("h4", {
								className: "dsh-argon-statusTitle",
								children: t("modulesTitle")
							}),
							(0, react_jsx_runtime.jsx)("ul", {
								className: "dsh-argon-modules",
								children: (status?.modules || [
									{ name: "Task Charter (任务宪章)", chars: 470 },
									{ name: "Writing Rules (执笔与交付总则)", chars: 2046 }
								]).map((mod, idx) => (0, react_jsx_runtime.jsxs)("li", {
									className: "dsh-argon-module",
									children: [
										(0, react_jsx_runtime.jsx)("span", {
											className: "dsh-argon-module-name",
											children: mod.name
										}),
										(0, react_jsx_runtime.jsxs)("span", {
											className: "dsh-argon-module-meta",
											children: [mod.chars, " ", t("chars")]
										})
									]
								}, idx))
							}),
							(0, react_jsx_runtime.jsx)("h4", {
								className: "dsh-argon-statusTitle",
								children: t("preflightTitle")
							}),
							(0, react_jsx_runtime.jsxs)("p", {
								className: "dsh-argon-note",
								children: [
									t("fingerprint"),
									" ",
									(0, react_jsx_runtime.jsx)("code", {
										className: "dsh-argon-fingerprint",
										children: status?.contract ?? "—"
									})
								]
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: "dsh-argon-note",
								children: t("fingerprintNote")
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: "dsh-argon-note",
								children: t("subagentNote")
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-argon-actions",
								children: [
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: view.busy,
										onClick: () => {
											void props.recheck();
										},
										children: t("recheck")
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: view.busy,
										onClick: () => {
											void props.refresh();
										},
										children: t("refresh")
									})
								]
							})
						]
					})
				]
			});
		}

		const inject = [
			"slots",
			"locale",
			"connection",
			"remote",
			"configForms"
		];

		function apply(ctx) {
			ensureStyles();
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-argon: dictionaries");
			const controller = createArgonController(ctx);
			ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
				name: "plugins.bundle.config",
				key: "dsh-argon",
				locale: NS,
				inject: () => controller.face()
			}, ArgonCard));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
