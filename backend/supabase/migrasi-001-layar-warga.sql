-- Jalankan sekali di Supabase SQL Editor setelah schema.sql.
-- Hanya menambah kolom/tabel; aman dijalankan ulang dan tidak mengubah data lama.

alter table laporan add column if not exists jenis text;
alter table laporan add column if not exists keparahan text
  check (keparahan in ('ringan', 'bahaya', 'putus'));
alter table laporan add column if not exists foto_urls text[] not null default '{}';
alter table laporan add column if not exists foto_hash text[] not null default '{}';
alter table laporan add column if not exists foto_sesudah_url text;
alter table laporan add column if not exists cek_foto jsonb;
alter table laporan add column if not exists pelapor_email text;
alter table laporan add column if not exists warga_id uuid;
alter table laporan add column if not exists dikonfirmasi_pada timestamptz;

create index if not exists laporan_foto_hash_idx on laporan using gin (foto_hash);

create table if not exists laporan_riwayat (
  id uuid primary key default gen_random_uuid(),
  laporan_id uuid not null references laporan(id) on delete cascade,
  status text not null,
  catatan text,
  dibuat_pada timestamptz not null default now()
);

create index if not exists laporan_riwayat_laporan_idx on laporan_riwayat (laporan_id, dibuat_pada);

create table if not exists warga (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nama text,
  kecamatan text,
  google_sub text unique,
  pengingat_kecamatan boolean not null default false,
  dibuat_pada timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'laporan_warga_id_fkey') then
    alter table laporan add constraint laporan_warga_id_fkey
      foreign key (warga_id) references warga(id) on delete set null;
  end if;
end $$;

create table if not exists otp (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  kode_hash text not null,
  profil jsonb,
  percobaan int not null default 0,
  kedaluwarsa timestamptz not null,
  dibuat_pada timestamptz not null default now()
);

create index if not exists otp_email_idx on otp (email, dibuat_pada desc);

create table if not exists sesi (
  token_hash text primary key,
  warga_id uuid not null references warga(id) on delete cascade,
  kedaluwarsa timestamptz not null,
  dibuat_pada timestamptz not null default now()
);

create table if not exists pantauan (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  warga_id uuid references warga(id) on delete set null,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  radius_m int not null default 1000 check (radius_m between 100 and 5000),
  proyek_ids uuid[] not null default '{}',
  kabar_30_hari boolean not null default true,
  kabar_7_hari boolean not null default true,
  kabar_selesai boolean not null default true,
  kabar_proyek_baru boolean not null default false,
  aktif boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

alter table laporan_riwayat enable row level security;
alter table warga enable row level security;
alter table otp enable row level security;
alter table sesi enable row level security;
alter table pantauan enable row level security;
