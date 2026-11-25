export type Page = "Dashboard" | "Data Kuesioner" | "Hasil SAW" | "Saran Responden"
export type PublicPage = "home" | "survey" | "results" | "login"
export type Rating = 1 | 2 | 3 | 4 | 5

export type Facility = {
  id: string
  name: string
  shortName: string
  keywords: string[]
  recommendation: string
}

export type SurveyResponse = {
  id: string
  faculty: string
  program: string
  gender: string
  cohort: string
  frequency: string
  ratings: Partial<Record<string, Rating>>
  suggestion: string
  photoUrls: string[]
}

export type Filters = {
  faculty: string
  program: string
  gender: string
  cohort: string
  frequency: string
}

export type FacilityResult = Facility & {
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

export type ImportResult = {
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

export type ImportNotice = {
  tone: "success" | "warning" | "error"
  title: string
  details: string[]
}
