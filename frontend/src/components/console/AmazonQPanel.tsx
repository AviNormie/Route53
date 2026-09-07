"use client";

import { useId, useState } from "react";
import {
  FiBookOpen,
  FiChevronLeft,
  FiClock,
  FiMaximize2,
  FiPlus,
  FiSend,
  FiSettings,
} from "react-icons/fi";

const SUGGESTIONS = [
  {
    title: "How do I add a custom domain to my application?",
    body: "Learn how to configure DNS for a custom domain name.",
    tag: "Q&A",
  },
  {
    title: "List running EC2 instances",
    body: "Show EC2 instances currently running in this account.",
    tag: "Table",
  },
  {
    title: "How do I create a Route 53 hosted zone?",
    body: "Steps to create a public or private hosted zone.",
    tag: "Q&A",
  },
] as const;

function AmazonQMark({ size = 72 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `amazon-q-panel-grad-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="72" height="72" rx="16" fill={`url(#${gradientId})`} />
      <path
        fill="#fff"
        d="M52.4 22.1 36.4 12.9c-.7-.4-1.6-.6-2.5-.6s-1.8.2-2.5.6L15.4 22.1c-1.4.8-2.5 2.7-2.5 4.3v18.2c0 1.6 1.1 3.5 2.5 4.3l15.9 9.2c.7.4 1.6.6 2.5.6s1.8-.2 2.5-.6l15.9-9.2c1.4-.8 2.5-2.7 2.5-4.3V26.4c0-1.6-1.1-3.5-2.5-4.3h-.1ZM34 53.4 18.8 44.7V27.3L34 18.6l15.2 8.7v14L40.2 35v-2.1c0-.8-.4-1.4-1-1.8l-3.7-2.1c-.3-.2-.7-.3-1.1-.3s-.7.1-1.1.3l-3.7 2.1c-.6.4-1 1-1 1.8v4.3c0 .8.4 1.4 1 1.8l3.7 2.1c.3.2.7.3 1.1.3s.7-.1 1.1-.3l1.9-1.1 9.1 5.2L34 53.4Z"
      />
      <defs>
        <radialGradient
          id={gradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(78 -6) rotate(135) scale(120 154)"
        >
          <stop stopColor="#FF6AD5" />
          <stop offset="0.3" stopColor="#D946EF" />
          <stop offset="0.45" stopColor="#C026D3" />
          <stop offset="0.6" stopColor="#A855F7" />
          <stop offset="0.8" stopColor="#7C3AED" />
        </radialGradient>
      </defs>
    </svg>
  );
}

type AmazonQPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function AmazonQPanel({ open, onClose }: AmazonQPanelProps) {
  const [prompt, setPrompt] = useState("");

  if (!open) return null;

  return (
    <aside className="console-amazon-q" aria-label="Amazon Q">
      <header className="console-amazon-q__header">
        <h2 className="console-amazon-q__title">Amazon Q</h2>
        <div className="console-amazon-q__header-actions">
          <button type="button" className="console-amazon-q__icon-btn" aria-label="New conversation">
            <FiPlus size={16} />
          </button>
          <button type="button" className="console-amazon-q__icon-btn" aria-label="Resources">
            <FiBookOpen size={15} />
          </button>
          <button type="button" className="console-amazon-q__icon-btn" aria-label="History">
            <FiClock size={15} />
          </button>
          <button type="button" className="console-amazon-q__icon-btn" aria-label="Settings">
            <FiSettings size={15} />
          </button>
          <button type="button" className="console-amazon-q__icon-btn" aria-label="Expand">
            <FiMaximize2 size={14} />
          </button>
          <button
            type="button"
            className="console-amazon-q__icon-btn"
            aria-label="Collapse Amazon Q"
            onClick={onClose}
          >
            <FiChevronLeft size={18} />
          </button>
        </div>
      </header>

      <div className="console-amazon-q__body">
        <div className="console-amazon-q__hero">
          <AmazonQMark size={64} />
          <h3 className="console-amazon-q__heading">How can I help you today?</h3>
        </div>

        <div className="console-amazon-q__composer">
          <textarea
            className="console-amazon-q__input"
            rows={4}
            maxLength={10000}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to do with AWS, such as 'List all S3 buckets'."
          />
          <button type="button" className="console-amazon-q__send" aria-label="Send">
            <FiSend size={16} />
          </button>
          <p className="console-amazon-q__limit">Max 10000 characters.</p>
        </div>

        <div className="console-amazon-q__suggestions">
          {SUGGESTIONS.map((item) => (
            <button
              key={item.title}
              type="button"
              className="console-amazon-q__card"
              onClick={() => setPrompt(item.title)}
            >
              <strong>{item.title}</strong>
              <span>{item.body}</span>
              <em>{item.tag}</em>
            </button>
          ))}
        </div>
      </div>

      <footer className="console-amazon-q__footer">
        Help us improve Amazon Q by{" "}
        <a href="#" className="console-link">
          providing feedback
        </a>
        .
      </footer>
    </aside>
  );
}
