import { ChevronDownIcon, GlobeIcon } from "@/components/ui/icons";

const columns = [
  {
    title: "Learn",
    links: [
      "What Is AWS?",
      "What Is Cloud Computing?",
      "What Is Agentic AI?",
      "Cloud Computing Concepts Hub",
      "AWS Cloud Security",
    ],
  },
  {
    title: "Resources",
    links: [
      "Getting Started",
      "Training",
      "AWS Trust Center",
      "AWS Solutions Library",
      "Architecture Center",
    ],
  },
  {
    title: "Developers",
    links: [
      "Builder Center",
      "SDKs & Tools",
      ".NET on AWS",
      "Python on AWS",
      "Java on AWS",
    ],
  },
  {
    title: "Help",
    links: [
      "Contact Us",
      "File a Support Ticket",
      "AWS re:Post",
      "Knowledge Center",
      "AWS Support Overview",
    ],
  },
] as const;

export function AwsFooter() {
  return (
    <footer className="footer-shell mt-10 pt-10 pb-16">
      <div className="page-shell">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="#" className="btn-pill inline-flex min-h-12 bg-white px-6 font-bold text-aws-ink hover:bg-aws-muted-bg">
            Create an AWS account
          </a>

          <button
            type="button"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/50 px-5 text-sm text-white"
            aria-haspopup="listbox"
            aria-label="Select language"
          >
            <GlobeIcon />
            English
            <ChevronDownIcon />
          </button>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="mb-4 text-base font-bold text-white">{column.title}</h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-aws-footer-link hover:text-white hover:underline">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a href="#overview" className="text-sm text-aws-footer-link hover:text-white hover:underline">
            ↑ Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
