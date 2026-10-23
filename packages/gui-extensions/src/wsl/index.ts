import { Schema } from "effect"
import { Extension, Store } from "../sdk"
import { Wsl } from "./contract"
import en from "./i18n/en"

// Read leniently like the settings file it migrates from: one bad record must not drop the others.
const Saved = Schema.Struct({ servers: Schema.Array(Schema.Unknown) })

export default Extension.define({
  id: "wsl",
  os: ["windows"],
  provides: { wsl: Wsl },
  stores: {
    // The distros main serves; stored before in the desktop settings file.
    servers: Store.main(Saved, { servers: [] }, { settings: "wslServers" }),
  },
  i18n: {
    en,
  }
})
