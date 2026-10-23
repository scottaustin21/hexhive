import { createMemo, createResource, type Accessor } from "solid-js"
import type { ColorScheme } from "@opencode/ui/theme/context"
import { useTheme } from "@opencode/ui/theme/context"
import {
  monoDefault,
  monoFontFamily,
  monoInput,
  sansDefault,
  sansFontFamily,
  sansInput,
  terminalDefault,
  terminalFontFamily,
  terminalInput,
  useSettings,
} from "@/settings/model"
import { playSoundById, SOUND_OPTIONS } from "@/shell/notifications/sound"
import { createSoundPreviewController } from "./behavior"
import { ServerConnection } from "@/runtime/server/registry"
import { useServerCtx } from "@/runtime/server/runtime"
import { useLanguage } from "@/runtime/i18n/language"
import { showToast } from "@/shell/notifications/toast"
import { Schema } from "effect"
import { Predicate } from "effect"

export { createShellOptions, createSoundPreviewController } from "./behavior"

export type { ShellOption, ShellSelectOption } from "./behavior"

const ConfigModelSelectionSchema = Schema.Struct({
  providerID: Schema.String,
  model: Schema.String,
  variant: Schema.optional(Schema.String),
})

type ConfigModelSelection = typeof ConfigModelSelectionSchema.Type

export type SubagentModelOption = {
  providerID: string
  modelID: string
  name: string
  current: boolean
}

export function createSubagentModelController(server: Accessor<ServerConnection.Any>) {
  const language = useLanguage()
  const serverCtx = useServerCtx(server)

  const [state] = createResource(
    () => ServerConnection.key(server()),
    async () => {
      const context = serverCtx()

      const [entries, shells] = await Promise.all([
        context.sdk.api.config.get().catch(() => []),
        context.sdk.api.config.shells().catch(() => []),
      ])

      const boundary = entries.findIndex((entry) => entry.type === "directory")
      const configGlobal = boundary === -1 ? entries : entries.slice(0, boundary)

      const subagentModel = configGlobal
        .flatMap((entry) => (entry.type === "document" && entry.info.subagent?.model !== undefined ? [entry.info.subagent.model] : []))
        .at(-1)

      return {
        shells,
        shell: configGlobal
          .flatMap((entry) => (entry.type === "document" && entry.info.shell !== undefined ? [entry.info.shell] : []))
          .at(-1),
        subagentModel: subagentModel ? ConfigModelSelectionSchema.make(subagentModel) : undefined,
      }
    },
    { initialValue: { shells: [], shell: undefined, subagentModel: undefined as ConfigModelSelection | undefined } },
  )

  const options = createMemo(() => {
    const result: SubagentModelOption[] = []

    const ctx = serverCtx()

    if (!ctx) return result

    const providers = ctx.data.location.provider.list()

    if (!providers) return result

    const models = ctx.data.location.model.list()

    if (!models) return result

    for (const provider of providers.values()) {
      const providerModels = models.get(provider.id) ?? {}

      for (const [id, modelInfo] of Object.entries(providerModels)) {
        result.push({
          providerID: provider.id,
          modelID: id,
          name: modelInfo.name,
          current: Predicate.isBoolean(state.latest.subagentModel)
            ? false
            : state.latest.subagentModel?.providerID === provider.id && state.latest.subagentModel?.model === id,
        })
      }
    }

    return result
  })

  return {
    current: () => state.latest.subagentModel,
    currentName: () => {
      const model = state.latest.subagentModel

      if (!model) return language.t("settings.general.row.subagentModel.default")

      const ctx = serverCtx()

      if (!ctx) return `${model.providerID}:${model.model}`

      const models = ctx.data.location.model.list()

      if (!models) return `${model.providerID}:${model.model}`

      const providerModels = models.get(model.providerID) ?? {}

      const item = providerModels[model.model]

      return item?.name ?? `${model.providerID}:${model.model}`
    },
    options,
    select: (option: SubagentModelOption | null) => {
      const previous = state.latest.subagentModel

      if (option) {
        const selection: ConfigModelSelection = {
          providerID: option.providerID,
          model: option.modelID,
        }

        state.mutate({ ...previous, subagentModel: selection })

        void serverCtx()
          .sdk.api.config.update({ subagent: { model: selection } })
          .catch((error: unknown) => {
            state.mutate(previous)
            showToast({
              variant: "error",
              title: language.t("common.requestFailed"),
              description: error instanceof Error ? error.message : language.t("common.requestFailed"),
            })
          })
      } else {
        state.mutate({ ...previous, subagentModel: undefined })

        void serverCtx()
          .sdk.api.config.update({ subagent: { model: null } })
          .catch((error: unknown) => {
            state.mutate(previous)
            showToast({
              variant: "error",
              title: language.t("common.requestFailed"),
              description: error instanceof Error ? error.message : language.t("common.requestFailed"),
            })
          })
      }
    },
  }
}

export type SubagentModelSettingsController = ReturnType<typeof createSubagentModelController>

export function createServerShellController(server: Accessor<ServerConnection.Any>) {
  const language = useLanguage()
  const serverCtx = useServerCtx(server)
  const source = () => ServerConnection.key(server())

  const [state, actions] = createResource(
    source,
    async () => {
      const context = serverCtx()

      const [entries, shells] = await Promise.all([
        context.sdk.api.config.get().catch(() => []),
        context.sdk.api.config.shells().catch(() => []),
      ])

      const boundary = entries.findIndex((entry) => entry.type === "directory")
      const global = boundary === -1 ? entries : entries.slice(0, boundary)

      return {
        shells,
        shell: global
          .flatMap((entry) => (entry.type === "document" && entry.info.shell !== undefined ? [entry.info.shell] : []))
          .at(-1),
      }
    },
    { initialValue: { shells: [], shell: undefined } },
  )

  return {
    shells: () => state.latest.shells,
    current: () => state.latest.shell ?? "",
    select: (value: string) => {
      if (value === (state.latest.shell ?? "")) return
      const previous = state.latest
      actions.mutate({ ...previous, shell: value || undefined })
      void serverCtx()
        .sdk.api.config.update({ shell: value || null })
        .catch((error: unknown) => {
          actions.mutate(previous)
          showToast({
            variant: "error",
            title: language.t("common.requestFailed"),
            description: error instanceof Error ? error.message : language.t("common.requestFailed"),
          })
        })
    },
  }
}

export function createAppearanceSettingsController() {
  const settings = useSettings()
  const theme = useTheme()
  const themes = createMemo(() => theme.ids().map((id) => ({ id, name: theme.name(id) })))

  onMount(() => void theme.loadThemes())

  return {
    scheme: {
      current: theme.colorScheme,
      select: (value: ColorScheme) => theme.setColorScheme(value),
    },
    theme: {
      options: themes,
      current: createMemo(() => themes().find((option) => option.id === theme.themeId())),
      select: (option: { id: string } | null) => option && theme.setTheme(option.id),
    },
    fonts: {
      ui: createMemo(() => ({
        value: sansInput(settings.appearance.uiFont()),
        family: sansFontFamily(settings.appearance.uiFont()),
        placeholder: sansDefault,
      })),
      code: createMemo(() => ({
        value: monoInput(settings.appearance.font()),
        family: monoFontFamily(settings.appearance.font()),
        placeholder: monoDefault,
      })),
      terminal: createMemo(() => ({
        value: terminalInput(settings.appearance.terminalFont()),
        family: terminalFontFamily(settings.appearance.terminalFont()),
        placeholder: terminalDefault,
      })),
      setUI: (value: string) => settings.appearance.setUIFont(value),
      setCode: (value: string) => settings.appearance.setFont(value),
      setTerminal: (value: string) => settings.appearance.setTerminalFont(value),
    },
  }
}

const noneSound = { id: "none", label: "sound.option.none" } as const

export const soundOptions = [noneSound, ...SOUND_OPTIONS]

export type SoundSelectOption = (typeof soundOptions)[number]

export function createSoundSettingsController() {
  const settings = useSettings()
  const preview = createSoundPreviewController(playSoundById)

  const channel = (
    enabled: Accessor<boolean>,
    current: Accessor<string>,
    setEnabled: (value: boolean) => void,
    set: (id: string) => void,
  ) => ({
    current: createMemo(() =>
      enabled() ? (soundOptions.find((option) => option.id === current()) ?? noneSound) : noneSound,
    ),
    highlight: (option: SoundSelectOption | undefined) => {
      if (!option) return
      preview.play(option.id === "none" ? undefined : option.id)
    },
    select: (option: SoundSelectOption | null) => {
      if (!option) return

      if (option.id === "none") {
        setEnabled(false)
        preview.stop()

        return
      }

      setEnabled(true)
      set(option.id)
      preview.play(option.id)
    },
  })

  return {
    agent: channel(
      settings.sounds.agentEnabled,
      settings.sounds.agent,
      (value) => settings.sounds.setAgentEnabled(value),
      (id) => settings.sounds.setAgent(id),
    ),
    permissions: channel(
      settings.sounds.permissionsEnabled,
      settings.sounds.permissions,
      (value) => settings.sounds.setPermissionsEnabled(value),
      (id) => settings.sounds.setPermissions(id),
    ),
    errors: channel(
      settings.sounds.errorsEnabled,
      settings.sounds.errors,
      (value) => settings.sounds.setErrorsEnabled(value),
      (id) => settings.sounds.setErrors(id),
    ),
  }
}

export type ShellSettingsController = ReturnType<typeof createServerShellController>

export type AppearanceSettingsController = ReturnType<typeof createAppearanceSettingsController>

export type SoundSettingsController = ReturnType<typeof createSoundSettingsController>
