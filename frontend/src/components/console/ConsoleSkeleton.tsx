type ConsoleSkeletonProps = {
  rows?: number;
  title?: boolean;
};

export function ConsoleSkeleton({ rows = 5, title = true }: ConsoleSkeletonProps) {
  return (
    <div className="console-skeleton" aria-busy="true" aria-live="polite">
      {title ? <div className="console-skeleton__title" /> : null}
      <div className="console-skeleton__toolbar">
        <div className="console-skeleton__bar console-skeleton__bar--wide" />
        <div className="console-skeleton__bar console-skeleton__bar--btn" />
      </div>
      <div className="console-skeleton__table">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="console-skeleton__row">
            <div className="console-skeleton__cell" />
            <div className="console-skeleton__cell" />
            <div className="console-skeleton__cell console-skeleton__cell--short" />
            <div className="console-skeleton__cell" />
          </div>
        ))}
      </div>
    </div>
  );
}
