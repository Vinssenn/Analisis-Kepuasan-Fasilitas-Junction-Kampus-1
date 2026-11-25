import { useState } from "react"
import type { FacilityResult, Filters, Page, PublicPage, SurveyResponse } from "../../types"
import { analyze, facilities, formatNumber, importResponses, EMPTY_FILTERS } from "../../utils/saw"
import { Button, EmptyState, Field, FilterBar, Icon, PageHeader, PublicHeader, Status } from "../../components/ui"

export function ResultsPage({
  responses,
  results,
  onSync,
  openDetail,
}: {
  responses: SurveyResponse[]
  results: FacilityResult[]
  onSync: () => void
  openDetail: (result: FacilityResult) => void
}) {
  const [sortBy, setSortBy] = useState<"rank" | "score">("rank")
  const valid = results.filter((result) => result.validCount > 0)
  const rows = [...valid].sort((a, b) =>
    sortBy === "rank" ? a.rank - b.rank : b.score - a.score,
  )
  return (
    <>
      <PageHeader
        title="Hasil dan Peringkat Prioritas SAW"
        description="Skor tertinggi menunjukkan kebutuhan perbaikan paling tinggi."
        action={
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "rank" | "score")
            }
          >
            <option value="rank">Urutkan: Peringkat</option>
            <option value="score">Urutkan: Skor SAW</option>
          </select>
        }
      />
      <div className="method-banner">
        <div className="method-icon">
          <Icon name="target" size={22} />
        </div>
        <div>
          <b>Simple Additive Weighting (SAW)</b>
          <p>Semua kriteria bersifat benefit: C1 0,40 · C2 0,30 · C3 0,30.</p>
        </div>
        <span>Total bobot 1,00</span>
      </div>
      {!responses.length ? (
        <section className="card">
          <EmptyState onImport={onSync} />
        </section>
      ) : (
        <>
          <section className="ranking-visual">
            {rows.slice(0, 3).map((result) => (
              <button
                key={result.id}
                onClick={() => openDetail(result)}
                className={`podium podium-${result.rank}`}
              >
                <span>Peringkat {result.rank}</span>
                <b>{result.shortName}</b>
                <strong>{formatNumber(result.score, 3)}</strong>
                <Status rank={result.rank} total={rows.length} />
              </button>
            ))}
          </section>
          <section className="card table-card wide-table ranking-table">
            <div className="card-head">
              <div>
                <h2>Tabel Hasil SAW</h2>
                <p>
                  Jumlah data valid dapat berbeda pada setiap fasilitas karena
                  nilai kosong diabaikan.
                </p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Peringkat</th>
                  <th>Nama fasilitas</th>
                  <th>Rata-rata</th>
                  <th>Data valid</th>
                  <th>Kesenjangan</th>
                  <th>Rating rendah</th>
                  <th>Proporsi rendah</th>
                  <th>Skor SAW</th>
                  <th>Prioritas</th>
                  <th>Rekomendasi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((result) => (
                  <tr key={result.id}>
                    <td>
                      <span className={`rank r${result.rank}`}>
                        {result.rank}
                      </span>
                    </td>
                    <td>
                      <button
                        className="detail-btn left"
                        onClick={() => openDetail(result)}
                      >
                        {result.name}
                      </button>
                    </td>
                    <td>{formatNumber(result.average)}</td>
                    <td>{result.validCount}</td>
                    <td>{formatNumber(result.gap)}</td>
                    <td>{result.lowCount}</td>
                    <td>{formatNumber(result.lowProportion * 100, 1)}%</td>
                    <td>
                      <b className="score">{formatNumber(result.score, 3)}</b>
                    </td>
                    <td>
                      <Status rank={result.rank} total={rows.length} />
                    </td>
                    <td className="recommendation-cell">
                      {result.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  )
}