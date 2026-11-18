/** Small-caps eyebrow over a Cinzel heading. Centred by default; `align="start"` for side-by-side rows. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  align = "center",
  onLeather = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  align?: "center" | "start";
  onLeather?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 ${align === "center" ? "items-center text-center" : "items-start"}`}
    >
      <span className={`label-caps ${onLeather ? "text-gold-thread" : ""}`}>{eyebrow}</span>
      <h2
        id={id}
        className={`font-display text-4xl leading-tight font-bold text-balance sm:text-[2.75rem] ${
          onLeather ? "text-on-leather" : ""
        }`}
      >
        {title}
      </h2>
    </div>
  );
}
