import type { ReactNode } from "react";

type ConsoleCardProps = {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
};

export function ConsoleCard({
  title,
  actions,
  children,
  className = "",
  padded = true,
}: ConsoleCardProps) {
  return (
    <section className={`console-card${className ? ` ${className}` : ""}`}>
      {title || actions ? (
        <header className="console-card__header">
          {title ? <h2 className="console-card__title">{title}</h2> : <span />}
          {actions ? <div className="console-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={padded ? "console-card__body" : undefined}>{children}</div>
    </section>
  );
}
