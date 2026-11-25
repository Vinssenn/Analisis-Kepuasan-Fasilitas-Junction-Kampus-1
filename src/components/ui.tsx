import React from "react"
import type { FacilityResult, Filters, Page, PublicPage, SurveyResponse } from "../types"
import { EMPTY_FILTERS } from "../utils/saw"
import type { ReactNode } from "react"

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    form: (
      <>
        <path d="M9 5h10M9 12h10M9 19h10" />
        <path d="m3 5 1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 13h6M9 17h6" />
      </>
    ),
    message: (
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3A1.7 1.7 0 0 0 14 21v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M20 8v6M23 11h-6" />
      </>
    ),
    trend: (
      <>
        <path d="m3 17 6-6 4 4 8-9" />
        <path d="M15 6h6v6" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 3.5 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
        <path d="M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" />
      </>
    ),
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8Z" />,
    back: <path d="m15 18-6-6 6-6" />,
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 4.5 6v5.5c0 4.8 3.2 7.7 7.5 9.5 4.3-1.8 7.5-4.7 7.5-9.5V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 19v2" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.grid}
    </svg>
  )
}

export function Button({
  children,
  icon,
  secondary,
  onClick,
}: {
  children: React.ReactNode
  icon?: string
  secondary?: boolean
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className={`btn ${secondary ? "secondary" : ""}`}>
      {icon && <Icon name={icon} size={16} />} {children}
    </button>
  )
}

export function Status({ rank, total }: { rank: number; total: number }) {
  const tier =
    rank <= Math.ceil(total / 3)
      ? "Tinggi"
      : rank <= Math.ceil((total * 2) / 3)
        ? "Sedang"
        : "Rendah"
  const tone =
    tier === "Tinggi" ? "danger" : tier === "Sedang" ? "warning" : "success"
  return (
    <span className={`status ${tone}`}>
      <i />
      {`Prioritas ${tier}`}
    </span>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-actions">{action}</div>}
    </div>
  )
}

export function FilterBar({
  responses,
  filters,
  setFilters,
}: {
  responses: SurveyResponse[]
  filters: Filters
  setFilters: (filters: Filters) => void
}) {
  const fields: { key: keyof Filters; label: string }[] = [
    { key: "faculty", label: "Semua fakultas" },
    { key: "program", label: "Semua program studi" },
    { key: "gender", label: "Semua gender" },
    { key: "cohort", label: "Semua angkatan" },
    { key: "frequency", label: "Semua frekuensi" },
  ]
  return (
    <div className="filter-bar">
      <div className="filter-label">
        <Icon name="filter" size={15} />
        <b>Filter analisis</b>
      </div>
      {fields.map((field) => {
        const options = [
          ...new Set(
            responses.map((response) => response[field.key]).filter(Boolean),
          ),
        ].sort()
        return (
          <select
            key={field.key}
            value={filters[field.key]}
            onChange={(event) =>
              setFilters({ ...filters, [field.key]: event.target.value })
            }
          >
            <option value="">{field.label}</option>
            {options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        )
      })}
      {Object.values(filters).some(Boolean) && (
        <button className="link-btn" onClick={() => setFilters(EMPTY_FILTERS)}>
          Atur ulang
        </button>
      )}
    </div>
  )
}

export function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="form" size={24} />
      </span>
      <h2>Data rating asli belum dimuat</h2>
      <p>
        Sinkronisasi Google Spreadsheet untuk memuat data responden dan menampilkan statistik, grafik, serta peringkat SAW.
      </p>
      <Button icon="download" onClick={onImport}>
        Sinkronisasi Spreadsheet
      </Button>
    </div>
  )
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input defaultValue={value} />
    </label>
  )
}

export function PublicHeader({
  page,
  setPage,
}: {
  page: PublicPage
  setPage: (page: PublicPage) => void
}) {
  return (
    <header className="public-header">
      <button
        className="public-brand"
        onClick={() => setPage("home")}
        aria-label="Kembali ke beranda"
      >
        <span>J</span>
        <div>
          <b>Junctify</b>
          <small>Campus Experience</small>
        </div>
      </button>
      <nav className="public-nav" aria-label="Navigasi publik">
        <button
          className={page === "home" ? "active" : ""}
          onClick={() => setPage("home")}
        >
          Beranda
        </button>
        <button
          className={page === "results" ? "active" : ""}
          onClick={() => setPage("results")}
        >
          Hasil Analisis
        </button>
        <button
          className={page === "survey" ? "active" : ""}
          onClick={() => setPage("survey")}
        >
          Isi Survei
        </button>
      </nav>
      <button className="admin-login-link" onClick={() => setPage("login")}>
        <Icon name="lock" size={15} /> Login Admin
      </button>
    </header>
  )
}
