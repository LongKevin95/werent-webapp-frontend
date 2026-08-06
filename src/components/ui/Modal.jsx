import { useId } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import Button from "./Button";

const modalSizeClassNames = {
  sm: "max-w-[420px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
  xl: "max-w-[1180px]",
};

const modalHeaderVariantClassNames = {
  brand:
    "border-[#35A554] bg-[linear-gradient(90deg,#35A554_0%,#43B863_55%,#5BC879_100%)] text-white",
  default: "border-[#E8ECE7] bg-white text-[#1F252D]",
};

function Modal({
  ariaLabelledBy,
  children,
  className,
  closeButtonClassName,
  closeDisabled = false,
  closeIconClassName,
  closeLabel = "Đóng",
  closeOnBackdrop = false,
  contentClassName,
  footer,
  footerClassName,
  headerClassName,
  headerVariant = "default",
  isOpen = true,
  onClose,
  overlayClassName,
  showCloseButton = true,
  size = "md",
  title,
  titleClassName,
}) {
  const generatedTitleId = useId();
  const titleId = ariaLabelledBy ?? (title ? generatedTitleId : undefined);

  if (!isOpen) {
    return null;
  }

  function handleOverlayClick(event) {
    if (closeOnBackdrop && onClose && event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-[2px]",
        overlayClassName,
      )}
      onClick={handleOverlayClick}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "w-full overflow-hidden rounded-[24px] bg-white shadow-[0_24px_64px_rgba(31,37,45,0.22)]",
          modalSizeClassNames[size],
          className,
        )}
        role="dialog"
      >
        {title || showCloseButton ? (
          <div
            className={cn(
              "flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6",
              modalHeaderVariantClassNames[headerVariant],
              headerClassName,
            )}
          >
            {title ? (
              <h2
                className={cn(
                  "text-xl font-bold tracking-[-0.02em]",
                  headerVariant === "brand" ? "text-white" : "text-[#1F252D]",
                  titleClassName,
                )}
                id={titleId}
              >
                {title}
              </h2>
            ) : (
              <span />
            )}

            {showCloseButton && onClose ? (
              <Button
                aria-label={closeLabel}
                className={cn(
                  "shrink-0",
                  headerVariant === "brand"
                    ? "text-white hover:bg-transparent hover:text-white/80"
                    : "text-[#68717D] hover:bg-[#F1F5F1] hover:text-[#242A32]",
                  closeButtonClassName,
                )}
                disabled={closeDisabled}
                size="icon"
                variant="ghost"
                onClick={onClose}
              >
                <X className={cn("size-5", closeIconClassName)} />
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className={cn("px-5 pt-5 sm:px-6", contentClassName)}>
          {children}
        </div>

        {footer ? (
          <div
            className={cn(
              "flex flex-col-reverse gap-3 px-5 pb-5 pt-6 sm:flex-row sm:justify-end sm:px-6 sm:pb-6",
              footerClassName,
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
