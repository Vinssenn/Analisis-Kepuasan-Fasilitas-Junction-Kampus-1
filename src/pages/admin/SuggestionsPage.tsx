import type { FacilityResult, Filters, Page, PublicPage, SurveyResponse } from "../../types"
import { analyze, facilities, formatNumber, importResponses, EMPTY_FILTERS, normalizeText } from "../../utils/saw"
import { Button, EmptyState, Field, FilterBar, Icon, PageHeader, PublicHeader, Status } from "../../components/ui"

function getDriveThumbnailUrl(url: string) {
  const fileId = url.match(/[?&]id=([^&]+)/)?.[1]

  if (!fileId) return ""

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
}

export function SuggestionsPage({
  responses,
  onSync,
}: {
  responses: SurveyResponse[]
  onSync: () => void
}) {
  const suggestions = responses.filter(
    (response) => response.suggestion || response.photoUrls?.length,
  )
  const themes = facilities
    .map((facility) => ({
      ...facility,
      count: suggestions.filter((response) =>
        facility.keywords.some((keyword) =>
          normalizeText(response.suggestion).includes(normalizeText(keyword)),
        ),
      ).length,
    }))
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count)
  return (
    <>
      <PageHeader
        title="Saran Responden"
        description="Jawaban terbuka ditampilkan apa adanya tanpa identitas pribadi."
      />
      {!responses.length ? (
        <section className="card">
          <EmptyState onImport={onSync} />
        </section>
      ) : (
        <>
          <div className="mini-stats">
            <div>
              <span>Jawaban terbuka</span>
              <b>{suggestions.length}</b>
              <small>Dari {responses.length} respons aktif</small>
            </div>
            <div>
              <span>Tema teridentifikasi</span>
              <b>{themes.length}</b>
              <small>Berdasarkan kata yang benar-benar muncul</small>
            </div>
            <div>
              <span>Tema terbanyak</span>
              <b className="compact">{themes[0]?.shortName || "—"}</b>
              <small>
                {themes[0]
                  ? `${themes[0].count} saran terkait`
                  : "Belum ada tema"}
              </small>
            </div>
          </div>
          {themes.length > 0 && (
            <section className="theme-grid">
              {themes.map((theme) => (
                <article className="card theme-card" key={theme.id}>
                  <span>{theme.count} saran</span>
                  <h2>{theme.name}</h2>
                  <p>
                    Tema dikenali dari penyebutan kata terkait dalam jawaban
                    asli.
                  </p>
                </article>
              ))}
            </section>
          )}
          <section className="card suggestion-list">
            <div className="card-head">
              <div>
                <h2>Jawaban asli responden</h2>
                <p>Teks tidak diubah menjadi klaim atau fakta tambahan.</p>
              </div>
            </div>
            {suggestions.length ? (
              suggestions.map((response) => (
              <blockquote key={response.id}>
                <span>{response.id}</span>

                {response.suggestion && (
                  <p>“{response.suggestion}”</p>
                )}

                {response.photoUrls?.length > 0 && (
                  <div className="suggestion-photos">
                    <p>Foto pendukung:</p>

                    <div className="suggestion-photo-grid">
                      {response.photoUrls.map((photoUrl, index) => {
                        const imageUrl = getDriveThumbnailUrl(photoUrl)
                        console.log("URL Foto:", imageUrl)
                        return (
                          <a
                            key={`${response.id}-${index}`}
                            href={photoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`Foto fasilitas dari ${response.id}`}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                style={{
                                  display: "block",
                                  width: "420px",
                                  maxWidth: "100%",
                                  height: "auto",
                                  maxHeight: "600px",
                                  objectFit: "contain",
                                  objectPosition: "left center",
                                  borderRadius: "12px",
                                  cursor: "pointer",
                                }}
                              />
                            ) : (
                              <span>Lihat foto {index + 1}</span>
                            )}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </blockquote>
            ))
            ) : (
              <div className="empty-inline">
                Tidak ada jawaban terbuka pada data yang sedang digunakan.
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}
