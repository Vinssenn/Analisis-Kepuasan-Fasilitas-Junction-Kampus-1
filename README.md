# Junction Analytics — PHP Native

Project ini merupakan konversi dari prototype Figma Make (React/Vite) menjadi PHP Native, JavaScript, CSS, dan MySQL.

## Fitur
### Area pengguna
- Homepage dengan navigasi atas
- Laporan data dan ringkasan perhitungan SAW
- Formulir isi survei dengan 14 aspek fasilitas
- Login administrator

### Area administrator
- Dashboard ringkasan data
- Data Kuesioner (lihat respons, impor CSV, hapus respons)
- Saran Responden
- Pengaturan dan bobot SAW

## Instalasi di XAMPP
1. Ekstrak folder `Junction-Analytics-PHP` ke `C:\xampp\htdocs\`.
2. Jalankan Apache dan MySQL dari XAMPP.
3. Buka phpMyAdmin: `http://localhost/phpmyadmin`.
4. Import file `database/schema.sql`.
5. Periksa pengaturan database di `config/config.php` (default XAMPP: user `root`, password kosong).
6. Buat hash password admin dari Command Prompt pada folder project:
   ```bash
   php -r "echo password_hash('Admin123!', PASSWORD_DEFAULT), PHP_EOL;"
   ```
7. Salin hasil hash, lalu jalankan SQL berikut di phpMyAdmin (ganti HASH_HASIL):
   ```sql
   INSERT INTO admins(name,email,password_hash)
   VALUES('Administrator','admin@junction.local','HASH_HASIL');
   ```
8. Buka `http://localhost/Junction-Analytics-PHP/`.

Login awal setelah akun dibuat:
- Email: `admin@junction.local`
- Password: `Admin123!`

Segera ganti password contoh tersebut setelah instalasi.

## Membaca data yang sudah ada di database
- Halaman laporan dan dashboard sekarang memeriksa tabel yang memiliki kolom rating fasilitas.
- Kolom rating yang didukung: `rating_1` sampai `rating_14`, `C1` sampai `C14`, atau nama kolom aspek fasilitas seperti “Kapasitas tempat duduk” dan “Kenyamanan kursi”.
- Nama tabel `responses` akan diprioritaskan. Jika tidak ada, aplikasi mencoba tabel lain yang memiliki minimal 5 kolom kriteria yang dikenali.
- Kolom identitas yang dikenali antara lain `respondent_code`/`kode_responden`, `faculty`/`fakultas`, `program`/`prodi`, `cohort`/`angkatan`, `suggestion`/`saran`, dan `created_at`/`tanggal`.
- Pastikan `DB_NAME` pada `config/config.php` sama persis dengan nama database tempat data manual dimasukkan. Aplikasi tidak dapat membaca database lain yang berbeda dari konfigurasi tersebut.
- Jika nama kolom rating di database berbeda jauh dari daftar di atas, kirim screenshot tab **Structure/Struktur** tabel dan nama database di phpMyAdmin agar pemetaan dapat disesuaikan.

## Catatan konversi
- Tampilan dasar memakai stylesheet dari project Figma Make, kemudian ditambahkan struktur halaman PHP.
- Sistem autentikasi menggunakan session PHP dan `password_verify`.
- Respons survei disimpan ke MySQL, bukan hanya localStorage browser.
- Impor CSV menerima kolom berkode C1–C14 atau nama aspek fasilitas. Format CSV perlu dicek setelah impor karena format sumber dapat berbeda.
- Data survei yang sudah ada pada browser/prototype tidak otomatis dipindahkan. Gunakan impor CSV dari dashboard admin atau pastikan tabel database yang digunakan memiliki kolom yang dikenali.
- Perhitungan SAW mengikuti bobot dari prototype: gap 0,40; jumlah rating rendah 0,30; proporsi rating rendah 0,30. Rating rendah adalah nilai 1 atau 2.
- Untuk produksi, gunakan HTTPS, ganti kredensial database, tambahkan pembatasan akses dan validasi impor CSV lebih ketat.


## Integrasi Google Forms → Google Sheets

Website dapat membaca respons Google Forms langsung dari spreadsheet jawaban. Setiap kali halaman Homepage, Laporan Data, Dashboard, Data Kuesioner, atau Saran Responden dibuka, PHP mengambil nilai terbaru dari Google Sheets API. Tombol **Perbarui data** melakukan permintaan ulang (tidak menggunakan cache aplikasi). Spreadsheet menjadi sumber baca; website tidak mengubah atau menghapus isi Google Sheets.

### 1. Siapkan Google Sheets API
1. Buka Google Cloud Console dan pilih/buat project.
2. Aktifkan **Google Sheets API**.
3. Buat **Service Account**, lalu buat key JSON untuk service account tersebut.
4. Unduh file JSON dan simpan sebagai `config/google-service-account.json` di folder project. Jangan unggah file ini ke GitHub atau bagikan ke orang lain.
5. Buka spreadsheet jawaban Google Forms, tekan **Bagikan**, lalu tambahkan email service account (nilai `client_email` di JSON) sebagai **Viewer/Pembaca**.
6. Ambil Spreadsheet ID dari URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.

### 2. Atur konfigurasi
Edit bagian Google Sheets pada `config/config.php`:

```php
const GOOGLE_SHEETS_ENABLED = true;
const GOOGLE_SHEET_ID = 'ISI_ID_SPREADSHEET_DI_SINI';
const GOOGLE_SHEET_RANGE = 'Form Responses 1!A:ZZ';
```

Ganti `GOOGLE_SHEET_ID` dengan ID spreadsheet. Sesuaikan `GOOGLE_SHEET_RANGE` dengan nama tab jawaban Google Forms yang sebenarnya, misalnya `Form Responses 1!A:ZZ` atau `Tanggapan Formulir 1!A:ZZ`.

Pastikan ekstensi PHP **curl** dan **openssl** aktif di `php.ini`, lalu restart Apache. PHP perlu akses internet agar dapat meminta token dan membaca Google Sheets API.

### 3. Format kolom spreadsheet
Baris pertama harus berisi judul kolom. Pemetaan rating mendukung kode `C1` sampai `C14`, `rating_1` sampai `rating_14`, atau nama aspek fasilitas yang dikenali aplikasi. Kolom metadata yang dikenali antara lain Timestamp, Peran/Role, Fakultas, Program Studi/Prodi, Jenis Kelamin/Gender, Angkatan, Frekuensi Kunjungan, dan Saran/Masukan.

Nilai rating sebaiknya berupa angka 1–5. Nilai seperti `4 - Puas` juga dikenali. Baris tanpa rating yang valid akan dilewati. Nama header yang tidak sesuai perlu disesuaikan berdasarkan baris header spreadsheet.

### Catatan penting
- Integrasi menggunakan Google Sheets API dan service account, bukan link CSV publik. Spreadsheet tetap privat dan hanya dibagikan ke email service account.
- Jangan mengirim file `google-service-account.json` ke chat atau menyimpannya di repositori publik.
- Data dari Google Sheets dibaca sebagai sumber utama saat `GOOGLE_SHEETS_ENABLED = true`; MySQL tetap digunakan untuk akun admin. Pengiriman survei dari form website saat ini masih menyimpan ke tabel MySQL, bukan menulis kembali ke Google Sheets.
- Saya belum dapat menguji koneksi ke spreadsheet milikmu karena Spreadsheet ID, nama tab, dan file kredensial belum tersedia. Header spreadsheet juga perlu dicocokkan agar semua kolom metadata dan 14 rating terbaca tepat.
