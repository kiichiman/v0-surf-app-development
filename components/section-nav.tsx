'use client';

import { useEffect, useRef, useState } from 'react';

export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? '');
  const listRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  useEffect(() => {
    if (!active) return;
    const list = listRef.current;
    const button = buttonRefs.current[active];
    if (!list || !button) return;

    const left = button.offsetLeft - (list.clientWidth - button.offsetWidth) / 2;
    list.scrollTo({ left, behavior: 'smooth' });
  }, [active]);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
  };

  return (
    <div ref={listRef} className="flex gap-2 overflow-x-auto py-2 [scrollbar-width:none]">
      {sections.map((section) => (
        <button
          key={section.id}
          ref={(el) => {
            buttonRefs.current[section.id] = el;
          }}
          type="button"
          onClick={() => handleClick(section.id)}
          className={
            section.id === active
              ? 'shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap bg-primary text-primary-foreground'
              : 'shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap bg-secondary text-secondary-foreground'
          }
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
