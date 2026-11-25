import type { FacilityResult, Filters, Page, PublicPage, SurveyResponse } from "../../types"
import { analyze, facilities, formatNumber, importResponses, EMPTY_FILTERS } from "../../utils/saw"
import { Button, EmptyState, Field, FilterBar, Icon, PageHeader, PublicHeader, Status } from "../../components/ui"

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Informasi profil dan konfigurasi metode penelitian."
      />
      <div className="settings-grid">
        <section className="card settings-card">
          <h2>Profil Administrator</h2>
          <div className="profile-edit">
            <div className="avatar large">RD</div>
            <div>
              <b>Richard Devin</b>
              <p>Administrator Sistem</p>
            </div>
          </div>
          <Field label="Nama Lengkap" value="Richard Devin" />
          <Field label="Email" value="richard.devin@junction.ac.id" />
          <Button>Simpan Profil</Button>
        </section>
        <section className="card settings-card">
          <h2>Konfigurasi SAW</h2>
          {[
            "C1 — Kesenjangan kepuasan — 0,40",
            "C2 — Jumlah penilaian rendah — 0,30",
            "C3 — Proporsi penilaian rendah — 0,30",
          ].map((item) => (
            <div className="setting-row" key={item}>
              <span>{item}</span>
              <b>Benefit</b>
            </div>
          ))}
          <div className="calc-total">
            <span>Total bobot</span>
            <b>1,00</b>
          </div>
        </section>
      </div>
    </>
  )
}
