import { createContext, useContext } from "react"

export const ThemeContext = createContext("light")

export function useResolvedTheme() {
  return useContext(ThemeContext)
}
