
export interface FacilityCriterion {
  name: string;
  average: number;
  totalRatings: number;
}

export interface PublicSummary {
  totalResponses: number;
  criteria: FacilityCriterion[];
}

const API_URL = import.meta.env.VITE_PUBLIC_SHEETS_API_URL;

export async function getPublicSummary(): Promise<PublicSummary> {
  if (!API_URL) {
    throw new Error("URL Google Sheets API belum diatur.");
  }

  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Gagal mengambil data Google Spreadsheet.");
  }

  return response.json() as Promise<PublicSummary>;
}
