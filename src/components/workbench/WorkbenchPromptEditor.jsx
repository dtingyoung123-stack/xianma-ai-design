"use client"

import { useRef, useState } from "react"
import { Clipboard, Palette, Sparkles } from "lucide-react"
import WorkbenchTextEditor, { WorkbenchTextEditorAction } from "@/components/workbench/WorkbenchTextEditor"
import { BackgroundColorPicker } from "@/components/workbench/ColorConstraintPicker"
import { backgroundColorPrompt, insertBackgroundColorPrompt } from "@/lib/background-color-prompt.mjs"

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
  maxLength,
  ariaLabel = title,
  afterInput,
  backgroundColorMode,
}) {
  const hasContent = Boolean(String(value || "").trim())
  const [colorOpen, setColorOpen] = useState(false)
  const previousColorPrompt = useRef("")

  function insertColor(color) {
    const next = backgroundColorPrompt(backgroundColorMode, color)
    const updated = insertBackgroundColorPrompt(value, previousColorPrompt.current, next)
    if (maxLength && updated.length > maxLength) return `插入后超过 ${maxLength} 字，请先精简提示词再选择颜色。`
    onChange(updated)
    previousColorPrompt.current = next
    setColorOpen(false)
  }

  return (
    <WorkbenchTextEditor
      title={title}
      value={value}
      onChange={onChange}
      onClear={onClear}
      placeholder={placeholder}
      helperText={helperText}
      rows={rows}
      maxLength={maxLength}
      ariaLabel={ariaLabel}
      afterInput={<>{afterInput}{colorOpen && <BackgroundColorPicker onSelect={insertColor} onClose={() => setColorOpen(false)} />}</>}
      toolbar={(
        <>
          {backgroundColorMode && <WorkbenchTextEditorAction icon={Palette} label="更改背景色" onClick={() => setColorOpen(true)} />}
          <WorkbenchTextEditorAction icon={Clipboard} label="提示词模板" onClick={onTemplate} />
          <WorkbenchTextEditorAction icon={Sparkles} label="AI 润色" onClick={onPolish} primary disabled={!hasContent} />
        </>
      )}
    />
  )
}
