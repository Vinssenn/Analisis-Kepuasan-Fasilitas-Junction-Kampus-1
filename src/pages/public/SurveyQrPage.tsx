import qrJunctify from "../../assets/qr-junctify.png"
import type { FacilityResult, PublicPage } from "../../types"
import { formatNumber, GOOGLE_FORM_URL } from "../../utils/saw"
import { Icon, PublicHeader } from "../../components/ui"

export function SurveyQrPage({ setPage }: { setPage: (page: PublicPage) => void }) {
  return (
    <div className="public-page qr-page">
      <PublicHeader page="survey" setPage={setPage} />
      <main className="qr-main">
        <button className="back-link" onClick={() => setPage("home")}>
          <Icon name="back" size={17} /> Kembali ke beranda
        </button>
        <section className="qr-layout">
          <div className="qr-copy">
            <span className="section-kicker">Survei kepuasan fasilitas</span>
            <h1>
              Pindai. Isi.
              <br />
              <em>Beri dampak.</em>
            </h1>
            <p>
              Arahkan kamera ponsel Anda ke QR code untuk membuka formulir
              survei Google Forms.
            </p>
            <ul>
              <li>
                <Icon name="shield" size={18} />
                <span>
                  <b>Respons sepenuhnya anonim</b>
                  <small>
                    Identitas pribadi tidak ditampilkan dalam analisis.
                  </small>
                </span>
              </li>
              <li>
                <Icon name="form" size={18} />
                <span>
                  <b>14 pertanyaan singkat</b>
                  <small>Estimasi waktu pengisian sekitar 3 menit.</small>
                </span>
              </li>
            </ul>
          </div>
          <article className="qr-card">
            <div className="qr-code">
              <img src={qrJunctify} alt="QR code menuju Google Form survei" />
            </div>
            <h2>Scan untuk mulai mengisi</h2>
            <p>Gunakan kamera atau aplikasi pemindai QR di ponsel Anda.</p>
            <div className="or-divider">
              <span>atau</span>
            </div>
            <a
              className="public-primary"
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noreferrer"
            >
              Buka Google Form <Icon name="arrow" size={17} />
            </a>
            <small className="prototype-note">
              Tautan formulir dapat diganti dengan URL Google Form penelitian.
            </small>
          </article>
        </section>
      </main>
    </div>
  )
}
