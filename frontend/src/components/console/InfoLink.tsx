"use client";

type InfoLinkProps = {
  onClick?: () => void;
};

export function InfoLink({ onClick }: InfoLinkProps) {
  return (
    <button type="button" className="console-link hz-info-link" onClick={onClick}>
      Info
    </button>
  );
}
