import type { Facility, FacilityResult, Filters, ImportResult, Page, Rating, SurveyResponse } from "../types"

export const EXPECTED_RESPONSES = 60
export const WEIGHTS = { gap: 0.4, lowCount: 0.3, lowProportion: 0.3 }
export const EMPTY_FILTERS: Filters = {
  faculty: "",
  program: "",
  gender: "",
  cohort: "",
  frequency: "",
}

export const facilities: Facility[] = [
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

export const ratingHeaderRules = [
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

export const navItems: { label: Page; icon: string }[] = [
  { label: "Dashboard", icon: "grid" },
  { label: "Data Kuesioner", icon: "form" },
  { label: "Hasil SAW", icon: "target" },
  { label: "Saran Responden", icon: "message" },
]

export function cleanCsvText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/^\uFEFF/, "")
    .replace(/[\u00A0\u2007\u202F]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

export function normalizeText(value: string) {
  return cleanCsvText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

export function detectDelimiter(text: string): "," | ";" {
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

export function parseCsv(text: string, delimiter: "," | ";") {
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

export function findColumn(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeText)
  return headers.findIndex((header) =>
    normalizedAliases.some(
      (alias) => header === alias || header.includes(alias),
    ),
  )
}

export function importResponses(text: string): ImportResult {
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
      "jika anda bisa merombak atau menambahkan satu hal untuk meningkatkan kelayakan kampus junction fasilitas atau layanan apa yang menjadi prioritas utama anda dan mengapa",
      "usulan perbaikan",
      "saran perbaikan",
      "fasilitas atau layanan yang ingin diperbaiki",
      "fasilitas atau layanan apa yang menurut anda perlu diperbaiki",
      "fasilitas yang ingin diperbaiki",
      "layanan yang ingin diperbaiki",
      "jelaskan alasannya",
      "saran",
    ]),
        photo: findColumn(headers, ["upload foto"]),
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
      photoUrls: read(metaColumns.photo)
        .split(/\s*,\s*/)
        .filter(Boolean),
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

export function analyze(responses: SurveyResponse[]): FacilityResult[] {
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

export function formatNumber(value: number, digits = 2) {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export const GOOGLE_FORM_URL = "https://forms.gle/r9DbRe7hCZ6p565PA"
