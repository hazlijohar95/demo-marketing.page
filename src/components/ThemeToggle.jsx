import { useResolvedTheme } from "../lib/theme.js"

const OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
]

export default function ThemeToggle() {
  const [, override, set] = useResolvedTheme()
  return (
    <span data-component="theme-toggle" role="group" aria-label="Color theme">
      {OPTIONS.map((option) => {
        const current = override === option.value
        return (
          <button
            key={option.value}
            type="button"
            data-active={current ? "true" : undefined}
            aria-pressed={current}
            onClick={() => set(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </span>
  )
}
