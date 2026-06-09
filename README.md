# Jadwal Kuliah

Aplikasi web untuk mengelola jadwal kuliah, tugas, dan ujian dengan login Google, Supabase, tema gelap/terang, dan push notification.

## Fitur Utama

- CRUD jadwal mata kuliah
- CRUD tugas dengan status selesai dan pencarian
- CRUD jadwal ujian dengan countdown ujian berikutnya
- Login Google via Supabase Auth
- Penyimpanan cloud per user via Supabase
- Push notification opt-in dengan panel riwayat notifikasi
- Reminder otomatis untuk deadline tugas dan jadwal ujian
- UI responsive untuk desktop dan mobile

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase Auth, Database, dan Edge Functions

## Setup

1. Salin `.env.example` menjadi `.env`.
2. Isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `VITE_VAPID_PUBLIC_KEY`.
3. Jalankan migration di folder `supabase/migrations`.
4. Deploy Edge Function `supabase/functions/send-push` dan `supabase/functions/check-reminders`.
5. Isi secret Edge Function: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_INTERNAL_SECRET`, dan opsional `REMINDER_LOOKBACK_MINUTES`.
6. Jadwalkan `check-reminders` berjalan otomatis, misalnya tiap 10-15 menit, dengan header `x-push-secret` berisi nilai `PUSH_INTERNAL_SECRET`.
7. Pastikan Google OAuth redirect URL mengarah ke origin aplikasi.

## Notifikasi

- `notifications` menjadi sumber utama panel lonceng.
- IndexedDB tetap dipakai sebagai cache lokal ketika koneksi bermasalah.
- `notification_preferences` menyimpan timezone serta jadwal reminder tugas dan ujian.
- `notification_delivery_logs` menyimpan hasil pengiriman push per subscription.
- `dedupe_key` mencegah reminder yang sama terkirim berkali-kali saat scheduler berjalan berulang.

## Verifikasi Lokal

```bash
npm run lint
npm run build
```
