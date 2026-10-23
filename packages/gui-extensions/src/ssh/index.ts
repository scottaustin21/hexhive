import { Schema } from "effect"
import { Extension, Store } from "../sdk"
import { Ssh, SshConfig } from "./contract"
import en from "./i18n/en"

export default Extension.define({
  id: "ssh",
  provides: { ssh: Ssh },
  stores: {
    // The saved hosts, which main keeps; stored before in the desktop settings file.
    servers: Store.main(Schema.Array(SshConfig), [], { settings: "ssh.servers" }),
  },
  i18n: {
    en,
  }
})
