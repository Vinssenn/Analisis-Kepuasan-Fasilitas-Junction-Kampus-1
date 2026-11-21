"use strict";

const { useMemo, useRef, useState } = React;

const EXPECTED_RESPONSES = 42
const WEIGHTS = { gap: 0.4, lowCount: 0.3, lowProportion: 0.3 }
const EMPTY_FILTERS = {
  faculty: "",
  program: "",
  gender: "",
  cohort: "",
  frequency: "",
}

const facilities = [
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
]

const navItems = [
  { label: "Dashboard", icon: "grid" },
  { label: "Data Kuesioner", icon: "form" },
  { label: "Hasil SAW", icon: "target" },
  { label: "Saran Responden", icon: "message" },
  { label: "Metode SAW", icon: "file" },
  { label: "Pengaturan", icon: "settings" },
]

function cleanCsvText(value) {
  return value
    .normalize("NFKC")
    .replace(/^\uFEFF/, "")
    .replace(/[\u00A0\u2007\u202F]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

function normalizeText(value) {
  return cleanCsvText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

function detectDelimiter(text) {
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

function parseCsv(text, delimiter) {
  const rows = []
  let row = []
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

function findColumn(headers, aliases) {
  const normalizedAliases = aliases.map(normalizeText)
  return headers.findIndex((header) =>
    normalizedAliases.some(
      (alias) => header === alias || header.includes(alias),
    ),
  )
}

function importResponses(text) {
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
    const facility = facilities.find((item) => item.id === rule.facilityId)
    return { ...rule, column, facility }
  })
  const issueRows = new Set()
  let emptyRatingCells = 0
  let invalidRatingCells = 0
  let malformedRows = 0
  const responses = rows.slice(1).map((row, index) => {
    const ratings = {}
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
        ratings[facility.id] = (value)
      } else {
        invalidRatingCells += 1
        issueRows.add(index)
      }
    })
    const read = (column) =>
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

function analyze(responses) {
  const raw = facilities.map((facility) => {
    const ratings = responses
      .map((response) => response.ratings[facility.id])
      .filter((rating) => rating !== undefined)
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

function formatNumber(value, digits = 2) {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: (
      React.createElement(React.Fragment, null, React.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "2" }), React.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "2" }), React.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "2" }), React.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "2" }))
    ),
    form: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M9 5h10M9 12h10M9 19h10" }), React.createElement("path", { d: "m3 5 1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2" }))
    ),
    target: (
      React.createElement(React.Fragment, null, React.createElement("circle", { cx: "12", cy: "12", r: "9" }), React.createElement("circle", { cx: "12", cy: "12", r: "5" }), React.createElement("circle", { cx: "12", cy: "12", r: "1" }))
    ),
    file: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M6 2h8l4 4v16H6z" }), React.createElement("path", { d: "M14 2v5h5M9 13h6M9 17h6" }))
    ),
    message: (
      React.createElement("path", { d: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" })
    ),
    settings: (
      React.createElement(React.Fragment, null, React.createElement("circle", { cx: "12", cy: "12", r: "3" }), React.createElement("path", { d: "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3A1.7 1.7 0 0 0 14 21v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" }))
    ),
    bell: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" }))
    ),
    download: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" }))
    ),
    eye: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12" }), React.createElement("circle", { cx: "12", cy: "12", r: "2.5" }))
    ),
    close: React.createElement("path", { d: "m6 6 12 12M18 6 6 18" }),
    chevron: React.createElement("path", { d: "m9 18 6-6-6-6" }),
    users: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }), React.createElement("circle", { cx: "8.5", cy: "7", r: "4" }), React.createElement("path", { d: "M20 8v6M23 11h-6" }))
    ),
    trend: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "m3 17 6-6 4 4 8-9" }), React.createElement("path", { d: "M15 6h6v6" }))
    ),
    alert: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M10.3 3.5 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.5a2 2 0 0 0-3.4 0Z" }), React.createElement("path", { d: "M12 9v4M12 17h.01" }))
    ),
    building: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" }), React.createElement("path", { d: "M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" }))
    ),
    filter: React.createElement("path", { d: "M4 5h16l-6 7v6l-4 2v-8Z" }),
    back: React.createElement("path", { d: "m15 18-6-6 6-6" }),
    arrow: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M5 12h14M13 6l6 6-6 6" }))
    ),
    shield: (
      React.createElement(React.Fragment, null, React.createElement("path", { d: "M12 3 4.5 6v5.5c0 4.8 3.2 7.7 7.5 9.5 4.3-1.8 7.5-4.7 7.5-9.5V6Z" }), React.createElement("path", { d: "m9 12 2 2 4-4" }))
    ),
    qr: (
      React.createElement(React.Fragment, null, React.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), React.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), React.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), React.createElement("path", { d: "M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 19v2" }))
    ),
    lock: (
      React.createElement(React.Fragment, null, React.createElement("rect", { x: "4", y: "10", width: "16", height: "11", rx: "3" }), React.createElement("path", { d: "M8 10V7a4 4 0 0 1 8 0v3M12 14v3" }))
    ),
  }
  return (
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, paths[name] || paths.grid)
  )
}

function Button({
  children,
  icon,
  secondary,
  onClick,
}) {
  return (
    React.createElement("button", { onClick: onClick, className: `btn ${secondary ? "secondary" : ""}` }, icon && React.createElement(Icon, { name: icon, size: 16 }), " ", children)
  )
}

function Status({ rank, total }) {
  const tier =
    rank <= Math.ceil(total / 3)
      ? "Tinggi"
      : rank <= Math.ceil((total * 2) / 3)
        ? "Sedang"
        : "Rendah"
  const tone =
    tier === "Tinggi" ? "danger" : tier === "Sedang" ? "warning" : "success"
  return (
    React.createElement("span", { className: `status ${tone}` }, React.createElement("i", null), `Prioritas ${tier}`)
  )
}

function PageHeader({
  title,
  description,
  action,
}) {
  return (
    React.createElement("div", { className: "page-heading" }, React.createElement("div", null, React.createElement("h1", null, title), React.createElement("p", null, description)), action && React.createElement("div", { className: "heading-actions" }, action))
  )
}

function FilterBar({
  responses,
  filters,
  setFilters,
}) {
  const fields = [
    { key: "faculty", label: "Semua fakultas" },
    { key: "program", label: "Semua program studi" },
    { key: "gender", label: "Semua gender" },
    { key: "cohort", label: "Semua angkatan" },
    { key: "frequency", label: "Semua frekuensi" },
  ]
  return (
    React.createElement("div", { className: "filter-bar" }, React.createElement("div", { className: "filter-label" }, React.createElement(Icon, { name: "filter", size: 15 }), React.createElement("b", null, "Filter analisis")), fields.map((field) => {
        const options = [
          ...new Set(
            responses.map((response) => response[field.key]).filter(Boolean),
          ),
        ].sort()
        return (
          React.createElement("select", { key: field.key, value: filters[field.key], onChange: (event) =>
              setFilters({ ...filters, [field.key]: event.target.value }) }, React.createElement("option", { value: "" }, field.label), options.map((option) => (
              React.createElement("option", { key: option }, option)
            )))
        )
      }), Object.values(filters).some(Boolean) && (
        React.createElement("button", { className: "link-btn", onClick: () => setFilters(EMPTY_FILTERS) }, "Atur ulang")
      ))
  )
}

function EmptyState({ onImport }) {
  return (
    React.createElement("div", { className: "empty-state" }, React.createElement("span", { className: "empty-icon" }, React.createElement(Icon, { name: "form", size: 24 })), React.createElement("h2", null, "Data rating asli belum dimuat"), React.createElement("p", null, "Impor CSV Google Forms berisi 42 respons untuk menampilkan statistik, grafik, dan peringkat SAW. Aplikasi tidak menampilkan angka simulasi."), React.createElement(Button, { icon: "download", onClick: onImport }, "Impor CSV asli"))
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
    React.createElement(React.Fragment, null, React.createElement(PageHeader, { title: "Dashboard Analisis Fasilitas Kampus Junction", description: "Ringkasan kepuasan dan prioritas perbaikan berdasarkan metode Simple Additive Weighting.", action: React.createElement(Button, { secondary: true, icon: "download", onClick: openImport }, "Impor CSV") }), React.createElement("div", { className: `notice ${responses.length ? "verified" : ""}` }, React.createElement(Icon, { name: responses.length ? "form" : "alert", size: 16 }), React.createElement("span", null, responses.length ? (
            React.createElement(React.Fragment, null, React.createElement("b", null, "Analisis berbasis data yang dimuat."), " ", responses.length, " ", "respons digunakan setelah filter aktif; nilai kosong atau tidak valid diabaikan per fasilitas.")
          ) : (
            React.createElement(React.Fragment, null, React.createElement("b", null, "Dataset penelitian belum tersedia di repository."), " Target penelitian adalah ", EXPECTED_RESPONSES, " respons; hasil analisis baru ditampilkan setelah CSV asli diimpor.")
          ))), React.createElement(FilterBar, { responses: responses, filters: filters, setFilters: setFilters }), React.createElement("div", { className: "stat-grid five" }, [
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
          React.createElement("div", { className: "stat-card", key: stat[0] }, React.createElement("div", { className: `stat-icon s${index}` }, React.createElement(Icon, { name: stat[2] })), React.createElement("div", { className: "stat-label" }, stat[0]), React.createElement("div", { className: `stat-value ${
                String(stat[1]).length > 10 ? "compact" : ""
              }` }, stat[1]), React.createElement("div", { className: "stat-meta" }, stat[3]))
        ))), !responses.length ? (
        React.createElement("section", { className: "card" }, React.createElement(EmptyState, { onImport: openImport }))
      ) : (
        React.createElement(React.Fragment, null, React.createElement("div", { className: "chart-grid" }, React.createElement("section", { className: "card bar-card facility-chart" }, React.createElement("div", { className: "card-head" }, React.createElement("div", null, React.createElement("h2", null, "Perbandingan Rata-rata Rating 14 Fasilitas"), React.createElement("p", null, "Nilai dihitung dari respons valid pada setiap fasilitas")), React.createElement("span", { className: "scale-note" }, "Skala 1–5")), React.createElement("div", { className: "horizontal-chart" }, results.map((result) => (
                  React.createElement("button", { key: result.id, className: "horizontal-row", onClick: () => openDetail(result) }, React.createElement("span", null, result.shortName), React.createElement("div", { className: "horizontal-track" }, React.createElement("i", { style: { width: `${(result.average / 5) * 100}%` } })), React.createElement("b", null, result.validCount ? formatNumber(result.average) : "—"))
                )))), React.createElement("section", { className: "card distribution-card" }, React.createElement("div", { className: "card-head" }, React.createElement("div", null, React.createElement("h2", null, "Distribusi Rating"), React.createElement("p", null, ratings.length, " rating valid dari ", responses.length, " ", "responden"))), React.createElement("div", { className: "distribution-bars" }, distribution.map((count, index) => {
                  const max = Math.max(...distribution, 1)
                  return (
                    React.createElement("div", { key: index }, React.createElement("span", null, count), React.createElement("div", null, React.createElement("i", { className: `rating-${index + 1}`, style: { height: `${(count / max) * 100}%` } })), React.createElement("b", null, index + 1), React.createElement("small", null, [
                            "Sangat tidak puas",
                            "Tidak puas",
                            "Cukup puas",
                            "Puas",
                            "Sangat puas",
                          ][index]))
                  )
                })))), React.createElement("section", { className: "card summary-card" }, React.createElement("div", { className: "summary-icon" }, React.createElement(Icon, { name: "target", size: 22 })), React.createElement("div", null, React.createElement("span", null, "Ringkasan hasil analisis"), React.createElement("h2", null, top
                  ? `${top.name} menjadi prioritas perbaikan tertinggi`
                  : "Belum ada fasilitas yang dapat diperingkat"), React.createElement("p", null, top
                  ? `Skor SAW ${formatNumber(top.score, 3)} diperoleh dari kesenjangan kepuasan, jumlah rating 1–2, dan proporsi rating 1–2. ${top.recommendation}`
                  : "Pastikan kolom rating pada CSV sesuai dengan 14 aspek fasilitas.")), React.createElement(Button, { onClick: () => setPage("Hasil SAW") }, "Lihat hasil lengkap")))
      ))
  )
}

function QuestionnairePage({
  allResponses,
  responses,
  openImport,
}) {
  return (
    React.createElement(React.Fragment, null, React.createElement(PageHeader, { title: "Data Kuesioner", description: "Data responden ditampilkan tanpa nama dan NIM untuk menjaga privasi.", action: React.createElement(Button, { icon: "download", onClick: openImport }, "Impor CSV Google Forms") }), React.createElement("div", { className: "mini-stats four" }, React.createElement("div", null, React.createElement("span", null, "Respons dimuat"), React.createElement("b", null, allResponses.length), React.createElement("small", null, "Dari target ", EXPECTED_RESPONSES, " respons")), React.createElement("div", null, React.createElement("span", null, "Respons setelah filter"), React.createElement("b", null, responses.length), React.createElement("small", null, "Data aktif untuk analisis")), React.createElement("div", null, React.createElement("span", null, "Aspek fasilitas"), React.createElement("b", null, "14"), React.createElement("small", null, "Skala Likert 1–5")), React.createElement("div", null, React.createElement("span", null, "Privasi"), React.createElement("b", null, "Aman"), React.createElement("small", null, "Nama dan NIM tidak ditampilkan"))), !allResponses.length ? (
        React.createElement("section", { className: "card" }, React.createElement(EmptyState, { onImport: openImport }))
      ) : (
        React.createElement("section", { className: "card table-card wide-table" }, React.createElement("div", { className: "card-head" }, React.createElement("div", null, React.createElement("h2", null, "Respons anonim"), React.createElement("p", null, "Nilai “—” menandakan respons kosong atau tidak valid dan tidak dihitung sebagai rating rendah."))), React.createElement("table", null, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Kode"), React.createElement("th", null, "Fakultas"), React.createElement("th", null, "Program Studi"), React.createElement("th", null, "Gender"), React.createElement("th", null, "Angkatan"), React.createElement("th", null, "Frekuensi Kunjungan"), React.createElement("th", null, "Rating Valid"), React.createElement("th", null, "Saran"))), React.createElement("tbody", null, responses.map((response) => (
                React.createElement("tr", { key: response.id }, React.createElement("td", null, React.createElement("b", null, response.id)), React.createElement("td", null, response.faculty || "—"), React.createElement("td", null, response.program || "—"), React.createElement("td", null, response.gender || "—"), React.createElement("td", null, response.cohort || "—"), React.createElement("td", null, response.frequency || "—"), React.createElement("td", null, Object.keys(response.ratings).length, " / 14"), React.createElement("td", null, response.suggestion ? "Tersedia" : "—"))
              )))))
      ), React.createElement("section", { className: "card criteria-list-card" }, React.createElement("div", { className: "card-head" }, React.createElement("div", null, React.createElement("h2", null, "14 Pertanyaan Penilaian Fasilitas"), React.createElement("p", null, "Interpretasi: 1 Sangat Tidak Puas · 2 Tidak Puas · 3 Cukup Puas · 4 Puas · 5 Sangat Puas"))), React.createElement("ol", { className: "criteria-list" }, facilities.map((facility) => (
            React.createElement("li", { key: facility.id }, facility.name)
          )))))
  )
}

function ResultsPage({
  responses,
  results,
  openImport,
  openDetail,
}) {
  const [sortBy, setSortBy] = useState("rank")
  const valid = results.filter((result) => result.validCount > 0)
  const rows = [...valid].sort((a, b) =>
    sortBy === "rank" ? a.rank - b.rank : b.score - a.score,
  )
  return (
    React.createElement(React.Fragment, null, React.createElement(PageHeader, { title: "Hasil dan Peringkat Prioritas SAW", description: "Skor tertinggi menunjukkan kebutuhan perbaikan paling tinggi.", action: React.createElement("select", { value: sortBy, onChange: (event) =>
              setSortBy(event.target.value) }, React.createElement("option", { value: "rank" }, "Urutkan: Peringkat"), React.createElement("option", { value: "score" }, "Urutkan: Skor SAW")) }), React.createElement("div", { className: "method-banner" }, React.createElement("div", { className: "method-icon" }, React.createElement(Icon, { name: "target", size: 22 })), React.createElement("div", null, React.createElement("b", null, "Simple Additive Weighting (SAW)"), React.createElement("p", null, "Semua kriteria bersifat benefit: C1 0,40 · C2 0,30 · C3 0,30.")), React.createElement("span", null, "Total bobot 1,00")), !responses.length ? (
        React.createElement("section", { className: "card" }, React.createElement(EmptyState, { onImport: openImport }))
      ) : (
        React.createElement(React.Fragment, null, React.createElement("section", { className: "ranking-visual" }, rows.slice(0, 3).map((result) => (
              React.createElement("button", { key: result.id, onClick: () => openDetail(result), className: `podium podium-${result.rank}` }, React.createElement("span", null, "Peringkat ", result.rank), React.createElement("b", null, result.shortName), React.createElement("strong", null, formatNumber(result.score, 3)), React.createElement(Status, { rank: result.rank, total: rows.length }))
            ))), React.createElement("section", { className: "card table-card wide-table ranking-table" }, React.createElement("div", { className: "card-head" }, React.createElement("div", null, React.createElement("h2", null, "Tabel Hasil SAW"), React.createElement("p", null, "Jumlah data valid dapat berbeda pada setiap fasilitas karena nilai kosong diabaikan."))), React.createElement("table", null, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Peringkat"), React.createElement("th", null, "Nama fasilitas"), React.createElement("th", null, "Rata-rata"), React.createElement("th", null, "Data valid"), React.createElement("th", null, "Kesenjangan"), React.createElement("th", null, "Rating rendah"), React.createElement("th", null, "Proporsi rendah"), React.createElement("th", null, "Skor SAW"), React.createElement("th", null, "Prioritas"), React.createElement("th", null, "Rekomendasi"))), React.createElement("tbody", null, rows.map((result) => (
                  React.createElement("tr", { key: result.id }, React.createElement("td", null, React.createElement("span", { className: `rank r${result.rank}` }, result.rank)), React.createElement("td", null, React.createElement("button", { className: "detail-btn left", onClick: () => openDetail(result) }, result.name)), React.createElement("td", null, formatNumber(result.average)), React.createElement("td", null, result.validCount), React.createElement("td", null, formatNumber(result.gap)), React.createElement("td", null, result.lowCount), React.createElement("td", null, formatNumber(result.lowProportion * 100, 1), "%"), React.createElement("td", null, React.createElement("b", { className: "score" }, formatNumber(result.score, 3))), React.createElement("td", null, React.createElement(Status, { rank: result.rank, total: rows.length })), React.createElement("td", { className: "recommendation-cell" }, result.recommendation))
                ))))))
      ))
  )
}

function SuggestionsPage({
  responses,
  openImport,
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
    React.createElement(React.Fragment, null, React.createElement(PageHeader, { title: "Saran Responden", description: "Jawaban terbuka ditampilkan apa adanya tanpa identitas pribadi." }), !responses.length ? (
        React.createElement("section", { className: "card" }, React.createElement(EmptyState, { onImport: openImport }))
      ) : (
        React.createElement(React.Fragment, null, React.createElement("div", { className: "mini-stats" }, React.createElement("div", null, React.createElement("span", null, "Jawaban terbuka"), React.createElement("b", null, suggestions.length), React.createElement("small", null, "Dari ", responses.length, " respons aktif")), React.createElement("div", null, React.createElement("span", null, "Tema teridentifikasi"), React.createElement("b", null, themes.length), React.createElement("small", null, "Berdasarkan kata yang benar-benar muncul")), React.createElement("div", null, React.createElement("span", null, "Tema terbanyak"), React.createElement("b", { className: "compact" }, themes[0]?.shortName || "—"), React.createElement("small", null, themes[0]
                  ? `${themes[0].count} saran terkait`
                  : "Belum ada tema"))), themes.length > 0 && (
            React.createElement("section", { className: "theme-grid" }, themes.map((theme) => (
                React.createElement("article", { className: "card theme-card", key: theme.id }, React.createElement("span", null, theme.count, " saran"), React.createElement("h2", null, theme.name), React.createElement("p", null, "Tema dikenali dari penyebutan kata terkait dalam jawaban asli."))
              )))
          ), React.createElement("section", { className: "card suggestion-list" }, React.createElement("div", { className: "card-head" }, React.createElement("div", null, React.createElement("h2", null, "Jawaban asli responden"), React.createElement("p", null, "Teks tidak diubah menjadi klaim atau fakta tambahan."))), suggestions.length ? (
              suggestions.map((response) => (
                React.createElement("blockquote", { key: response.id }, React.createElement("span", null, response.id), React.createElement("p", null, "“", response.suggestion, "”"))
              ))
            ) : (
              React.createElement("div", { className: "empty-inline" }, "Tidak ada jawaban terbuka pada data yang sedang digunakan.")
            )))
      ))
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
    React.createElement(React.Fragment, null, React.createElement(PageHeader, { title: "Metode Simple Additive Weighting", description: "Penjelasan kriteria, bobot, normalisasi, dan interpretasi hasil." }), React.createElement("div", { className: "criteria-grid three" }, [
          ["C1", "Kesenjangan kepuasan", "0,40"],
          ["C2", "Jumlah penilaian rendah", "0,30"],
          ["C3", "Proporsi penilaian rendah", "0,30"],
        ].map((item) => (
          React.createElement("div", { className: "criterion", key: item[0] }, React.createElement("div", null, React.createElement("span", null, item[0]), React.createElement("small", null, "Benefit")), React.createElement("b", null, item[2]), React.createElement("p", null, item[1]), React.createElement("div", { className: "weight" }, React.createElement("i", { style: { width: `${Number(item[2].replace(",", ".")) * 100}%` } })))
        ))), React.createElement("section", { className: "card formula-card" }, React.createElement("div", null, React.createElement("span", null, "Rumus normalisasi benefit"), React.createElement("b", null, "rᵢⱼ = xᵢⱼ / max(xⱼ)")), React.createElement("div", null, React.createElement("span", null, "Rumus skor akhir"), React.createElement("b", null, "Vᵢ = 0,40rᵢ₁ + 0,30rᵢ₂ + 0,30rᵢ₃")), React.createElement("div", null, React.createElement("span", null, "Total bobot"), React.createElement("b", null, "0,40 + 0,30 + 0,30 = 1,00"))), React.createElement("section", { className: "steps-grid" }, steps.map((step) => (
          React.createElement("article", { className: "card step-card", key: step[0] }, React.createElement("span", null, step[0]), React.createElement("div", null, React.createElement("h2", null, step[1]), React.createElement("p", null, step[2])))
        ))), React.createElement("div", { className: "notice" }, React.createElement(Icon, { name: "alert", size: 16 }), React.createElement("span", null, React.createElement("b", null, "Penanganan data kosong:"), " nilai kosong atau di luar skala 1–5 tidak dihitung, tidak dianggap rating rendah, dan jumlah data valid ditampilkan per fasilitas.")))
  )
}

function SettingsPage() {
  return (
    React.createElement(React.Fragment, null, React.createElement(PageHeader, { title: "Pengaturan", description: "Informasi profil dan konfigurasi metode penelitian." }), React.createElement("div", { className: "settings-grid" }, React.createElement("section", { className: "card settings-card" }, React.createElement("h2", null, "Profil Administrator"), React.createElement("div", { className: "profile-edit" }, React.createElement("div", { className: "avatar large" }, "RD"), React.createElement("div", null, React.createElement("b", null, "Richard Devin"), React.createElement("p", null, "Administrator Sistem"))), React.createElement(Field, { label: "Nama Lengkap", value: "Richard Devin" }), React.createElement(Field, { label: "Email", value: "richard.devin@junction.ac.id" }), React.createElement(Button, null, "Simpan Profil")), React.createElement("section", { className: "card settings-card" }, React.createElement("h2", null, "Konfigurasi SAW"), [
            "C1 — Kesenjangan kepuasan — 0,40",
            "C2 — Jumlah penilaian rendah — 0,30",
            "C3 — Proporsi penilaian rendah — 0,30",
          ].map((item) => (
            React.createElement("div", { className: "setting-row", key: item }, React.createElement("span", null, item), React.createElement("b", null, "Benefit"))
          )), React.createElement("div", { className: "calc-total" }, React.createElement("span", null, "Total bobot"), React.createElement("b", null, "1,00")))))
  )
}

function Field({ label, value }) {
  return (
    React.createElement("label", { className: "field" }, React.createElement("span", null, label), React.createElement("input", { defaultValue: value }))
  )
}

function FacilityDetail({
  result,
  responses,
  close,
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
    React.createElement("div", { className: "detail-page" }, React.createElement(Button, { secondary: true, icon: "back", onClick: close }, "Kembali ke dashboard"), React.createElement(PageHeader, { title: result.name, description: "Detail hasil penilaian fasilitas dan komponen perhitungan SAW." }), React.createElement("div", { className: "detail-stat-grid" }, React.createElement("div", null, React.createElement("span", null, "Rata-rata rating"), React.createElement("b", null, result.validCount ? formatNumber(result.average) : "—"), React.createElement("small", null, result.validCount, " data valid")), React.createElement("div", null, React.createElement("span", null, "Penilaian rendah"), React.createElement("b", null, result.lowCount), React.createElement("small", null, result.validCount
              ? `${formatNumber(result.lowProportion * 100, 1)}% dari data valid`
              : "Belum ada data")), React.createElement("div", null, React.createElement("span", null, "Skor SAW"), React.createElement("b", null, result.validCount ? formatNumber(result.score, 3) : "—"), React.createElement("small", null, result.rank
              ? `Peringkat ${result.rank} dari ${rankedTotal}`
              : "Belum diperingkat")), React.createElement("div", null, React.createElement("span", null, "Status prioritas"), React.createElement("b", { className: "status-value" }, result.rank ? (
              React.createElement(Status, { rank: result.rank, total: rankedTotal })
            ) : (
              "—"
            )), React.createElement("small", null, "Berdasarkan skor SAW"))), React.createElement("div", { className: "detail-layout" }, React.createElement("section", { className: "card" }, React.createElement("div", { className: "card-head" }, React.createElement("div", null, React.createElement("h2", null, "Distribusi Rating 1–5"), React.createElement("p", null, "Nilai kosong tidak disertakan"))), React.createElement("div", { className: "rating-list" }, ratings.map((count, index) => (
              React.createElement("div", { key: index }, React.createElement("span", null, index + 1), React.createElement("div", null, React.createElement("i", { style: {
                      width: `${
                        result.validCount
                          ? (count / result.validCount) * 100
                          : 0
                      }%`,
                    } })), React.createElement("b", null, count), React.createElement("small", null, result.validCount
                    ? formatNumber((count / result.validCount) * 100, 1)
                    : "0,0", "%"))
            )))), React.createElement("section", { className: "card detail-recommendation" }, React.createElement("span", null, "Rekomendasi perbaikan"), React.createElement("h2", null, result.recommendation), React.createElement("p", null, "Rekomendasi diarahkan pada aspek yang dinilai dan tidak menambahkan klaim kondisi di luar hasil survei."), React.createElement("div", { className: "saw-breakdown" }, React.createElement("div", null, React.createElement("span", null, "C1 Kesenjangan"), React.createElement("b", null, formatNumber(result.gap)), React.createElement("small", null, "Normalisasi ", formatNumber(result.normalizedGap, 3))), React.createElement("div", null, React.createElement("span", null, "C2 Rating rendah"), React.createElement("b", null, result.lowCount), React.createElement("small", null, "Normalisasi ", formatNumber(result.normalizedLowCount, 3))), React.createElement("div", null, React.createElement("span", null, "C3 Proporsi rendah"), React.createElement("b", null, formatNumber(result.lowProportion * 100, 1), "%"), React.createElement("small", null, "Normalisasi ", formatNumber(result.normalizedLowProportion, 3)))))), React.createElement("section", { className: "card suggestion-list" }, React.createElement("div", { className: "card-head" }, React.createElement("div", null, React.createElement("h2", null, "Saran terbuka yang relevan"), React.createElement("p", null, "Dipilih berdasarkan kata terkait fasilitas pada jawaban asli."))), related.length ? (
          related.map((response) => (
            React.createElement("blockquote", { key: response.id }, React.createElement("span", null, response.id), React.createElement("p", null, "“", response.suggestion, "”"))
          ))
        ) : (
          React.createElement("div", { className: "empty-inline" }, "Tidak ada saran terbuka yang relevan pada data aktif.")
        )))
  )
}

const GOOGLE_FORM_URL = "https://forms.gle/L3sV9ZR9NqPvySTa9"

function PublicHeader({
  page,
  setPage,
}) {
  return (
    React.createElement("header", { className: "public-header" }, React.createElement("button", { className: "public-brand", onClick: () => setPage("home"), "aria-label": "Kembali ke beranda" }, React.createElement("span", null, "J"), React.createElement("div", null, React.createElement("b", null, "Junction"), React.createElement("small", null, "Campus Experience"))), React.createElement("nav", { className: "public-nav", "aria-label": "Navigasi publik" }, React.createElement("button", { className: page === "home" ? "active" : "", onClick: () => setPage("home") }, "Beranda"), React.createElement("button", { className: page === "results" ? "active" : "", onClick: () => setPage("results") }, "Hasil Analisis"), React.createElement("button", { className: page === "survey" ? "active" : "", onClick: () => setPage("survey") }, "Isi Survei")), React.createElement("button", { className: "admin-login-link", onClick: () => setPage("login") }, React.createElement(Icon, { name: "lock", size: 15 }), " Login Admin"))
  )
}

function PublicHome({
  setPage,
  results,
  responseCount,
}) {
  const rankedResults = results.filter((result) => result.validCount > 0)
  const topResult = rankedResults[0]
  return (
    React.createElement("div", { className: "public-page" }, React.createElement(PublicHeader, { page: "home", setPage: setPage }), React.createElement("main", null, React.createElement("section", { className: "public-hero" }, React.createElement("div", { className: "hero-copy" }, React.createElement("span", { className: "eyebrow" }, React.createElement("i", null), " Suara Anda, perubahan untuk kita"), React.createElement("h1", null, "Bantu kami membuat", React.createElement("br", null), React.createElement("em", null, "Kampus Junction"), React.createElement("br", null), "lebih nyaman."), React.createElement("p", null, "Bagikan pengalaman Anda menggunakan fasilitas Kampus Junction. Setiap jawaban menjadi dasar evaluasi untuk menentukan prioritas perbaikan yang tepat."), React.createElement("div", { className: "hero-actions" }, React.createElement("button", { className: "public-primary", onClick: () => setPage("survey") }, "Isi survei sekarang ", React.createElement(Icon, { name: "arrow", size: 17 })), React.createElement("span", null, React.createElement(Icon, { name: "shield", size: 17 }), React.createElement("b", null, "Anonim & aman"), React.createElement("small", null, "Hanya membutuhkan ±3 menit")))), React.createElement("div", { className: "hero-visual", "aria-label": "Ringkasan survei fasilitas" }, React.createElement("div", { className: "visual-orbit orbit-one" }), React.createElement("div", { className: "visual-orbit orbit-two" }), React.createElement("div", { className: "junction-building" }, React.createElement("span", null, "J"), React.createElement("div", null), React.createElement("div", null), React.createElement("div", null)), React.createElement("article", { className: "float-card response-card" }, React.createElement("span", null, React.createElement(Icon, { name: "form", size: 17 })), React.createElement("div", null, React.createElement("b", null, "14 aspek"), React.createElement("small", null, "fasilitas dinilai"))), React.createElement("article", { className: "float-card method-card" }, React.createElement("span", null, React.createElement(Icon, { name: "target", size: 17 })), React.createElement("div", null, React.createElement("b", null, "Metode SAW"), React.createElement("small", null, "prioritas objektif"))))), React.createElement("section", { className: "public-stats" }, React.createElement("div", null, React.createElement("b", null, "14"), React.createElement("span", null, "Aspek fasilitas")), React.createElement("div", null, React.createElement("b", null, "3"), React.createElement("span", null, "Kriteria analisis")), React.createElement("div", null, React.createElement("b", null, "100%"), React.createElement("span", null, "Respons anonim")), React.createElement("p", null, "Data survei dianalisis dengan metode", " ", React.createElement("strong", null, "Simple Additive Weighting"), " untuk menemukan fasilitas yang paling membutuhkan perhatian.")), React.createElement("section", { className: "public-results-section" }, React.createElement("div", { className: "public-section-heading" }, React.createElement("div", null, React.createElement("span", { className: "section-kicker" }, "Hasil perhitungan SPK"), React.createElement("h2", null, "Prioritas perbaikan fasilitas"), React.createElement("p", null, "Peringkat dihitung menggunakan metode SAW dari kesenjangan kepuasan, jumlah penilaian rendah, dan proporsi penilaian rendah.")), React.createElement("button", { className: "public-outline", onClick: () => setPage("results") }, "Lihat hasil lengkap ", React.createElement(Icon, { name: "arrow", size: 16 }))), rankedResults.length ? (
            React.createElement(React.Fragment, null, React.createElement("div", { className: "public-result-summary" }, React.createElement("span", { className: "summary-rank" }, "01"), React.createElement("div", null, React.createElement("small", null, "Prioritas perbaikan tertinggi"), React.createElement("h3", null, topResult.name), React.createElement("p", null, topResult.recommendation)), React.createElement("div", { className: "summary-score" }, React.createElement("small", null, "Skor SAW"), React.createElement("b", null, formatNumber(topResult.score, 3)), React.createElement("span", null, responseCount, " responden"))), React.createElement("div", { className: "public-ranking-preview" }, rankedResults.slice(0, 3).map((result) => (
                  React.createElement("article", { key: result.id }, React.createElement("div", { className: "preview-rank" }, React.createElement("span", null, "Peringkat"), React.createElement("b", null, String(result.rank).padStart(2, "0"))), React.createElement("div", { className: "preview-result-copy" }, React.createElement("h3", null, result.name), React.createElement("div", null, React.createElement("span", null, "Rata-rata ", formatNumber(result.average)), React.createElement("span", null, result.lowCount, " rating rendah"))), React.createElement("strong", null, formatNumber(result.score, 3)))
                ))))
          ) : (
            React.createElement("div", { className: "public-results-empty" }, React.createElement("span", null, React.createElement(Icon, { name: "target", size: 25 })), React.createElement("div", null, React.createElement("h3", null, "Hasil analisis belum dipublikasikan"), React.createElement("p", null, "Peringkat fasilitas akan tampil setelah data kuesioner diimpor dan dihitung oleh administrator.")))
          )), React.createElement("section", { className: "how-section" }, React.createElement("span", { className: "section-kicker" }, "Cara berpartisipasi"), React.createElement("h2", null, "Tiga langkah sederhana untuk ikut berkontribusi"), React.createElement("div", { className: "how-grid" }, [
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
              React.createElement("article", { key: item[0] }, React.createElement("span", { className: "step-number" }, item[0]), React.createElement("i", null, React.createElement(Icon, { name: item[3], size: 22 })), React.createElement("h3", null, item[1]), React.createElement("p", null, item[2]))
            ))))), React.createElement("footer", { className: "public-footer" }, React.createElement("b", null, "Junction Analytics"), React.createElement("span", null, "Proyek analisis kepuasan fasilitas kampus")))
  )
}

function PublicResultsPage({
  setPage,
  results,
  responseCount,
}) {
  const rankedResults = results.filter((result) => result.validCount > 0)
  return (
    React.createElement("div", { className: "public-page public-results-page" }, React.createElement(PublicHeader, { page: "results", setPage: setPage }), React.createElement("main", null, React.createElement("section", { className: "results-hero" }, React.createElement("button", { className: "back-link", onClick: () => setPage("home") }, React.createElement(Icon, { name: "back", size: 17 }), " Kembali ke beranda"), React.createElement("div", null, React.createElement("span", { className: "section-kicker" }, "Hasil analisis fasilitas"), React.createElement("h1", null, "Peringkat prioritas", React.createElement("br", null), React.createElement("em", null, "perbaikan kampus.")), React.createElement("p", null, "Skor tertinggi menunjukkan fasilitas yang paling membutuhkan perhatian berdasarkan hasil perhitungan Simple Additive Weighting.")), React.createElement("aside", null, React.createElement("div", null, React.createElement("b", null, responseCount || "—"), React.createElement("span", null, "Respons dianalisis")), React.createElement("div", null, React.createElement("b", null, rankedResults.length || "—"), React.createElement("span", null, "Fasilitas diperingkat")), React.createElement("div", null, React.createElement("b", null, "1,00"), React.createElement("span", null, "Total bobot SAW")))), React.createElement("section", { className: "public-results-content" }, React.createElement("div", { className: "public-method-note" }, React.createElement(Icon, { name: "target", size: 21 }), React.createElement("div", null, React.createElement("b", null, "Simple Additive Weighting (SAW)"), React.createElement("p", null, "C1 Kesenjangan kepuasan 0,40 · C2 Jumlah penilaian rendah 0,30 · C3 Proporsi penilaian rendah 0,30"))), rankedResults.length ? (
            React.createElement("div", { className: "public-results-table-wrap" }, React.createElement("table", { className: "public-results-table" }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Peringkat"), React.createElement("th", null, "Fasilitas"), React.createElement("th", null, "Rata-rata"), React.createElement("th", null, "Kesenjangan"), React.createElement("th", null, "Rating rendah"), React.createElement("th", null, "Proporsi"), React.createElement("th", null, "Skor SAW"))), React.createElement("tbody", null, rankedResults.map((result) => (
                    React.createElement("tr", { key: result.id }, React.createElement("td", null, React.createElement("span", { className: `public-rank rank-${result.rank}` }, String(result.rank).padStart(2, "0"))), React.createElement("td", null, React.createElement("b", null, result.name), React.createElement("small", null, result.recommendation)), React.createElement("td", null, formatNumber(result.average)), React.createElement("td", null, formatNumber(result.gap)), React.createElement("td", null, result.lowCount, " dari ", result.validCount), React.createElement("td", null, formatNumber(result.lowProportion * 100, 1), "%"), React.createElement("td", null, React.createElement("strong", null, formatNumber(result.score, 3))))
                  )))))
          ) : (
            React.createElement("div", { className: "public-results-empty detail-empty" }, React.createElement("span", null, React.createElement(Icon, { name: "target", size: 28 })), React.createElement("div", null, React.createElement("h3", null, "Belum ada hasil yang dapat ditampilkan"), React.createElement("p", null, "Administrator perlu mengimpor CSV Google Forms terlebih dahulu. Halaman ini tidak menggunakan angka simulasi.")))
          ))), React.createElement("footer", { className: "public-footer" }, React.createElement("b", null, "Junction Analytics"), React.createElement("span", null, "Hasil publik analisis kepuasan fasilitas")))
  )
}

function SurveyQrPage({ setPage }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(GOOGLE_FORM_URL)}`
  return (
    React.createElement("div", { className: "public-page qr-page" }, React.createElement(PublicHeader, { page: "survey", setPage: setPage }), React.createElement("main", { className: "qr-main" }, React.createElement("button", { className: "back-link", onClick: () => setPage("home") }, React.createElement(Icon, { name: "back", size: 17 }), " Kembali ke beranda"), React.createElement("section", { className: "qr-layout" }, React.createElement("div", { className: "qr-copy" }, React.createElement("span", { className: "section-kicker" }, "Survei kepuasan fasilitas"), React.createElement("h1", null, "Pindai. Isi.", React.createElement("br", null), React.createElement("em", null, "Beri dampak.")), React.createElement("p", null, "Arahkan kamera ponsel Anda ke QR code untuk membuka formulir survei Google Forms."), React.createElement("ul", null, React.createElement("li", null, React.createElement(Icon, { name: "shield", size: 18 }), React.createElement("span", null, React.createElement("b", null, "Respons sepenuhnya anonim"), React.createElement("small", null, "Identitas pribadi tidak ditampilkan dalam analisis."))), React.createElement("li", null, React.createElement(Icon, { name: "form", size: 18 }), React.createElement("span", null, React.createElement("b", null, "14 pertanyaan singkat"), React.createElement("small", null, "Estimasi waktu pengisian sekitar 3 menit."))))), React.createElement("article", { className: "qr-card" }, React.createElement("div", { className: "qr-code" }, React.createElement("img", { src: qrUrl, alt: "QR code menuju Google Form survei" })), React.createElement("h2", null, "Scan untuk mulai mengisi"), React.createElement("p", null, "Gunakan kamera atau aplikasi pemindai QR di ponsel Anda."), React.createElement("div", { className: "or-divider" }, React.createElement("span", null, "atau")), React.createElement("a", { className: "public-primary", href: GOOGLE_FORM_URL, target: "_blank", rel: "noreferrer" }, "Buka Google Form ", React.createElement(Icon, { name: "arrow", size: 17 })), React.createElement("small", { className: "prototype-note" }, "Tautan formulir dapat diganti dengan URL Google Form penelitian.")))))
  )
}

function LoginPage({
  setPage,
  onLogin,
}) {
  const [showPassword, setShowPassword] = useState(false)
  return (
    React.createElement("div", { className: "login-page" }, React.createElement("section", { className: "login-aside" }, React.createElement("button", { className: "public-brand light", onClick: () => setPage("home") }, React.createElement("span", null, "J"), React.createElement("div", null, React.createElement("b", null, "Junction"), React.createElement("small", null, "Analytics"))), React.createElement("div", null, React.createElement("span", { className: "eyebrow dark" }, React.createElement("i", null), " Portal administrator"), React.createElement("h1", null, "Ubah data menjadi", React.createElement("br", null), React.createElement("em", null, "prioritas perbaikan.")), React.createElement("p", null, "Kelola respons survei dan lihat hasil analisis SAW fasilitas Kampus Junction dalam satu dashboard.")), React.createElement("small", null, "Junction Analytics · Prototype Proyek Akhir")), React.createElement("main", { className: "login-main" }, React.createElement("button", { className: "back-link", onClick: () => setPage("home") }, React.createElement(Icon, { name: "back", size: 17 }), " Kembali ke beranda"), React.createElement("form", { className: "login-card", onSubmit: (event) => {
            event.preventDefault()
            onLogin()
          } }, React.createElement("span", { className: "login-icon" }, React.createElement(Icon, { name: "lock", size: 23 })), React.createElement("h2", null, "Selamat datang kembali"), React.createElement("p", null, "Masuk untuk mengakses dashboard analisis."), React.createElement("label", null, React.createElement("span", null, "Email atau nama pengguna"), React.createElement("input", { required: true, placeholder: "Masukkan email atau username", autoComplete: "username" })), React.createElement("label", null, React.createElement("span", null, "Kata sandi"), React.createElement("div", { className: "password-field" }, React.createElement("input", { required: true, type: showPassword ? "text" : "password", placeholder: "Masukkan kata sandi", autoComplete: "current-password" }), React.createElement("button", { type: "button", onClick: () => setShowPassword((value) => !value), "aria-label": "Tampilkan atau sembunyikan kata sandi" }, React.createElement(Icon, { name: "eye", size: 18 })))), React.createElement("div", { className: "login-options" }, React.createElement("label", null, React.createElement("input", { type: "checkbox" }), " Ingat saya"), React.createElement("button", { type: "button" }, "Lupa kata sandi?")), React.createElement("button", { className: "public-primary login-submit", type: "submit" }, "Masuk ke Dashboard ", React.createElement(Icon, { name: "arrow", size: 17 })), React.createElement("div", { className: "demo-notice" }, React.createElement(Icon, { name: "alert", size: 16 }), React.createElement("span", null, React.createElement("b", null, "Mode prototipe"), " — isi kredensial apa pun untuk masuk.")))))
  )
}

function App() {
  const [publicPage, setPublicPage] = useState("home")
  const [isAdmin, setIsAdmin] = useState(false)
  const [page, setPage] = useState("Dashboard")
  const [allResponses, setAllResponses] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [selected, setSelected] = useState(null)
  const [importMessage, setImportMessage] = useState(null)
  const fileInput = useRef(null)
  const responses = useMemo(
    () =>
      allResponses.filter((response) =>
        Object.entries(filters).every(
          ([key, value]) =>
            !value || response[(key)] === value,
        ),
      ),
    [allResponses, filters],
  )
  const results = useMemo(() => analyze(responses), [responses])
  const publicResults = useMemo(() => analyze(allResponses), [allResponses])

  function openImport() {
    fileInput.current?.click()
  }

  async function handleImport(file) {
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

  function openDetail(result) {
    setSelected(result)
  }

  if (!isAdmin) {
    if (publicPage === "survey") return React.createElement(SurveyQrPage, { setPage: setPublicPage })
    if (publicPage === "results")
      return (
        React.createElement(PublicResultsPage, { setPage: setPublicPage, results: publicResults, responseCount: allResponses.length })
      )
    if (publicPage === "login")
      return (
        React.createElement(LoginPage, { setPage: setPublicPage, onLogin: () => setIsAdmin(true) })
      )
    return (
      React.createElement(PublicHome, { setPage: setPublicPage, results: publicResults, responseCount: allResponses.length })
    )
  }

  const content = selected ? (
    React.createElement(FacilityDetail, { result: selected, responses: responses, close: () => {
        setSelected(null)
        setPage("Dashboard")
      } })
  ) : page === "Dashboard" ? (
    React.createElement(Dashboard, { responses: responses, results: results, filters: filters, setFilters: setFilters, setPage: setPage, openImport: openImport, openDetail: openDetail })
  ) : page === "Data Kuesioner" ? (
    React.createElement(QuestionnairePage, { allResponses: allResponses, responses: responses, openImport: openImport })
  ) : page === "Hasil SAW" ? (
    React.createElement(ResultsPage, { responses: responses, results: results, openImport: openImport, openDetail: openDetail })
  ) : page === "Saran Responden" ? (
    React.createElement(SuggestionsPage, { responses: responses, openImport: openImport })
  ) : page === "Metode SAW" ? (
    React.createElement(MethodPage, null)
  ) : (
    React.createElement(SettingsPage, null)
  )

  return (
    React.createElement("div", { className: "app-shell" }, React.createElement("input", { ref: fileInput, className: "file-input", type: "file", accept: ".csv,text/csv", onChange: (event) => {
          void handleImport(event.target.files?.[0])
          event.target.value = ""
        } }), React.createElement("aside", { className: "sidebar" }, React.createElement("div", { className: "brand" }, React.createElement("span", { className: "brand-mark" }, "J"), React.createElement("div", null, React.createElement("b", null, "Junction"), React.createElement("small", null, "Analytics"))), React.createElement("div", { className: "nav-label" }, "MENU UTAMA"), React.createElement("nav", null, navItems.map((item) => (
            React.createElement("button", { key: item.label, className: !selected && page === item.label ? "active" : "", onClick: () => {
                setSelected(null)
                setPage(item.label)
              } }, React.createElement(Icon, { name: item.icon }), React.createElement("span", null, item.label), !selected && page === item.label && React.createElement("i", null))
          ))), React.createElement("div", { className: "sidebar-foot" }, React.createElement("div", { className: "system-status data-status" }, React.createElement("i", null), React.createElement("div", null, React.createElement("b", null, "Data lokal browser"), React.createElement("span", null, allResponses.length
                  ? `${allResponses.length} respons dimuat`
                  : "CSV belum dimuat"))), React.createElement("p", null, "Junction Analytics v1.0", React.createElement("br", null), "Prototype Proyek Akhir"))), React.createElement("main", { className: "main" }, React.createElement("header", null, React.createElement("div", { className: "breadcrumb" }, React.createElement("span", null, "Junction Analytics"), React.createElement(Icon, { name: "chevron", size: 14 }), React.createElement("b", null, selected ? "Detail Fasilitas" : page)), React.createElement("div", { className: "header-right" }, React.createElement("button", { className: "icon-btn notification" }, React.createElement(Icon, { name: "bell" })), React.createElement("div", { className: "divider" }), React.createElement("div", { className: "profile" }, React.createElement("div", { className: "avatar" }, "RD"), React.createElement("div", null, React.createElement("b", null, "Richard Devin"), React.createElement("span", null, "Administrator"))), React.createElement("button", { className: "admin-logout", onClick: () => {
                setIsAdmin(false)
                setPublicPage("home")
              } }, "Keluar"))), React.createElement("div", { className: "content" }, importMessage && (
            React.createElement("div", { className: `import-toast ${importMessage.tone}` }, React.createElement("div", null, React.createElement("b", null, importMessage.title), React.createElement("ul", null, importMessage.details.map((detail) => (
                    React.createElement("li", { key: detail }, detail)
                  )))), React.createElement("button", { onClick: () => setImportMessage(null) }, React.createElement(Icon, { name: "close", size: 15 })))
          ), content)))
  )
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
