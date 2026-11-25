import { useState, type FormEvent } from "react"
import type { PublicPage } from "../../types"
import { Icon } from "../../components/ui"


export function LoginPage({
  setPage,
  onLogin,
}: {
  setPage: (page: PublicPage) => void
  onLogin: (email: string, password: string) => Promise<string | null>
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const message = await onLogin(email, password)

      if (message) {
        setError(message)
      }
    } catch {
      setError("Terjadi kesalahan saat mencoba login.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-aside">
        <button className="public-brand light" onClick={() => setPage("home")}>
          <span>J</span>
          <div>
            <b>Junctify</b>
          </div>
        </button>

        <div>
          <span className="eyebrow dark">
            <i /> Portal administrator
          </span>
          <h1>
            Ubah data menjadi
            <br />
            <em>prioritas perbaikan.</em>
          </h1>
          <p>
            Kelola respons survei dan lihat hasil analisis SAW fasilitas Kampus
            Junction dalam satu dashboard.
          </p>
        </div>

        <small>Junctify · Prototype Proyek Akhir</small>
      </section>

      <main className="login-main">
        <button className="back-link" onClick={() => setPage("home")}>
          <Icon name="back" size={17} /> Kembali ke beranda
        </button>

        <form className="login-card" onSubmit={handleSubmit}>
          <span className="login-icon">
            <Icon name="lock" size={23} />
          </span>

          <h2>Selamat datang kembali</h2>
          <p>Masuk untuk mengakses dashboard analisis.</p>

          <label>
            <span>Email administrator</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Masukkan email admin"
              autoComplete="username"
            />
          </label>

          <label>
            <span>Kata sandi</span>
            <div className="password-field">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label="Tampilkan atau sembunyikan kata sandi"
              >
                <Icon name="eye" size={18} />
              </button>
            </div>
          </label>

          {error && (
            <div className="demo-notice">
              <Icon name="alert" size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="public-primary login-submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Memeriksa akun..." : "Masuk ke Dashboard"}
            {!isLoading && <Icon name="arrow" size={17} />}
          </button>

        </form>
      </main>
    </div>
  )
}
