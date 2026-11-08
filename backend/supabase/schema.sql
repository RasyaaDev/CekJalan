create extension if not exists pgcrypto;

create table if not exists kontraktor (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists proyek (
  id uuid primary key default gen_random_uuid(),
  kode_tender text unique,
  slug text not null unique,
  ruas text not null,
  lokasi text,
  nilai_kontrak bigint check (nilai_kontrak >= 0),
  sumber_dana text,
  kontraktor_id uuid references kontraktor(id) on delete set null,
  tahun_anggaran int,
  tanggal_kontrak date,
  selesai_pada date,
  masa_pemeliharaan_bulan int check (masa_pemeliharaan_bulan between 0 and 120),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  sumber_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists laporan (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  proyek_id uuid references proyek(id) on delete set null,
  deskripsi text not null,
  foto_url text,
  status text not null default 'masuk'
    check (status in ('masuk', 'diverifikasi', 'diteruskan', 'dikerjakan', 'selesai')),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  pelapor_nama text,
  pelapor_wa text,
  dibuat_pada timestamptz not null default now(),
  tenggat_pada timestamptz,
  selesai_pada timestamptz,
  buka_lagi_count int not null default 0,
  catatan_admin text
);

create index if not exists laporan_kode_idx on laporan (kode);
create index if not exists laporan_status_idx on laporan (status);
create index if not exists proyek_ruas_idx on proyek (ruas);
create index if not exists proyek_slug_idx on proyek (slug);

alter table kontraktor enable row level security;
alter table proyek enable row level security;
alter table laporan enable row level security;
