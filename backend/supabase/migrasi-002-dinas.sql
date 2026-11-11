-- Jalankan sekali di Supabase SQL Editor setelah migrasi-001-layar-warga.sql.
-- Hanya menambah kolom/tabel dan melonggarkan constraint status; data lama tidak diubah.

alter table laporan drop constraint if exists laporan_status_check;
alter table laporan add constraint laporan_status_check
  check (status in ('masuk', 'diverifikasi', 'diteruskan', 'dikerjakan', 'selesai', 'ditolak', 'perlu_foto_ulang'));

alter table laporan add column if not exists alasan_tolak text;
alter table laporan add column if not exists diverifikasi_oleh text;
alter table laporan add column if not exists cek_sesudah jsonb;
alter table laporan add column if not exists ditandai_selesai_pada timestamptz;

create table if not exists petugas (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nip text unique,
  nama text not null,
  sandi_hash text not null,
  aktif boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

create table if not exists sesi_petugas (
  token_hash text primary key,
  petugas_id uuid not null references petugas(id) on delete cascade,
  kedaluwarsa timestamptz not null,
  dibuat_pada timestamptz not null default now()
);

create table if not exists pengaturan (
  kunci text primary key,
  nilai jsonb not null,
  diubah_pada timestamptz not null default now()
);

create table if not exists pengingat_log (
  id uuid primary key default gen_random_uuid(),
  proyek_id uuid not null references proyek(id) on delete cascade,
  jenis text not null check (jenis in ('h60', 'h30', 'h7', 'manual')),
  penerima text not null,
  jumlah int not null default 0,
  dikirim_oleh text,
  dibuat_pada timestamptz not null default now()
);

create unique index if not exists pengingat_log_otomatis_unik
  on pengingat_log (proyek_id, jenis) where jenis <> 'manual';

create table if not exists ekspor_log (
  id uuid primary key default gen_random_uuid(),
  nama_berkas text not null,
  petugas text not null,
  dibuat_pada timestamptz not null default now()
);

alter table petugas enable row level security;
alter table sesi_petugas enable row level security;
alter table pengaturan enable row level security;
alter table pengingat_log enable row level security;
alter table ekspor_log enable row level security;
