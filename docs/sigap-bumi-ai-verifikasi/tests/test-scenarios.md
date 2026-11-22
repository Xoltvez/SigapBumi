# Manual test scenarios

| Test foto | Kategori yang dipilih | Harapan umum |
| --- | --- | --- |
| Kucing, selfie, makanan | Banjir & Tsunami | Ditolak |
| Foto jelas jalan/perumahan tergenang banjir | Banjir & Tsunami | Lolos pemeriksaan foto |
| Foto banjir | Gempa | Ditolak karena kategori berbeda |
| Foto kerusakan bangunan parah | Gempa | Lolos pemeriksaan visual bila kerusakan jelas, tetapi penyebab belum terbukti |
| Foto bangunan renovasi dengan retak ringan | Gempa | Perlu review |
| Foto jalan normal seusai hujan | Banjir & Tsunami | Ditolak atau perlu review |
| Foto longsor jelas | Lainnya | Lolos pemeriksaan foto |
| Foto kebakaran hutan jelas | Lainnya | Lolos pemeriksaan foto |
| Foto peringatan bencana berupa poster | Lainnya | Ditolak |
| Foto dari berita lama/screenshot kejadian | Kategori sesuai | Mungkin lolos relevansi visual; butuh pemeriksaan keaslian & waktu terpisah |
| Gambar AI sintetis banjir | Banjir & Tsunami | Mungkin lolos relevansi visual; butuh pemeriksaan keaslian terpisah |
| Foto sangat buram/malam hari | Kategori apa pun | Perlu review |

Ekspektasi di atas bukan jaminan hasil model. Ukur hasil pada dataset dengan ground-truth ahli sebelum memakai auto-reject di produksi.
