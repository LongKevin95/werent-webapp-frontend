import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const baseButtonClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35A554]/25 disabled:cursor-not-allowed disabled:opacity-65";

const buttonVariantClassNames = {
  primary:
    "bg-[#35A554] text-white shadow-[0_14px_25px_rgba(50,164,82,0.22)] hover:bg-[#2C9349]",
  outline:
    "border border-[#D8E5DA] bg-white text-[#355C41] hover:bg-[#F6FAF7]",
  danger:
    "bg-[#D45252] text-white shadow-[0_12px_24px_rgba(212,82,82,0.2)] hover:bg-[#BE4444]",
  ghost: "bg-transparent text-[#355C41] hover:bg-[#F6FAF7]",
};

const buttonSizeClassNames = {
  sm: "h-10 px-3.5",
  md: "h-11 px-4",
  lg: "h-12 px-5",
  icon: "size-9 p-0",
};

const Button = forwardRef(function Button(
  {
    children,
    className,
    size = "md",
    type = "button",
    variant = "outline",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        baseButtonClassName,
        buttonVariantClassNames[variant],
        buttonSizeClassNames[size],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
