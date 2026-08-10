"use client"

import { useState, useEffect, useRef } from "react"
import SafeImage from "@/components/SafeImage"
import ImageQueueModule from "@/components/workbench/ImageQueueModule"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import {
  WorkbenchModelSelect,
  WorkbenchParameterSelect,
  WorkbenchToast,
} from "@/components/workbench/WorkbenchControls"
import {
  WorkbenchButton,
  WorkbenchEmpty,
  WorkbenchFooter,
  WorkbenchModule,
  WorkbenchHistoryAction,
  WorkbenchPanel,
  WorkbenchPanelHead,
  WorkbenchScroll,
  WorkbenchShell,
} from "@/components/workbench/Workbench"
import { getBreadcrumbs } from "@/config/navigation"
import { suitePersonalAssets, suitePublicAssets, suiteTeamAssets } from "@/data/demo/asset-picker"

/* ================================================================
   AI 商品套图 — Layout data (matching prototype)
   ================================================================ */
const layoutTemplates = {
  platform: [
    { id: "p1",  name: "主图·居中留白",     dir: "square",     thumb: "/assets/layout-square-1.png" },
    { id: "p2",  name: "横幅·场景大图",     dir: "horizontal", thumb: "/assets/layout-horizontal-1.png" },
    { id: "p3",  name: "竖版长图·卖点罗列", dir: "vertical",   thumb: "/assets/layout-vertical-1.png" },
    { id: "p4",  name: "主图·卖点三点",     dir: "square",     thumb: "/assets/layout-square-2.png" },
    { id: "p5",  name: "A+·左图右文",       dir: "horizontal", thumb: "/assets/layout-horizontal-2.png" },
    { id: "p6",  name: "移动端·尺寸对比",   dir: "vertical",   thumb: "/assets/layout-vertical-2.png" },
    { id: "p7",  name: "主图·场景氛围",     dir: "square",     thumb: "/assets/layout-square-3.jpg" },
    { id: "p8",  name: "A+·三段式对比",     dir: "horizontal", thumb: "/assets/layout-horizontal-3.png" },
    { id: "p9",  name: "竖版·场景铺陈",     dir: "vertical",   thumb: "/assets/layout-vertical-3.png" },
    { id: "p10", name: "主图·四宫格细节",   dir: "square",     thumb: "/assets/layout-square-4.jpg" },
    { id: "p11", name: "横幅·卖点罗列",     dir: "horizontal", thumb: "/assets/layout-horizontal-4.png" },
    { id: "p12", name: "竖版详情·材质特写", dir: "vertical",   thumb: "/assets/layout-vertical-4.jpg" },
    { id: "p13", name: "主图·尺寸标注",     dir: "square",     thumb: "/assets/layout-square-5.jpg" },
    { id: "p14", name: "A+·全景场景",       dir: "horizontal", thumb: "/assets/layout-horizontal-5.jpg" },
    { id: "p15", name: "移动端A+·分段",     dir: "vertical",   thumb: "/assets/layout-vertical-5.jpg" },
    { id: "p16", name: "主图·多色展示",     dir: "square",     thumb: "/assets/layout-square-6.jpg" },
    { id: "p17", name: "横幅·中置标题",     dir: "horizontal", thumb: "/assets/layout-horizontal-6.jpg" },
    { id: "p18", name: "竖版·使用说明",     dir: "vertical",   thumb: "/assets/layout-vertical-6.jpg" },
    { id: "p19", name: "A+·细节特写带",     dir: "horizontal", thumb: "/assets/layout-horizontal-7.jpg" },
    { id: "p20", name: "横幅·材质展示",     dir: "horizontal", thumb: "/assets/layout-horizontal-8.jpg" },
  ],
  mine: []
}

const modelOptions = [
  { name: "Nano Banana 2", desc: "多参考图生成，适合复杂主体与长文本画面", eta: "75s", icon: "/assets/gemini.png" },
  { name: "Wan 2.7 Image Pro", desc: "中文指令稳定，适合商品、场景与主体编辑", eta: "61s", icon: "/assets/wan.png" },
  { name: "Nano Banana Pro", desc: "多参考图生成，适合复杂主体与长文本画面", eta: "79s", icon: "/assets/gemini.png" },
  { name: "Seedream 5.0", desc: "生成速度快，适合批量创意与商业出图", eta: "40s", icon: "/assets/seedream.svg" },
  { name: "GPT Image 2", desc: "细节还原强，适合高质量生成与局部修改", eta: "140s", icon: "/assets/gpt.svg" },
]

const ratioOptions = [
  { label: "智能比例", w: 24, h: 32, smart: true },
  { label: "1:1", w: 28, h: 28 },
  { label: "3:2", w: 34, h: 24 },
  { label: "2:3", w: 24, h: 34 },
  { label: "16:9", w: 38, h: 24 },
  { label: "4:3", w: 34, h: 28 },
  { label: "3:4", w: 28, h: 34 },
  { label: "9:16", w: 24, h: 38 },
]

/* ================================================================
   Main Page Component
   ================================================================ */
export default function SuitePage() {
  const crumbs = getBreadcrumbs(["AI 能力中心", "AI 商品套图"])

  // State
  const [products, setProducts] = useState([])
  const [sellPoints, setSellPoints] = useState("")
  const [language, setLanguage] = useState("英语")
  const [mainOn, setMainOn] = useState({ selling: true, detail: true, scene: true })
  const [aplusOn, setAplusOn] = useState({ adv: true, mobile: true })
  const [mainCounts, setMainCounts] = useState({ selling: 4, detail: 4, scene: 4 })
  const [aplusCounts, setAplusCounts] = useState({ adv: 4, mobile: 4 })
  const [mainNotext, setMainNotext] = useState(false)
  const [model, setModel] = useState("Nano Banana 2")
  const [resolution, setResolution] = useState("2K")
  const [ratio, setRatio] = useState("1:1")
  const [layoutMain, setLayoutMain] = useState([])
  const [layoutAplus, setLayoutAplus] = useState([])
  const [resultTab, setResultTab] = useState("全部")
  const [collapsed, setCollapsed] = useState({})

  // Modals
  const [layoutTarget, setLayoutTarget] = useState(null) // 'main'|'aplus'
  const [polishOpen, setPolishOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [assetReplaceIndex, setAssetReplaceIndex] = useState(null)

  // Generate
  const [generating, setGenerating] = useState(false)
  const [genDone, setGenDone] = useState(0)
  const [genTotal, setGenTotal] = useState(0)
  const [genResults, setGenResults] = useState(null)
  const timerRef = useRef(null)

  // Toast
  function toast(msg) { setToastMsg(msg); setTimeout(() => setToastMsg(""), 2500) }

  const mainTypes = [
    { key: "selling", name: "卖点图" },
    { key: "detail", name: "细节特写图" },
    { key: "scene", name: "场景图" },
  ]
  const aplusTypes = [
    { key: "adv", name: "高级A+", size: "1464×600 px" },
    { key: "mobile", name: "手机A+", size: "600×450 px" },
  ]

  // Generate
  function handleGenerate() {
    if (!products.length) return toast("请至少添加一张商品图片")
    if (!sellPoints.trim()) return toast("请填写商品卖点")
    if (sellPoints.length > 500) return toast("商品卖点不能超过 500 字")

    const groups = []
    mainTypes.forEach(t => {
      if (mainOn[t.key]) groups.push({ tab: t.name, name: t.name, kind: "main", count: layoutMain.length || mainCounts[t.key] })
    })
    aplusTypes.forEach(t => {
      if (aplusOn[t.key]) groups.push({ tab: t.name, name: t.name + " " + t.size, kind: "aplus", wide: t.key === "adv", count: layoutAplus.length || aplusCounts[t.key] })
    })
    if (!groups.length) return toast("请至少勾选一种图片类型")

    const total = groups.reduce((s, g) => s + g.count, 0)
    setGenResults(groups)
    setGenTotal(total)
    setGenDone(0)
    setGenerating(true)
    setResultTab("全部")
    setCollapsed({})
    toast(`开始生成整套 ${total} 张…`)

    timerRef.current = setInterval(() => {
      setGenDone(prev => {
        if (prev + 1 >= total) {
          clearInterval(timerRef.current)
          setGenerating(false)
          return total
        }
        return prev + 1
      })
    }, 320)
  }

  function handleClear() {
    clearInterval(timerRef.current)
    setProducts([]); setSellPoints(""); setLanguage("英语")
    setMainOn({ selling: true, detail: true, scene: true })
    setAplusOn({ adv: true, mobile: true })
    setMainCounts({ selling: 4, detail: 4, scene: 4 })
    setAplusCounts({ adv: 4, mobile: 4 })
    setMainNotext(false); setModel("Nano Banana 2"); setResolution("2K"); setRatio("1:1")
    setLayoutMain([]); setLayoutAplus([]); setResultTab("全部"); setCollapsed({})
    setGenerating(false); setGenDone(0); setGenResults(null)
    setClearOpen(false)
    toast("已清空当前配置和结果")
  }

  useEffect(() => { return () => clearInterval(timerRef.current) }, [])

  return (
    <WorkbenchShell
      crumbs={crumbs}
      status="已上线"
      title="AI 商品套图"
      description="多张商品图 + 卖点，一键产出亚马逊主副图矩阵与 A+ 套图。"
      actions={<WorkbenchHistoryAction source="product-suite" sourceLabel="AI 商品套图" params={{ model, resolution, ratio, language }} />}
      columns="minmax(360px, 3fr) minmax(0, 7fr)"
    >
        {/* Left Config */}
        <ConfigPanel
          products={products} setProducts={setProducts}
          sellPoints={sellPoints} setSellPoints={setSellPoints}
          language={language} setLanguage={setLanguage}
          mainOn={mainOn} setMainOn={setMainOn}
          aplusOn={aplusOn} setAplusOn={setAplusOn}
          mainCounts={mainCounts} setMainCounts={setMainCounts}
          aplusCounts={aplusCounts} setAplusCounts={setAplusCounts}
          mainNotext={mainNotext} setMainNotext={setMainNotext}
          model={model} setModel={setModel}
          resolution={resolution} setResolution={setResolution}
          ratio={ratio} setRatio={setRatio}
          layoutMain={layoutMain} layoutAplus={layoutAplus}
          assetReplaceIndex={assetReplaceIndex}
          onOpenLayout={setLayoutTarget}
          onOpenAssetPicker={() => { setAssetReplaceIndex(null); setAssetPickerOpen(true) }}
          onReplaceAsset={(index) => { setAssetReplaceIndex(index); setAssetPickerOpen(true) }}
          onPolish={() => setPolishOpen(true)}
          onNotify={toast}
          onGenerate={handleGenerate}
          onClear={() => setClearOpen(true)}
          generating={generating} genDone={genDone} genTotal={genTotal}
          mainTypes={mainTypes} aplusTypes={aplusTypes}
        />

        {/* Right Results */}
        <ResultsPanel
          results={genResults} generating={generating} genDone={genDone} genTotal={genTotal}
          resultTab={resultTab} setResultTab={setResultTab}
          collapsed={collapsed} setCollapsed={setCollapsed}
          mainNotext={mainNotext}
        />

      {/* Modals */}
      {layoutTarget && (
        <LayoutPicker
          target={layoutTarget}
          selected={layoutTarget === "main" ? layoutMain : layoutAplus}
          onConfirm={(ids) => {
            if (layoutTarget === "main") setLayoutMain(ids)
            else setLayoutAplus(ids)
            setLayoutTarget(null)
          }}
          onClose={() => setLayoutTarget(null)}
        />
      )}
      {polishOpen && <PolishModal sellPoints={sellPoints} onApply={(v) => { setSellPoints(v); setPolishOpen(false); toast("已应用润色结果") }} onClose={() => setPolishOpen(false)} />}
      {clearOpen && <ClearConfirm onConfirm={handleClear} onClose={() => setClearOpen(false)} />}
      {assetPickerOpen && (
        <AssetPickerModal
          title={assetReplaceIndex !== null ? `替换图${assetReplaceIndex + 1}` : "选择图片"}
          description={assetReplaceIndex !== null ? "选择 1 张图片替换当前队列图片。" : "从素材库、本地文件中选择一张或多张图片。"}
          max={assetReplaceIndex !== null ? 1 : Math.max(1, 16 - products.length)}
          defaultSource="mine"
          personalAssets={suitePersonalAssets}
          teamAssets={suiteTeamAssets}
          publicAssets={suitePublicAssets}
          onClose={() => { setAssetPickerOpen(false); setAssetReplaceIndex(null) }}
          onConfirm={(selectedAssets) => {
            const mapAsset = (asset, index = 0) => ({
              id: asset.id || `${asset.filename}-${Date.now()}-${index}`,
              title: asset.title || asset.name || asset.filename,
              filename: asset.filename,
              source: asset.source || "素材库",
              size: asset.size || "演示素材",
              img: asset.src || asset.img,
            })
            if (assetReplaceIndex !== null) {
              const asset = selectedAssets[0]
              if (asset) setProducts((prev) => prev.map((product, index) => index === assetReplaceIndex ? mapAsset(asset) : product))
              setAssetReplaceIndex(null)
              setAssetPickerOpen(false)
              return
            }
            const available = Math.max(0, 16 - products.length)
            const next = selectedAssets.slice(0, available).map(mapAsset)
            if (next.length) setProducts((prev) => [...prev, ...next])
            if (selectedAssets.length > available) toast("最多添加 16 张商品图片")
            setAssetReplaceIndex(null)
            setAssetPickerOpen(false)
          }}
        />
      )}
      <WorkbenchToast message={toastMsg} />
    </WorkbenchShell>
  )
}

/* ================================================================
   Shared Helpers
   ================================================================ */
function Module({ title, sub, action, children }) {
  return <WorkbenchModule title={title} hint={sub} action={action}>{children}</WorkbenchModule>
}

function CheckToggle({ on, onClick }) {
  return (
    <button onClick={onClick} className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 text-[13px] transition-colors"
      style={on ? { background: "var(--brand-primary)", borderColor: "var(--brand-primary)", color: "var(--white)" } : { borderColor: "var(--gray-300)", color: "transparent" }}>✓</button>
  )
}

function Stepper({ value, onChange, disabled }) {
  return (
    <div className="inline-flex items-center border rounded-full overflow-hidden bg-white" style={{ borderColor: "var(--border-base)" }}>
      <button disabled={disabled} onClick={() => onChange(-1)}
        className="w-[34px] h-[34px] grid place-items-center text-lg font-black transition-colors hover:bg-[var(--brand-primary-soft)]"
        style={{ color: disabled ? "var(--text-disabled)" : "var(--brand-primary)", background: disabled ? "var(--gray-50)" : "var(--brand-primary-soft)" }}>−</button>
      <span className="min-w-[44px] text-center text-sm font-black" style={{ color: "var(--text-title)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <button disabled={disabled} onClick={() => onChange(1)}
        className="w-[34px] h-[34px] grid place-items-center text-lg font-black transition-colors hover:bg-[var(--brand-primary-soft)]"
        style={{ color: disabled ? "var(--text-disabled)" : "var(--brand-primary)", background: disabled ? "var(--gray-50)" : "var(--brand-primary-soft)" }}>+</button>
    </div>
  )
}

function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} className="relative w-[38px] h-[22px] rounded-full transition-colors duration-150"
      style={{ background: on ? "var(--brand-primary)" : "var(--gray-300)" }}>
      <div className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-150"
        style={{ left: on ? "18px" : "2px" }} />
    </button>
  )
}

/* ================================================================
   Config Panel
   ================================================================ */
function ConfigPanel(props) {
  const { products, setProducts, sellPoints, setSellPoints, language, setLanguage,
    mainOn, setMainOn, aplusOn, setAplusOn, mainCounts, setMainCounts, aplusCounts, setAplusCounts,
    mainNotext, setMainNotext, model, setModel, resolution, setResolution, ratio, setRatio,
    layoutMain, layoutAplus, onOpenLayout, onOpenAssetPicker, onReplaceAsset, onPolish, onNotify, onGenerate, onClear, generating, genDone, genTotal,
    mainTypes, aplusTypes } = props

  function addProducts(nextProducts) {
    const existing = new Set(products.map((p) => p.img || p.filename))
    const available = Math.max(0, 16 - products.length)
    const deduped = nextProducts.filter((p) => !existing.has(p.img || p.filename)).slice(0, available)
    if (deduped.length) setProducts([...products, ...deduped])
  }

  function addLocalProducts(event) {
    const files = Array.from(event.target.files || [])
    addProducts(files.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      title: file.name,
      filename: file.name,
      source: "本地上传",
      size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
      img: URL.createObjectURL(file),
    })))
    event.target.value = ""
  }

  function removeProduct(index) {
    setProducts(products.filter((_, i) => i !== index))
  }

  return (
    <WorkbenchPanel>
      <WorkbenchScroll gap={14}>
        {/* ① 商品原图 */}
        <ImageQueueModule
          title="① 商品原图"
          images={products}
          assetSub="从个人、团体或公共素材库选择"
          uploadSub="支持 JPG/JPEG/PNG，可多选"
          emptyText="尚未添加商品图片，数组第 1 张将作为主图。"
          getSrc={(product) => product?.img}
          getName={(product) => product?.title || product?.filename}
          getSize={(product) => product?.size}
          getKey={(product, index) => product?.id || product?.filename || index}
          onOpenAssetPicker={onOpenAssetPicker}
          onLocalImages={addLocalProducts}
          onRemove={removeProduct}
          onRefresh={onReplaceAsset}
          onReorder={setProducts}
          onPreviewNotify={onNotify}
        />

        {/* ② 卖点文案 */}
        <Module
          title="② 卖点文案"
          action={(
            <button onClick={onPolish}
              className="h-7 px-3 rounded-full text-xs font-bold border bg-white transition-colors hover:text-[var(--brand-primary)]"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border-base)" }}>AI 润色</button>
          )}
        >
          <label className="text-[13px] font-bold block" style={{ color: "var(--text-secondary)" }}>填写商品卖点，生成时按所选语言上图</label>
          <textarea value={sellPoints} onChange={(e) => setSellPoints(e.target.value)} maxLength={500}
            placeholder="请输入商品核心卖点" rows={4}
            className="w-full p-3 rounded-xl border text-sm outline-none resize-y"
            style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} />
          <div className="text-right">
            <span className="text-xs" style={{ color: "var(--text-disabled)" }}>{sellPoints.length} / 500</span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>卖点通过版式模板叠加到图上，文字清晰可改、可一字不差复刻。</p>
          <div className="mt-2">
            <label className="text-[13px] font-bold block mb-2" style={{ color: "var(--text-secondary)" }}>生成图片语言</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: "var(--gray-100)" }}>
              {["英语", "中文"].map((l) => (
                <button key={l} onClick={() => setLanguage(l)}
                  className="h-[38px] rounded-lg text-sm font-bold border transition-all"
                  style={language === l
                    ? { background: "var(--white)", borderColor: "var(--brand-primary)", color: "var(--brand-primary)", boxShadow: "var(--shadow-card)" }
                    : { borderColor: "transparent", background: "transparent", color: "var(--text-secondary)" }}>{l}</button>
              ))}
            </div>
          </div>
        </Module>

        {/* ③ 主副图设置 */}
        <Module title="③ 主副图设置" sub="多选 · 常用 1:1">
          {mainTypes.map(t => {
            const on = mainOn[t.key], cnt = mainCounts[t.key]
            return (
              <div key={t.key} className="border rounded-xl p-2.5 flex items-center gap-2.5 mb-2"
                style={{ borderColor: on ? "var(--brand-primary)" : "var(--border-base)", background: on ? "var(--brand-primary-soft)" : "var(--white)" }}>
                <CheckToggle on={on} onClick={() => setMainOn({ ...mainOn, [t.key]: !on })} />
                <strong className="text-sm flex-1" style={{ color: "var(--text-title)" }}>{t.name}</strong>
                <span className="text-[11px] font-bold mr-2" style={{ color: "var(--text-disabled)" }}>最多9张</span>
                <Stepper value={cnt} onChange={(d) => setMainCounts({ ...mainCounts, [t.key]: Math.max(1, Math.min(9, cnt + d)) })}
                  disabled={layoutMain.length > 0} />
              </div>
            )
          })}
          <button onClick={() => onOpenLayout("main")}
            className="w-full mt-2 flex items-center justify-between border rounded-xl px-3 py-2.5 text-left text-[13px] font-bold bg-[var(--gray-50)] transition-colors hover:border-[var(--brand-primary)]"
            style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>
            <span>选择排版<br /><span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{layoutMain.length ? `已选 ${layoutMain.length} 个排版 · 每版生成一张` : "未选排版 · 按数量随机套用平台排版"}</span></span>
            <span style={{ color: "var(--text-disabled)" }}>›</span>
          </button>
          <label className="flex items-center gap-2 text-[13px] font-bold mt-2" style={{ color: "var(--text-body)" }}>
            <Switch on={mainNotext} onClick={() => setMainNotext(!mainNotext)} /> 无文字模式
          </label>
          <div className="mt-3">
            <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-title)" }}>生成比例</h4>
            <div className="grid grid-cols-4 gap-2 p-1.5 rounded-[14px]" style={{ background: "var(--gray-100)" }}>
              {ratioOptions.map(r => (
                <button key={r.label} onClick={() => setRatio(r.label)}
                  className="min-h-[70px] flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all"
                  style={ratio === r.label ? { background: "var(--white)", boxShadow: "var(--shadow-card)", color: "var(--brand-primary)" } : { color: "var(--text-secondary)" }}>
                  <span className="block border-[3px] rounded" style={{
                    width: r.w, height: r.h, borderColor: ratio === r.label ? "var(--brand-primary)" : "var(--gray-300)",
                    position: "relative"
                  }}>
                    {r.smart && <span className="absolute -right-3.5 top-1 w-5 h-3.5 border-[3px] rounded border-current" />}
                  </span>
                  <span className="text-[11px] font-bold">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 p-2.5 rounded-xl text-xs" style={{ background: "var(--warning-bg)", border: "1px solid var(--warning)", color: "var(--warning)" }}>
            💡 未选择排版时，将根据官方排版随机生成对应数量
          </div>
        </Module>

        {/* ④ A+ */}
        <Module title="④ A+ 详情页套图" sub="可同时勾选">
          {aplusTypes.map(t => {
            const on = aplusOn[t.key], cnt = aplusCounts[t.key]
            return (
              <div key={t.key} className="border rounded-xl p-2.5 flex items-center gap-2.5 mb-2"
                style={{ borderColor: on ? "var(--brand-primary)" : "var(--border-base)", background: on ? "var(--brand-primary-soft)" : "var(--white)" }}>
                <CheckToggle on={on} onClick={() => setAplusOn({ ...aplusOn, [t.key]: !on })} />
                <strong className="text-sm flex-1" style={{ color: "var(--text-title)" }}>{t.name}
                  <span className="font-semibold ml-2" style={{ color: "var(--text-secondary)" }}>{t.size}</span></strong>
                <Stepper value={cnt} onChange={(d) => setAplusCounts({ ...aplusCounts, [t.key]: Math.max(1, Math.min(9, cnt + d)) })}
                  disabled={layoutAplus.length > 0} />
              </div>
            )
          })}
          <button onClick={() => onOpenLayout("aplus")}
            className="w-full mt-2 flex items-center justify-between border rounded-xl px-3 py-2.5 text-left text-[13px] font-bold bg-[var(--gray-50)] transition-colors hover:border-[var(--brand-primary)]"
            style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>
            <span>选择排版<br /><span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{layoutAplus.length ? `已选 ${layoutAplus.length} 个排版 · 每版生成一张` : "未选排版 · 按数量随机套用平台排版"}</span></span>
            <span style={{ color: "var(--text-disabled)" }}>›</span>
          </button>
          <div className="text-[11px] font-semibold mt-1" style={{ color: "var(--text-disabled)" }}>
            A+ 固定生成 1464×600 px / 600×450 px，不受主副图比例和清晰度设置影响。
          </div>
        </Module>

        {/* 生成参数 */}
        <Module title="生成参数">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <WorkbenchModelSelect value={model} onChange={setModel} options={modelOptions} />
            <WorkbenchParameterSelect
              summary={`${resolution} · 高画质`}
              sections={[{ key: "resolution", label: "清晰度", value: resolution, options: ["1K", "2K", "4K"], onChange: setResolution }]}
              note="图片尺寸在主副图设置里选择；张数按每类图各自数量生成。"
            />
          </div>
        </Module>
      </WorkbenchScroll>

      {/* Footer */}
      <WorkbenchFooter>
        <WorkbenchButton onClick={onGenerate} disabled={generating} className="h-[46px] flex-1 rounded-xl text-[15px]">
          {generating ? `生成中… ${genDone}/${genTotal}` : "一键生成整套"}
        </WorkbenchButton>
        <WorkbenchButton variant="ghost" onClick={onClear} disabled={generating} className="h-[46px] w-[92px] rounded-xl">清空</WorkbenchButton>
      </WorkbenchFooter>
    </WorkbenchPanel>
  )
}

/* ================================================================
   Results Panel
   ================================================================ */
function ResultsPanel({ results, generating, genDone, genTotal, resultTab, setResultTab, collapsed, setCollapsed, mainNotext }) {
  if (!results) {
    return (
      <WorkbenchPanel className="min-w-0">
        <WorkbenchPanelHead title="结果预览" description="按类别分组展示整套图，可逐张下载 / 返修 / 加素材库。" />
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <WorkbenchEmpty title="还没有生成结果" description="配置好左侧参数，点「一键生成整套」，这里按类别展示整套图。" />
        </div>
      </WorkbenchPanel>
    )
  }

  const tabs = ["全部", ...results.map(g => g.tab)]
  const shown = resultTab === "全部" ? results : results.filter(g => g.tab === resultTab)

  return (
    <WorkbenchPanel className="min-w-0">
      <div className="shrink-0 px-4 py-3.5 border-b" style={{ borderColor: "var(--border-light)" }}>
        <WorkbenchPanelHead title="结果预览" description="按类别分组展示整套图，可逐张下载 / 返修 / 加素材库。" className="border-b-0 px-0 py-0 mb-3" />
        {generating && (
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl mb-3" style={{ background: "var(--brand-primary-soft)", border: "1px solid var(--brand-primary-soft)" }}>
            <span className="text-[13px] font-black" style={{ color: "var(--brand-primary)" }}>生成中… {genDone} / {genTotal} 张</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-200)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(genDone / genTotal * 100)}%`, background: "var(--brand-primary)" }} />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {tabs.map(t => {
            const n = t === "全部" ? genTotal : (results.find(g => g.tab === t) || { count: 0 }).count
            return (
              <button key={t} onClick={() => setResultTab(t)}
                className="h-[34px] px-3.5 rounded-full border text-[13px] font-bold inline-flex items-center gap-1.5 transition-colors"
                style={resultTab === t
                  ? { color: "var(--white)", borderColor: "var(--brand-primary)", background: "linear-gradient(180deg, var(--brand-primary-hover), var(--brand-primary-active))" }
                  : { color: "var(--text-body)", borderColor: "var(--border-base)", background: "var(--white)" }}>
                {t} <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                  style={resultTab === t ? { color: "var(--white)", background: "var(--brand-primary-soft)" } : { color: "var(--text-disabled)", background: "var(--gray-100)" }}>{n}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {shown.map(g => {
          const isCol = collapsed[g.name]
          return (
            <div key={g.name}>
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-2.5 cursor-pointer select-none"
                onClick={() => setCollapsed({ ...collapsed, [g.name]: !isCol })} style={{ color: "var(--text-title)" }}>
                <span style={{ color: "var(--text-disabled)", width: "14px" }}>{isCol ? "▸" : "▾"}</span>
                {g.name} <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--text-secondary)", background: "var(--gray-100)" }}>{g.count} 张</span>
              </h3>
              {!isCol && (
                <div className={g.wide ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-4 gap-2.5"}>
                  {Array.from({ length: g.count }, (_, i) => {
                    const ready = i < genDone
                    return (
                      <div key={i} className="relative aspect-square border rounded-xl overflow-hidden cursor-pointer group"
                        style={{ borderColor: "var(--border-base)", background: ready ? "transparent" : "var(--gray-100)" }}>
                        {ready ? (
                          <>
                            <img src={`/assets/mat-${(i % 8) + 1}.png`} alt="" className="w-full h-full object-cover" />
                            {g.kind === "main" && !mainNotext && (
                              <div className="absolute left-0 right-0 bottom-7 px-2 py-1 text-[10px] font-black text-white text-center truncate pointer-events-none"
                                style={{ textShadow: "0 1px 3px var(--overlay-scrim)" }}>防滑耐磨 · 易清洗</div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors">
                              <div className="absolute bottom-2 left-2 right-2 hidden group-hover:flex gap-1 text-[11px]">
                                <button className="px-2 py-1 rounded bg-white/90 font-bold" style={{ color: "var(--text-title)" }}>下载</button>
                                <button className="px-2 py-1 rounded bg-white/90 font-bold" style={{ color: "var(--text-title)" }}>编辑</button>
                                <button className="px-2 py-1 rounded bg-white/90 font-bold" style={{ color: "var(--text-title)" }}>加素材</button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: "var(--text-disabled)" }}>生成中…</div>
                        )}
                        <span className="absolute left-2 top-2 text-[11px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ background: "var(--gray-900)" }}>{i + 1}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </WorkbenchPanel>
  )
}

/* ================================================================
   Layout Picker Modal
   ================================================================ */
function LayoutPicker({ target, selected, onConfirm, onClose }) {
  const [tab, setTab] = useState("platform")
  const [dir, setDir] = useState("square")
  const [draft, setDraft] = useState([...selected])
  const LAY_MAX = 8

  const all = layoutTemplates.platform.concat(layoutTemplates.mine)
  const tplById = (id) => all.find(t => t.id === id)
  const source = layoutTemplates[tab] || []
  const list = source.filter(t => t.dir === dir)

  function toggle(id) {
    const i = draft.indexOf(id)
    if (i >= 0) setDraft(draft.filter(x => x !== id))
    else if (draft.length < LAY_MAX) setDraft([...draft, id])
  }

  const targetName = target === "aplus" ? "A+ 详情页套图" : "主副图"
  const tabNames = { platform: "平台推荐", mine: "我的", fav: "收藏" }
  const dirNames = { horizontal: "横版", square: "方形", vertical: "竖版" }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center" style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-[22px] shadow-2xl overflow-hidden flex flex-col"
        style={{ width: "min(1080px, calc(100vw - 80px))", height: "min(720px, calc(100vh - 80px))" }}>
        {/* Header */}
        <div className="flex justify-between items-start gap-4 px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--border-light)" }}>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-title)" }}>选择排版 · {targetName}</h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              {target === "aplus" ? "A+ 排版用于固定尺寸，不受主副图比例和清晰度设置影响" : "排版决定卖点文案如何排布上图；最终横/竖以主副图生成比例为准"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] text-lg"
            style={{ color: "var(--text-secondary)" }}>×</button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: grid */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border-light)" }}>
              <div className="flex gap-2">
                {Object.entries(tabNames).map(([k, v]) => (
                  <button key={k} onClick={() => { setTab(k); setDir("square") }}
                    className="h-8 px-3.5 rounded-full text-[13px] font-bold transition-colors"
                    style={tab === k ? { background: "var(--brand-primary)", color: "var(--white)" } : { color: "var(--text-secondary)", border: "1px solid var(--border-base)" }}>{v}</button>
                ))}
              </div>
              <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "var(--gray-100)" }}>
                {Object.entries(dirNames).map(([k, v]) => (
                  <button key={k} onClick={() => setDir(k)}
                    className="h-8 px-3 rounded-lg text-xs font-bold transition-all"
                    style={dir === k ? { background: "var(--white)", color: "var(--text-title)", boxShadow: "var(--shadow-card)" } : { color: "var(--text-secondary)" }}>{v}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs mb-3 p-2.5 rounded-xl" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
                💡 选中排版后，对应类别将<b>每个排版各生成 1 张</b>，张数由排版数量决定；未选则按步进器数量随机套用平台排版。
              </p>
              <div className={`grid gap-3 ${dir === "vertical" ? "grid-cols-4" : dir === "square" ? "grid-cols-3" : "grid-cols-2"}`}>
                {list.map(t => {
                  const on = draft.includes(t.id)
                  return (
                    <div key={t.id} onClick={() => toggle(t.id)}
                      className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-colors ${on ? "border-[var(--brand-primary)]" : "border-[var(--border-base)]"}`}>
                      <img src={t.thumb} alt={t.name} className="w-full aspect-[4/3] object-cover" />
                      <div className="p-2 text-xs font-bold truncate" style={{ color: "var(--text-title)" }}>{t.name}</div>
                      {on && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--brand-primary-soft)" }}>
                          <span className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ background: "var(--brand-primary)" }}>✓</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                {!list.length && (
                  <div className="col-span-full py-12 text-center text-sm" style={{ color: "var(--text-disabled)" }}>该筛选下暂无排版</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: selected */}
          <div className="w-[240px] border-l flex flex-col shrink-0" style={{ borderColor: "var(--border-light)" }}>
            <h4 className="px-4 py-3 text-sm font-semibold border-b" style={{ color: "var(--text-title)", borderColor: "var(--border-light)" }}>
              已选排版 <em className="font-normal ml-1" style={{ color: "var(--text-secondary)" }}>{draft.length} / {LAY_MAX}</em>
            </h4>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {draft.length ? draft.map(id => {
                const t = tplById(id)
                if (!t) return null
                return (
                  <div key={id} className="flex items-center gap-2 p-2 border rounded-xl" style={{ borderColor: "var(--border-base)" }}>
                    <img src={t.thumb} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <strong className="text-xs flex-1 truncate" style={{ color: "var(--text-title)" }}>{t.name}</strong>
                    <button onClick={() => toggle(id)} className="text-sm shrink-0 hover:text-[var(--danger)]" style={{ color: "var(--text-secondary)" }}>×</button>
                  </div>
                )
              }) : (
                <p className="text-xs text-center py-8" style={{ color: "var(--text-disabled)" }}>暂无已选排版<br />从左侧挑选，最多 {LAY_MAX} 个</p>
              )}
            </div>
            <div className="shrink-0 flex gap-2 p-3 border-t" style={{ borderColor: "var(--border-light)" }}>
              <button onClick={() => setDraft([])} className="h-9 px-4 rounded-lg text-sm font-medium border bg-white"
                style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>清空</button>
              <button onClick={() => onConfirm(draft)} className="flex-1 h-9 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--brand-primary)" }}>确认（{draft.length}）</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   AI Polish Modal
   ================================================================ */
function PolishModal({ sellPoints, onApply, onClose }) {
  const result = (sellPoints.trim().replace(/\s+/g, " ") + "；突出核心优势、使用体验与购买价值，表达简洁有力。").slice(0, 500)
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center" style={{ background: "var(--overlay-scrim)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-[520px] space-y-4"
        style={{ boxShadow: "var(--shadow-card-hover)", border: "1px solid var(--border-light)" }}>
        <div className="flex justify-between items-center">
          <strong className="text-base" style={{ color: "var(--text-title)" }}>AI 卖点润色</strong>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--success-bg)", color: "var(--success)" }}>已完成</span>
        </div>
        <p className="text-sm leading-relaxed p-4 rounded-xl" style={{ background: "var(--gray-50)", color: "var(--text-body)" }}>{result}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-5 rounded-lg text-sm font-medium border bg-white"
            style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>取消</button>
          <button onClick={() => onApply(result)} className="h-9 px-5 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--brand-primary)" }}>确认</button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   Clear Confirm
   ================================================================ */
function ClearConfirm({ onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center" style={{ background: "var(--overlay-scrim)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-[420px] space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-title)" }}>确认清空</h3>
          <button onClick={onClose} className="text-lg hover:text-[var(--danger)]" style={{ color: "var(--text-secondary)" }}>×</button>
        </div>
        <p className="text-sm" style={{ color: "var(--text-body)" }}>清空后当前配置和结果将无法在本页恢复，是否继续？</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-5 rounded-lg text-sm font-medium border bg-white"
            style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>取消</button>
          <button onClick={onConfirm} className="h-9 px-5 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--danger)" }}>确认清空</button>
        </div>
      </div>
    </div>
  )
}
