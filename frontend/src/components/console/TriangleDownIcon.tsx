import { BsTriangleFill } from "react-icons/bs";
import type { IconBaseProps } from "react-icons";

/** Base angle after flipping the previous 120deg orientation upside-down. */
const BASE_DOWN_DEG = 120 + 180; // 300deg

type TriangleDownIconProps = IconBaseProps & {
  /** Extra rotation applied after the base flip (e.g. -90 when collapsed). */
  extraRotateDeg?: number;
};

export function TriangleDownIcon({
  style,
  className,
  extraRotateDeg = 0,
  size = 12,
  ...props
}: TriangleDownIconProps) {
  const transform =
    extraRotateDeg === 0
      ? `rotate(${BASE_DOWN_DEG}deg)`
      : `rotate(${BASE_DOWN_DEG + extraRotateDeg}deg)`;

  return (
    <BsTriangleFill
      size={size}
      aria-hidden="true"
      className={className}
      style={{ transform, display: "inline-block", flexShrink: 0, ...style }}
      {...props}
    />
  );
}

/** Up-facing triangle (account menu open, etc.) — flipped opposite of down. */
export function TriangleUpIcon({ style, className, size = 12, ...props }: IconBaseProps) {
  return (
    <BsTriangleFill
      size={size}
      aria-hidden="true"
      className={className}
      style={{
        transform: `rotate(${BASE_DOWN_DEG + 180}deg)`,
        display: "inline-block",
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
}
