import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none select-none focus-visible:shadow-[var(--focus-ring)] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-[var(--danger)] aria-invalid:shadow-[0_0_0_3px_var(--danger-bg)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] hover:bg-[var(--brand-primary-hover)] active:bg-[var(--brand-primary-active)] disabled:bg-[var(--gray-200)] disabled:text-[var(--text-disabled)]",
        outline:
          "border-[var(--border-base)] bg-[var(--bg-card)] text-[var(--text-title)] shadow-[var(--shadow-control)] hover:border-[var(--gray-300)] hover:bg-[var(--gray-50)] aria-expanded:border-[var(--gray-300)] aria-expanded:bg-[var(--gray-50)] disabled:bg-[var(--gray-50)] disabled:text-[var(--text-disabled)] disabled:shadow-none",
        secondary:
          "border-[var(--brand-primary-border)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--camellia-alpha-14)] aria-expanded:bg-[var(--camellia-alpha-14)] disabled:border-[var(--border-light)] disabled:bg-[var(--gray-50)] disabled:text-[var(--text-disabled)]",
        ghost:
          "bg-transparent text-[var(--text-body)] hover:bg-[var(--gray-100)] hover:text-[var(--text-title)] aria-expanded:bg-[var(--gray-100)] disabled:text-[var(--text-disabled)]",
        destructive:
          "bg-[var(--danger)] text-[var(--white)] hover:brightness-95 focus-visible:shadow-[0_0_0_3px_var(--danger-bg)] disabled:bg-[var(--gray-200)] disabled:text-[var(--text-disabled)]",
        link: "text-[var(--brand-primary)] underline-offset-4 hover:text-[var(--brand-primary-hover)] hover:underline disabled:text-[var(--text-disabled)]",
      },
      size: {
        default:
          "h-[var(--button-height-md)] gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1.5 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-[var(--button-height-sm)] gap-1.5 px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[var(--button-height-lg)] gap-2 px-5",
        icon: "size-[var(--button-height-md)]",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-[var(--button-height-lg)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
