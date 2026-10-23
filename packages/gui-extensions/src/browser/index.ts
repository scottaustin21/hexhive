import { Schema } from "effect"
import { Extension, Ipc, Store } from "../sdk"
import { Browser } from "./contract"
import { History } from "./history"
import en from "./i18n/en"
import type { BrowserPane } from "./ipc"

// The pane's Ipc, which the main entry provides and the renderer's model reads as `ctx.uses.pane` once a session
// opens. A reference, so its protocol schemas load with the model instead of at startup.
const Pane = Ipc.ref<typeof BrowserPane>("browser.pane")

export default Extension.define({
  id: "browser",
  provides: { browser: Browser, pane: Pane },
  stores: {
    // The end of the last block of element refs main reserved, so refs stay unique across reloads.
    refs: Store.main(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)), 0),
    // Pages the browser showed, for the new tab page and the address field's suggestions. One list for every
    // session and server, kept on this device.
    history: Store.global(History, { visits: [] }),
  },
  i18n: {
    en,
  }
})
