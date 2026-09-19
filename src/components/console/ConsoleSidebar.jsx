import { ChevronDown, Plus, Search, Settings } from "lucide-react"

import { APP_URL } from "../../content.js"
import { AGENTS, CHATS, NAV } from "../../content/console-data.js"

export default function ConsoleSidebar({
  chatId,
  setChatId,
  sideTab,
  setSideTab,
  activeNav,
  setActiveNav,
  query,
  setQuery,
}) {
  const filtered = CHATS.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <aside data-slot="live-side" aria-label="Workspace">
      <div data-slot="live-brand">
        <img src="/brand/boxcompute-symbol.svg" width="20" height="20" alt="" />
        boxcompute
      </div>
      <div data-slot="live-ws">
        <span data-slot="live-avatar" data-tone="ember">
          NR
        </span>
        <span>
          <b>Northwind Retail</b>
          <span>Production · 3 members</span>
        </span>
        <ChevronDown aria-hidden="true" />
      </div>
      <nav data-slot="live-nav" aria-label="Console">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            data-active={activeNav === id}
            aria-current={activeNav === id ? "true" : undefined}
            onClick={() => setActiveNav(id)}
          >
            <Icon aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>
      {/* Sidebar views are toggle buttons: there is no tabpanel and no
          aria-controls, so tab semantics announced a relationship that
          pointed at nothing, and arrow-key navigation was never wired. */}
      <div data-slot="live-tabs" role="group" aria-label="Sidebar view">
        {["chats", "agents"].map((tab) => (
          <button
            key={tab}
            type="button"
            data-active={sideTab === tab}
            aria-pressed={sideTab === tab}
            onClick={() => {
              setSideTab(tab)
              setActiveNav(tab)
            }}
          >
            {tab === "chats" ? "Chats" : "Agents"}
          </button>
        ))}
      </div>

      {sideTab === "chats" ? (
        <>
          <div data-slot="live-search">
            <Search aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
            />
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="New chat in the real console"
            >
              <Plus aria-hidden="true" />
            </a>
          </div>
          <p data-slot="live-group">Today</p>
          <ul data-slot="live-chats">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  data-active={c.id === chatId}
                  aria-current={c.id === chatId ? "true" : undefined}
                  onClick={() => setChatId(c.id)}
                >
                  <span data-slot="live-avatar" data-tone="mint">
                    BC
                  </span>
                  <span>
                    <b>{c.title}</b>
                    <span>
                      {c.model} · {c.status}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li data-slot="live-empty">No chats match “{query}”.</li>
            ) : null}
          </ul>
        </>
      ) : (
        <ul data-slot="live-chats">
          {AGENTS.map((agent) => (
            <li key={agent.name}>
              <button type="button" data-active={false} onClick={() => setSideTab("chats")}>
                <span data-slot="live-avatar" data-tone="mint">
                  {agent.name.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <b>{agent.name}</b>
                  <span>{agent.detail}</span>
                </span>
                <span data-slot="live-mini">{agent.status}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div data-slot="live-user">
        <button type="button" aria-label="Settings">
          <Settings aria-hidden="true" /> Settings
        </button>
        <span>
          <span data-slot="live-avatar" data-tone="plain">
            PR
          </span>
          <span>
            <b>Priya Raman</b>
            <span>priya@northwindretail.com</span>
          </span>
        </span>
      </div>
    </aside>
  )
}
