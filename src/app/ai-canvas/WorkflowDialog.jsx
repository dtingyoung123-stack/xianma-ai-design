"use client"
import { useCallback, useLayoutEffect, useRef } from "react"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"

// Keep the existing dialog's mount/focus lifecycle stable while page-local
// forms and the task clock rerender. No shared dialog contract is changed.
export default function WorkflowDialog({ onClose, ...props }) {
  const latestClose = useRef(onClose)
  useLayoutEffect(() => { latestClose.current = onClose }, [onClose])
  const close = useCallback(() => latestClose.current(), [])
  return <WorkbenchPickerDialog {...props} onClose={close} />
}
