"use client";

import { useId, useState } from "react";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";

export type AccordionItem = {
  id: string;
  title: string;
  content: string;
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
};

export function Accordion({ items, className = "" }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const baseId = useId();

  return (
    <div className={`border-t border-aws-border ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;

        return (
          <div key={item.id} className="border-b border-aws-border">
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                className="accordion-title flex w-full items-start justify-between gap-6 py-5 text-left text-[18px] font-bold text-aws-ink transition-colors hover:text-aws-navy"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <span className="accordion-title__text text-[18px] font-bold leading-[1.4]">
                  {item.title}
                </span>
                <span className="mt-0.5 shrink-0 text-aws-ink" aria-hidden="true">
                  {isOpen ? <MinusIcon /> : <PlusIcon />}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-5 pr-10 text-[0.95rem] leading-7 text-aws-body"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
