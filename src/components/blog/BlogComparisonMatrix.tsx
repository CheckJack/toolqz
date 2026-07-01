import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type { Website } from "@/types";

interface ComparisonRow {
  slug: string;
  bestFor: string;
  freeTier: string;
  mobile: string;
  price: string;
}

export function BlogComparisonMatrix({
  rows,
  tools,
}: {
  rows: ComparisonRow[];
  tools: Record<string, Website>;
}) {
  return (
    <ScrollReveal as="section" id="comparison" className="my-12 scroll-mt-24">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
        At a glance
      </p>
      <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.75rem]">
        Compare all five apps
      </h2>

      <p className="mt-4 text-[13px] text-muted-dim sm:hidden" aria-hidden>
        Swipe table to compare →
      </p>

      <div className="-mx-5 mt-6 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <div className="rounded-xl border border-dark-border">
        <table className="w-full min-w-[640px] text-left text-[14px]" aria-label="Productivity apps comparison">
          <thead>
            <tr className="border-b border-dark-border bg-dark-elevated/80 text-[11px] uppercase tracking-wider text-muted-dim">
              <th className="px-4 py-3 font-medium sm:px-5">App</th>
              <th className="px-4 py-3 font-medium sm:px-5">Best for</th>
              <th className="px-4 py-3 font-medium sm:px-5">Free tier</th>
              <th className="px-4 py-3 font-medium sm:px-5">Mobile</th>
              <th className="px-4 py-3 font-medium sm:px-5">Pricing</th>
              <th className="px-4 py-3 font-medium sm:px-5">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {rows.map((row) => {
              const tool = tools[row.slug];
              if (!tool) return null;
              return (
                <tr key={row.slug} className="bg-dark-surface/30 transition-colors hover:bg-dark-elevated/40">
                  <td className="px-4 py-4 sm:px-5">
                    <Link
                      href={`/tools/${row.slug}`}
                      className="font-medium text-white transition-colors hover:text-neon"
                    >
                      {tool.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-muted sm:px-5">{row.bestFor}</td>
                  <td className="px-4 py-4 text-muted sm:px-5">{row.freeTier}</td>
                  <td className="px-4 py-4 text-muted sm:px-5">{row.mobile}</td>
                  <td className="px-4 py-4 text-muted sm:px-5">{row.price}</td>
                  <td className="px-4 py-4 sm:px-5">
                    {tool.rating ? (
                      <span className="font-medium text-neon">{tool.rating.toFixed(1)}</span>
                    ) : (
                      <span className="text-muted-dim">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </ScrollReveal>
  );
}
