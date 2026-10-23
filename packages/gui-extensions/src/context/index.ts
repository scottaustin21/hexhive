import { Extension } from "../sdk"
import en from "./i18n/en"

export default Extension.define({
  id: "context",
  legacy: ["usage"],
  i18n: {
    en,
  }
})
