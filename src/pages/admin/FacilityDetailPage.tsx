import type { FacilityResult, Filters, Page, PublicPage, SurveyResponse } from "../../types"
import { analyze, facilities, formatNumber, importResponses, EMPTY_FILTERS, normalizeText } from "../../utils/saw"
import { Button, EmptyState, Field, FilterBar, Icon, PageHeader, PublicHeader, Status } from "../../components/ui"

export function FacilityDetail({
  result,
  responses,
  close,
}: {
  result: FacilityResult
  responses: SurveyResponse[]
  close: () => void
}) {
  const ratings = [1, 2, 3, 4, 5].map(
    (value) =>
      responses.filter((response) => response.ratings[result.id] === value)
        .length,
  )
  const related = responses.filter(
    (response) =>
      response.suggestion &&
      result.keywords.some((keyword) =>
        normalizeText(response.suggestion).includes(normalizeText(keyword)),
      ),
  )
  const rankedTotal = analyze(responses).filter(
    (item) => item.validCount,
  ).length
  return (
    <div className="detail-page">
      <Button secondary icon="back" onClick={close}>
        Kembali ke dashboard
      </Button>
      <PageHeader
        title={result.name}
        description="Detail hasil penilaian fasilitas dan komponen perhitungan SAW."
      />
      <div className="detail-stat-grid">
        <div>
          <span>Rata-rata rating</span>
          <b>{result.validCount ? formatNumber(result.average) : "—"}</b>
          <small>{result.validCount} data valid</small>
        </div>
        <div>
          <span>Penilaian rendah</span>
          <b>{result.lowCount}</b>
          <small>
            {result.validCount
              ? `${formatNumber(result.lowProportion * 100, 1)}% dari data valid`
              : "Belum ada data"}
          </small>
        </div>
        <div>
          <span>Skor SAW</span>
          <b>{result.validCount ? formatNumber(result.score, 3) : "—"}</b>
          <small>
            {result.rank
              ? `Peringkat ${result.rank} dari ${rankedTotal}`
              : "Belum diperingkat"}
          </small>
        </div>
        <div>
          <span>Status prioritas</span>
          <b className="status-value">
            {result.rank ? (
              <Status rank={result.rank} total={rankedTotal} />
            ) : (
              "—"
            )}
          </b>
          <small>Berdasarkan skor SAW</small>
        </div>
      </div>
      <div className="detail-layout">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Distribusi Rating 1–5</h2>
              <p>Nilai kosong tidak disertakan</p>
            </div>
          </div>
          <div className="rating-list">
            {ratings.map((count, index) => (
              <div key={index}>
                <span>{index + 1}</span>
                <div>
                  <i
                    style={{
                      width: `${
                        result.validCount
                          ? (count / result.validCount) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <b>{count}</b>
                <small>
                  {result.validCount
                    ? formatNumber((count / result.validCount) * 100, 1)
                    : "0,0"}
                  %
                </small>
              </div>
            ))}
          </div>
        </section>
        <section className="card detail-recommendation">
          <span>Rekomendasi perbaikan</span>
          <h2>{result.recommendation}</h2>
          <p>
            Rekomendasi diarahkan pada aspek yang dinilai dan tidak menambahkan
            klaim kondisi di luar hasil survei.
          </p>
          <div className="saw-breakdown">
            <div>
              <span>C1 Kesenjangan</span>
              <b>{formatNumber(result.gap)}</b>
              <small>Normalisasi {formatNumber(result.normalizedGap, 3)}</small>
            </div>
            <div>
              <span>C2 Rating rendah</span>
              <b>{result.lowCount}</b>
              <small>
                Normalisasi {formatNumber(result.normalizedLowCount, 3)}
              </small>
            </div>
            <div>
              <span>C3 Proporsi rendah</span>
              <b>{formatNumber(result.lowProportion * 100, 1)}%</b>
              <small>
                Normalisasi {formatNumber(result.normalizedLowProportion, 3)}
              </small>
            </div>
          </div>
        </section>
      </div>
      <section className="card suggestion-list">
        <div className="card-head">
          <div>
            <h2>Saran terbuka yang relevan</h2>
            <p>Dipilih berdasarkan kata terkait fasilitas pada jawaban asli.</p>
          </div>
        </div>
        {related.length ? (
          related.map((response) => (
            <blockquote key={response.id}>
              <span>{response.id}</span>
              <p>“{response.suggestion}”</p>
            </blockquote>
          ))
        ) : (
          <div className="empty-inline">
            Tidak ada saran terbuka yang relevan pada data aktif.
          </div>
        )}
      </section>
    </div>
  )
}
