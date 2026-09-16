import { useCallback, useEffect, useState } from "react"

import { ThemeContext } from "./theme.js"

import SiteHeader from "./components/SiteHeader.jsx"
import Hero from "./components/Hero.jsx"
import ConsoleSection from "./components/ConsoleSection.jsx"
import DemoSection from "./components/DemoSection.jsx"
import PlatformSection from "./components/PlatformSection.jsx"
import CompareSection from "./components/CompareSection.jsx"
import SpecSection from "./components/SpecSection.jsx"
import HowItWorks from "./components/HowItWorks.jsx"
import FaqSection from "./components/FaqSection.jsx"
import ClosingSection from "./components/ClosingSection.jsx"
import SiteFooter from "./components/SiteFooter.jsx"

function getInitialTheme() {
  try {
    const saved = localStorage.getItem("bx-theme")
    if (saved === "light" || saved === "dark") return saved
  } catch {}
  return "system"
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  )

  useEffect(() => {
    try {
      if (theme === "system") localStorage.removeItem("bx-theme")
      else localStorage.setItem("bx-theme", theme)
    } catch {}
    const root = document.documentElement
    if (theme === "system") root.removeAttribute("data-bx-theme")
    else root.setAttribute("data-bx-theme", theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (event) => setSystemDark(event.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  const setThemePreference = useCallback((value) => setTheme(value), [])

  const themeAttr = theme === "system" ? undefined : theme
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme

  return (
    <ThemeContext.Provider value={resolved}>
    <main data-page="box" data-theme={themeAttr}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <div data-component="container">
        <div id="main">
          <Hero />
          <ConsoleSection />
          <DemoSection />
          <PlatformSection />
          <CompareSection />
          <SpecSection />
          <HowItWorks />
          <FaqSection />
          <ClosingSection />
        </div>
        <SiteFooter theme={theme} onThemeChange={setThemePreference} />
      </div>
    </main>
    </ThemeContext.Provider>
  )
}
