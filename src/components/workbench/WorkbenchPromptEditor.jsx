"use client"

import { Clipboard, Sparkles } from "lucide-react"
import WorkbenchTextEditor, { WorkbenchTextEditorAction } from "@/components/workbench/WorkbenchTextEditor"

export default function WorkbenchPromptEditor({
  title = "创作指令",
  value,
  onChange,
  onTemplate,
  onClear,
  onPolish,
  placeholder = "请输入提示词",
  helperText,
  rows = 8,
  ariaLabel = title,
  afterInput,
}) {
  const hasContent = Boolean(String(value || "").trim())

  return (
    <WorkbenchTextEditor
      title={title}
      value={value}
      onChange={onChange}
      onClear={onClear}
      placeholder={placeholder}
      helperText={helperText}
      rows={rows}
      ariaLabel={ariaLabel}
      afterInput={afterInput}
      toolbar={(
        <>
          <WorkbenchTextEditorAction icon={Clipboard} label="提示词模板" onClick={onTemplate} />
          <WorkbenchTextEditorAction icon={Sparkles} label="AI 润色" onClick={onPolish} primary disabled={!hasContent} />
        </>
      )}
    />
  )
}
