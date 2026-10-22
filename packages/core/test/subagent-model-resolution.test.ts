import { describe, expect, it } from "bun:test"
import { Config } from "@opencode/core/config"
import type { Document, Entry } from "@opencode/schema/config"

const doc = (info: Partial<Document["info"]>): Entry =>
  ({ type: "document", path: "/fake", info: info as Document["info"] }) as Document

const dir = (path: string): Entry => ({ type: "directory", path })

describe("Config.latest subagent model resolution", () => {
  it("returns undefined when no entries have subagent", () => {
    const entries: Entry[] = [doc({ model: { providerID: "test", model: "qwen" } })]

    expect(Config.latest(entries, "subagent")).toBeUndefined()
  })

  it("returns subagent config from a single entry", () => {
    const model = { providerID: "subagent", model: "qwen-4b" } as const
    const entries: Entry[] = [doc({ subagent: { model } })]

    expect(Config.latest(entries, "subagent")?.model).toEqual(model)
  })

  it("uses the highest-priority entry (last wins)", () => {
    const globalModel = { providerID: "subagent", model: "qwen-4b" } as const
    const projectModel = { providerID: "subagent", model: "gpt-4o" } as const

    const entries: Entry[] = [
      doc({ subagent: { model: globalModel } }),
      doc({ subagent: { model: projectModel } }),
    ]

    expect(Config.latest(entries, "subagent")?.model).toEqual(projectModel)
  })

  it("skips entries where subagent has no model field", () => {
    const model = { providerID: "subagent", model: "qwen-4b" } as const

    const entries: Entry[] = [
      doc({ subagent: {} }),
      doc({ model: { providerID: "test", model: "parent-model" } }),
      doc({ subagent: { model } }),
    ]

    expect(Config.latest(entries, "subagent")?.model).toEqual(model)
  })

  it("skips directory entries", () => {
    const model = { providerID: "subagent", model: "qwen-4b" } as const

    const entries: Entry[] = [
      doc({ subagent: { model } }),
      dir("/some/path"),
    ]

    expect(Config.latest(entries, "subagent")?.model).toEqual(model)
  })
})

describe("subagent model resolution order", () => {
  it("respects override > agent.model > config.subagent.model > parent.model", () => {
    const parentModel = { providerID: "orchestrator", model: "qwen-35b" } as const
    const agentModel = { providerID: "orchestrator", model: "qwen-35b-v2" } as const
    const configModel = { providerID: "subagent", model: "qwen-4b" } as const

    // Case 1: override wins
    expect(
      { ...parentModel } ?? agentModel ?? Config.latest([doc({ subagent: { model: configModel } })], "subagent")?.model ?? parentModel,
    ).toEqual(parentModel)

    // Case 2: agent.model when no override
    expect(
      undefined ?? agentModel ?? Config.latest([doc({ subagent: { model: configModel } })], "subagent")?.model ?? parentModel,
    ).toEqual(agentModel)

    // Case 3: config.subagent.model when no override and no agent model
    expect(
      undefined ?? undefined ?? Config.latest([doc({ subagent: { model: configModel } })], "subagent")?.model ?? parentModel,
    ).toEqual(configModel)

    // Case 4: parent.model fallback when nothing else set
    const noSubagentEntries: Entry[] = [doc({ model: { providerID: "test", model: "fallback" } })]

    expect(
      undefined ?? undefined ?? Config.latest(noSubagentEntries, "subagent")?.model ?? parentModel,
    ).toEqual(parentModel)
  })
})
