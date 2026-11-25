import type { FacilityResult, PublicPage } from "../../types"
import { formatNumber, GOOGLE_FORM_URL } from "../../utils/saw"
import { Icon, PublicHeader } from "../../components/ui"

export function HomePage({
  setPage,
  results,
  responseCount,
  isLoading,
}: {
  setPage: (page: PublicPage) => void
  results: FacilityResult[]
  responseCount: number
  isLoading: boolean
}) {
  const rankedResults = results.filter((result) => result.validCount > 0)
  const topResult = rankedResults[0]
  return (
    <div className="public-page">
      <PublicHeader page="home" setPage={setPage} />
      <main>
        <section className="public-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <i /> Suara Anda, perubahan untuk kita
            </span>
            <h1>
              Bantu kami membuat
              <br />
              <em>Kampus Junction</em>
              <br />
              lebih nyaman.
            </h1>
            <p>
              Bagikan pengalaman Anda menggunakan fasilitas Kampus Junction.
              Setiap jawaban menjadi dasar evaluasi untuk menentukan prioritas
              perbaikan yang tepat.
            </p>
            <div className="hero-actions">
              <button
                className="public-primary"
                onClick={() => setPage("survey")}
              >
                Isi survei sekarang <Icon name="arrow" size={17} />
              </button>
              <span>
                <Icon name="shield" size={17} />
                <b>Anonim & aman</b>
                <small>Hanya membutuhkan ±3 menit</small>
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Ringkasan survei fasilitas">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="junction-building">
              <span>J</span>
              <div />
              <div />
              <div />
            </div>
            <article className="float-card response-card">
              <span>
                <Icon name="form" size={17} />
              </span>
              <div>
                <b>14 aspek</b>
                <small>fasilitas dinilai</small>
              </div>
            </article>
            <article className="float-card method-card">
              <span>
                <Icon name="target" size={17} />
              </span>
              <div>
                <b>Metode SAW</b>
                <small>prioritas objektif</small>
              </div>
            </article>
          </div>
        </section>
        <section className="public-stats">
          <div>
            <b>14</b>
            <span>Aspek fasilitas</span>
          </div>
          <div>
            <b>3</b>
            <span>Kriteria analisis</span>
          </div>
          <div>
            <b>100%</b>
            <span>Respons anonim</span>
          </div>
          <p>
            Data survei dianalisis dengan metode{" "}
            <strong>Simple Additive Weighting</strong> untuk menemukan fasilitas
            yang paling membutuhkan perhatian.
          </p>
        </section>
        <section className="public-results-section">
          <div className="public-section-heading">
            <div>
              <span className="section-kicker">Hasil perhitungan SPK</span>
              <h2>Prioritas perbaikan fasilitas</h2>
              <p>
                Peringkat dihitung menggunakan metode SAW dari kesenjangan
                kepuasan, jumlah penilaian rendah, dan proporsi penilaian
                rendah.
              </p>
            </div>
            <button
              className="public-outline"
              onClick={() => setPage("results")}
            >
              Lihat hasil lengkap <Icon name="arrow" size={16} />
            </button>
          </div>
          {rankedResults.length ? (
            <>
              <div className="public-result-summary">
                <span className="summary-rank">01</span>
                <div>
                  <small>Prioritas perbaikan tertinggi</small>
                  <h3>{topResult.name}</h3>
                  <p>{topResult.recommendation}</p>
                </div>
                <div className="summary-score">
                  <small>Skor SAW</small>
                  <b>{formatNumber(topResult.score, 3)}</b>
                  <span>{responseCount} responden</span>
                </div>
              </div>
              <div className="public-ranking-preview">
                {rankedResults.slice(0, 3).map((result) => (
                  <article key={result.id}>
                    <div className="preview-rank">
                      <span>Peringkat</span>
                      <b>{String(result.rank).padStart(2, "0")}</b>
                    </div>
                    <div className="preview-result-copy">
                      <h3>{result.name}</h3>
                      <div>
                        <span>Rata-rata {formatNumber(result.average)}</span>
                        <span>{result.lowCount} rating rendah</span>
                      </div>
                    </div>
                    <strong>{formatNumber(result.score, 3)}</strong>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="public-results-empty">
              <span>
                <Icon name="target" size={25} />
              </span>
              <div>
                <h3>{isLoading ? "Memuat data kuesioner..." : "Hasil analisis belum tersedia"}</h3>
                <p>
                  {isLoading
                    ? "Junctify sedang mengambil data terbaru dari Google Spreadsheet."
                    : "Hasil peringkat akan tampil setelah data kuesioner tersedia."}
                </p>
              </div>
            </div>
          )}
        </section>
        <section className="how-section">
          <span className="section-kicker">Cara berpartisipasi</span>
          <h2>Tiga langkah sederhana untuk ikut berkontribusi</h2>
          <div className="how-grid">
            {[
              [
                "01",
                "Buka formulir",
                "Pindai QR code atau buka tautan Google Form yang telah disediakan.",
                "qr",
              ],
              [
                "02",
                "Bagikan pengalaman",
                "Beri penilaian jujur untuk 14 aspek fasilitas Kampus Junction.",
                "form",
              ],
              [
                "03",
                "Selesai",
                "Jawaban anonim Anda akan masuk ke proses analisis prioritas.",
                "shield",
              ],
            ].map((item) => (
              <article key={item[0]}>
                <span className="step-number">{item[0]}</span>
                <i>
                  <Icon name={item[3]} size={22} />
                </i>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <b>Junctify</b>
        <span>Proyek analisis kepuasan fasilitas kampus</span>
      </footer>
    </div>
  )
}
