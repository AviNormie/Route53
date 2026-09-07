"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ConsoleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "normal" | "primary" | "orange" | "link" | "ghost";
  children: ReactNode;
  href?: string;
};

export function ConsoleButton({
  variant = "normal",
  className = "",
  children,
  type = "button",
  href,
  ...rest
}: ConsoleButtonProps) {
  const variantClass =
    variant === "orange" ? "console-btn--primary" : `console-btn--${variant}`;
  const classes = `console-btn ${variantClass}${className ? ` ${className}` : ""}`;

  if (href) {
    return (
      <Link
        href={href}
        className={`${classes}${rest.disabled ? " is-disabled" : ""}`}
        aria-disabled={rest.disabled}
        onClick={(e) => {
          if (rest.disabled) e.preventDefault();
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
