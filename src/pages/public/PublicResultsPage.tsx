import type { FacilityResult, PublicPage } from "../../types"
import { formatNumber, GOOGLE_FORM_URL } from "../../utils/saw"
import { Icon, PublicHeader } from "../../components/ui"

export function PublicResultsPage({
  setPage,
  results,
  responseCount,
}: {
  setPage: (page: PublicPage) => void
  results: FacilityResult[]
  responseCount: number
}) {
  const rankedResults = results.filter((result) => result.validCount > 0)
  return (
    <div className="public-page public-results-page">
      <PublicHeader page="results" setPage={setPage} />
      <main>
        <section className="results-hero">
          <button className="back-link" onClick={() => setPage("home")}>
            <Icon name="back" size={17} /> Kembali ke beranda
          </button>
          <div>
            <span className="section-kicker">Hasil analisis fasilitas</span>
            <h1>
              Peringkat prioritas
              <br />
              <em>perbaikan kampus.</em>
            </h1>
            <p>
              Skor tertinggi menunjukkan fasilitas yang paling membutuhkan
              perhatian berdasarkan hasil perhitungan Simple Additive Weighting.
            </p>
          </div>
          <aside>
            <div>
              <b>{responseCount || "—"}</b>
              <span>Respons dianalisis</span>
            </div>
            <div>
              <b>{rankedResults.length || "—"}</b>
              <span>Fasilitas diperingkat</span>
            </div>
            <div>
              <b>1,00</b>
              <span>Total bobot SAW</span>
            </div>
          </aside>
        </section>
        <section className="public-results-content">
          <div className="public-method-note">
            <Icon name="target" size={21} />
            <div>
              <b>Simple Additive Weighting (SAW)</b>
              <p>
                C1 Kesenjangan kepuasan 0,40 · C2 Jumlah penilaian rendah 0,30 ·
                C3 Proporsi penilaian rendah 0,30
              </p>
            </div>
          </div>
          {rankedResults.length ? (
            <div className="public-results-table-wrap">
              <table className="public-results-table">
                <thead>
                  <tr>
                    <th>Peringkat</th>
                    <th>Fasilitas</th>
                    <th>Rata-rata</th>
                    <th>Kesenjangan</th>
                    <th>Rating rendah</th>
                    <th>Proporsi</th>
                    <th>Skor SAW</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedResults.map((result) => (
                    <tr key={result.id}>
                      <td>
                        <span className={`public-rank rank-${result.rank}`}>
                          {String(result.rank).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <b>{result.name}</b>
                        <small>{result.recommendation}</small>
                      </td>
                      <td>{formatNumber(result.average)}</td>
                      <td>{formatNumber(result.gap)}</td>
                      <td>
                        {result.lowCount} dari {result.validCount}
                      </td>
                      <td>{formatNumber(result.lowProportion * 100, 1)}%</td>
                      <td>
                        <strong>{formatNumber(result.score, 3)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="public-results-empty detail-empty">
              <span>
                <Icon name="target" size={28} />
              </span>
              <div>
                <h3>Belum ada hasil yang dapat ditampilkan</h3>
                <p>
                  Administrator perlu mengimpor CSV Google Forms terlebih
                  dahulu. Halaman ini tidak menggunakan angka simulasi.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
      <footer className="public-footer">
        <b>Junctify Analytics</b>
        <span>Hasil publik analisis kepuasan fasilitas</span>
      </footer>
    </div>
  )
}
