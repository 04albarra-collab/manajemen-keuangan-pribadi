# 💰 DompetKu — Aplikasi Manajemen Keuangan Pribadi

Aplikasi web **tanpa build-step** (HTML + CSS murni + JavaScript ES6 + Chart.js) untuk mencatat pemasukan/pengeluaran, mengatur budget kategori, melihat grafik bulanan, dan mengejar target menabung.

> **Bilingual:** Indonesia 🇮🇩 / English 🇺🇸 — toggle ID/EN di topbar.
> **Storage:** `localStorage` (awet setelah reload) + export/import JSON. Siap migrasi ke Firebase.

---

## ✨ Fitur

### Wajib
- **Input pemasukan/pengeluaran** — modal form + validasi, edit, hapus, dompet (Cash/Bank/E-Wallet), catatan, tanggal
- **Kategori transaksi** — CRUD + icon + warna + budget bulanan per kategori (ID/EN)
- **Grafik pengeluaran bulanan** — Chart.js:
  - Bar `Pemasukan vs Pengeluaran` (6/12 bulan)
  - Doughnut `Pengeluaran per Kategori`
  - Line `Tren Arus Kas Bersih + Rata-rata`
- **Target menabung** — CRUD target, setor/tarik dana, progress %, sisa hari, status tercapai, riwayat

### Kompleks (tambahan)
- 📊 **Dashboard:** total saldo, income/expense bulan ini, rasio menabung, top kategori, transaksi terbaru, **budget alert** (>80% kuning, >100% merah + toast)
- 🔁 **Transaksi rutin:** flag `weekly/monthly` → otomatis dibuatkan untuk bulan berjalan
- 🔍 **Filter & search:** keyword, tipe, kategori, dompet, rentang tanggal + sort + pagination
- 📑 **Laporan:** filter bulan, rekap, **export CSV**, **print/PDF**, backup JSON
- 🌙 **Dark mode** + responsive (sidebar → bottom-nav di HP) + toast + dialog konfirmasi
- 🤝 **Hutang & Piutang** — catat siapa & berapa, tipe hutang (saya pinjam) / piutang (saya meminjami), tenggat, cicilan bertahap + progress sisa, status Aktif/Jatuh tempo/Lunas, filter + export CSV, ringkasan di dashboard

---

## 🗂️ Struktur Project

```
manajemen-keuangan-pribadi/
├── index.html              # SPA shell: sidebar, topbar, router outlet
├── css/
│   ├── variables.css       # token warna light/dark
│   ├── layout.css          # sidebar, grid, responsive
│   ├── components.css      # card, button, tabel, modal, badge, progress
│   └── print.css           # gaya cetak laporan
├── js/
│   ├── main.js             # hash-router (#/dashboard …) + theme + lang + backup
│   ├── store.js            # state + pub/sub + localStorage + computed + recurring
│   ├── icons.js            # set ikon SVG inline (tanpa emoji/CDN) + badge kategori
│   ├── i18n.js             # kamus id/en, t(), catName()
│   ├── utils.js            # formatRp, formatDate, monthKey, CSV, download
│   ├── seed.js             # 12 kategori + ~22 transaksi demo + 3 target
│   ├── components/
│   │   ├── modal.js        # modal generik
│   │   ├── toast.js        # notifikasi
│   │   └── confirm.js      # konfirmasi hapus (Promise)
│   ├── views/
│   │   ├── dashboard.js    # KPI + alert + tabel terbaru + strip hutang/piutang
│   │   ├── transaksi.js    # tabel + filter + CRUD + quick-add
│   │   ├── kategori.js     # CRUD kategori + progress budget
│   │   ├── target.js       # CRUD target + setor/tarik
│   │   ├── pinjaman.js     # hutang & piutang + cicilan + filter + CSV
│   │   └── laporan.js      # rekap + CSV + print
│   └── charts/
│       └── charts.js       # monthly (bar), category (doughnut), trend (line)
└── README.md
```

---

## 🚀 Cara Menjalankan

### Opsi 1 — Double click (paling mudah)
1. Buka folder `manajemen-keuangan-pribadi`
2. Double-click `index.html` → terbuka di browser

> Catatan: ES modules (`type="module"`) kadang diblokir via `file://` di Chrome. Kalau kosong, pakai Opsi 2.

### Opsi 2 — Live Server / server lokal (disarankan)
```bash
cd manajemen-keuangan-pribadi

# Python
python3 -m http.server 8080
# lalu buka http://localhost:8080

# atau Node
npx serve .
```

### Opsi 3 — VS Code
Klik kanan `index.html` → **Open with Live Server**.

Tidak perlu `npm install`. Satu-satunya CDN: Chart.js
```
https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js
```

---

## 🧭 Cara Pakai

| Halaman | Fungsi |
|---|---|
| `#/dashboard` | Lihat saldo, grafik, alert budget, transaksi terbaru |
| `#/transaksi` | Tombol **＋ Tambah**, lalu filter/cari, klik ✏️/🗑️ untuk ubah/hapus |
| `#/kategori` | **＋ Tambah Kategori** (nama ID+EN, icon, warna, budget). Progress otomatis dari transaksi bulan berjalan |
| `#/target` | **🎯 Target Baru** → **Setor/Tarik** untuk update progress |
| `#/pinjaman` | **Catat Baru** (hutang/piutang + tenggat) → **Bayar/Tagih** per cicilan, filter tipe & status |
| `#/laporan` | Pilih bulan + range → **CSV / Print** |

**Tips:**
- Ganti bahasa: tombol **ID/EN** di kanan atas (format Rp ikut berubah: `Rp1.000.000` vs `IDR 1,000,000`)
- Dark mode: tombol 🌙/☀️
- Backup: sidebar bawah → **⬇️ JSON** / **⬆️ JSON**
- Kembalikan data contoh: **🔄 Reset data demo**

---

## 💾 Model Data (`localStorage: mkp_state_v1`)

```js
{
  transactions: [
    { id, type: "income"|"expense", amount: 50000, date: "2026-09-15",
      categoryId, wallet: "Cash"|"Bank"|"E-Wallet",
      note, recurring: "none"|"weekly"|"monthly", createdAt }
  ],
  categories: [
    { id, name_id: "Makanan", name_en: "Food",
      type: "expense", icon: "food", color: "#ef4444", budget: 1500000 }
  ],
  goals: [
    { id, name: "Laptop", targetAmount: 12000000, savedAmount: 3500000,
      deadline: "2027-03-01", color: "#4f46e5",
      history: [{ date, amount }] }
  ],
  loans: [
    { id, type: "hutang"|"piutang", person: "Andi", amount: 500000,
      paidAmount: 200000, date: "2026-09-01", dueDate: "2026-10-01",
      note, history: [{ date, amount }] }
  ],
  settings: { theme: "light"|"dark", lang: "id"|"en" }
}
```

---

## 🧪 Uji Manual (checklist)

- [ ] Buka app → dashboard tampil 3 chart + data demo
- [ ] Tambah transaksi → muncul di tabel + saldo sidebar berubah
- [ ] Reload browser → data tetap ada (localStorage)
- [ ] Ganti ID→EN → label + format angka berubah, data tidak hilang
- [ ] Set budget kategori kecil → muncul alert kuning/merah
- [ ] Setor target → progress % naik + riwayat bertambah
- [ ] Laporan → pilih bulan → export CSV terbuka di Excel → Print tampil rapi
- [ ] Console browser (F12) tanpa error merah

---

## 🔌 Migrasi ke Firebase (opsional, belum diimplementasikan)

Arsitektur sudah dipisah (`store.js` sebagai satu-satunya pintu data), jadi tinggal:
1. Tambah `js/firebase-adapter.js` (Auth + Firestore)
2. Ganti `addTransaction/updateTransaction/...` agar tulis ke Firestore bila user login
3. Tambah login Google di topbar

Sekarang default tetap `localStorage` agar bisa langsung dipakai/dikumpulkan tanpa setup.

---

## 👨‍💻 Dikembangkan untuk belajar

CSS murni (tanpa framework), JS modular ala React (state + render + subscribe), Chart.js untuk visualisasi.
