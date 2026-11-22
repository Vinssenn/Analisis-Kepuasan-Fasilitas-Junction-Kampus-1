<?php
require __DIR__.'/config/config.php';
verify_csrf();
$page = $_GET['page'] ?? 'home';
$notice = $_SESSION['notice'] ?? null; unset($_SESSION['notice']);

if ($page === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? ''); $password = $_POST['password'] ?? '';
    $stmt = db()->prepare('SELECT * FROM admins WHERE email=? LIMIT 1'); $stmt->execute([$email]); $admin = $stmt->fetch();
    if ($admin && password_verify($password, $admin['password_hash'])) {
        session_regenerate_id(true); $_SESSION['admin_id'] = $admin['id']; $_SESSION['admin_name'] = $admin['name'];
        redirect('index.php?page=admin');
    }
    $notice = ['type'=>'error','text'=>'Email atau kata sandi tidak sesuai.'];
}
if ($page === 'logout') { $_SESSION=[]; session_destroy(); redirect('index.php'); }

if ($page === 'survey' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $ratings = [];
    for ($i=1; $i<=14; $i++) {
        $v = $_POST['rating_'.$i] ?? '';
        if ($v === '' || !in_array((int)$v,[1,2,3,4,5],true)) {
            $_SESSION['notice']=['type'=>'error','text'=>'Mohon isi seluruh penilaian fasilitas dengan skala 1–5.']; redirect('index.php?page=survey');
        }
        $ratings[]=(int)$v;
    }
    $code = 'RSP-'.date('ymd').'-'.strtoupper(bin2hex(random_bytes(2)));
    $fields = ['respondent_code','role_name','faculty','program','gender','cohort','frequency'];
    $values = [$code,trim($_POST['role_name']??''),trim($_POST['faculty']??''),trim($_POST['program']??''),trim($_POST['gender']??''),trim($_POST['cohort']??''),trim($_POST['frequency']??'')];
    $columns = implode(',', $fields); $marks = implode(',', array_fill(0,count($fields),'?'));
    for($i=1;$i<=14;$i++){ $columns.=',rating_'.$i; $marks.=',?'; $values[]=$ratings[$i-1]; }
    $columns.=',suggestion'; $marks.=',?'; $values[]=trim($_POST['suggestion']??'');
    $stmt=db()->prepare("INSERT INTO responses ($columns) VALUES ($marks)"); $stmt->execute($values);
    $_SESSION['notice']=['type'=>'success','text'=>'Terima kasih. Jawaban survei berhasil disimpan.']; redirect('index.php?page=survey');
}
if ($page === 'admin' || str_starts_with($page,'admin-')) require_admin();

if ($page === 'admin-import' && $_SERVER['REQUEST_METHOD']==='POST') {
    require_admin();
    if (!isset($_FILES['csv']['tmp_name']) || !is_uploaded_file($_FILES['csv']['tmp_name'])) {
        $_SESSION['notice']=['type'=>'error','text'=>'File CSV belum dipilih.']; redirect('index.php?page=admin-data');
    }
    $fh=fopen($_FILES['csv']['tmp_name'],'r'); $first=fgets($fh); if($first===false){fclose($fh);redirect('index.php?page=admin-data');}
    $delimiter=substr_count($first,';')>substr_count($first,',')?';':','; rewind($fh);
    $headers=fgetcsv($fh,0,$delimiter); $normalized=array_map(fn($s)=>strtolower(trim((string)$s)), $headers?:[]);
    $map=[];
    foreach($normalized as $idx=>$h) {
      if(preg_match('/^(c?)([1-9]|1[0-4])$/i',$h,$m)) $map[(int)$m[2]]=$idx;
      else foreach(facilities() as $i=>$f) if(str_contains($h,strtolower($f[1])) || str_contains($h,strtolower($f[2]))) $map[$i+1]=$idx;
    }
    $count=0;
    while(($row=fgetcsv($fh,0,$delimiter))!==false) {
      if(count(array_filter($row,fn($v)=>trim((string)$v)!==''))===0) continue;
      $vals=[];
      for($i=1;$i<=14;$i++){ $v=isset($map[$i])?trim((string)($row[$map[$i]]??'')):''; $vals[]=(is_numeric($v)&&(int)$v>=1&&(int)$v<=5)?(int)$v:null; }
      $code='CSV-'.date('ymd').'-'.(++$count);
      $stmt=db()->prepare('INSERT INTO responses(respondent_code,role_name,faculty,program,gender,cohort,frequency,'.implode(',',array_map(fn($i)=>'rating_'.$i,range(1,14))).',suggestion) VALUES('.implode(',',array_fill(0,22,'?')).')');
      $stmt->execute(array_merge([$code,$row[0]??'Import CSV',$row[1]??'', $row[2]??'', $row[3]??'', $row[4]??'', $row[5]??''],$vals,[$row[count($row)-1]??'']));
    }
    fclose($fh); $_SESSION['notice']=['type'=>'success','text'=>"$count baris CSV berhasil diproses. Periksa kembali hasil impor pada Data Kuesioner."]; redirect('index.php?page=admin-data');
}
if ($page === 'admin-delete' && $_SERVER['REQUEST_METHOD']==='POST') {
    require_admin(); $id=(int)($_POST['id']??0); db()->prepare('DELETE FROM responses WHERE id=?')->execute([$id]);
    $_SESSION['notice']=['type'=>'success','text'=>'Data responden dihapus.']; redirect('index.php?page=admin-data');
}

$dataError = null;
try {
    $responses = ($page==='home'||$page==='report'||$page==='admin'||$page==='admin-data'||$page==='admin-suggestions') ? get_responses() : [];
} catch (Throwable $ex) {
    $responses = [];
    $dataError = $ex->getMessage();
}
$results = ($responses || in_array($page,['home','report','admin'])) ? saw_results($responses) : [];
$titleMap=['home'=>'Beranda','report'=>'Laporan Data','survey'=>'Isi Survei','login'=>'Login Admin','admin'=>'Dashboard','admin-data'=>'Data Kuesioner','admin-suggestions'=>'Saran Responden','admin-settings'=>'Pengaturan'];
page_header($titleMap[$page]??'Junction Analytics');
?>
<div class="public-page">
<?php if (in_array($page,['home','report','survey'])): ?>
<header class="public-header">
  <a class="public-brand" href="index.php"><span>J</span><div><b>Junction</b><small>Analytics</small></div></a>
  <nav class="public-nav">
    <a class="<?= $page==='home'?'active':'' ?>" href="index.php">Homepage</a>
    <a class="<?= $page==='report'?'active':'' ?>" href="index.php?page=report">Laporan Data</a>
    <a class="<?= $page==='survey'?'active':'' ?>" href="index.php?page=survey">Isi Survei</a>
  </nav>
  <a class="admin-login-link" href="index.php?page=login">Login Admin</a>
</header>
<?php endif; ?>
<?php if($notice): ?><div class="notice-banner <?=e($notice['type'])?>"><?=e($notice['text'])?></div><?php endif; ?>
<?php if($dataError): ?><div class="notice-banner error"><b>Integrasi Google Sheets belum berhasil:</b> <?=e($dataError)?></div><?php endif; ?>

<?php if($page==='home'): ?>
<section class="public-hero">
 <div class="hero-copy"><span class="eyebrow"><i></i> ANALISIS KEPUASAN FASILITAS KAMPUS</span>
 <h1>Ruang nyaman,<br><em>pengalaman</em> lebih baik.</h1>
 <p>Bantu kami memahami tingkat kepuasan pengguna terhadap fasilitas Kampus Junction. Masukan Anda menjadi bahan evaluasi untuk peningkatan kualitas fasilitas.</p>
 <div class="hero-actions"><a class="public-primary" href="index.php?page=survey">Isi Survei <span>→</span></a><a class="text-link" href="index.php?page=report">Lihat laporan data</a></div>
 <div class="hero-metrics"><div><b><?=count($responses)?></b><span>Responden</span></div><div><b>14</b><span>Aspek fasilitas</span></div><div><b>1–5</b><span>Skala penilaian</span></div></div>
 </div>
 <div class="hero-visual"><div class="hero-art"><div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div><div class="hero-bag"><span>J</span><i></i><b></b></div><div class="float-note note-left">✦ <span>Suara Anda</span></div><div class="float-note note-right">✓ <span>Data berarti</span></div></div></div>
</section>
<section class="public-section"><div class="section-intro"><span class="section-kicker">TUJUAN SURVEI</span><h2>Membangun fasilitas dari <em>masukan nyata.</em></h2><p>Data dikumpulkan untuk melihat aspek fasilitas yang sudah baik dan yang masih perlu ditingkatkan.</p></div>
<div class="public-feature-grid"><article><b>01</b><h3>Berikan penilaian</h3><p>Isi penilaian sesuai pengalaman Anda saat menggunakan fasilitas Junction.</p></article><article><b>02</b><h3>Lihat hasil analisis</h3><p>Ringkasan data dan hasil pengolahan ditampilkan pada halaman laporan.</p></article><article><b>03</b><h3>Dorong perbaikan</h3><p>Masukan menjadi bahan pertimbangan untuk evaluasi fasilitas kampus.</p></article></div></section>
<?php elseif($page==='report'): ?>
<main class="public-content"><div class="page-heading"><div><span class="section-kicker">RINGKASAN HASIL</span><h1>Laporan Data Kepuasan</h1><p>Ringkasan penilaian fasilitas Kampus Junction berdasarkan data survei yang tersimpan.</p><small class="data-source-note">Sumber data: <b><?=e($responses[0]['_source_table'] ?? 'Google Sheets')?></b></small></div><a class="btn primary" href="index.php?page=report&refresh=1">↻ Perbarui data</a></div>
<div class="public-stat-grid"><article><span>Total responden</span><b><?=count($responses)?></b></article><article><span>Aspek fasilitas</span><b>14</b></article><article><span>Rata-rata rating</span><b><?php $all=[];foreach($responses as $r)for($i=1;$i<=14;$i++)if($r['rating_'.$i])$all[]=(int)$r['rating_'.$i]; echo $all?number_format(array_sum($all)/count($all),2,',','.'): '—'; ?></b></article></div>
<section class="card public-table"><div class="card-head"><div><h2>Prioritas fasilitas berdasarkan SAW</h2><p>Skor dihitung dari kesenjangan kepuasan, jumlah rating rendah, dan proporsi rating rendah.</p></div></div>
<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Fasilitas</th><th>Rata-rata</th><th>Data valid</th><th>Kesenjangan</th><th>Rating rendah</th><th>Skor SAW</th></tr></thead><tbody>
<?php foreach($results as $r): ?><tr><td><?=$r['rank']?></td><td><?=e($r['name'])?></td><td><?=number_format($r['average'],2)?></td><td><?=$r['valid']?></td><td><?=number_format($r['gap'],2)?></td><td><?=$r['low']?></td><td><b><?=number_format($r['score'],3)?></b></td></tr><?php endforeach; ?>
</tbody></table></div><?php if(!count($responses)): ?><div class="empty-inline">Belum ada data survei yang masuk.</div><?php endif; ?></section></main>
<?php elseif($page==='survey'): ?>
<main class="survey-container"><div class="page-heading"><div><span class="section-kicker">FORMULIR RESPONDEN</span><h1>Survei Kepuasan Fasilitas</h1><p>Berikan penilaian berdasarkan pengalaman Anda menggunakan fasilitas Kampus Junction.</p></div></div>
<form method="post" class="card survey-form"><input type="hidden" name="csrf" value="<?=e(csrf_token())?>">
<h2>Informasi responden</h2><div class="survey-meta-grid">
<label>Peran<select name="role_name" required><option value="">Pilih peran</option><?php foreach(['Mahasiswa','Karyawan','Dosen','Alumni','Lainnya'] as $v): ?><option><?=e($v)?></option><?php endforeach; ?></select></label>
<label>Fakultas<select name="faculty"><option value="">Pilih fakultas</option><?php foreach(['Fakultas Teknologi dan Ilmu Komputer','Psikologi','Ekonomi dan Bisnis','Kedokteran dan Ilmu Kesehatan','Ilmu Sosial dan Humaniora'] as $v): ?><option><?=e($v)?></option><?php endforeach; ?></select></label>
<label>Program Studi<input name="program" placeholder="Program studi"></label><label>Jenis kelamin<select name="gender"><option value="">Pilih</option><option>Laki-laki</option><option>Perempuan</option><option>Tidak ingin menyebutkan</option></select></label>
<label>Angkatan<select name="cohort"><option value="">Pilih angkatan</option><?php for($y=2020;$y<=date('Y');$y++): ?><option><?=$y?></option><?php endfor; ?></select></label>
<label>Frekuensi kunjungan<select name="frequency"><option value="">Pilih frekuensi</option><?php foreach(['Setiap hari','Beberapa kali seminggu','Seminggu sekali','Beberapa kali sebulan','Jarang'] as $v): ?><option><?=e($v)?></option><?php endforeach; ?></select></label>
</div><h2>Penilaian fasilitas</h2><p class="form-hint">Skala 1 = Sangat Tidak Puas, 2 = Tidak Puas, 3 = Cukup, 4 = Puas, 5 = Sangat Puas.</p>
<?php foreach(facilities() as $i=>$f): ?><fieldset class="rating-question"><legend><b><?=$f[0]?>.</b> <?=e($f[1])?></legend><div class="rating-options"><?php for($v=1;$v<=5;$v++): ?><label class="rating-choice"><input type="radio" name="rating_<?=$i+1?>" value="<?=$v?>" required><span><?=$v?></span></label><?php endfor; ?></div><div class="rating-scale"><span>Sangat tidak puas</span><span>Sangat puas</span></div></fieldset><?php endforeach; ?>
<label class="suggestion-field">Saran atau masukan (opsional)<textarea name="suggestion" rows="4" placeholder="Tuliskan saran untuk peningkatan fasilitas Junction..."></textarea></label>
<button class="public-primary" type="submit">Kirim Survei <span>→</span></button></form></main>
<?php elseif($page==='login'): ?>
<main class="login-page"><section class="login-aside"><span class="eyebrow"><i></i> JUNCTION ANALYTICS</span><h1>Kelola data,<br><em>pahami kebutuhan.</em></h1><p>Halaman administrator untuk mengelola data kuesioner dan masukan responden.</p></section><form method="post" class="card login-form"><input type="hidden" name="csrf" value="<?=e(csrf_token())?>"><span class="section-kicker">ADMINISTRATOR</span><h2>Masuk ke dashboard</h2><p>Gunakan akun administrator yang telah terdaftar.</p><label>Email<input type="email" name="email" required autocomplete="username"></label><label>Kata sandi<input type="password" name="password" required autocomplete="current-password"></label><button class="public-primary" type="submit">Login <span>→</span></button><a href="index.php">Kembali ke homepage</a></form></main>
<?php elseif($page==='admin'||str_starts_with($page,'admin-')): ?>
<?php $adminPage=$page==='admin'?'Dashboard':($page==='admin-data'?'Data Kuesioner':($page==='admin-suggestions'?'Saran Responden':'Pengaturan')); $nav=[['admin','Dashboard'],['admin-data','Data Kuesioner'],['admin-suggestions','Saran Responden'],['admin-settings','Pengaturan']]; ?>
<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">J</span><div><b>Junction</b><small>Analytics</small></div></div><div class="nav-label">MENU UTAMA</div><nav><?php foreach($nav as [$url,$label]): ?><a class="<?=($page===$url?'active':'')?>" href="index.php?page=<?=$url?>"><span><?=e($label)?></span></a><?php endforeach; ?></nav><div class="sidebar-foot"><div class="system-status data-status"><i></i><div><b>Database MySQL</b><span><?=count(get_responses())?> respons tersimpan</span></div></div><p>Junction Analytics<br>PHP Native</p></div></aside>
<main class="main"><header><div class="breadcrumb"><span>Junction Analytics</span><b><?=$adminPage?></b></div><div class="header-right"><div class="profile"><div class="avatar">AD</div><div><b><?=e($_SESSION['admin_name']??'Administrator')?></b><span>Administrator</span></div></div><a class="admin-logout" href="index.php?page=logout">Keluar</a></div></header><div class="content">
<?php if($page==='admin'): ?>
<div class="page-heading"><div><h1>Dashboard</h1><p>Ringkasan data kepuasan fasilitas Kampus Junction.</p></div><div class="hero-actions"><a class="btn" href="index.php?page=admin&refresh=1">↻ Perbarui data</a><a class="btn primary" href="index.php?page=admin-data">Lihat data kuesioner</a></div></div>
<div class="stat-grid five"><div class="stat-card"><span>Total Responden</span><b><?=count($responses)?></b></div><div class="stat-card"><span>Aspek Fasilitas</span><b>14</b></div><div class="stat-card"><span>Jawaban Saran</span><b><?=count(array_filter($responses,fn($r)=>trim((string)$r['suggestion'])!==''))?></b></div><div class="stat-card"><span>Rating Terisi</span><b><?php $n=0;foreach($responses as $r)for($i=1;$i<=14;$i++)$n+=!empty($r['rating_'.$i]);echo $n;?></b></div><div class="stat-card"><span>Status Sistem</span><b class="compact">Aktif</b></div></div>
<section class="card"><div class="card-head"><div><h2>Prioritas fasilitas</h2><p>Perhitungan SAW dari seluruh respons yang tersimpan.</p></div></div><div class="table-wrap"><table><thead><tr><th>Rank</th><th>Fasilitas</th><th>Rata-rata</th><th>Data valid</th><th>Skor SAW</th><th>Rekomendasi</th></tr></thead><tbody><?php foreach($results as $r): ?><tr><td><?=$r['rank']?></td><td><?=e($r['name'])?></td><td><?=number_format($r['average'],2)?></td><td><?=$r['valid']?></td><td><b><?=number_format($r['score'],3)?></b></td><td><?=e($r['recommendation'])?></td></tr><?php endforeach; ?></tbody></table></div></section>
<?php elseif($page==='admin-data'): ?>
<div class="page-heading"><div><h1>Data Kuesioner</h1><p>Daftar respons survei yang dibaca dari Google Sheets.</p></div><a class="btn primary" href="index.php?page=admin-data&refresh=1">↻ Perbarui data</a></div>
<section class="card import-card"><div class="card-head"><div><h2>Sumber data: Google Sheets</h2><p>Data dibaca langsung dari spreadsheet yang terhubung ke Google Forms. Gunakan tombol Perbarui data untuk mengambil respons terbaru.</p></div></div></section>
<section class="card"><div class="card-head"><div><h2>Seluruh responden</h2><p><?=count($responses)?> respons</p></div></div><div class="table-wrap"><table><thead><tr><th>Kode</th><th>Peran</th><th>Fakultas</th><th>Program Studi</th><th>Angkatan</th><th>Waktu</th></tr></thead><tbody><?php foreach($responses as $r): ?><tr><td><?=e($r['respondent_code'])?></td><td><?=e($r['role_name'])?></td><td><?=e($r['faculty'])?></td><td><?=e($r['program'])?></td><td><?=e($r['cohort'])?></td><td><?=e($r['created_at'])?></td></tr><?php endforeach; ?></tbody></table></div><?php if(!$responses): ?><div class="empty-inline">Belum ada respons.</div><?php endif; ?></section>
<?php elseif($page==='admin-suggestions'): ?>
<div class="page-heading"><div><h1>Saran Responden</h1><p>Jawaban terbuka ditampilkan apa adanya tanpa identitas pribadi.</p></div></div><section class="card suggestion-list"><?php $suggestions=array_filter($responses,fn($r)=>trim((string)$r['suggestion'])!=='');foreach($suggestions as $r): ?><blockquote><span><?=e($r['respondent_code'])?></span><p>“<?=e($r['suggestion'])?>”</p></blockquote><?php endforeach; if(!$suggestions): ?><div class="empty-inline">Belum ada saran responden.</div><?php endif; ?></section>
<?php else: ?>
<div class="page-heading"><div><h1>Pengaturan</h1><p>Informasi administrator dan konfigurasi analisis.</p></div></div><div class="settings-grid"><section class="card settings-card"><h2>Profil Administrator</h2><div class="profile-edit"><div class="avatar large">AD</div><div><b><?=e($_SESSION['admin_name']??'Administrator')?></b><p>Administrator Sistem</p></div></div><p>Email akun dikelola melalui tabel <code>admins</code> pada database.</p></section><section class="card settings-card"><h2>Konfigurasi metode SAW</h2><div class="setting-row"><span>C1 — Kesenjangan kepuasan</span><b>Benefit · 0,40</b></div><div class="setting-row"><span>C2 — Jumlah rating rendah</span><b>Benefit · 0,30</b></div><div class="setting-row"><span>C3 — Proporsi rating rendah</span><b>Benefit · 0,30</b></div><div class="calc-total"><span>Total bobot</span><b>1,00</b></div><p>Skor tertinggi menunjukkan prioritas fasilitas untuk dievaluasi.</p></section></div>
<?php endif; ?></div></main></div>
<?php else: ?><main class="public-content"><h1>Halaman tidak ditemukan</h1><a href="index.php">Kembali ke homepage</a></main><?php endif; ?>
</div>
<?php if (in_array($page,['home','report','survey'])): ?>
<footer class="public-footer"><a class="public-brand" href="index.php"><span>J</span><div><b>Junction</b><small>Analytics</small></div></a><p>Analisis kepuasan fasilitas Kampus Junction</p><small>© <?=date('Y')?> Junction Analytics</small></footer>
<?php endif; ?>
<?php page_footer(); ?>
