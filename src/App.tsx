import { useMemo, useRef, useState } from "react"

type Page = "Dashboard" | "Data Kuesioner" | "Hasil SAW" | "Saran Responden" | "Metode SAW" | "Pengaturan"
type PublicPage = "home" | "survey" | "results" | "login"
type Rating = 1 | 2 | 3 | 4 | 5

type Facility = {
  id: string
  name: string
  shortName: string
  keywords: string[]
  recommendation: string
}

type SurveyResponse = {
  id: string
  faculty: string
  program: string
  gender: string
  cohort: string
  frequency: string
  ratings: Partial<Record<string, Rating>>
  suggestion: string
}

type Filters = {
  faculty: string
  program: string
  gender: string
  cohort: string
  frequency: string
}

type FacilityResult = Facility & {
  validCount: number
  average: number
  gap: number
  lowCount: number
  lowProportion: number
  normalizedGap: number
  normalizedLowCount: number
  normalizedLowProportion: number
  score: number
  rank: number
}

type ImportResult = {
  responses: SurveyResponse[]
  headers: string[]
  delimiter: "," | ";"
  recognizedCriteria: {
    criterion: string
    facilityName: string
    header: string
  }[]
  missingCriteria: string[]
  emptyRatingCells: number
  invalidRatingCells: number
  affectedRows: number
  malformedRows: number
}

type ImportNotice = {
  tone: "success" | "warning" | "error"
  title: string
  details: string[]
}

const EXPECTED_RESPONSES = 42
const WEIGHTS = { gap: 0.4, lowCount: 0.3, lowProportion: 0.3 }
const EMPTY_FILTERS: Filters = {
  faculty: "",
  program: "",
  gender: "",
  cohort: "",
  frequency: "",
}

const facilities: Facility[] = [
  {
    id: "seating-capacity",
    name: "Kapasitas tempat duduk",
    shortName: "Kapasitas duduk",
    keywords: ["tempat duduk", "kapasitas", "kursi kurang"],
    recommendation:
      "Evaluasi kebutuhan penambahan tempat duduk berdasarkan pola kepadatan dan ruang yang tersedia.",
  },
  {
    id: "chair-comfort",
    name: "Kenyamanan kursi",
    shortName: "Kenyamanan kursi",
    keywords: ["kursi", "duduk", "sandaran"],
    recommendation:
      "Periksa kondisi ergonomi kursi dan prioritaskan perbaikan atau penggantian unit yang tidak nyaman.",
  },
  {
    id: "lighting",
    name: "Tingkat pencahayaan",
    shortName: "Pencahayaan",
    keywords: ["cahaya", "pencahayaan", "lampu", "gelap"],
    recommendation:
      "Audit pemerataan pencahayaan dan perbaiki titik yang redup tanpa menimbulkan silau.",
  },
  {
    id: "table-size",
    name: "Ukuran meja",
    shortName: "Ukuran meja",
    keywords: ["meja", "ukuran meja"],
    recommendation:
      "Tinjau ukuran meja agar memadai untuk aktivitas belajar dan penggunaan perangkat.",
  },
  {
    id: "table-spacing",
    name: "Jarak antar meja dan ruang gerak",
    shortName: "Jarak meja",
    keywords: ["jarak", "ruang gerak", "sempit", "meja"],
    recommendation:
      "Atur ulang tata letak meja untuk memperbaiki sirkulasi dan ruang gerak pengguna.",
  },
  {
    id: "air-circulation",
    name: "Sirkulasi udara atau suhu ruangan",
    shortName: "Sirkulasi udara",
    keywords: ["udara", "suhu", "panas", "ac", "ventilasi"],
    recommendation:
      "Periksa ventilasi dan pengaturan suhu pada area yang paling sering dinilai kurang nyaman.",
  },
  {
    id: "wifi",
    name: "Kualitas dan kestabilan Wi-Fi",
    shortName: "Wi-Fi",
    keywords: ["wifi", "wi-fi", "internet", "jaringan", "sinyal"],
    recommendation:
      "Audit kestabilan jaringan dan cakupan akses pada area dengan keluhan koneksi.",
  },
  {
    id: "outlet-count",
    name: "Jumlah stopkontak",
    shortName: "Jumlah stopkontak",
    keywords: ["stopkontak", "colokan", "listrik"],
    recommendation:
      "Petakan kebutuhan daya dan pertimbangkan penambahan stopkontak yang aman di titik penggunaan tinggi.",
  },
  {
    id: "outlet-access",
    name: "Kemudahan menjangkau stopkontak",
    shortName: "Akses stopkontak",
    keywords: ["stopkontak", "colokan", "jangkau"],
    recommendation:
      "Perbaiki penempatan atau akses stopkontak agar dapat dijangkau tanpa mengganggu jalur sirkulasi.",
  },
  {
    id: "noise",
    name: "Tingkat kebisingan",
    shortName: "Kebisingan",
    keywords: ["bising", "kebisingan", "suara", "berisik"],
    recommendation:
      "Identifikasi sumber kebisingan dan terapkan pengaturan zona atau peredaman yang sesuai.",
  },
  {
    id: "cleanliness",
    name: "Kebersihan meja, kursi, dan lantai",
    shortName: "Kebersihan area",
    keywords: ["bersih", "kebersihan", "lantai", "meja", "kursi"],
    recommendation:
      "Tingkatkan pemeriksaan kebersihan meja, kursi, dan lantai pada jadwal penggunaan padat.",
  },
  {
    id: "trash-bin",
    name: "Ketersediaan tempat sampah dan kondisi kebersihannya",
    shortName: "Tempat sampah",
    keywords: ["sampah", "tempat sampah", "tong sampah"],
    recommendation:
      "Evaluasi jumlah, lokasi, dan jadwal pengosongan tempat sampah agar area tetap bersih.",
  },
  {
    id: "support-access",
    name: "Akses ke fasilitas pendukung, seperti toilet dan kantin",
    shortName: "Akses pendukung",
    keywords: ["toilet", "kantin", "fasilitas pendukung", "akses"],
    recommendation:
      "Perjelas akses dan petunjuk menuju toilet, kantin, serta fasilitas pendukung lain.",
  },
  {
    id: "belonging-safety",
    name: "Keamanan barang bawaan pengguna",
    shortName: "Keamanan barang",
    keywords: ["aman", "keamanan", "barang", "kehilangan"],
    recommendation:
      "Tinjau pengawasan area dan sarana penyimpanan untuk membantu keamanan barang pengguna.",
  },
]

const ratingHeaderRules = [
  {
    criterion: "C1",
    facilityId: "seating-capacity",
    phrases: [
      "kapasitas tempat duduk selalu mencukupi termasuk pada jam jam sibuk",
      "kapasitas tempat duduk",
    ],
    keywordSets: [["kapasitas", "tempat", "duduk"]],
  },
  {
    criterion: "C2",
    facilityId: "chair-comfort",
    phrases: [
      "kursi yang disediakan di area kampus junction nyaman digunakan untuk duduk dalam waktu lama",
      "kenyamanan kursi",
      "kursi nyaman digunakan",
    ],
    keywordSets: [["kursi", "nyaman"]],
  },
  {
    criterion: "C3",
    facilityId: "lighting",
    phrases: [
      "tingkat pencahayaan di area ini memadai untuk membaca atau melihat layar laptop tanpa membuat mata cepat lelah",
      "tingkat pencahayaan",
      "pencahayaan memadai",
    ],
    keywordSets: [["pencahayaan"]],
  },
  {
    criterion: "C4",
    facilityId: "table-size",
    phrases: ["ukuran meja yang tersedia", "ukuran meja"],
    keywordSets: [["ukuran", "meja"]],
  },
  {
    criterion: "C5",
    facilityId: "table-spacing",
    phrases: [
      "jarak antar meja dan ruang gerak",
      "jarak antar meja",
      "ruang gerak antar meja",
    ],
    keywordSets: [
      ["jarak", "meja"],
      ["ruang", "gerak", "meja"],
    ],
  },
  {
    criterion: "C6",
    facilityId: "air-circulation",
    phrases: [
      "sirkulasi udara atau suhu ruangan",
      "sirkulasi udara",
      "suhu ruangan",
    ],
    keywordSets: [
      ["sirkulasi", "udara"],
      ["suhu", "ruangan"],
    ],
  },
  {
    criterion: "C7",
    facilityId: "wifi",
    phrases: [
      "koneksi wi fi yang tersedia di kampus junction cepat dan stabil untuk mengunduh mengunggah tugas akademik",
      "kualitas dan kestabilan wi fi",
      "koneksi wi fi",
      "wifi cepat dan stabil",
    ],
    keywordSets: [
      ["wi", "fi", "stabil"],
      ["wifi", "stabil"],
    ],
  },
  {
    criterion: "C8",
    facilityId: "outlet-count",
    phrases: ["jumlah stopkontak yang tersedia", "jumlah stopkontak"],
    keywordSets: [["jumlah", "stopkontak"]],
  },
  {
    criterion: "C9",
    facilityId: "outlet-access",
    phrases: [
      "kemudahan menjangkau stopkontak",
      "stopkontak mudah dijangkau",
      "mudah menjangkau stopkontak",
    ],
    keywordSets: [["stopkontak", "jangkau"]],
  },
  {
    criterion: "C10",
    facilityId: "noise",
    phrases: ["tingkat kebisingan", "kebisingan di area"],
    keywordSets: [["kebisingan"]],
  },
  {
    criterion: "C11",
    facilityId: "cleanliness",
    phrases: [
      "kebersihan meja kursi dan lantai",
      "meja kursi dan lantai dalam kondisi bersih",
    ],
    keywordSets: [
      ["meja", "kursi", "lantai", "bersih"],
      ["meja", "kursi", "lantai", "kebersihan"],
    ],
  },
  {
    criterion: "C12",
    facilityId: "trash-bin",
    phrases: [
      "ketersediaan tempat sampah dan kondisi kebersihannya",
      "tempat sampah tersedia",
      "kondisi kebersihan tempat sampah",
    ],
    keywordSets: [
      ["tempat", "sampah", "bersih"],
      ["tempat", "sampah", "kebersihan"],
    ],
  },
  {
    criterion: "C13",
    facilityId: "support-access",
    phrases: [
      "akses ke fasilitas pendukung seperti toilet dan kantin",
      "akses fasilitas pendukung",
      "toilet dan kantin mudah dijangkau",
    ],
    keywordSets: [
      ["toilet", "kantin", "akses"],
      ["toilet", "kantin", "mudah"],
    ],
  },
  {
    criterion: "C14",
    facilityId: "belonging-safety",
    phrases: [
      "keamanan barang bawaan pengguna",
      "barang bawaan pengguna aman",
      "keamanan barang bawaan",
    ],
    keywordSets: [
      ["keamanan", "barang", "bawaan"],
      ["barang", "bawaan", "aman"],
    ],
  },
] as const

const navItems: { label: Page; icon: string }[] = [
  { label: "Dashboard", icon: "grid" },
  { label: "Data Kuesioner", icon: "form" },
  { label: "Hasil SAW", icon: "target" },
  { label: "Saran Responden", icon: "message" },
  { label: "Metode SAW", icon: "file" },
  { label: "Pengaturan", icon: "settings" },
]

function cleanCsvText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/^\uFEFF/, "")
    .replace(/[\u00A0\u2007\u202F]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

function normalizeText(value: string) {
  return cleanCsvText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

function detectDelimiter(text: string): "," | ";" {
  const counts = { ",": 0, ";": 0 }
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') i += 1
      else quoted = !quoted
    } else if (!quoted && (char === "," || char === ";")) {
      counts[char] += 1
    } else if (!quoted && (char === "\n" || char === "\r")) {
      break
    }
  }
  return counts[";"] > counts[","] ? ";" : ","
}

function parseCsv(text: string, delimiter: "," | ";") {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (char === delimiter && !quoted) {
      row.push(cleanCsvText(cell))
      cell = ""
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1
      row.push(cleanCsvText(cell))
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ""
    } else {
      cell += char
    }
  }
  row.push(cleanCsvText(cell))
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function findColumn(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeText)
  return headers.findIndex((header) =>
    normalizedAliases.some(
      (alias) => header === alias || header.includes(alias),
    ),
  )
}

function importResponses(text: string): ImportResult {
  const delimiter = detectDelimiter(text)
  const rows = parseCsv(text, delimiter)
  const originalHeaders = rows[0] || []
  const headers = originalHeaders.map(normalizeText)
  const emptyResult = {
    responses: [],
    headers: originalHeaders,
    delimiter,
    recognizedCriteria: [],
    missingCriteria: ratingHeaderRules.map(
      (rule) =>
        `${rule.criterion} — ${facilities.find((facility) => facility.id === rule.facilityId)?.name}`,
    ),
    emptyRatingCells: 0,
    invalidRatingCells: 0,
    affectedRows: 0,
    malformedRows: 0,
  }
  if (rows.length < 2 || !headers.length) return emptyResult
  const metaColumns = {
    faculty: findColumn(headers, ["fakultas anda", "fakultas"]),
    program: findColumn(headers, [
      "program studi anda",
      "program studi",
      "prodi",
    ]),
    gender: findColumn(headers, ["gender", "jenis kelamin"]),
    cohort: findColumn(headers, [
      "tahun angkatan anda",
      "tahun angkatan",
      "angkatan",
    ]),
    frequency: findColumn(headers, [
      "frekuensi kunjungan junction",
      "frekuensi kunjungan",
      "seberapa sering",
    ]),
    suggestion: findColumn(headers, [
      "usulan perbaikan",
      "saran perbaikan",
      "fasilitas atau layanan yang ingin diperbaiki",
      "fasilitas atau layanan apa yang menurut anda perlu diperbaiki",
      "fasilitas yang ingin diperbaiki",
      "layanan yang ingin diperbaiki",
      "jelaskan alasannya",
      "saran",
    ]),
  }
  const facilityColumns = ratingHeaderRules.map((rule) => {
    const column = headers.findIndex((header, index) => {
      if (index === metaColumns.suggestion) return false
      const phraseMatches = rule.phrases.some((phrase) =>
        header.includes(normalizeText(phrase)),
      )
      const keywordMatches = rule.keywordSets.some((keywords) =>
        keywords.every((keyword) => header.includes(normalizeText(keyword))),
      )
      return phraseMatches || keywordMatches
    })
    const facility = facilities.find((item) => item.id === rule.facilityId)!
    return { ...rule, column, facility }
  })
  const issueRows = new Set<number>()
  let emptyRatingCells = 0
  let invalidRatingCells = 0
  let malformedRows = 0
  const responses = rows.slice(1).map((row, index) => {
    const ratings: Partial<Record<string, Rating>> = {}
    if (row.length !== originalHeaders.length) {
      malformedRows += 1
      issueRows.add(index)
    }
    facilityColumns.forEach(({ facility, column }) => {
      if (column < 0) return
      const rawValue = cleanCsvText(row[column] || "")
      if (!rawValue) {
        emptyRatingCells += 1
        issueRows.add(index)
        return
      }
      const value = Number(rawValue)
      if (Number.isInteger(value) && value >= 1 && value <= 5) {
        ratings[facility.id] = (value as Rating)
      } else {
        invalidRatingCells += 1
        issueRows.add(index)
      }
    })
    const read = (column: number) =>
      column >= 0 ? cleanCsvText(row[column] || "") : ""
    return {
      id: `RSP-${String(index + 1).padStart(3, "0")}`,
      faculty: read(metaColumns.faculty),
      program: read(metaColumns.program),
      gender: read(metaColumns.gender),
      cohort: read(metaColumns.cohort),
      frequency: read(metaColumns.frequency),
      ratings,
      suggestion: read(metaColumns.suggestion),
    }
  })
  const recognizedCriteria = facilityColumns
    .filter((item) => item.column >= 0)
    .map((item) => ({
      criterion: item.criterion,
      facilityName: item.facility.name,
      header: originalHeaders[item.column],
    }))
  const missingCriteria = facilityColumns
    .filter((item) => item.column < 0)
    .map((item) => `${item.criterion} — ${item.facility.name}`)
  return {
    responses,
    headers: originalHeaders,
    delimiter,
    recognizedCriteria,
    missingCriteria,
    emptyRatingCells,
    invalidRatingCells,
    affectedRows: issueRows.size,
    malformedRows,
  }
}

function analyze(responses: SurveyResponse[]): FacilityResult[] {
  const raw = facilities.map((facility) => {
    const ratings = responses
      .map((response) => response.ratings[facility.id])
      .filter((rating): rating is Rating => rating !== undefined)
    const validCount = ratings.length
    const average = validCount
      ? ratings.reduce((sum, rating) => sum + rating, 0) / validCount
      : 0
    const lowCount = ratings.filter((rating) => rating <= 2).length
    return {
      ...facility,
      validCount,
      average,
      gap: validCount ? 5 - average : 0,
      lowCount,
      lowProportion: validCount ? lowCount / validCount : 0,
    }
  })
  const maxGap = Math.max(0, ...raw.map((item) => item.gap))
  const maxLowCount = Math.max(0, ...raw.map((item) => item.lowCount))
  const maxLowProportion = Math.max(0, ...raw.map((item) => item.lowProportion))
  const scored = raw.map((item) => {
    const normalizedGap = maxGap ? item.gap / maxGap : 0
    const normalizedLowCount = maxLowCount ? item.lowCount / maxLowCount : 0
    const normalizedLowProportion = maxLowProportion
      ? item.lowProportion / maxLowProportion
      : 0
    return {
      ...item,
      normalizedGap,
      normalizedLowCount,
      normalizedLowProportion,
      score:
        normalizedGap * WEIGHTS.gap +
        normalizedLowCount * WEIGHTS.lowCount +
        normalizedLowProportion * WEIGHTS.lowProportion,
      rank: 0,
    }
  })
  const ranked = scored
    .filter((item) => item.validCount > 0)
    .sort((a, b) => b.score - a.score || a.average - b.average)
  const ranks = new Map(ranked.map((item, index) => [item.id, index + 1]))
  return scored
    .map((item) => ({ ...item, rank: ranks.get(item.id) || 0 }))
    .sort((a, b) => (a.rank || 99) - (b.rank || 99))
}

function formatNumber(value: number, digits = 2) {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    form: (
      <>
        <path d="M9 5h10M9 12h10M9 19h10" />
        <path d="m3 5 1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 13h6M9 17h6" />
      </>
    ),
    message: (
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3A1.7 1.7 0 0 0 14 21v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M20 8v6M23 11h-6" />
      </>
    ),
    trend: (
      <>
        <path d="m3 17 6-6 4 4 8-9" />
        <path d="M15 6h6v6" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 3.5 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
        <path d="M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" />
      </>
    ),
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8Z" />,
    back: <path d="m15 18-6-6 6-6" />,
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 4.5 6v5.5c0 4.8 3.2 7.7 7.5 9.5 4.3-1.8 7.5-4.7 7.5-9.5V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 19v2" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.grid}
    </svg>
  )
}

function Button({
  children,
  icon,
  secondary,
  onClick,
}: {
  children: React.ReactNode
  icon?: string
  secondary?: boolean
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className={`btn ${secondary ? "secondary" : ""}`}>
      {icon && <Icon name={icon} size={16} />} {children}
    </button>
  )
}

function Status({ rank, total }: { rank: number; total: number }) {
  const tier =
    rank <= Math.ceil(total / 3)
      ? "Tinggi"
      : rank <= Math.ceil((total * 2) / 3)
        ? "Sedang"
        : "Rendah"
  const tone =
    tier === "Tinggi" ? "danger" : tier === "Sedang" ? "warning" : "success"
  return (
    <span className={`status ${tone}`}>
      <i />
      {`Prioritas ${tier}`}
    </span>
  )
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-actions">{action}</div>}
    </div>
  )
}

function FilterBar({
  responses,
  filters,
  setFilters,
}: {
  responses: SurveyResponse[]
  filters: Filters
  setFilters: (filters: Filters) => void
}) {
  const fields: { key: keyof Filters; label: string }[] = [
    { key: "faculty", label: "Semua fakultas" },
    { key: "program", label: "Semua program studi" },
    { key: "gender", label: "Semua gender" },
    { key: "cohort", label: "Semua angkatan" },
    { key: "frequency", label: "Semua frekuensi" },
  ]
  return (
    <div className="filter-bar">
      <div className="filter-label">
        <Icon name="filter" size={15} />
        <b>Filter analisis</b>
      </div>
      {fields.map((field) => {
        const options = [
          ...new Set(
            responses.map((response) => response[field.key]).filter(Boolean),
          ),
        ].sort()
        return (
          <select
            key={field.key}
            value={filters[field.key]}
            onChange={(event) =>
              setFilters({ ...filters, [field.key]: event.target.value })
            }
          >
            <option value="">{field.label}</option>
            {options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        )
      })}
      {Object.values(filters).some(Boolean) && (
        <button className="link-btn" onClick={() => setFilters(EMPTY_FILTERS)}>
          Atur ulang
        </button>
      )}
    </div>
  )
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="form" size={24} />
      </span>
      <h2>Data rating asli belum dimuat</h2>
      <p>
        Impor CSV Google Forms berisi 42 respons untuk menampilkan statistik,
        grafik, dan peringkat SAW. Aplikasi tidak menampilkan angka simulasi.
      </p>
      <Button icon="download" onClick={onImport}>
        Impor CSV asli
      </Button>
    </div>
  )
}

function Dashboard({
  responses,
  results,
  filters,
  setFilters,
  setPage,
  openImport,
  openDetail,
}: {
  responses: SurveyResponse[]
  results: FacilityResult[]
  filters: Filters
  setFilters: (filters: Filters) => void
  setPage: (page: Page) => void
  openImport: () => void
  openDetail: (facility: FacilityResult) => void
}) {
  const validResults = results.filter((result) => result.validCount > 0)
  const ratings = responses.flatMap((response) =>
    Object.values(response.ratings),
  )
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
          <Button secondary icon="download" onClick={openImport}>
            Impor CSV
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
          <EmptyState onImport={openImport} />
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
                {results.map((result) => (
                  <button
                    key={result.id}
                    className="horizontal-row"
                    onClick={() => openDetail(result)}
                  >
                    <span>{result.shortName}</span>
                    <div className="horizontal-track">
                      <i style={{ width: `${(result.average / 5) * 100}%` }} />
                    </div>
                    <b>
                      {result.validCount ? formatNumber(result.average) : "—"}
                    </b>
                  </button>
                ))}
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

function QuestionnairePage({
  allResponses,
  responses,
  openImport,
}: {
  allResponses: SurveyResponse[]
  responses: SurveyResponse[]
  openImport: () => void
}) {
  return (
    <>
      <PageHeader
        title="Data Kuesioner"
        description="Data responden ditampilkan tanpa nama dan NIM untuk menjaga privasi."
        action={
          <Button icon="download" onClick={openImport}>
            Impor CSV Google Forms
          </Button>
        }
      />
      <div className="mini-stats four">
        <div>
          <span>Respons dimuat</span>
          <b>{allResponses.length}</b>
          <small>Dari target {EXPECTED_RESPONSES} respons</small>
        </div>
        <div>
          <span>Respons setelah filter</span>
          <b>{responses.length}</b>
          <small>Data aktif untuk analisis</small>
        </div>
        <div>
          <span>Aspek fasilitas</span>
          <b>14</b>
          <small>Skala Likert 1–5</small>
        </div>
        <div>
          <span>Privasi</span>
          <b>Aman</b>
          <small>Nama dan NIM tidak ditampilkan</small>
        </div>
      </div>
      {!allResponses.length ? (
        <section className="card">
          <EmptyState onImport={openImport} />
        </section>
      ) : (
        <section className="card table-card wide-table">
          <div className="card-head">
            <div>
              <h2>Respons anonim</h2>
              <p>
                Nilai “—” menandakan respons kosong atau tidak valid dan tidak
                dihitung sebagai rating rendah.
              </p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Fakultas</th>
                <th>Program Studi</th>
                <th>Gender</th>
                <th>Angkatan</th>
                <th>Frekuensi Kunjungan</th>
                <th>Rating Valid</th>
                <th>Saran</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id}>
                  <td>
                    <b>{response.id}</b>
                  </td>
                  <td>{response.faculty || "—"}</td>
                  <td>{response.program || "—"}</td>
                  <td>{response.gender || "—"}</td>
                  <td>{response.cohort || "—"}</td>
                  <td>{response.frequency || "—"}</td>
                  <td>{Object.keys(response.ratings).length} / 14</td>
                  <td>{response.suggestion ? "Tersedia" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <section className="card criteria-list-card">
        <div className="card-head">
          <div>
            <h2>14 Pertanyaan Penilaian Fasilitas</h2>
            <p>
              Interpretasi: 1 Sangat Tidak Puas · 2 Tidak Puas · 3 Cukup Puas ·
              4 Puas · 5 Sangat Puas
            </p>
          </div>
        </div>
        <ol className="criteria-list">
          {facilities.map((facility) => (
            <li key={facility.id}>{facility.name}</li>
          ))}
        </ol>
      </section>
    </>
  )
}

function ResultsPage({
  responses,
  results,
  openImport,
  openDetail,
}: {
  responses: SurveyResponse[]
  results: FacilityResult[]
  openImport: () => void
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
          <EmptyState onImport={openImport} />
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

function SuggestionsPage({
  responses,
  openImport,
}: {
  responses: SurveyResponse[]
  openImport: () => void
}) {
  const suggestions = responses.filter((response) => response.suggestion)
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
          <EmptyState onImport={openImport} />
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
                  <p>“{response.suggestion}”</p>
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

function MethodPage() {
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

function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Informasi profil dan konfigurasi metode penelitian."
      />
      <div className="settings-grid">
        <section className="card settings-card">
          <h2>Profil Administrator</h2>
          <div className="profile-edit">
            <div className="avatar large">RD</div>
            <div>
              <b>Richard Devin</b>
              <p>Administrator Sistem</p>
            </div>
          </div>
          <Field label="Nama Lengkap" value="Richard Devin" />
          <Field label="Email" value="richard.devin@junction.ac.id" />
          <Button>Simpan Profil</Button>
        </section>
        <section className="card settings-card">
          <h2>Konfigurasi SAW</h2>
          {[
            "C1 — Kesenjangan kepuasan — 0,40",
            "C2 — Jumlah penilaian rendah — 0,30",
            "C3 — Proporsi penilaian rendah — 0,30",
          ].map((item) => (
            <div className="setting-row" key={item}>
              <span>{item}</span>
              <b>Benefit</b>
            </div>
          ))}
          <div className="calc-total">
            <span>Total bobot</span>
            <b>1,00</b>
          </div>
        </section>
      </div>
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input defaultValue={value} />
    </label>
  )
}

function FacilityDetail({
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

const GOOGLE_FORM_URL = "https://docs.google.com/forms/"

function PublicHeader({
  page,
  setPage,
}: {
  page: PublicPage
  setPage: (page: PublicPage) => void
}) {
  return (
    <header className="public-header">
      <button
        className="public-brand"
        onClick={() => setPage("home")}
        aria-label="Kembali ke beranda"
      >
        <span>J</span>
        <div>
          <b>Junction</b>
          <small>Campus Experience</small>
        </div>
      </button>
      <nav className="public-nav" aria-label="Navigasi publik">
        <button
          className={page === "home" ? "active" : ""}
          onClick={() => setPage("home")}
        >
          Beranda
        </button>
        <button
          className={page === "results" ? "active" : ""}
          onClick={() => setPage("results")}
        >
          Hasil Analisis
        </button>
        <button
          className={page === "survey" ? "active" : ""}
          onClick={() => setPage("survey")}
        >
          Isi Survei
        </button>
      </nav>
      <button className="admin-login-link" onClick={() => setPage("login")}>
        <Icon name="lock" size={15} /> Login Admin
      </button>
    </header>
  )
}

function PublicHome({
  setPage,
  results,
  responseCount,
}: {
  setPage: (page: PublicPage) => void
  results: FacilityResult[]
  responseCount: number
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
                <h3>Hasil analisis belum dipublikasikan</h3>
                <p>
                  Peringkat fasilitas akan tampil setelah data kuesioner diimpor
                  dan dihitung oleh administrator.
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
        <b>Junction Analytics</b>
        <span>Proyek analisis kepuasan fasilitas kampus</span>
      </footer>
    </div>
  )
}

function PublicResultsPage({
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
        <b>Junction Analytics</b>
        <span>Hasil publik analisis kepuasan fasilitas</span>
      </footer>
    </div>
  )
}

function SurveyQrPage({ setPage }: { setPage: (page: PublicPage) => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(GOOGLE_FORM_URL)}`
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
              <img src={qrUrl} alt="QR code menuju Google Form survei" />
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

function LoginPage({
  setPage,
  onLogin,
}: {
  setPage: (page: PublicPage) => void
  onLogin: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="login-page">
      <section className="login-aside">
        <button className="public-brand light" onClick={() => setPage("home")}>
          <span>J</span>
          <div>
            <b>Junction</b>
            <small>Analytics</small>
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
        <small>Junction Analytics · Prototype Proyek Akhir</small>
      </section>
      <main className="login-main">
        <button className="back-link" onClick={() => setPage("home")}>
          <Icon name="back" size={17} /> Kembali ke beranda
        </button>
        <form
          className="login-card"
          onSubmit={(event) => {
            event.preventDefault()
            onLogin()
          }}
        >
          <span className="login-icon">
            <Icon name="lock" size={23} />
          </span>
          <h2>Selamat datang kembali</h2>
          <p>Masuk untuk mengakses dashboard analisis.</p>
          <label>
            <span>Email atau nama pengguna</span>
            <input
              required
              placeholder="Masukkan email atau username"
              autoComplete="username"
            />
          </label>
          <label>
            <span>Kata sandi</span>
            <div className="password-field">
              <input
                required
                type={showPassword ? "text" : "password"}
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
          <div className="login-options">
            <label>
              <input type="checkbox" /> Ingat saya
            </label>
            <button type="button">Lupa kata sandi?</button>
          </div>
          <button className="public-primary login-submit" type="submit">
            Masuk ke Dashboard <Icon name="arrow" size={17} />
          </button>
          <div className="demo-notice">
            <Icon name="alert" size={16} />
            <span>
              <b>Mode prototipe</b> — isi kredensial apa pun untuk masuk.
            </span>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function App() {
  const [publicPage, setPublicPage] = useState<PublicPage>("home")
  const [isAdmin, setIsAdmin] = useState(false)
  const [page, setPage] = useState<Page>("Dashboard")
  const [allResponses, setAllResponses] = useState<SurveyResponse[]>([])
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<FacilityResult | null>(null)
  const [importMessage, setImportMessage] = useState<ImportNotice | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
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

  function openImport() {
    fileInput.current?.click()
  }

  async function handleImport(file?: File) {
    if (!file) return
    const result = importResponses(await file.text())
    const recognizedCount = result.recognizedCriteria.length
    const details = [
      `File: ${file.name} · pemisah terdeteksi: ${
        result.delimiter === ";" ? "titik koma (;)" : "koma (,)"
      }.`,
      `${result.responses.length} responden terbaca dan ${recognizedCount} dari 14 kriteria rating dikenali.`,
    ]
    if (recognizedCount) {
      details.push(
        `Kolom rating dikenali: ${result.recognizedCriteria.map((item) => `${item.criterion} (${item.facilityName})`).join(", ")}.`,
      )
    }
    if (result.affectedRows) {
      details.push(
        `${result.affectedRows} baris memiliki masalah: ${result.emptyRatingCells} nilai rating kosong, ${result.invalidRatingCells} nilai di luar angka 1–5, dan ${result.malformedRows} baris dengan jumlah kolom tidak sesuai. Nilai bermasalah tidak dihitung, tetapi baris responden tetap disimpan.`,
      )
    } else if (recognizedCount && result.responses.length) {
      details.push(
        "Status validasi: seluruh nilai pada kolom rating yang dikenali valid (angka 1–5).",
      )
    }
    if (result.missingCriteria.length) {
      details.push(
        `Kolom rating belum ditemukan: ${result.missingCriteria.join(", ")}.`,
      )
      details.push(
        `Nama kolom yang berhasil dibaca: ${
          result.headers.length
            ? result.headers.join(" | ")
            : "tidak ada header terbaca"
        }.`,
      )
    }
    if (!result.responses.length || !recognizedCount) {
      setImportMessage({
        tone: "error",
        title:
          "Struktur CSV belum dapat digunakan. Data yang sudah ada tidak diubah.",
        details,
      })
    } else {
      setAllResponses(result.responses)
      setFilters(EMPTY_FILTERS)
      setImportMessage({
        tone:
          result.missingCriteria.length || result.affectedRows
            ? "warning"
            : "success",
        title:
          result.missingCriteria.length || result.affectedRows
            ? "CSV berhasil diimpor dengan catatan validasi."
            : "CSV berhasil diimpor dan tervalidasi.",
        details,
      })
    }
    setPage("Data Kuesioner")
  }

  function openDetail(result: FacilityResult) {
    setSelected(result)
  }

  if (!isAdmin) {
    if (publicPage === "survey") return <SurveyQrPage setPage={setPublicPage} />
    if (publicPage === "results")
      return (
        <PublicResultsPage
          setPage={setPublicPage}
          results={publicResults}
          responseCount={allResponses.length}
        />
      )
    if (publicPage === "login")
      return (
        <LoginPage setPage={setPublicPage} onLogin={() => setIsAdmin(true)} />
      )
    return (
      <PublicHome
        setPage={setPublicPage}
        results={publicResults}
        responseCount={allResponses.length}
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
    <Dashboard
      responses={responses}
      results={results}
      filters={filters}
      setFilters={setFilters}
      setPage={setPage}
      openImport={openImport}
      openDetail={openDetail}
    />
  ) : page === "Data Kuesioner" ? (
    <QuestionnairePage
      allResponses={allResponses}
      responses={responses}
      openImport={openImport}
    />
  ) : page === "Hasil SAW" ? (
    <ResultsPage
      responses={responses}
      results={results}
      openImport={openImport}
      openDetail={openDetail}
    />
  ) : page === "Saran Responden" ? (
    <SuggestionsPage responses={responses} openImport={openImport} />
  ) : page === "Metode SAW" ? (
    <MethodPage />
  ) : (
    <SettingsPage />
  )

  return (
    <div className="app-shell">
      <input
        ref={fileInput}
        className="file-input"
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => {
          void handleImport(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">J</span>
          <div>
            <b>Junction</b>
            <small>Analytics</small>
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
            Junction Analytics v1.0
            <br />
            Prototype Proyek Akhir
          </p>
        </div>
      </aside>
      <main className="main">
        <header>
          <div className="breadcrumb">
            <span>Junction Analytics</span>
            <Icon name="chevron" size={14} />
            <b>{selected ? "Detail Fasilitas" : page}</b>
          </div>
          <div className="header-right">
            <button className="icon-btn notification">
              <Icon name="bell" />
            </button>
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
              onClick={() => {
                setIsAdmin(false)
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
