import type { FacilityResult, Filters, Page, PublicPage, SurveyResponse } from "../../types"
import { analyze, facilities, formatNumber, importResponses, EMPTY_FILTERS } from "../../utils/saw"
import { Button, EmptyState, Field, FilterBar, Icon, PageHeader, PublicHeader, Status } from "../../components/ui"

export function MethodPage() {
  const steps = [
    [
      "1",
      "Rata-rata rating",
      "Hitung rata-rata dari rating valid 1–5 untuk setiap fasilitas.",
    ],
    [
      "2",
      "Kesenjangan kepuasan (C1)",
      "Nilai maksimum 5 dikurangi rata-rata rating fasilitas.",
    ],
    [
      "3",
      "Rating rendah (C2 dan C3)",
      "Hitung jumlah dan proporsi rating 1 atau 2 dari seluruh respons valid.",
    ],
    [
      "4",
      "Normalisasi benefit",
      "Setiap nilai kriteria dibagi nilai maksimum kriteria tersebut.",
    ],
    [
      "5",
      "Nilai terbobot",
      "Kalikan hasil normalisasi dengan bobot C1 0,40; C2 0,30; C3 0,30.",
    ],
    [
      "6",
      "Skor dan peringkat",
      "Jumlahkan nilai terbobot lalu urutkan dari skor tertinggi ke terendah.",
    ],
  ]
  return (
    <>
      <PageHeader
        title="Metode Simple Additive Weighting"
        description="Penjelasan kriteria, bobot, normalisasi, dan interpretasi hasil."
      />
      <div className="criteria-grid three">
        {[
          ["C1", "Kesenjangan kepuasan", "0,40"],
          ["C2", "Jumlah penilaian rendah", "0,30"],
          ["C3", "Proporsi penilaian rendah", "0,30"],
        ].map((item) => (
          <div className="criterion" key={item[0]}>
            <div>
              <span>{item[0]}</span>
              <small>Benefit</small>
            </div>
            <b>{item[2]}</b>
            <p>{item[1]}</p>
            <div className="weight">
              <i
                style={{ width: `${Number(item[2].replace(",", ".")) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <section className="card formula-card">
        <div>
          <span>Rumus normalisasi benefit</span>
          <b>rᵢⱼ = xᵢⱼ / max(xⱼ)</b>
        </div>
        <div>
          <span>Rumus skor akhir</span>
          <b>Vᵢ = 0,40rᵢ₁ + 0,30rᵢ₂ + 0,30rᵢ₃</b>
        </div>
        <div>
          <span>Total bobot</span>
          <b>0,40 + 0,30 + 0,30 = 1,00</b>
        </div>
      </section>
      <section className="steps-grid">
        {steps.map((step) => (
          <article className="card step-card" key={step[0]}>
            <span>{step[0]}</span>
            <div>
              <h2>{step[1]}</h2>
              <p>{step[2]}</p>
            </div>
          </article>
        ))}
      </section>
      <div className="notice">
        <Icon name="alert" size={16} />
        <span>
          <b>Penanganan data kosong:</b> nilai kosong atau di luar skala 1–5
          tidak dihitung, tidak dianggap rating rendah, dan jumlah data valid
          ditampilkan per fasilitas.
        </span>
      </div>
    </>
  )
}
