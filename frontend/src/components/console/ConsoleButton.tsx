import type { ButtonHTMLAttributes, ReactNode } from "react";

type ConsoleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "normal" | "primary" | "link" | "ghost";
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
