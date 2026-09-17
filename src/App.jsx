import { useEffect, useState } from "react"

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

function useSystemTheme() {
  const get = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  const [system, setSystem] = useState(get)
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (event) => setSystem(event.matches ? "dark" : "light")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])
  return system
}

export default function App() {
  const resolved = useSystemTheme()

  return (
    <ThemeContext.Provider value={resolved}>
    <main data-page="box">
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
        <SiteFooter />
      </div>
    </main>
    </ThemeContext.Provider>
  )
}
