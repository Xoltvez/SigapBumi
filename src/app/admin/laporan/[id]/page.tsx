import React, { Suspense } from "react";
import DetailLaporanClient from "@/components/admin/laporan/DetailLaporanClient";

export function generateStaticParams() {
  return [
    { id: "rep-1" },
    { id: "rep-2" },
    { id: "rep-3" },
    { id: "rep-4" },
  ];
}

export default async function AdminDetailLaporanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-ink-muted text-sm">
          <p>Memuat Lembar Kerja Laporan...</p>
        </div>
      }
    >
      <DetailLaporanClient reportId={id} />
    </Suspense>
  );
}
