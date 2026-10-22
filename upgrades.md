# Hexhive Upgrades

## 1. Subagent Model Selection

> Allow the user to configure a global default model for subagents, separate from the main session model.

- [x] **Schema**: Add `subagent` config field with optional `model` to `packages/schema/src/config.ts` (Info + Patch)
- [x] **Core config**: Extend `packages/core/src/config.ts` `update()` to patch `subagent` via JSONC editor
- [x] **Server API**: Extend `packages/server/src/handlers/config.ts` handler to accept `subagent` in Patch
- [x] **Core subagent**: Update `packages/core/src/tool/plugin/subagent.ts` model resolution (line ~184) to check config before falling back to `parent.model`
- [x] **App UI**: Add subagent model picker in settings (reuse model selection pattern)
- [x] **App i18n**: Add English source strings for the new settings UI
- [ ] **Test**: Add a focused test for the model resolution order: `override > agent.model > config.subagent.model > parent.model`

## 2. Offload LLM Work to Non-LLM Tools

> Use LSPs, lint, typecheck, and other deterministic tools to provide structured feedback instead of asking the model to analyze code. Reduces context bloat and speeds up slow hardware.

- [x] Enable LSPs by default in config schema (built-in servers: typescript, eslint, oxlint, etc.)
- [ ] Add LSP toggle to app settings UI
- [ ] Document "offload to tools" strategy in project templates
- [ ] Explore: use LSP diagnostics + go-to-definition in the agent's read/edit workflow
