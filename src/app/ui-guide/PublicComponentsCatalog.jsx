"use client"

import { useMemo, useState } from "react"
import { Boxes, ChevronDown, Copy, Eye, FolderTree, Image as ImageIcon, Layers3, Search, Sparkles, Trash2, Wrench } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import { ColorConstraintChips } from "@/components/workbench/ColorConstraintPicker"
import ImagePreviewModal from "@/components/workbench/ImagePreviewModal"
import ImageQueueModule from "@/components/workbench/ImageQueueModule"
import PromptPickerModal from "@/components/workbench/PromptPickerModal"
import {
  WorkbenchButton,
  WorkbenchEmpty,
  WorkbenchModule,
} from "@/components/workbench/Workbench"
import {
  WorkbenchModelSelect,
  WorkbenchParameterSelect,
} from "@/components/workbench/WorkbenchControls"
import WorkbenchPromptEditor from "@/components/workbench/WorkbenchPromptEditor"
import WorkbenchRecentHistory from "@/components/workbench/WorkbenchRecentHistory"
import WorkbenchTextEditor, { WorkbenchTextEditorAction } from "@/components/workbench/WorkbenchTextEditor"
import { componentCatalog, componentCatalogCategories } from "@/config/component-catalog"
import { buyerShowPersonalAssets, buyerShowPublicAssets, buyerShowTeamAssets } from "@/data/demo/asset-picker"
import { expertModels } from "@/data/demo/expert"
import { initialPrompts } from "@/data/demo/prompts"
import { subjectReplaceHistory } from "@/data/demo/subject-replace"

const categoryIcons = { global: Layers3, ui: Boxes, workbench: Wrench }

export default function PublicComponentsCatalog() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [textDemo, setTextDemo] = useState("轻便收纳，材质耐磨，适合厨房和客厅日常整理。")
  const [promptDemo, setPromptDemo] = useState("生成真实自然的居家买家秀，保持商品结构与颜色准确。")
  const [colors, setColors] = useState([{ hex: "#D9353F" }, { hex: "#344054" }])
  const [model, setModel] = useState(expertModels[0].name)
  const [resolution, setResolution] = useState("2K")
  const [modal, setModal] = useState("")
  const [previewIndex, setPreviewIndex] = useState(0)

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return componentCatalog.filter((item) => {
      const categoryMatch = category === "all" || item.category === category
      const haystack = `${item.name} ${item.path} ${item.description} ${item.usage.join(" ")}`.toLowerCase()
      return categoryMatch && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
  }, [category, query])

  return (
    <div className="pb-10">
      <section className="mb-6 border-b pb-6" style={{ borderColor: "var(--border-base)" }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]"><FolderTree size={17} />真实代码目录</div>
            <h2 className="mt-2 text-2xl font-bold text-[var(--text-title)]">公共组件分布</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">只统计 src/components 下实际复用的组件文件，页面局部组件和规范示例不计入。</p>
          </div>
          <div className="text-sm text-[var(--text-secondary)]"><strong className="mr-1 text-2xl text-[var(--text-title)]">{componentCatalog.length}</strong>个公共组件文件</div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {componentCatalogCategories.map((item) => {
            const Icon = categoryIcons[item.id]
            const count = componentCatalog.filter((component) => component.category === item.id).length
            return (
              <button key={item.id} type="button" onClick={() => setCategory(category === item.id ? "all" : item.id)}
                className="flex min-h-20 items-center gap-3 rounded-lg border px-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                style={category === item.id ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", background: "var(--white)" }}>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--gray-100)] text-[var(--brand-primary)]"><Icon size={19} /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm text-[var(--text-title)]">{item.label} · {count}</strong>
                  <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{item.path}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="sticky top-0 z-20 mb-2 flex flex-col gap-2 border-y bg-[var(--white)]/95 py-3 backdrop-blur-sm sm:flex-row sm:items-center" style={{ borderColor: "var(--border-light)" }}>
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-[var(--white)] px-3 text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索组件名称、路径或使用页面" aria-label="搜索公共组件" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-body)] outline-none" />
        </label>
        <div className="flex flex-wrap gap-1 rounded-lg bg-[var(--gray-100)] p-1" role="tablist" aria-label="组件目录筛选">
          {[{ id: "all", label: "全部" }, ...componentCatalogCategories].map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={category === item.id} onClick={() => setCategory(item.id)}
              className="h-8 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              style={category === item.id ? { background: "var(--white)", color: "var(--brand-primary)", boxShadow: "var(--shadow-control)" } : { color: "var(--text-secondary)" }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {componentCatalogCategories.map((group) => {
        const groupItems = visibleItems.filter((item) => item.category === group.id)
        if (!groupItems.length) return null
        return (
          <section key={group.id} className="pt-7">
            <div className="mb-1 flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--brand-primary-border)" }}>
              <h2 className="text-lg font-bold text-[var(--text-title)]">{group.label}</h2>
              <span className="rounded-md bg-[var(--gray-100)] px-2 py-1 text-xs text-[var(--text-secondary)]">{groupItems.length}</span>
              <span className="ml-auto hidden font-mono text-xs text-[var(--text-disabled)] sm:block">{group.path}</span>
            </div>
            {groupItems.map((item) => (
              <article key={item.id} className="grid gap-5 border-b py-6 xl:grid-cols-[minmax(260px,0.8fr)_minmax(380px,1.2fr)]" style={{ borderColor: "var(--border-light)" }}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--text-title)]">{item.name}</h3>
                    <span className="rounded-md bg-[var(--brand-primary-soft)] px-2 py-1 text-[11px] text-[var(--brand-primary)]">{item.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{item.description}</p>
                  <div className="mt-3 break-all rounded-md bg-[var(--gray-50)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{item.path}</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.usage.map((usage) => <span key={usage} className="rounded-md border px-2 py-1 text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>{usage}</span>)}
                  </div>
                </div>
                <div className="min-w-0 rounded-lg border bg-[var(--gray-25)] p-3" style={{ borderColor: "var(--border-base)" }}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{isStructuralPreview(item.preview) ? "结构预览" : "真实组件演示"}</span>
                    <span className="text-[11px] text-[var(--text-disabled)]">{item.name}</span>
                  </div>
                  <ComponentPreview
                    item={item}
                    textDemo={textDemo} setTextDemo={setTextDemo}
                    promptDemo={promptDemo} setPromptDemo={setPromptDemo}
                    colors={colors} setColors={setColors}
                    model={model} setModel={setModel}
                    resolution={resolution} setResolution={setResolution}
                    setModal={setModal}
                  />
                </div>
              </article>
            ))}
          </section>
        )
      })}

      {!visibleItems.length && (
        <div className="flex min-h-64 flex-col items-center justify-center border-b text-center" style={{ borderColor: "var(--border-light)" }}>
          <Search size={28} className="text-[var(--text-disabled)]" />
          <strong className="mt-3 text-sm text-[var(--text-title)]">没有匹配的公共组件</strong>
          <button type="button" onClick={() => { setQuery(""); setCategory("all") }} className="mt-2 text-sm font-medium text-[var(--brand-primary)]">清除筛选</button>
        </div>
      )}

      {modal === "asset" && (
        <AssetPickerModal personalAssets={buyerShowPersonalAssets} teamAssets={buyerShowTeamAssets} publicAssets={buyerShowPublicAssets} max={4} onClose={() => setModal("")} onConfirm={() => setModal("")} />
      )}
      {modal === "prompt" && (
        <PromptPickerModal prompts={initialPrompts} defaultLibrary="team" initialSelectedId="" onClose={() => setModal("")} onConfirm={(selectedPrompt) => { setPromptDemo(selectedPrompt.content); setModal("") }} />
      )}
      {modal === "preview" && (
        <ImagePreviewModal images={buyerShowPersonalAssets} index={previewIndex} setIndex={setPreviewIndex} getSrc={(image) => image.src} getName={(image) => image.title} onClose={() => setModal("")} />
      )}
    </div>
  )
}

function ComponentPreview({ item, textDemo, setTextDemo, promptDemo, setPromptDemo, colors, setColors, model, setModel, resolution, setResolution, setModal }) {
  if (isStructuralPreview(item.preview)) return <StructuralPreview type={item.preview} />

  if (item.preview === "safe-image") {
    return <div className="flex items-center gap-3"><SafeImage src="/assets/buyer.webp" alt="SafeImage 示例" className="size-20 rounded-lg object-cover" /><span className="text-xs leading-5 text-[var(--text-secondary)]">加载成功时显示图片，失败时安全隐藏。</span></div>
  }

  if (item.preview === "button") {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button>主要操作</Button>
          <Button variant="outline">次要操作</Button>
          <Button variant="secondary">柔和按钮</Button>
          <Button variant="ghost">文字操作</Button>
          <Button variant="destructive"><Trash2 />删除</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">小尺寸</Button>
          <Button>默认尺寸</Button>
          <Button size="lg">大尺寸</Button>
          <Button disabled>禁用状态</Button>
          <Button variant="outline" disabled>禁用描边</Button>
        </div>
      </div>
    )
  }

  if (item.preview === "avatar") {
    return (
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Avatar size="lg"><AvatarImage src="/assets/buyer.webp" alt="用户头像" /><AvatarFallback>肖</AvatarFallback><AvatarBadge /></Avatar>
          <div><p className="text-sm font-medium text-[var(--text-title)]">图片头像</p><p className="text-xs text-[var(--text-secondary)]">含在线状态</p></div>
        </div>
        <AvatarGroup>
          <Avatar><AvatarFallback>肖</AvatarFallback><AvatarBadge /></Avatar>
          <Avatar><AvatarFallback>设</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>运</AvatarFallback></Avatar>
          <AvatarGroupCount>+8</AvatarGroupCount>
        </AvatarGroup>
      </div>
    )
  }

  if (item.preview === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>打开菜单 <ChevronDown /></DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>组件操作</DropdownMenuLabel>
            <DropdownMenuItem><Eye />查看详情</DropdownMenuItem>
            <DropdownMenuItem><Copy />复制配置</DropdownMenuItem>
            <DropdownMenuItem disabled>暂不可用</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive"><Trash2 />删除组件</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (item.preview === "workbench") {
    return <div className="space-y-3"><WorkbenchModule title="参数模块" hint="公共骨架"><div className="h-12 rounded-lg bg-[var(--gray-100)]" /></WorkbenchModule><div className="flex gap-2"><WorkbenchButton className="flex-1">主操作</WorkbenchButton><WorkbenchButton variant="ghost">次操作</WorkbenchButton></div><WorkbenchEmpty title="暂无结果" description="完成配置后，结果会在这里展示。" className="min-h-32" /></div>
  }

  if (item.preview === "controls") {
    return <div className="grid gap-2 sm:grid-cols-2"><WorkbenchModelSelect value={model} onChange={setModel} options={expertModels} /><WorkbenchParameterSelect label="清晰度" summary={resolution} sections={[{ key: "resolution", label: "清晰度", value: resolution, options: ["1K", "2K", "4K"], onChange: setResolution }]} /></div>
  }

  if (item.preview === "asset-picker") return <Button variant="outline" onClick={() => setModal("asset")}><ImageIcon />打开素材选择器</Button>
  if (item.preview === "prompt-picker") return <Button variant="outline" onClick={() => setModal("prompt")}><Sparkles />打开提示词选择器</Button>
  if (item.preview === "image-preview") return <Button variant="outline" onClick={() => setModal("preview")}><ImageIcon />打开图片预览</Button>

  if (item.preview === "image-queue") {
    return <ImageQueueModule title="参考图片" images={[]} max={4} onOpenAssetPicker={() => setModal("asset")} onLocalImages={() => {}} onRemove={() => {}} onRefresh={() => {}} onReorder={() => {}} />
  }

  if (item.preview === "colors") {
    return <ColorConstraintChips colors={colors} onRemove={(hex) => setColors((items) => items.filter((color) => color.hex !== hex))} />
  }

  if (item.preview === "text-editor") {
    return <WorkbenchTextEditor title="卖点文案" value={textDemo} onChange={setTextDemo} onClear={() => setTextDemo("")} maxLength={500} rows={3} toolbar={<WorkbenchTextEditorAction icon={Sparkles} label="AI 润色" onClick={() => setTextDemo((value) => `${value} 表达简洁有力。`)} primary disabled={!textDemo.trim()} />} afterInput={<div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--gray-100)] p-1"><button type="button" className="h-8 rounded-md bg-[var(--white)] text-xs font-semibold text-[var(--brand-primary)] shadow-[var(--shadow-control)]">英语</button><button type="button" className="h-8 rounded-md text-xs font-semibold text-[var(--text-secondary)]">中文</button></div>} />
  }

  if (item.preview === "prompt-editor") {
    return <WorkbenchPromptEditor title="综合提示词" value={promptDemo} onChange={setPromptDemo} onTemplate={() => setModal("prompt")} onClear={() => setPromptDemo("")} onPolish={() => setPromptDemo((value) => `${value} 画面自然可信。`)} rows={3} afterInput={<ColorConstraintChips colors={colors} onRemove={(hex) => setColors((items) => items.filter((color) => color.hex !== hex))} />} />
  }

  if (item.preview === "recent-history") {
    return <div className="h-80 overflow-hidden rounded-lg border bg-[var(--white)]" style={{ borderColor: "var(--border-base)" }}><WorkbenchRecentHistory items={subjectReplaceHistory.slice(0, 3)} source="subject-replace" sourceLabel="主体替换" onRefresh={() => {}} onCopy={() => {}} onContinue={() => {}} className="h-full border-0" /></div>
  }

  return <StructuralPreview type="generic" />
}

function StructuralPreview({ type }) {
  if (type === "topbar") return <div className="flex h-14 items-center gap-3 rounded-lg border bg-[var(--white)] px-3" style={{ borderColor: "var(--border-base)" }}><span className="size-8 rounded-full bg-[var(--brand-primary)]" /><span className="h-3 w-24 rounded bg-[var(--gray-200)]" /><span className="ml-auto h-8 w-40 rounded-full bg-[var(--gray-100)]" /></div>
  if (type === "sidebar") return <div className="flex h-44 w-48 flex-col gap-2 rounded-lg border bg-[var(--white)] p-3" style={{ borderColor: "var(--border-base)" }}>{[72, 124, 92, 112].map((width, index) => <span key={width} className="h-8 rounded-md" style={{ width, background: index === 1 ? "var(--brand-primary-soft)" : "var(--gray-100)" }} />)}</div>
  if (type === "page-shell" || type === "page-header") return <div className="space-y-3"><div className="flex items-center gap-2"><span className="h-3 w-12 rounded bg-[var(--brand-primary-soft)]" /><span className="h-3 w-32 rounded bg-[var(--gray-200)]" /></div><div className="h-6 w-44 rounded bg-[var(--gray-300)]" /><div className="h-28 rounded-lg border bg-[var(--white)]" style={{ borderColor: "var(--border-base)" }} /></div>
  if (type === "placeholder") return <div className="grid min-h-36 place-items-center rounded-lg border border-dashed bg-[var(--white)] text-center" style={{ borderColor: "var(--border-base)" }}><div><Boxes size={28} className="mx-auto text-[var(--text-disabled)]" /><strong className="mt-2 block text-sm text-[var(--text-title)]">功能建设中</strong></div></div>
  if (type === "layout") return <div className="grid h-44 grid-cols-[80px_1fr] grid-rows-[42px_1fr] overflow-hidden rounded-lg border bg-[var(--white)]" style={{ borderColor: "var(--border-base)" }}><div className="col-span-2 border-b bg-[var(--gray-50)]" style={{ borderColor: "var(--border-light)" }} /><div className="border-r bg-[var(--gray-50)]" style={{ borderColor: "var(--border-light)" }} /><div className="m-3 rounded-lg bg-[var(--gray-100)]" /></div>
  if (type === "picker-base") return <div className="mx-auto max-w-sm overflow-hidden rounded-lg border bg-[var(--white)] shadow-[var(--shadow-card)]" style={{ borderColor: "var(--border-base)" }}><div className="border-b p-3 text-sm font-semibold text-[var(--text-title)]" style={{ borderColor: "var(--border-light)" }}>选择内容</div><div className="h-24 bg-[var(--gray-50)] p-3"><div className="h-full rounded border border-dashed" style={{ borderColor: "var(--border-base)" }} /></div><div className="flex justify-end gap-2 border-t p-3" style={{ borderColor: "var(--border-light)" }}><span className="h-8 w-14 rounded bg-[var(--gray-100)]" /><span className="h-8 w-14 rounded bg-[var(--brand-primary)]" /></div></div>
  if (type === "region-editor") return <div className="grid h-44 grid-cols-[1fr_72px] overflow-hidden rounded-lg border bg-[var(--gray-900)]" style={{ borderColor: "var(--border-base)" }}><div className="m-4 rounded bg-[var(--gray-700)]" /><div className="flex flex-col gap-2 border-l bg-[var(--white)] p-2" style={{ borderColor: "var(--border-light)" }}>{[1, 2, 3, 4].map((item) => <span key={item} className="h-8 rounded bg-[var(--gray-100)]" />)}</div></div>
  return <div className="h-36 rounded-lg border border-dashed bg-[var(--white)]" style={{ borderColor: "var(--border-base)" }} />
}

function isStructuralPreview(preview) {
  return ["layout", "topbar", "sidebar", "page-shell", "page-header", "placeholder", "picker-base", "region-editor"].includes(preview)
}
