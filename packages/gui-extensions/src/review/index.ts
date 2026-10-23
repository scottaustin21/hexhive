import { Schema } from "effect"
import { FileTree, OpenInApp } from "../file/contract"
import { Extension, Store } from "../sdk"
import { Changes } from "./contract"
import en from "./i18n/en"

const DiffState = Schema.Struct({ diffStyle: Schema.Literals(["unified", "split"]) })

const PanelState = Schema.Struct({ expandMode: Schema.Literals(["expand", "collapse"]) })

const MobileDiff = Schema.Struct({ wrap: Schema.Boolean })

const SessionState = Schema.Struct({
  mode: Schema.optional(Schema.Literals(["git", "branch", "turn"])),
  file: Schema.optional(Schema.String),
  open: Schema.Array(Schema.String),
})

export default Extension.define({
  id: "review",
  provides: { changes: Changes },
  // The changed files list in the file browser's tree; without it the list stays empty. The toolbar also shows the
  // file extension's "Open in" button.
  uses: { tree: FileTree, openIn: OpenInApp },
  stores: {
    diff: Store.global(
      DiffState,
      { diffStyle: "split" },
      {
        key: "layout",
        pick: (value: { review?: { diffStyle?: unknown } } | null) => {
          const diffStyle = value?.review?.diffStyle

          return diffStyle === undefined ? undefined : { diffStyle }
        },
      },
    ),
    panel: Store.global(
      PanelState,
      { expandMode: "collapse" },
      {
        key: "review-panel-v2",
        pick: (value: { expandMode?: unknown } | null) => {
          const expandMode = value?.expandMode

          return expandMode === undefined ? undefined : { expandMode }
        },
      },
    ),
    // Whether narrow screens wrap long diff lines; stored before in the app settings.
    mobileDiff: Store.global(
      MobileDiff,
      { wrap: true },
      {
        key: "settings.v3",
        pick: (value: { general?: { mobileDiffWrap?: unknown } } | null) => {
          const wrap = value?.general?.mobileDiffWrap

          return wrap === undefined ? undefined : { wrap }
        },
      },
    ),
    // The mode, selected file and open files of each session.
    session: Store.session(
      SessionState,
      { open: [] },
      {
        key: "layout",
        sessions: "sessionView",
        // An entry that holds only other fields, such as its scroll, holds no review state.
        pick: (entry: { reviewMode?: unknown; reviewFile?: unknown; reviewOpen?: unknown } | undefined) =>
          entry && [entry.reviewMode, entry.reviewFile, entry.reviewOpen].some((field) => field !== undefined)
            ? { mode: entry.reviewMode, file: entry.reviewFile, open: entry.reviewOpen }
            : undefined,
      },
    ),
  },
  i18n: {
    en,
  }
})
