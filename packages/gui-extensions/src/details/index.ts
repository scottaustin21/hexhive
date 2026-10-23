import { Schema } from "effect"
import { Changes } from "../review/contract"
import { Extension, Store } from "../sdk"
import en from "./i18n/en"

const Prefs = Schema.Struct({ projectExpanded: Schema.Boolean, serverExpanded: Schema.Boolean })

export default Extension.define({
  id: "details",
  legacy: ["summary"],
  uses: { changes: Changes },
  stores: {
    // Stored under the extension's earlier id `summary`, and before extensions in the app settings.
    prefs: Store.global(Prefs, { projectExpanded: true, serverExpanded: true }, [
      "extension.summary.prefs",
      { key: "settings.v3", pick: (value: { sessionSummary?: unknown } | null) => value?.sessionSummary },
    ]),
  },
  i18n: {
    en,
  }
})
