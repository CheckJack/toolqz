import { ScrollReveal } from "@/components/motion/ScrollReveal";

export function BlogMasthead() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollReveal
      as="header"
      eager
      className="border-b border-dark-border pb-8 text-center sm:pb-10"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neon">
        The Digital Desk
      </p>
      <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.75rem]">
        TOOLQZ Blog
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-muted sm:text-[15px]">
        Reporting on websites, apps, and the digital tools worth your time — and the ones to skip.
      </p>
      <p className="mt-4 text-[12px] text-muted-dim">{today}</p>
    </ScrollReveal>
  );
}
