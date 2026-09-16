import { Monitor, Moon, Sun } from "lucide-react"

const OPTIONS = [
  { value: "system", label: "System theme", Icon: Monitor },
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
]

export default function ThemeToggle({ theme, onThemeChange }) {
  return (
    <div data-slot="theme-toggle" role="group" aria-label="Color theme">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          data-slot="theme-option"
          aria-pressed={theme === value}
          aria-label={label}
          title={label}
          onClick={() => onThemeChange(value)}
        >
          <Icon aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
