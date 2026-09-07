import { FiExternalLink, FiTerminal } from "react-icons/fi";

const LEFT_LINKS = [
  { label: "CloudShell", icon: true },
  { label: "Agent Toolkit for AWS" },
  { label: "Feedback" },
  { label: "Console mobile app" },
] as const;

const RIGHT_LINKS = ["Privacy", "Terms", "Cookie preferences"] as const;

export function ConsoleFooter() {
  return (
    <footer className="console-footer">
      <div className="console-footer__left">
        {LEFT_LINKS.map((item) => (
          <a key={item.label} href="#" className="console-footer__link">
            {"icon" in item && item.icon ? (
              <FiTerminal size={12} aria-hidden="true" />
            ) : null}
            <span>{item.label}</span>
          </a>
        ))}
      </div>
      <div className="console-footer__right">
        <span className="console-footer__copy">
          © 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.
        </span>
        {RIGHT_LINKS.map((label) => (
          <a key={label} href="#" className="console-footer__link">
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}

export function ExternalHint() {
  return <FiExternalLink size={12} aria-hidden="true" className="console-ext-icon" />;
}
