"use client"

import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

export default function WorkbenchPickerDialog({
  eyebrow,
  title,
  description,
  width = "960px",
  onClose,
  children,
  footer,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)

  useEffect(() => {
    const previousActiveElement = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const panel = panelRef.current
    const initialFocus = panel?.querySelector(focusableSelector)
    initialFocus?.focus()

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== "Tab" || !panel) return

      const focusable = Array.from(panel.querySelectorAll(focusableSelector))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousActiveElement?.focus?.()
    }
  }, [onClose])

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5"
      style={{ background: "var(--overlay-scrim)" }}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:max-h-[calc(100dvh-40px)]"
        style={{ maxWidth: width }}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b px-4 py-3.5 sm:px-5" style={{ borderColor: "var(--border-base)" }}>
          <div className="min-w-0">
            {eyebrow && <span className="mb-1.5 block text-xs font-semibold text-[var(--brand-primary)]">{eyebrow}</span>}
            <h2 id={titleId} className="text-base font-semibold text-[var(--text-title)] sm:text-lg">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`关闭${title}`}
            title="关闭"
            className="grid size-8 shrink-0 place-items-center rounded-md border text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            style={{ borderColor: "var(--border-base)" }}
          >
            <X size={17} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border-base)" }}>
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body,
  )
}
