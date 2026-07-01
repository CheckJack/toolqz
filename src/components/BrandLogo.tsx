import Link from "next/link";

interface BrandLogoProps {
  as?: "link" | "span";
  size?: "sm" | "lg";
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "text-[15px]",
  lg: "text-[15px] sm:text-[17px]",
};

export function BrandLogo({
  as = "link",
  size = "sm",
  className = "",
  onClick,
}: BrandLogoProps) {
  const mark = (
    <>
      TOOL<span className="text-neon">QZ</span>
    </>
  );

  const baseClass = `${sizeClasses[size]} font-semibold tracking-[-0.03em] text-white ${className}`;

  if (as === "span") {
    return <span className={baseClass}>{mark}</span>;
  }

  return (
    <Link href="/" className={baseClass} onClick={onClick}>
      {mark}
    </Link>
  );
}
