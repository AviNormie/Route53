import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "normal" | "primary" | "link";

type ConsoleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function ConsoleButton({
  variant = "normal",
  className = "",
  children,
  type = "button",
  ...rest
}: ConsoleButtonProps) {
  return (
    <button
      type={type}
      className={`console-btn console-btn--${variant}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
