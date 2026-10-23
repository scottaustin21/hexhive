import { Schema } from "effect"
import { Browser } from "../browser/contract"
import { Changes } from "../review/contract"
import { Extension, Store } from "../sdk"
import { OpenAppPreferences } from "./apps"
import { FileTree, OpenInApp } from "./contract"
import en from "./i18n/en"

const TreeState = Schema.Struct({ tab: Schema.Literals(["changes", "all"]) })

export default Extension.define({
  id: "file",
  provides: { tree: FileTree, openIn: OpenInApp },
  // Without review the tree lists only the workspace files; without the browser, HTML opens as a file tab.
  uses: { changes: Changes, browser: Browser },
  stores: {
    tree: Store.global(
      TreeState,
      { tab: "changes" },
      {
        key: "layout",
        pick: (value: { fileTree?: { tab?: unknown } } | null) => {
          const tab = value?.fileTree?.tab

          return tab === undefined ? undefined : { tab }
        },
      },
    ),
    // The open-in-app choice. Only the desktop reads it.
    app: Store.global(OpenAppPreferences, { app: "finder" }, "open.app"),
  },
  i18n: {
    en,
  }
})
