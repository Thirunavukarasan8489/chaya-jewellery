"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [value, setValue] = React.useState(initial);

  // Keep the field in step with back/forward navigation. Adjusting during
  // render (rather than in an effect) avoids a frame showing the stale term.
  const [renderedInitial, setRenderedInitial] = React.useState(initial);
  if (renderedInitial !== initial) {
    setRenderedInitial(initial);
    setValue(initial);
  }

  function submit(next: string) {
    const query = next.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      className="relative"
    >
      <Search
        size={19}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-plum-400"
      />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        placeholder="Ruby, neelam, 5 carat, Ceylon…"
        aria-label="Search gemstones"
        className="h-14 w-full rounded-full border border-plum-900/15 bg-white pr-24 pl-12 text-plum-900 shadow-sm transition-colors placeholder:text-plum-400 focus:border-gold-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            submit("");
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-19 grid size-8 -translate-y-1/2 place-items-center rounded-full text-plum-400 hover:bg-ivory-200 hover:text-plum-700"
        >
          <X size={16} />
        </button>
      )}
      <button
        type="submit"
        className="absolute top-1/2 right-2 h-10 -translate-y-1/2 rounded-full bg-plum-900 px-4 text-sm font-semibold text-ivory-100 transition-colors hover:bg-gold-500 hover:text-plum-950"
      >
        Search
      </button>
    </form>
  );
}
