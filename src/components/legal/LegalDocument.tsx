import React from "react";
import Link from "next/link";
import { ChevronLeft, CalendarDays, type LucideIcon } from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalDocumentProps {
  title: string;
  intro: string;
  updatedAt: string;
  icon: LucideIcon;
  sections: LegalSection[];
  related: { href: string; label: string };
}

export function LegalDocument({
  title,
  intro,
  updatedAt,
  icon: Icon,
  sections,
  related,
}: LegalDocumentProps) {
  return (
    <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-8">
      {/* Breadcrumb & Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-ink">{title}</h1>
            <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted mt-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Terakhir diperbarui: {updatedAt}
            </p>
          </div>
        </div>
        <p className="text-sm text-ink-soft mt-4 leading-relaxed max-w-3xl">
          {intro}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Daftar Isi */}
        <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 bg-surface border border-line rounded-lg p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
            Daftar Isi
          </p>
          <ol className="space-y-1.5 text-sm">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex gap-2 text-ink-soft hover:text-primary-hover transition-colors"
                >
                  <span className="font-mono text-ink-muted w-5 shrink-0">
                    {index + 1}.
                  </span>
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
          <div className="border-t border-line mt-4 pt-4 text-xs">
            <Link
              href={related.href}
              className="font-semibold text-primary-hover hover:underline"
            >
              {related.label} &rarr;
            </Link>
          </div>
        </aside>

        {/* Isi Dokumen */}
        <article className="lg:col-span-8 xl:col-span-9 bg-surface border border-line rounded-lg p-5 md:p-8 shadow-card space-y-8">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 space-y-3"
            >
              <h2 className="text-lg font-bold text-ink">
                {index + 1}. {section.title}
              </h2>
              <div className="text-sm text-ink-soft leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-ink [&_a]:text-primary-hover [&_a]:font-medium hover:[&_a]:underline">
                {section.content}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
