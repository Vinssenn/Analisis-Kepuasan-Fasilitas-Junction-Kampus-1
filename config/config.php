<?php
declare(strict_types=1);
session_start();

const DB_HOST = 'localhost';
const DB_NAME = 'junction_analytics';
const DB_USER = 'root';
const DB_PASS = '';

// Integrasi Google Sheets: aktifkan setelah service account disiapkan.
const GOOGLE_SHEETS_ENABLED = true;
const GOOGLE_SHEET_ID = 'ISI_ID_SPREADSHEET_DI_SINI';
const GOOGLE_SHEET_RANGE = 'Form Responses 1!A:ZZ';
const GOOGLE_SERVICE_ACCOUNT_FILE = __DIR__ . '/google-service-account.json';

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $pdo = new PDO(
        'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    return $pdo;
}
function e(mixed $v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function redirect(string $url): never { header('Location: '.$url); exit; }
function csrf_token(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}
function verify_csrf(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        http_response_code(419); exit('Sesi formulir tidak valid. Muat ulang halaman dan coba lagi.');
    }
}
function is_admin(): bool { return !empty($_SESSION['admin_id']); }
function require_admin(): void { if (!is_admin()) redirect('index.php?page=login'); }
function facilities(): array {
    return [
        ['C1','Kapasitas tempat duduk','Kapasitas duduk','Evaluasi kebutuhan penambahan tempat duduk berdasarkan pola kepadatan dan ruang yang tersedia.'],
        ['C2','Kenyamanan kursi','Kenyamanan kursi','Periksa kondisi ergonomi kursi dan prioritaskan perbaikan atau penggantian unit yang tidak nyaman.'],
        ['C3','Tingkat pencahayaan','Pencahayaan','Audit pemerataan pencahayaan dan perbaiki titik yang redup tanpa menimbulkan silau.'],
        ['C4','Ukuran meja','Ukuran meja','Tinjau ukuran meja agar memadai untuk aktivitas belajar dan penggunaan perangkat.'],
        ['C5','Jarak antar meja dan ruang gerak','Jarak meja','Atur ulang tata letak meja untuk memperbaiki sirkulasi dan ruang gerak pengguna.'],
        ['C6','Sirkulasi udara atau suhu ruangan','Sirkulasi udara','Periksa ventilasi dan pengaturan suhu pada area yang paling sering dinilai kurang nyaman.'],
        ['C7','Kualitas dan kestabilan Wi-Fi','Wi-Fi','Audit kestabilan jaringan dan cakupan akses pada area dengan keluhan koneksi.'],
        ['C8','Jumlah stopkontak','Jumlah stopkontak','Petakan kebutuhan daya dan pertimbangkan penambahan stopkontak yang aman di titik penggunaan tinggi.'],
        ['C9','Kemudahan menjangkau stopkontak','Akses stopkontak','Perbaiki penempatan atau akses stopkontak agar dapat dijangkau tanpa mengganggu jalur sirkulasi.'],
        ['C10','Tingkat kebisingan','Kebisingan','Identifikasi sumber kebisingan dan terapkan pengaturan zona atau peredaman yang sesuai.'],
        ['C11','Kebersihan meja, kursi, dan lantai','Kebersihan area','Tingkatkan pemeriksaan kebersihan meja, kursi, dan lantai pada jadwal penggunaan padat.'],
        ['C12','Ketersediaan tempat sampah dan kondisi kebersihannya','Tempat sampah','Evaluasi jumlah, lokasi, dan jadwal pengosongan tempat sampah agar area tetap bersih.'],
        ['C13','Akses ke fasilitas pendukung, seperti toilet dan kantin','Akses pendukung','Perjelas akses dan petunjuk menuju toilet, kantin, serta fasilitas pendukung lain.'],
        ['C14','Keamanan barang bawaan pengguna','Keamanan barang','Tinjau pengawasan area dan sarana penyimpanan untuk membantu keamanan barang pengguna.'],
    ];
}
function normalize_column_name(string $value): string {
    $value = strtolower($value);
    $value = str_replace(['wi-fi', 'wi fi', 'wifi'], 'wifi', $value);
    return preg_replace('/[^a-z0-9]+/u', '', $value) ?? '';
}

/** Cari kolom rating pada tabel yang sudah dibuat pengguna. Mendukung rating_1, C1,
 * nama aspek lengkap, dan variasi header dari file kuesioner. */
function response_column_map(array $columns): array {
    $normalized = [];
    foreach ($columns as $column) $normalized[normalize_column_name($column)] = $column;
    $aliases = [
      1=>['rating1','c1','kapasitas tempat duduk','kapasitas tempat duduk selalu mencukupi'],
      2=>['rating2','c2','kenyamanan kursi','kursi nyaman digunakan'],
      3=>['rating3','c3','tingkat pencahayaan','pencahayaan memadai'],
      4=>['rating4','c4','ukuran meja'],
      5=>['rating5','c5','jarak antar meja','ruang gerak antar meja'],
      6=>['rating6','c6','sirkulasi udara','suhu ruangan'],
      7=>['rating7','c7','kualitas dan kestabilan wifi','koneksi wifi'],
      8=>['rating8','c8','jumlah stopkontak'],
      9=>['rating9','c9','kemudahan menjangkau stopkontak'],
      10=>['rating10','c10','tingkat kebisingan'],
      11=>['rating11','c11','kebersihan meja kursi dan lantai'],
      12=>['rating12','c12','ketersediaan tempat sampah','tempat sampah tersedia'],
      13=>['rating13','c13','akses ke fasilitas pendukung','akses fasilitas pendukung'],
      14=>['rating14','c14','keamanan barang bawaan pengguna','keamanan barang bawaan'],
    ];
    $map = [];
    foreach ($aliases as $number=>$names) {
      foreach ($names as $alias) {
        $key = normalize_column_name($alias);
        if (isset($normalized[$key])) { $map[$number] = $normalized[$key]; break; }
        foreach ($columns as $column) {
          $columnKey = normalize_column_name((string)$column);
          if (strlen($key) >= 5 && str_contains($columnKey, $key)) { $map[$number] = $column; break 2; }
        }
      }
      if (!isset($map[$number])) {
        foreach ($columns as $column) {
          $key = normalize_column_name((string)$column);
          if (str_starts_with($key, 'rating'.$number) || $key === 'c'.$number) { $map[$number] = $column; break; }
        }
      }
    }
    return $map;
}

/** Membuat access token OAuth untuk Google Sheets API memakai service account. */
function google_sheets_access_token(): string {
    if (!extension_loaded('openssl') || !function_exists('curl_init')) throw new RuntimeException('Aktifkan ekstensi PHP OpenSSL dan cURL.');
    if (!is_file(GOOGLE_SERVICE_ACCOUNT_FILE)) throw new RuntimeException('File config/google-service-account.json belum tersedia.');
    $account = json_decode((string)file_get_contents(GOOGLE_SERVICE_ACCOUNT_FILE), true);
    if (!is_array($account) || empty($account['client_email']) || empty($account['private_key'])) throw new RuntimeException('File service account JSON tidak valid.');
    $b64 = fn(string $v): string => rtrim(strtr(base64_encode($v), '+/', '-_'), '=');
    $now=time(); $unsigned=$b64(json_encode(['alg'=>'RS256','typ'=>'JWT'])).'.'.$b64(json_encode([
      'iss'=>$account['client_email'],'scope'=>'https://www.googleapis.com/auth/spreadsheets.readonly',
      'aud'=>'https://oauth2.googleapis.com/token','iat'=>$now,'exp'=>$now+3600
    ]));
    $signature=''; if(!openssl_sign($unsigned,$signature,$account['private_key'],OPENSSL_ALGO_SHA256)) throw new RuntimeException('Gagal membuat tanda tangan OAuth Google.');
    $ch=curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query(['grant_type'=>'urn:ietf:params:oauth:grant-type:jwt-bearer','assertion'=>$unsigned.'.'.$b64($signature)]),CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>20]);
    $body=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);$error=curl_error($ch);curl_close($ch);
    if($body===false||$status<200||$status>=300) throw new RuntimeException('Autentikasi Google gagal (HTTP '.$status.'). '.($error?: (string)$body));
    $data=json_decode((string)$body,true);if(empty($data['access_token']))throw new RuntimeException('Access token Google tidak ditemukan.');return $data['access_token'];
}

/** Mengambil data Google Forms yang tersimpan di Google Sheets. Baris pertama = header. */
function get_responses_from_google_sheets(): array {
    if(GOOGLE_SHEET_ID===''||GOOGLE_SHEET_ID==='ISI_ID_SPREADSHEET_DI_SINI') throw new RuntimeException('Isi GOOGLE_SHEET_ID pada config/config.php.');
    $url='https://sheets.googleapis.com/v4/spreadsheets/'.rawurlencode(GOOGLE_SHEET_ID).'/values/'.rawurlencode(GOOGLE_SHEET_RANGE).'?valueRenderOption=UNFORMATTED_VALUE';
    $ch=curl_init($url);curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.google_sheets_access_token()],CURLOPT_TIMEOUT=>25]);
    $body=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);$error=curl_error($ch);curl_close($ch);
    if($body===false||$status<200||$status>=300)throw new RuntimeException('Gagal membaca Google Sheets (HTTP '.$status.'). '.($error?: (string)$body));
    $values=json_decode((string)$body,true)['values']??[];if(count($values)<2)return [];
    $headers=array_map(fn($v)=>(string)$v,$values[0]);$ratingMap=response_column_map($headers);
    if(count($ratingMap)<5)throw new RuntimeException('Header spreadsheet belum dikenali. Pastikan baris pertama berisi C1–C14 atau nama aspek fasilitas.');
    $find=function(array $aliases)use($headers):?int{foreach($aliases as $a){$key=normalize_column_name($a);foreach($headers as $i=>$h){$col=normalize_column_name($h);if($col===$key||(strlen($key)>=4&&str_contains($col,$key)))return $i;}}return null;};
    $meta=[
      'respondent_code'=>$find(['respondent_code','kode_responden','id_responden']), 'role_name'=>$find(['role_name','peran','role','status responden']),
      'faculty'=>$find(['faculty','fakultas']), 'program'=>$find(['program','program_studi','prodi']), 'gender'=>$find(['gender','jenis_kelamin']),
      'cohort'=>$find(['cohort','angkatan','tahun angkatan']), 'frequency'=>$find(['frequency','frekuensi_kunjungan']),
      'suggestion'=>$find(['suggestion','saran','masukan']), 'created_at'=>$find(['timestamp','created_at','tanggal','waktu'])
    ];
    $out=[];
    foreach(array_slice($values,1) as $idx=>$cells){$row=[];foreach($meta as $key=>$col)$row[$key]=$col!==null?($cells[$col]??''):'';
      $row['id']=$idx+1;$row['respondent_code']=trim((string)$row['respondent_code'])?:'GS-'.str_pad((string)($idx+1),4,'0',STR_PAD_LEFT);$row['_source_table']='Google Sheets';$hasRating=false;
      for($i=1;$i<=14;$i++){$column=$ratingMap[$i]??null;$colIndex=$column!==null?array_search($column,$headers,true):false;$v=$colIndex!==false?($cells[$colIndex]??null):null;$ratingValue=is_numeric($v)?(float)$v:(preg_match('/^\s*([1-5])(?:\D|$)/u',(string)$v,$m)?(float)$m[1]:null);$row['rating_'.$i]=($ratingValue!==null&&$ratingValue>=1&&$ratingValue<=5)?(int)$ratingValue:null;if($row['rating_'.$i]!==null)$hasRating=true;}
      if($hasRating)$out[]=$row;
    }
    usort($out,fn($a,$b)=>strcmp((string)$b['created_at'],(string)$a['created_at']));return $out;
}

function get_responses(): array {
    if (GOOGLE_SHEETS_ENABLED) return get_responses_from_google_sheets();
    $pdo = db();
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    $candidates = [];
    foreach ($tables as $table) {
      if (in_array(strtolower((string)$table), ['admins','admin','users','migrations'], true)) continue;
      $safe = str_replace('`', '``', (string)$table);
      $columns = $pdo->query("SHOW COLUMNS FROM `{$safe}`")->fetchAll(PDO::FETCH_COLUMN);
      $map = response_column_map($columns);
      if (count($map) >= 5) {
        $rowCount = (int)$pdo->query('SELECT COUNT(*) FROM `'.$safe.'`')->fetchColumn();
        $preferred = strtolower((string)$table) === 'responses' ? 1 : 0;
        // Utamakan tabel yang benar-benar berisi data; responses hanya menjadi tie-breaker.
        $priority = ($rowCount * 1000) + (count($map) * 10) + $preferred;
        $candidates[] = ['table'=>$safe, 'columns'=>$columns, 'map'=>$map, 'priority'=>$priority];
      }
    }
    if (!$candidates) return [];
    usort($candidates, fn($a,$b) => $b['priority'] <=> $a['priority']);
    $source = $candidates[0];
    $rows = $pdo->query('SELECT * FROM `'.$source['table'].'`')->fetchAll();
    $out = [];
    foreach ($rows as $index=>$row) {
      $normalized = [
        'id'=>$row['id'] ?? ($index+1),
        'respondent_code'=>$row['respondent_code'] ?? $row['kode_responden'] ?? $row['id_responden'] ?? ('RSP-'.str_pad((string)($index+1),3,'0',STR_PAD_LEFT)),
        'role_name'=>$row['role_name'] ?? $row['peran'] ?? $row['role'] ?? '',
        'faculty'=>$row['faculty'] ?? $row['fakultas'] ?? '',
        'program'=>$row['program'] ?? $row['program_studi'] ?? $row['prodi'] ?? '',
        'gender'=>$row['gender'] ?? $row['jenis_kelamin'] ?? '',
        'cohort'=>$row['cohort'] ?? $row['angkatan'] ?? $row['semester'] ?? '',
        'frequency'=>$row['frequency'] ?? $row['frekuensi_kunjungan'] ?? '',
        'suggestion'=>$row['suggestion'] ?? $row['saran'] ?? $row['masukan'] ?? '',
        'created_at'=>$row['created_at'] ?? $row['tanggal'] ?? $row['timestamp'] ?? '',
        '_source_table'=>$source['table'],
      ];
      for ($i=1; $i<=14; $i++) {
        $column = $source['map'][$i] ?? null;
        $value = $column !== null ? ($row[$column] ?? null) : null;
        $normalized['rating_'.$i] = is_numeric($value) && (int)$value >= 1 && (int)$value <= 5 ? (int)$value : null;
      }
      $out[] = $normalized;
    }
    usort($out, fn($a,$b) => strcmp((string)$b['created_at'], (string)$a['created_at']));
    return $out;
}
function saw_results(array $responses): array {
    $out = [];
    foreach (facilities() as $idx => $f) {
        $vals = [];
        foreach ($responses as $r) {
            $v = $r['rating_'.($idx+1)] ?? null;
            if ($v !== null && $v !== '' && (int)$v >= 1 && (int)$v <= 5) $vals[] = (int)$v;
        }
        $n = count($vals); $avg = $n ? array_sum($vals)/$n : 0;
        $low = count(array_filter($vals, fn($v) => $v <= 2));
        $out[] = ['code'=>$f[0], 'name'=>$f[1], 'short'=>$f[2], 'recommendation'=>$f[3],
            'valid'=>$n, 'average'=>$avg, 'gap'=>$n ? 5-$avg : 0, 'low'=>$low,
            'proportion'=>$n ? $low/$n : 0, 'score'=>0, 'rank'=>0];
    }
    $maxGap = max(array_column($out,'gap') ?: [0]);
    $maxLow = max(array_column($out,'low') ?: [0]);
    $maxProp = max(array_column($out,'proportion') ?: [0]);
    foreach ($out as &$r) {
        $r['score'] = ($maxGap ? $r['gap']/$maxGap : 0)*.4
            + ($maxLow ? $r['low']/$maxLow : 0)*.3
            + ($maxProp ? $r['proportion']/$maxProp : 0)*.3;
    } unset($r);
    usort($out, fn($a,$b) => $b['score'] <=> $a['score']);
    foreach ($out as $i => &$r) $r['rank'] = $i+1;
    return $out;
}
function page_header(string $title, bool $admin=false): void { ?>
<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title><?=e($title)?> — Junction Analytics</title><link rel="stylesheet" href="assets/css/style.css"></head><body>
<?php }
function page_footer(): void { ?><script src="assets/js/app.js"></script></body></html><?php }
