# Jadwal Kuliah

Aplikasi web untuk mengelola jadwal kuliah, tugas, dan ujian dengan login Google, Supabase, tema gelap/terang, dan dasar push notification.

## Fitur Utama

- CRUD jadwal mata kuliah
- CRUD tugas dengan status selesai dan pencarian
- CRUD jadwal ujian dengan countdown ujian berikutnya
- Login Google via Supabase Auth
- Penyimpanan cloud per user via Supabase
- Push notification opt-in
- UI responsive untuk desktop dan mobile

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase Auth, Database, dan Edge Functions

## Setup

1. Salin `.env.example` menjadi `.env`.
2. Isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `VITE_VAPID_PUBLIC_KEY`.
3. Jalankan migration di folder `supabase/migrations`.
4. Deploy Edge Function `supabase/functions/send-push`.
5. Isi secret Edge Function: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, dan opsional `PUSH_INTERNAL_SECRET`.
6. Pastikan Google OAuth redirect URL mengarah ke origin aplikasi.

## Verifikasi Lokal

```bash
npm run lint
npm run build
```
