-- Jalankan sekali di Supabase SQL Editor setelah migrasi-002-dinas.sql.
-- Menambah kata sandi untuk akun warga. Tidak mengubah data lama.

alter table warga add column if not exists sandi_hash text;
