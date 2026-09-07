import { ChevronDownIcon, GlobeIcon, UserIcon } from "@/components/ui/icons";

const links = [
  { label: "Contact us", href: "#" },
  { label: "AWS Marketplace", href: "#" },
];

export function AwsTopBar() {
  return (
    <div className="bg-aws-topbar text-white">
      <div className="page-shell flex h-[58px] items-center justify-end gap-4 text-[13px] sm:gap-5">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-sm hover:underline"
          aria-haspopup="listbox"
          aria-label="Select language"
        >
          <GlobeIcon />
          <span>English</span>
          <ChevronDownIcon />
        </button>

        {links.map((link) => (
          <a key={link.label} href={link.href} className="hidden hover:underline sm:inline">
            {link.label}
          </a>
        ))}

        <button
          type="button"
          className="hidden items-center gap-1.5 hover:underline md:inline-flex"
          aria-haspopup="menu"
        >
          Support
          <ChevronDownIcon />
        </button>

        <button
          type="button"
          className="hidden items-center gap-1.5 hover:underline md:inline-flex"
          aria-haspopup="menu"
        >
          My account
          <ChevronDownIcon />
        </button>

        <button
          type="button"
          className="grid size-8 place-items-center rounded-full border border-white/40"
          aria-label="Account"
        >
          <UserIcon />
        </button>
      </div>
    </div>
  );
}
