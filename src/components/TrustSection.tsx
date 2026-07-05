import { HowWePickContent } from "@/components/HowWePickContent";

export function TrustSection({ toolCount }: { toolCount: number }) {
  return (
    <section id="how-we-pick">
      <HowWePickContent toolCount={toolCount} />
    </section>
  );
}
