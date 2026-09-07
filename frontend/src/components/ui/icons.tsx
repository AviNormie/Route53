import type { SVGProps } from "react";
import { BsTriangleFill } from "react-icons/bs";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

export function ChevronDownIcon({ size = 12, style, className }: IconProps) {
  return (
    <BsTriangleFill
      size={size}
      aria-hidden="true"
      className={className}
      style={{ transform: "rotate(300deg)", display: "inline-block", ...style }}
    />
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M5.3 3.2a.75.75 0 0 1 1.06 0l4.27 4.27a.75.75 0 0 1 0 1.06L6.36 12.8a.75.75 0 1 1-1.06-1.06L9.04 8 5.3 4.26a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 12h17M12 3.5c2.5 2.8 3.8 5.8 3.8 8.5S14.5 17.7 12 20.5C9.5 17.7 8.2 14.7 8.2 12S9.5 6.3 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.8 18.2c1.3-2 3.1-3 5.2-3s3.9 1 5.2 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="m12 3.8 2.3 4.7 5.2.8-3.8 3.7.9 5.2L12 15.8l-4.6 2.4.9-5.2-3.8-3.7 5.2-.8L12 3.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 12h12.5M13 6.5 18.5 12 13 17.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThumbUpIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 11v8H5.8A1.8 1.8 0 0 1 4 17.2V12.8A1.8 1.8 0 0 1 5.8 11H8Zm0 0 2.4-5.3A2 2 0 0 1 12.2 4.5c.9 0 1.5.8 1.3 1.6L12.8 11H19a2 2 0 0 1 2 2.2l-.7 4.2A3 3 0 0 1 17.3 20H8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThumbDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16 13V5h2.2A1.8 1.8 0 0 1 20 6.8v4.4A1.8 1.8 0 0 1 18.2 13H16Zm0 0-2.4 5.3a2 2 0 0 1-1.8 1.2c-.9 0-1.5-.8-1.3-1.6L11.2 13H5a2 2 0 0 1-2-2.2l.7-4.2A3 3 0 0 1 6.7 4H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" {...props}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
