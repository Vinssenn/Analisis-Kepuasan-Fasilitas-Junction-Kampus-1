
const API_URL = import.meta.env.VITE_PUBLIC_SHEETS_API_URL;

export async function getSpreadsheetCSV(): Promise<string> {
  if (!API_URL) {
    throw new Error("URL Google Sheets API belum diatur.");
  }

  const response = await fetch(API_URL, {
    // Hindari mengambil respons lama dari cache browser saat sinkronisasi ulang.
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data Google Spreadsheet.");
  }

  const data = await response.json();

  if (!data.csv) {
    throw new Error("Data Google Spreadsheet kosong.");
  }

  return data.csv;
}
