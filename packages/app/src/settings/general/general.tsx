import { Component, For, Show, createMemo, createResource } from "solid-js"
import { createMediaQuery } from "@solid-primitives/media"
import { Select } from "@opencode/ui/select"
import { Switch } from "@opencode/ui/switch"
import { Popover } from "@kobalte/core/popover"
import { TimelineDetailControl } from "@/settings/timeline-detail"
import { useLanguage } from "@/runtime/i18n/language"
import { usePlatform } from "@/runtime/platform/platform"
import { ExtensionSettingsSections } from "@/runtime/extension/settings-page-view"
import {
  type FollowUpBehavior,
  type TerminalPlacement,
  type WorkspaceDefaultDestination,
  useSettings,
} from "@/settings/model"
import { formatKeybind } from "@/shell/commands/command"
import { SettingsList } from "@/settings/list"
import { SettingsRow } from "@/settings/row"
import { createShellOptions, createSubagentModelController, type ShellSettingsController, type SubagentModelSettingsController } from "./controllers"
import { useGlobal } from "@/runtime/server/runtime"
import { ServerConnection } from "@/runtime/server/registry"
import "@/settings/settings.css"

const tabLayoutOptions: ("horizontal" | "vertical")[] = ["horizontal", "vertical"]

const AutoApprovePermissionsSetting: Component = () => {
  const language = useLanguage()
  const settings = useSettings()

  return (
    <SettingsRow
      title={language.t("command.permissions.autoaccept.enable")}
      description={language.t("settings.permissions.autoAccept.default.description")}
    >
      <div data-action="settings-auto-accept-permissions">
        <Switch
          checked={settings.permissions.autoApproveDefault()}
          onChange={(checked) => settings.permissions.setAutoApproveDefault(checked)}
        />
      </div>
    </SettingsRow>
  )
}

const WorkspaceDestinationSetting: Component = () => {
  const language = useLanguage()
  const settings = useSettings()

  const options = createMemo((): { value: WorkspaceDefaultDestination; label: string }[] => [
    { value: "last-used", label: language.t("settings.workspaces.default.lastUsed") },
    { value: "local", label: language.t("settings.workspaces.default.local") },
    { value: "new", label: language.t("settings.workspaces.default.new") },
  ])

  return (
    <SettingsRow
      title={language.t("settings.workspaces.default.title")}
      description={language.t("settings.workspaces.default.description")}
    >
      <Select
        data-action="settings-workspace-destination"
        options={options()}
        current={options().find((option) => option.value === settings.workspaces.defaultDestination())}
        value={(option) => option.value}
        label={(option) => option.label}
        placement="bottom-end"
        gutter={6}
        onSelect={(option) => option && settings.workspaces.setDefaultDestination(option.value)}
      />
    </SettingsRow>
  )
}

export const ShellSetting: Component<{ controller: ShellSettingsController }> = (props) => {
  const language = useLanguage()

  const options = createMemo(() =>
    createShellOptions({
      shells: props.controller.shells(),
      current: props.controller.current(),
    }),
  )

  return (
    <SettingsRow
      title={language.t("settings.general.row.shell.title")}
      description={language.t("settings.general.row.shell.description")}
    >
      <Select
        data-action="settings-shell"
        options={options()}
        current={options().find((option) => option.value === props.controller.current()) ?? options()[0]}
        placement="bottom-end"
        gutter={6}
        value={(option) => option.id}
        label={(option) => {
          if (option.id === "auto") return language.t("settings.general.row.shell.autoDefault")

          if (!option.terminalOnly) return option.name

          return `${option.name} (${language.t("settings.general.row.shell.terminalOnly")})`
        }}
        onSelect={(option) => option && props.controller.select(option.value)}
      />
    </SettingsRow>
  )
}

const SubagentModelSetting: Component<{ controller: SubagentModelSettingsController }> = (props) => {
  const language = useLanguage()

  const options = createMemo(() => props.controller.options())

  return (
    <SettingsRow
      title={language.t("settings.general.row.subagentModel.title")}
      description={language.t("settings.general.row.subagentModel.description")}
    >
      <Popover gutter={6} placement="bottom-end">
        <Popover.Trigger>
          <button
            type="button"
            data-action="settings-subagent-model"
            class="rounded-lg px-3 py-1.5 text-start text-v2-text-text-base hover:bg-v2-overlay-simple-overlay-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <Show
              when={props.controller.current()}
              fallback={language.t("settings.general.row.subagentModel.default")}
            >
              {(model) => {
                const item = options().find((o) => o.current)

                return item ? item.name : `${model().providerID}:${model().model}`
              }}
            </Show>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            class="min-w-[220px] max-h-[320px] overflow-y-auto rounded-lg border border-v2-border-subtle bg-v2-background-surface p-1 shadow-lg"
          >
            <div class="px-2 py-1.5">
              <button
                type="button"
                class="w-full rounded-md px-2 py-1.5 text-start text-sm hover:bg-v2-overlay-simple-overlay-hover"
                classList={{ "bg-v2-overlay-simple-overlay-hover": !props.controller.current() }}
                onClick={() => props.controller.select(null)}
              >
                {language.t("settings.general.row.subagentModel.default")}
              </button>
            </div>
            <div class="border-t border-v2-border-subtle" />
            <div class="max-h-[260px] overflow-y-auto">
              <For each={options()}>
                {(option) => (
                  <button
                    type="button"
                    class="w-full rounded-md px-2 py-1.5 text-start text-sm hover:bg-v2-overlay-simple-overlay-hover"
                    classList={{ "bg-v2-overlay-simple-overlay-hover": option.current }}
                    onClick={() => props.controller.select(option)}
                  >
                    {option.name}
                  </button>
                )}
              </For>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </SettingsRow>
  )
}

const TerminalPlacementSetting: Component = () => {
  const language = useLanguage()
  const settings = useSettings()

  const options = createMemo((): { value: TerminalPlacement; label: string }[] => [
    { value: "side", label: language.t("settings.general.row.terminalPlacement.side") },
    { value: "bottom", label: language.t("settings.general.row.terminalPlacement.bottom") },
  ])

  return (
    <SettingsRow
      title={language.t("settings.general.row.terminalPlacement.title")}
      description={language.t("settings.general.row.terminalPlacement.description")}
    >
      <Select
        data-action="settings-terminal-placement"
        options={options()}
        current={options().find((option) => option.value === settings.general.terminalPlacement())}
        value={(option) => option.value}
        label={(option) => option.label}
        placement="bottom-end"
        gutter={6}
        onSelect={(option) => option && settings.general.setTerminalPlacement(option.value)}
      />
    </SettingsRow>
  )
}

const FollowUpBehaviorSetting: Component = () => {
  const language = useLanguage()
  const settings = useSettings()

  const options = createMemo((): { value: FollowUpBehavior; label: string }[] => [
    { value: "queue", label: language.t("settings.general.row.followUpBehavior.queue") },
    { value: "steer", label: language.t("settings.general.row.followUpBehavior.steer") },
  ])

  return (
    <SettingsRow
      title={language.t("settings.general.row.followUpBehavior.title")}
      description={language.t("settings.general.row.followUpBehavior.description", {
        keybind: formatKeybind("mod+enter", language.t),
      })}
    >
      <Select
        data-action="settings-follow-up-behavior"
        options={options()}
        current={options().find((option) => option.value === settings.general.followUpBehavior())}
        value={(option) => option.value}
        label={(option) => option.label}
        placement="bottom-end"
        gutter={6}
        onSelect={(option) => option && settings.general.setFollowUpBehavior(option.value)}
      />
    </SettingsRow>
  )
}

const LanguageSetting = () => {
  const language = useLanguage()

  const options = createMemo(() =>
    language.locales.map((locale) => ({
      value: locale,
      label: language.label(locale),
    })),
  )

  return (
    <SettingsRow
      title={language.t("settings.general.row.language.title")}
      description={language.t("settings.general.row.language.description")}
    >
      <Select
        data-action="settings-language"
        options={options()}
        placement="bottom-end"
        gutter={6}
        current={options().find((option) => option.value === language.locale())}
        value={(option) => option.value}
        label={(option) => option.label}
        onSelect={(option) => option && language.setLocale(option.value)}
      />
    </SettingsRow>
  )
}

const TabLayoutSetting = () => {
  const language = useLanguage()
  const settings = useSettings()

  return (
    <SettingsRow
      title={language.t("settings.appearance.row.tabs.title")}
      description={language.t("settings.appearance.row.tabs.description")}
    >
      <Select
        data-action="settings-tab-layout"
        options={tabLayoutOptions}
        current={tabLayoutOptions.find((option) => option === settings.appearance.tabLayout())}
        aria-label={language.t("settings.appearance.row.tabs.title")}
        placement="bottom-end"
        gutter={6}
        label={(option) =>
          option === "horizontal"
            ? language.t("settings.appearance.row.tabs.horizontal")
            : language.t("settings.appearance.row.tabs.vertical")
        }
        onSelect={(option) => option && settings.appearance.setTabLayout(option)}
      />
    </SettingsRow>
  )
}

export const SettingsGeneral: Component = () => {
  const language = useLanguage()
  const platform = usePlatform()
  const settings = useSettings()
  const mobile = createMediaQuery("(max-width: 767px)")
  const desktop = createMemo(() => platform.platform === "desktop")
  const servers = useGlobal().servers.list
  const server = createMemo(() => servers()[0] ?? undefined)

  const subagentModelController = createSubagentModelController(() => server() as ServerConnection.Any)

  const [pinchZoom, { mutate: setPinchZoom }] = createResource(
    () => desktop() && "getPinchZoomEnabled" in platform,
    () => Promise.resolve(platform.getPinchZoomEnabled?.() ?? false).catch(() => false),
    { initialValue: false },
  )

  const onPinchZoomChange = (checked: boolean) => {
    setPinchZoom(checked)
    const update = platform.setPinchZoomEnabled?.(checked)

    if (!update) return
    void update.catch(() => setPinchZoom(!checked))
  }

  const GeneralSection = () => (
    <div class="settings-section">
      <h3 class="settings-section-title">{language.t("settings.general.section.general")}</h3>
      <SettingsList>
        <LanguageSetting />
        <TabLayoutSetting />

        <WorkspaceDestinationSetting />
        <AutoApprovePermissionsSetting />

        <SettingsRow
          title={language.t("settings.general.row.showCustomAgents.title")}
          description={language.t("settings.general.row.showCustomAgents.description")}
        >
          <div data-action="settings-show-custom-agents">
            <Switch
              checked={settings.general.showCustomAgents()}
              onChange={(checked) => settings.general.setShowCustomAgents(checked)}
            />
          </div>
        </SettingsRow>

        <TerminalPlacementSetting />
        <FollowUpBehaviorSetting />

        <SubagentModelSetting controller={subagentModelController} />

        <Show when={desktop()}>
          <SettingsRow
            title={language.t("settings.general.row.pinchZoom.title")}
            description={language.t("settings.general.row.pinchZoom.description")}
          >
            <div data-action="settings-pinch-zoom">
              <Switch checked={pinchZoom.latest} onChange={onPinchZoomChange} />
            </div>
          </SettingsRow>
        </Show>

        <ExtensionSettingsSections page="general" section="general" />

        <Show when={mobile()}>
          <SettingsRow
            title={language.t("settings.general.row.mobileTitlebarBottom.title")}
            description={language.t("settings.general.row.mobileTitlebarBottom.description")}
          >
            <div data-action="settings-mobile-titlebar-bottom">
              <Switch
                checked={settings.general.mobileTitlebarPosition() === "bottom"}
                onChange={(checked) => settings.general.setMobileTitlebarPosition(checked ? "bottom" : "top")}
              />
            </div>
          </SettingsRow>
        </Show>
      </SettingsList>
    </div>
  )

  return (
    <>
      <div class="settings-tab-header">
        <div class="settings-tab-header-row">
          <div class="flex flex-col gap-1">
            <h2 class="settings-tab-title">{language.t("settings.tab.preferences")}</h2>
            <span class="text-11-regular text-v2-text-text-muted">
              {language.t("settings.preferences.description")}
            </span>
          </div>
        </div>
      </div>
      <div class="settings-tab-body settings-tab-body--sectioned">
        <GeneralSection />

        <section class="settings-section" aria-label={language.t("settings.timeline.title")}>
          <h3 class="settings-section-title">{language.t("settings.timeline.title")}</h3>
          <SettingsList>
            <div class="py-5">
              <TimelineDetailControl
                value={settings.general.timelineDetail()}
                onChange={settings.general.setTimelineDetail}
              />
            </div>
            <SettingsRow
              title={language.t("settings.timeline.row.turnDiffs.title")}
              description={language.t("settings.timeline.row.turnDiffs.description")}
            >
              <div data-action="settings-show-turn-diffs">
                <Switch
                  checked={settings.general.showTurnDiffs()}
                  onChange={(checked) => settings.general.setShowTurnDiffs(checked)}
                />
              </div>
            </SettingsRow>
          </SettingsList>
        </section>

        <ExtensionSettingsSections page="general" />
      </div>
    </>
  )
}
