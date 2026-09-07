"use client";

import { useConsoleTheme, type VisualMode } from "@/components/console/ConsoleThemeProvider";

const LANGUAGES = [
  { value: "browser", label: "Browser default" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "zh", label: "中文" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
] as const;

const VISUAL_MODES: { value: VisualMode; label: string }[] = [
  { value: "browser", label: "Browser default" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

type UserSettingsPopoverProps = {
  open: boolean;
};

export function UserSettingsPopover({ open }: UserSettingsPopoverProps) {
  const { visualMode, language, setVisualMode, setLanguage } = useConsoleTheme();

  if (!open) return null;

  return (
    <div className="console-settings-menu" role="dialog" aria-label="Current user settings">
      <h2 className="console-settings-menu__title">Current user settings</h2>

      <div className="console-settings-menu__section">
        <label className="console-settings-menu__label" htmlFor="console-settings-language">
          Language
        </label>
        <select
          id="console-settings-language"
          className="console-select console-settings-menu__select"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {LANGUAGES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="console-settings-menu__section">
        <p className="console-settings-menu__label" id="console-visual-mode-label">
          Visual mode - <em>beta</em>
        </p>
        <div
          className="console-settings-menu__radios"
          role="radiogroup"
          aria-labelledby="console-visual-mode-label"
        >
          {VISUAL_MODES.map((mode) => {
            const checked = visualMode === mode.value;
            return (
              <label key={mode.value} className="console-settings-menu__radio">
                <input
                  type="radio"
                  name="console-visual-mode"
                  value={mode.value}
                  checked={checked}
                  onChange={() => setVisualMode(mode.value)}
                />
                <span className="console-settings-menu__radio-ui" aria-hidden="true" />
                <span>{mode.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <a
        href="#"
        className="console-settings-menu__footer-link"
        onClick={(event) => event.preventDefault()}
      >
        See all user settings
      </a>
    </div>
  );
}
