

/**
 * CSS-only marquee. On a phone there is no room to rotate three messages in
 * place without either truncating them or reserving two lines, so they scroll.
 * The track is duplicated to make the loop seamless; the copy is hidden from
 * assistive tech so the message is not announced twice.
 */
export function AnnouncementBar({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden bg-plum-950 text-ivory-100">
      <div className="flex w-max animate-[marquee_26s_linear_infinite] motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1 || undefined}
            className="flex shrink-0 items-center"
          >
            {[text].map((text: string) => (
              <li
                key={text}
                className="flex items-center gap-3 px-6 py-2 text-[0.6875rem] font-medium tracking-wide whitespace-nowrap sm:text-xs"
              >
                <span className="text-gold-400">◆</span>
                {text}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
