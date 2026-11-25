import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { getSpreadsheetCSV } from "./services/googleSheets"
import type { FacilityResult, Filters, ImportNotice, Page, PublicPage, SurveyResponse } from "./types"
import { analyze, EMPTY_FILTERS, importResponses, navItems } from "./utils/saw"
import { Icon } from "./components/ui"
import { DashboardPage } from "./pages/admin/DashboardPage"
import { QuestionnairePage } from "./pages/admin/QuestionnairePage"
import { ResultsPage } from "./pages/admin/ResultsPage"
import { SuggestionsPage } from "./pages/admin/SuggestionsPage"
import { FacilityDetail } from "./pages/admin/FacilityDetailPage"
import { HomePage } from "./pages/public/HomePage"
import { PublicResultsPage } from "./pages/public/PublicResultsPage"
import { SurveyQrPage } from "./pages/public/SurveyQrPage"
import { LoginPage } from "./pages/public/LoginPage"
import { supabase } from "./lib/supabaseClient"

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [publicPage, setPublicPageState] = useState<PublicPage>("home")
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        setIsAdmin(false)
      } else {
        setIsAdmin(data.session?.user.app_metadata?.role === "admin")
      }

      setAuthLoading(false)
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const admin = session?.user.app_metadata?.role === "admin"

      setIsAdmin(admin)
      setAuthLoading(false)

      if (event === "SIGNED_OUT") {
        setPublicPageState("home")
        navigate("/", { replace: true })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const [page, setPageState] = useState<Page>("Dashboard")

  const pagePaths: Record<Page, string> = {
    "Dashboard": "/admin/dashboard",
    "Data Kuesioner": "/admin/kuesioner",
    "Hasil SAW": "/admin/hasil-saw",
    "Saran Responden": "/admin/saran",
  }

  const publicPaths: Record<PublicPage, string> = {
    home: "/",
    survey: "/survey",
    results: "/results",
    login: "/login",
  }

  function setPage(nextPage: Page) {
    setPageState(nextPage)
    navigate(pagePaths[nextPage])
  }

  function setPublicPage(nextPage: PublicPage) {
    setPublicPageState(nextPage)
    navigate(publicPaths[nextPage])
  }

  useEffect(() => {
    if (authLoading) return

    const path = location.pathname

    const matchedPage = (
      Object.entries(pagePaths) as [Page, string][]
    ).find(([, route]) => route === path)

    if (matchedPage) {
      if (!isAdmin) {
        setPublicPageState("login")
        navigate("/login", { replace: true })
        return
      }

      setPageState(matchedPage[0])
      return
    }

    const matchedPublic = (
      Object.entries(publicPaths) as [PublicPage, string][]
    ).find(([, route]) => route === path)

    if (matchedPublic) {
      setPublicPageState(matchedPublic[0])
    }
  }, [location.pathname, authLoading, isAdmin, navigate])

  const [allResponses, setAllResponses] = useState<SurveyResponse[]>([])
  const [newResponseCount, setNewResponseCount] = useState(0)
  const [notificationOpen, setNotificationOpen] = useState(false)

  const lastSyncedResponseCountRef = useRef<number | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<FacilityResult | null>(null)
  const [importMessage, setImportMessage] = useState<ImportNotice | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const isSyncingRef = useRef(false)
  const lastAutoSyncRef = useRef(0)
  const responses = useMemo(
    () =>
      allResponses.filter((response) =>
        Object.entries(filters).every(
          ([key, value]) =>
            !value || response[(key as keyof Filters)] === value,
        ),
      ),
    [allResponses, filters],
  )
  const results = useMemo(() => analyze(responses), [responses])
  const publicResults = useMemo(() => analyze(allResponses), [allResponses])

  // Satu fungsi untuk sinkronisasi otomatis maupun manual.
  // Ref mencegah permintaan bertumpuk, termasuk saat React StrictMode aktif.
  const handleLoadSpreadsheet = useCallback(async (showNotice = true) => {
    if (isSyncingRef.current) return

    isSyncingRef.current = true

    try {
      const csv = await getSpreadsheetCSV()
      const result = importResponses(csv)

      if (!result.responses.length) {
        throw new Error("Tidak ada data responden yang berhasil dibaca.")
      }

      const previousCount = lastSyncedResponseCountRef.current
      const currentCount = result.responses.length

      // Data pertama kali dimuat tidak dihitung sebagai notifikasi baru.
      if (previousCount !== null && currentCount > previousCount) {
        setNewResponseCount((previous) => previous + (currentCount - previousCount))
      }

      lastSyncedResponseCountRef.current = currentCount

      setAllResponses(result.responses)
      lastAutoSyncRef.current = Date.now()

      if (showNotice) {
        setImportMessage({
          tone: "success",
          title: "Sinkronisasi berhasil",
          details: [
            `${result.responses.length} respons berhasil dimuat dari Google Spreadsheet.`,
          ],
        })
      }
    } catch (error) {
      // Sinkronisasi otomatis tidak menampilkan toast di semua halaman.
      if (showNotice) {
        setImportMessage({
          tone: "error",
          title: "Sinkronisasi gagal",
          details: [
            error instanceof Error
              ? error.message
              : "Gagal mengambil data Google Spreadsheet.",
          ],
        })
      } else {
        console.error("Sinkronisasi otomatis Junctify gagal:", error)
      }
    } finally {
      isSyncingRef.current = false
      setIsInitialLoading(false)
    }
  }, [])

  // Data dimuat ketika website pertama kali dibuka, tanpa menunggu admin.
  // Saat pengguna kembali ke tab website, data diperbarui lagi jika sudah
  // lebih dari 30 detik sejak sinkronisasi otomatis terakhir.
  useEffect(() => {
    void handleLoadSpreadsheet(false)

    function refreshWhenVisible() {
      const isVisible = document.visibilityState === "visible"
      const hasWaited = Date.now() - lastAutoSyncRef.current > 30_000

      if (isVisible && hasWaited && !isSyncingRef.current) {
        void handleLoadSpreadsheet(false)
      }
    }

    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    const intervalId = window.setInterval(() => {
      if (isAdmin && !isSyncingRef.current) {
        void handleLoadSpreadsheet(false)
      }
    }, 60_000)

    return () => {
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
      window.clearInterval(intervalId)
    }
  }, [handleLoadSpreadsheet, isAdmin])

  function onSync() {
    void handleLoadSpreadsheet(true)
  }

  function openDetail(result: FacilityResult) {
    setSelected(result)
  }

  async function handleLogin(
    email: string,
    password: string,
  ): Promise<string | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return "Email atau kata sandi tidak sesuai."
    }

    if (data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut()
      return "Akun ini tidak memiliki hak akses administrator."
    }

    navigate("/admin/dashboard")
    return null
  }

  if (authLoading) {
    return <div className="content">Memeriksa sesi administrator...</div>
  }

  if (!isAdmin || !location.pathname.startsWith("/admin/")) {
    if (publicPage === "survey") return <SurveyQrPage setPage={setPublicPage} />
    if (publicPage === "results")
      return (
        <PublicResultsPage
          setPage={setPublicPage}
          results={publicResults}
          responseCount={allResponses.length}
          isLoading={isInitialLoading}
        />
      )
    if (publicPage === "login")
      return (
        <LoginPage
          setPage={setPublicPage}
          onLogin={handleLogin}
        />
      )
    return (
      <HomePage
        setPage={setPublicPage}
        results={publicResults}
        responseCount={allResponses.length}
        isLoading={isInitialLoading}
      />
    )
  }

  const content = selected ? (
    <FacilityDetail
      result={selected}
      responses={responses}
      close={() => {
        setSelected(null)
        setPage("Dashboard")
      }}
    />
  ) : page === "Dashboard" ? (
    <DashboardPage
      responses={responses}
      results={results}
      filters={filters}
      setFilters={setFilters}
      setPage={setPage}
      onSync={onSync}
      openDetail={openDetail}
    />
  ) : page === "Data Kuesioner" ? (
    <QuestionnairePage
      allResponses={allResponses}
      responses={responses}
      onSync={onSync}
    />
  ) : page === "Hasil SAW" ? (
    <ResultsPage
      responses={responses}
      results={results}
      onSync={onSync}
      openDetail={openDetail}
    />
    ) : (
      <SuggestionsPage responses={allResponses} onSync={onSync} />
    )

  return (
    <div className="app-shell">
      <button
        className="sync-button"
        onClick={onSync}
      >
        Sinkronisasi Google Spreadsheet
      </button>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">J</span>
          <div>
            <b>Junctify</b>
          </div>
        </div>
        <div className="nav-label">MENU UTAMA</div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.label}
              className={!selected && page === item.label ? "active" : ""}
              onClick={() => {
                setSelected(null)
                setPage(item.label)
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {!selected && page === item.label && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="system-status data-status">
            <i />
            <div>
              <b>Data lokal browser</b>
              <span>
                {allResponses.length
                  ? `${allResponses.length} respons dimuat`
                  : "CSV belum dimuat"}
              </span>
            </div>
          </div>
          <p>
            Junctify v1.0
            <br />
            Prototype Proyek Akhir
          </p>
        </div>
      </aside>
      <main className="main">
        <header>
          <div className="breadcrumb">
            <span>Junctify</span>
            <Icon name="chevron" size={14} />
            <b>{selected ? "Detail Fasilitas" : page}</b>
          </div>
          <div className="header-right">
            <div className="notification-wrapper">
              <button
                className="icon-btn notification"
                onClick={() => setNotificationOpen((open) => !open)}
                title="Notifikasi"
              >
                <Icon name="bell" />

                {newResponseCount > 0 && (
                  <span className="notification-badge">
                    {newResponseCount > 99 ? "99+" : newResponseCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="notification-panel">
                  <div className="notification-panel-header">
                    <b>Notifikasi</b>
                    {newResponseCount > 0 && (
                      <span>{newResponseCount} baru</span>
                    )}
                  </div>

                  {newResponseCount > 0 ? (
                    <div className="notification-item">
                      <Icon name="form" />
                      <div>
                        <b>Respons kuesioner baru</b>
                        <p>
                          Ada {newResponseCount} respons baru dari Google Spreadsheet.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="notification-empty">
                      Belum ada notifikasi baru.
                    </div>
                  )}

                  {newResponseCount > 0 && (
                    <button
                      className="notification-read"
                      onClick={() => {
                        setNewResponseCount(0)
                        setNotificationOpen(false)
                      }}
                    >
                      Tandai sudah dibaca
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="divider" />
            <div className="profile">
              <div className="avatar">RD</div>
              <div>
                <b>Richard Devin</b>
                <span>Administrator</span>
              </div>
            </div>
            <button
              className="admin-logout"
              onClick={async () => {
                const { error } = await supabase.auth.signOut()

                if (error) {
                  console.error("Gagal logout:", error.message)
                  return
                }

                setSelected(null)
                setPublicPage("home")
              }}
            >
              Keluar
            </button>
          </div>
        </header>
        <div className="content">
          {importMessage && (
            <div className={`import-toast ${importMessage.tone}`}>
              <div>
                <b>{importMessage.title}</b>
                <ul>
                  {importMessage.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setImportMessage(null)}>
                <Icon name="close" size={15} />
              </button>
            </div>
          )}
          {content}
        </div>
      </main>
    </div>
  )
}
