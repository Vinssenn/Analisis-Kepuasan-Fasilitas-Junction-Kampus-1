import type { FacilityResult, Filters, Page, PublicPage, SurveyResponse } from "../../types"
import { analyze, facilities, formatNumber, importResponses, EMPTY_FILTERS, EXPECTED_RESPONSES } from "../../utils/saw"
import { Button, EmptyState, Field, FilterBar, Icon, PageHeader, PublicHeader, Status } from "../../components/ui"

export function QuestionnairePage({
  allResponses,
  responses,
  onSync,
}: {
  allResponses: SurveyResponse[]
  responses: SurveyResponse[]
  onSync: () => void
}) {
  return (
    <>
      <PageHeader
        title="Data Kuesioner"
        description="Data responden ditampilkan tanpa nama dan NIM untuk menjaga privasi."
        action={
        <Button icon="download" onClick={onSync}>
          Sinkronisasi Google Spreadsheet
        </Button>
      }
      />
      <div className="mini-stats four">
        <div>
          <span>Respons dimuat</span>
          <b>{allResponses.length}</b>
          <small>Dari target {EXPECTED_RESPONSES} respons</small>
        </div>
        <div>
          <span>Respons setelah filter</span>
          <b>{responses.length}</b>
          <small>Data aktif untuk analisis</small>
        </div>
        <div>
          <span>Aspek fasilitas</span>
          <b>14</b>
          <small>Skala Likert 1–5</small>
        </div>
        <div>
          <span>Privasi</span>
          <b>Aman</b>
          <small>Nama dan NIM tidak ditampilkan</small>
        </div>
      </div>
      {!allResponses.length ? (
        <section className="card">
          <EmptyState onImport={onSync} />
        </section>
      ) : (
        <section className="card table-card wide-table">
          <div className="card-head">
            <div>
              <h2>Respons anonim</h2>
              <p>
                Nilai “—” menandakan respons kosong atau tidak valid dan tidak
                dihitung sebagai rating rendah.
              </p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Fakultas</th>
                <th>Program Studi</th>
                <th>Gender</th>
                <th>Angkatan</th>
                <th>Frekuensi Kunjungan</th>
                <th>Rating Valid</th>
                <th>Saran</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id}>
                  <td>
                    <b>{response.id}</b>
                  </td>
                  <td>{response.faculty || "—"}</td>
                  <td>{response.program || "—"}</td>
                  <td>{response.gender || "—"}</td>
                  <td>{response.cohort || "—"}</td>
                  <td>{response.frequency || "—"}</td>
                  <td>{Object.keys(response.ratings).length} / 14</td>
                  <td>{response.suggestion ? "Tersedia" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <section className="card criteria-list-card">
        <div className="card-head">
          <div>
            <h2>14 Pertanyaan Penilaian Fasilitas</h2>
            <p>
              Interpretasi: 1 Sangat Tidak Puas · 2 Tidak Puas · 3 Cukup Puas ·
              4 Puas · 5 Sangat Puas
            </p>
          </div>
        </div>
        <ol className="criteria-list">
          {facilities.map((facility) => (
            <li key={facility.id}>{facility.name}</li>
          ))}
        </ol>
      </section>
    </>
  )
}
