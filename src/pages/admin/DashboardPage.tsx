import type { FacilityResult, Filters, Page, PublicPage, SurveyResponse } from "../../types"
import { analyze, facilities, formatNumber, importResponses, EMPTY_FILTERS, EXPECTED_RESPONSES } from "../../utils/saw"
import { Button, EmptyState, Field, FilterBar, Icon, PageHeader, PublicHeader, Status } from "../../components/ui"

export function DashboardPage({
  responses,
  results,
  filters,
  setFilters,
  setPage,
  onSync,
  openDetail,
}: {
  responses: SurveyResponse[]
  results: FacilityResult[]
  filters: Filters
  setFilters: (filters: Filters) => void
  setPage: (page: Page) => void
  onSync: () => void
  openDetail: (facility: FacilityResult) => void
}) {
  const validResults = results.filter((result) => result.validCount > 0)
  const ratings = responses
    .flatMap((response) => Object.values(response.ratings))
    .filter((rating): rating is 1 | 2 | 3 | 4 | 5 => typeof rating === "number")
  const overallAverage = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : 0
  const distribution = [1, 2, 3, 4, 5].map(
    (value) => ratings.filter((rating) => rating === value).length,
  )
  const lowest = [...validResults].sort((a, b) => a.average - b.average)[0]
  const mostLow = [...validResults].sort((a, b) => b.lowCount - a.lowCount)[0]
  const top = validResults[0]
  return (
    <>
      <PageHeader
        title="Dashboard Analisis Fasilitas Kampus Junction"
        description="Ringkasan kepuasan dan prioritas perbaikan berdasarkan metode Simple Additive Weighting."
        action={
          <Button secondary icon="download" onClick={onSync}>
            Sinkronisasi Spreadsheet
          </Button>
        }
      />
      <div className={`notice ${responses.length ? "verified" : ""}`}>
        <Icon name={responses.length ? "form" : "alert"} size={16} />
        <span>
          {responses.length ? (
            <>
              <b>Analisis berbasis data yang dimuat.</b> {responses.length}{" "}
              respons digunakan setelah filter aktif; nilai kosong atau tidak
              valid diabaikan per fasilitas.
            </>
          ) : (
            <>
              <b>Dataset penelitian belum tersedia di repository.</b> Target
              penelitian adalah {EXPECTED_RESPONSES} respons; hasil analisis
              baru ditampilkan setelah CSV asli diimpor.
            </>
          )}
        </span>
      </div>
      <FilterBar
        responses={responses}
        filters={filters}
        setFilters={setFilters}
      />
      <div className="stat-grid five">
        {[
          [
            "Total Responden",
            responses.length ? String(responses.length) : "0",
            "users",
            `Target dataset: ${EXPECTED_RESPONSES}`,
          ],
          [
            "Rata-rata Kepuasan",
            ratings.length ? formatNumber(overallAverage) : "—",
            "trend",
            "Skala Likert 1–5",
          ],
          [
            "Fasilitas Dianalisis",
            String(validResults.length),
            "building",
            "Dari 14 aspek fasilitas",
          ],
          [
            "Rating Terendah",
            lowest ? lowest.shortName : "—",
            "alert",
            lowest ? `${formatNumber(lowest.average)} dari 5` : "Menunggu data",
          ],
          [
            "Rating Rendah Terbanyak",
            mostLow ? mostLow.shortName : "—",
            "form",
            mostLow ? `${mostLow.lowCount} penilaian 1–2` : "Menunggu data",
          ],
        ].map((stat, index) => (
          <div className="stat-card" key={stat[0]}>
            <div className={`stat-icon s${index}`}>
              <Icon name={stat[2]} />
            </div>
            <div className="stat-label">{stat[0]}</div>
            <div
              className={`stat-value ${
                String(stat[1]).length > 10 ? "compact" : ""
              }`}
            >
              {stat[1]}
            </div>
            <div className="stat-meta">{stat[3]}</div>
          </div>
        ))}
      </div>
      {!responses.length ? (
        <section className="card">
          <EmptyState onImport={onSync} />
        </section>
      ) : (
        <>
          <div className="chart-grid">
            <section className="card bar-card facility-chart">
              <div className="card-head">
                <div>
                  <h2>Perbandingan Rata-rata Rating 14 Fasilitas</h2>
                  <p>Nilai dihitung dari respons valid pada setiap fasilitas</p>
                </div>
                <span className="scale-note">Skala 1–5</span>
              </div>
              <div className="horizontal-chart">
                {results.map((result) => {
                  const rankIndex = validResults.findIndex(
                    (item) => item.id === result.id,
                  )

                  // Warna merah untuk prioritas tertinggi,
                  // berangsur menuju biru untuk prioritas terendah.
                  const ratio =
                  validResults.length > 1
                    ? rankIndex / (validResults.length - 1)
                    : 0

                const start = { r: 239, g: 68, b: 68 } // Merah
                const end = { r: 59, g: 130, b: 246 }  // Biru

                const barColor =
                  rankIndex >= 0
                    ? `rgb(
                        ${Math.round(start.r + (end.r - start.r) * ratio)},
                        ${Math.round(start.g + (end.g - start.g) * ratio)},
                        ${Math.round(start.b + (end.b - start.b) * ratio)}
                      )`
                    : "#cbd5e1"
                  return (
                    <button
                      key={result.id}
                      className="horizontal-row"
                      onClick={() => openDetail(result)}
                    >
                      <span title={result.name}>{result.name}</span>

                      <div className="horizontal-track">
                        <i
                          style={{
                            width: `${(result.average / 5) * 100}%`,
                            background: barColor,
                          }}
                        />
                      </div>

                      <b>
                        {result.validCount
                          ? formatNumber(result.average)
                          : "—"}
                      </b>
                    </button>
                  )
                })}
              </div>
            </section>
            <section className="card distribution-card">
              <div className="card-head">
                <div>
                  <h2>Distribusi Rating</h2>
                  <p>
                    {ratings.length} rating valid dari {responses.length}{" "}
                    responden
                  </p>
                </div>
              </div>
              <div className="distribution-bars">
                {distribution.map((count, index) => {
                  const max = Math.max(...distribution, 1)
                  return (
                    <div key={index}>
                      <span>{count}</span>
                      <div>
                        <i
                          className={`rating-${index + 1}`}
                          style={{ height: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <b>{index + 1}</b>
                      <small>
                        {
                          [
                            "Sangat tidak puas",
                            "Tidak puas",
                            "Cukup puas",
                            "Puas",
                            "Sangat puas",
                          ][index]
                        }
                      </small>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
          <section className="card summary-card">
            <div className="summary-icon">
              <Icon name="target" size={22} />
            </div>
            <div>
              <span>Ringkasan hasil analisis</span>
              <h2>
                {top
                  ? `${top.name} menjadi prioritas perbaikan tertinggi`
                  : "Belum ada fasilitas yang dapat diperingkat"}
              </h2>
              <p>
                {top
                  ? `Skor SAW ${formatNumber(top.score, 3)} diperoleh dari kesenjangan kepuasan, jumlah rating 1–2, dan proporsi rating 1–2. ${top.recommendation}`
                  : "Pastikan kolom rating pada CSV sesuai dengan 14 aspek fasilitas."}
              </p>
            </div>
            <Button onClick={() => setPage("Hasil SAW")}>
              Lihat hasil lengkap
            </Button>
          </section>
        </>
      )}
    </>
  )
}
