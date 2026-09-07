import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { FiSearch } from "react-icons/fi";

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
};

export function ConsoleField({ label, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="console-field">
      <label className="console-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="console-field__hint">{hint}</p> : null}
    </div>
  );
}

export function ConsoleInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`console-input${className ? ` ${className}` : ""}`} {...rest} />;
}

export function ConsoleTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea className={`console-textarea${className ? ` ${className}` : ""}`} {...rest} />;
}

export function ConsoleSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select className={`console-select${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </select>
  );
}

export function ConsoleSearch({
  placeholder,
  value,
  onChange,
  className = "",
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`console-search${className ? ` ${className}` : ""}`}>
      <span className="console-search__icon" aria-hidden="true">
        <FiSearch size={14} />
      </span>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}
