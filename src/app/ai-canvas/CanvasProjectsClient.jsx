"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Folder,
  FolderOpen,
  FolderPlus,
  LoaderCircle,
  MoreHorizontal,
  Move,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import {
  initialCanvasFolders,
  initialCanvasProjects,
} from "@/data/demo/ai-canvas-projects"

const prototypePath = "/prototypes/xianma-ai-canvas-v1.html"
const prototypeThemeStyleId = "xianma-project-theme-overrides"

const prototypeThemeStyles = `
  #backHomeBtn {
    display: none !important;
  }

  .xm-liblib-skin .topbar {
    left: 136px !important;
  }

  .app-actions button.run {
    background: #D9353F !important;
    border-color: #D9353F !important;
    color: #FFFFFF !important;
    box-shadow: 0 8px 22px rgba(217, 53, 63, 0.28) !important;
    transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease !important;
  }

  .app-actions button.run:hover {
    background: #C52D37 !important;
    border-color: #C52D37 !important;
    box-shadow: 0 10px 26px rgba(217, 53, 63, 0.36) !important;
  }

  .app-actions button.run:active {
    background: #B72832 !important;
    border-color: #B72832 !important;
    box-shadow: 0 5px 14px rgba(217, 53, 63, 0.28) !important;
    transform: translateY(1px) !important;
  }

  .app-actions button.run:focus-visible {
    outline: 3px solid rgba(217, 53, 63, 0.3) !important;
    outline-offset: 2px !important;
  }

  .app-actions button.run:disabled {
    background: #7A3035 !important;
    border-color: #7A3035 !important;
    color: rgba(255, 255, 255, 0.68) !important;
    box-shadow: none !important;
    cursor: not-allowed !important;
    transform: none !important;
  }
`

function formatNow() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date())
}

function createDemoId(prefix) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`
}

export default function CanvasProjectsClient() {
  const [folders, setFolders] = useState(initialCanvasFolders)
  const [projects, setProjects] = useState(initialCanvasProjects)
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [activeProject, setActiveProject] = useState(null)
  const [dialog, setDialog] = useState(null)
  const projectsRef = useRef(projects)

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  useEffect(() => {
    function syncProjectFromLocation() {
      const projectId = new URLSearchParams(window.location.search).get("project")
      setActiveProject(projectsRef.current.find((project) => project.id === projectId) || null)
    }

    syncProjectFromLocation()
    window.addEventListener("popstate", syncProjectFromLocation)
    return () => window.removeEventListener("popstate", syncProjectFromLocation)
  }, [])

  const currentFolder = folders.find((folder) => folder.id === currentFolderId) || null
  const visibleProjects = useMemo(
    () => projects.filter((project) => (project.folderId || null) === currentFolderId),
    [currentFolderId, projects],
  )

  const projectCounts = useMemo(
    () => Object.fromEntries(folders.map((folder) => [folder.id, projects.filter((project) => project.folderId === folder.id).length])),
    [folders, projects],
  )

  function openProject(project) {
    const url = new URL(window.location.href)
    url.searchParams.set("project", project.id)
    window.history.pushState({ ...window.history.state, aiCanvasProject: project.id }, "", url)
    setActiveProject(project)
  }

  const closeProject = useCallback(() => {
    if (window.history.state?.aiCanvasProject) {
      window.history.back()
      return
    }
    const url = new URL(window.location.href)
    url.searchParams.delete("project")
    window.history.replaceState(window.history.state, "", url)
    setActiveProject(null)
  }, [])

  function openNameDialog(type, entity = null) {
    setDialog({ type, entity, value: entity?.name || "" })
  }

  function confirmDialog() {
    if (!dialog) return
    const value = dialog.value?.trim()

    if (dialog.type === "newProject" && value) {
      const now = formatNow()
      setProjects((current) => [
        {
          id: createDemoId("p"),
          name: value,
          folderId: currentFolderId,
          cover: "/assets/layout-horizontal-5.jpg",
          createdAt: now,
          updatedAt: now,
          status: "草稿",
        },
        ...current,
      ])
    }

    if (dialog.type === "newFolder" && value) {
      setFolders((current) => [
        { id: createDemoId("f"), name: value, createdAt: formatNow() },
        ...current,
      ])
    }

    if (dialog.type === "renameProject" && value) {
      setProjects((current) => current.map((project) => (
        project.id === dialog.entity.id
          ? { ...project, name: value, updatedAt: formatNow() }
          : project
      )))
    }

    if (dialog.type === "renameFolder" && value) {
      setFolders((current) => current.map((folder) => (
        folder.id === dialog.entity.id ? { ...folder, name: value } : folder
      )))
    }

    if (dialog.type === "moveProject") {
      setProjects((current) => current.map((project) => (
        project.id === dialog.entity.id
          ? { ...project, folderId: dialog.targetFolderId || null, updatedAt: formatNow() }
          : project
      )))
    }

    if (dialog.type === "deleteProject") {
      setProjects((current) => current.filter((project) => project.id !== dialog.entity.id))
    }

    if (dialog.type === "deleteFolder") {
      setFolders((current) => current.filter((folder) => folder.id !== dialog.entity.id))
      setProjects((current) => current.map((project) => (
        project.folderId === dialog.entity.id ? { ...project, folderId: null } : project
      )))
      if (currentFolderId === dialog.entity.id) setCurrentFolderId(null)
    }

    setDialog(null)
  }

  if (activeProject) {
    return <CanvasPrototypeFrame project={activeProject} onExit={closeProject} />
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {currentFolder ? (
            <button
              type="button"
              onClick={() => setCurrentFolderId(null)}
              className="inline-flex min-h-9 items-center gap-2 rounded-md text-sm font-medium text-[var(--brand-primary)] hover:underline focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              <ArrowLeft size={16} />
              全部项目
              <span className="text-[var(--text-disabled)]">/</span>
              <span className="max-w-[240px] truncate text-[var(--text-title)]">{currentFolder.name}</span>
            </button>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">共 {projects.length} 个项目，{folders.length} 个文件夹</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!currentFolder && (
            <Button variant="outline" onClick={() => openNameDialog("newFolder")}>
              <FolderPlus />新建文件夹
            </Button>
          )}
          <Button onClick={() => openNameDialog("newProject")}>
            <Plus />新建项目
          </Button>
        </div>
      </div>

      {!currentFolder && folders.length > 0 && (
        <section className="mb-6" aria-labelledby="canvas-folder-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="canvas-folder-heading" className="text-sm font-semibold text-[var(--text-title)]">文件夹</h2>
            <span className="text-xs text-[var(--text-secondary)]">一级文件夹</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                projectCount={projectCounts[folder.id] || 0}
                onOpen={() => setCurrentFolderId(folder.id)}
                onRename={() => openNameDialog("renameFolder", folder)}
                onDelete={() => setDialog({ type: "deleteFolder", entity: folder })}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="canvas-project-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="canvas-project-heading" className="text-sm font-semibold text-[var(--text-title)]">
            {currentFolder ? currentFolder.name : "项目"}
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">{visibleProjects.length} 个项目</span>
        </div>
        {visibleProjects.length > 0 ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))" }}
          >
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                folders={folders}
                onOpen={() => openProject(project)}
                onRename={() => openNameDialog("renameProject", project)}
                onMove={() => setDialog({ type: "moveProject", entity: project, targetFolderId: project.folderId })}
                onDelete={() => setDialog({ type: "deleteProject", entity: project })}
              />
            ))}
          </div>
        ) : (
          <EmptyProjects onCreate={() => openNameDialog("newProject")} />
        )}
      </section>

      {dialog && (
        <ProjectDialog
          dialog={dialog}
          folders={folders}
          onChange={setDialog}
          onClose={() => setDialog(null)}
          onConfirm={confirmDialog}
        />
      )}
    </>
  )
}

function FolderCard({ folder, projectCount, onOpen, onRename, onDelete }) {
  return (
    <article className="relative overflow-hidden rounded-lg border bg-[var(--bg-card)] transition-[border-color,box-shadow] hover:border-[var(--gray-300)] hover:shadow-[var(--shadow-card-hover)]" style={{ borderColor: "var(--border-base)" }}>
      <button type="button" onClick={onOpen} className="flex min-h-28 w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
          <Folder size={24} />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-semibold text-[var(--text-title)]">{folder.name}</strong>
          <span className="mt-1 block text-xs text-[var(--text-secondary)]">{projectCount} 个项目</span>
          <span className="mt-2 block text-xs text-[var(--text-disabled)]">创建于 {folder.createdAt}</span>
        </span>
      </button>
      <EntityMenu label={`${folder.name}文件夹操作`} onRename={onRename} onDelete={onDelete} />
    </article>
  )
}

function ProjectCard({ project, folders, onOpen, onRename, onMove, onDelete }) {
  const folderName = folders.find((folder) => folder.id === project.folderId)?.name
  const saved = project.status === "已保存"

  return (
    <article className="relative overflow-hidden rounded-lg border bg-[var(--bg-card)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--gray-300)] hover:shadow-[var(--shadow-card-hover)]" style={{ borderColor: "var(--border-base)" }}>
      <button type="button" onClick={onOpen} className="block w-full text-left focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]">
        <span className="relative block aspect-[16/9] overflow-hidden bg-[var(--gray-100)]">
          <SafeImage src={project.cover} alt="" className="h-full w-full object-cover" />
          <span
            className="absolute bottom-2 left-2 inline-flex h-6 items-center rounded px-2 text-xs font-medium"
            style={saved
              ? { background: "var(--success-bg)", color: "var(--success)" }
              : { background: "var(--warning-bg)", color: "var(--warning)" }}
          >
            {project.status}
          </span>
        </span>
        <span className="block p-4">
          <strong className="block truncate pr-7 text-sm font-semibold text-[var(--text-title)]">{project.name}</strong>
          <span className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Clock3 size={13} />最近编辑 {project.updatedAt}
          </span>
          {folderName && <span className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"><FolderOpen size={13} />{folderName}</span>}
        </span>
      </button>
      <EntityMenu label={`${project.name}项目操作`} onRename={onRename} onMove={onMove} onDelete={onDelete} />
    </article>
  )
}

function EntityMenu({ label, onRename, onMove, onDelete }) {
  return (
    <div className="absolute right-2 top-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="icon-sm" aria-label={label} title="更多操作" className="bg-white/95" />}
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6}>
          <DropdownMenuItem onClick={onRename}><Pencil />重命名</DropdownMenuItem>
          {onMove && <DropdownMenuItem onClick={onMove}><Move />移动至文件夹</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2 />删除</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function EmptyProjects({ onCreate }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-[var(--gray-50)] p-6 text-center" style={{ borderColor: "var(--border-base)" }}>
      <span className="grid size-12 place-items-center rounded-lg bg-white text-[var(--text-secondary)] shadow-[var(--shadow-control)]"><FolderOpen size={23} /></span>
      <h3 className="mt-4 text-sm font-semibold text-[var(--text-title)]">当前还没有项目</h3>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">新建项目后即可进入无限画布。</p>
      <Button className="mt-4" onClick={onCreate}><Plus />新建项目</Button>
    </div>
  )
}

function ProjectDialog({ dialog, folders, onChange, onClose, onConfirm }) {
  const isDelete = dialog.type === "deleteProject" || dialog.type === "deleteFolder"
  const isMove = dialog.type === "moveProject"
  const titles = {
    newProject: "新建项目",
    newFolder: "新建文件夹",
    renameProject: "重命名项目",
    renameFolder: "重命名文件夹",
    moveProject: "移动至文件夹",
    deleteProject: "删除项目",
    deleteFolder: "删除文件夹",
  }
  const canConfirm = isDelete || isMove || Boolean(dialog.value?.trim())

  return (
    <WorkbenchPickerDialog
      title={titles[dialog.type]}
      width="480px"
      onClose={onClose}
      footer={(
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant={isDelete ? "destructive" : "default"} disabled={!canConfirm} onClick={onConfirm}>
            {isDelete ? "确认删除" : "确认"}
          </Button>
        </div>
      )}
    >
      {isDelete ? (
        <div className="flex items-start gap-3 rounded-lg bg-[var(--danger-bg)] p-3 text-sm text-[var(--text-body)]">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--danger)]" />
          <p className="leading-6">
            {dialog.type === "deleteFolder"
              ? `删除文件夹“${dialog.entity.name}”后，文件夹内项目将移回全部项目。`
              : `确认删除项目“${dialog.entity.name}”？该操作仅影响本次演示数据。`}
          </p>
        </div>
      ) : isMove ? (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-[var(--text-title)]">选择目标位置</legend>
          <div className="grid gap-2">
            <FolderOption
              label="全部项目"
              selected={!dialog.targetFolderId}
              onClick={() => onChange({ ...dialog, targetFolderId: null })}
            />
            {folders.map((folder) => (
              <FolderOption
                key={folder.id}
                label={folder.name}
                selected={dialog.targetFolderId === folder.id}
                onClick={() => onChange({ ...dialog, targetFolderId: folder.id })}
              />
            ))}
          </div>
        </fieldset>
      ) : (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[var(--text-title)]">
            {dialog.type.includes("Folder") ? "文件夹名称" : "项目名称"}
          </span>
          <input
            autoFocus
            value={dialog.value}
            maxLength={40}
            onChange={(event) => onChange({ ...dialog, value: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter" && dialog.value.trim()) onConfirm()
            }}
            placeholder={dialog.type.includes("Folder") ? "输入文件夹名称" : "输入项目名称"}
            className="h-10 w-full rounded-lg border bg-white px-3 text-sm text-[var(--text-body)] outline-none placeholder:text-[var(--text-disabled)] focus:border-[var(--brand-primary)] focus:shadow-[var(--focus-ring)]"
            style={{ borderColor: "var(--border-base)" }}
          />
        </label>
      )}
    </WorkbenchPickerDialog>
  )
}

function FolderOption({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex min-h-11 items-center gap-3 rounded-lg border px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
      style={selected
        ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }
        : { borderColor: "var(--border-base)", background: "var(--bg-card)", color: "var(--text-body)" }}
    >
      <Folder size={17} />{label}
    </button>
  )
}

function CanvasPrototypeFrame({ project, onExit }) {
  const [status, setStatus] = useState("loading")
  const [frameKey, setFrameKey] = useState(0)
  const bridgeCleanupRef = useRef(null)

  const connectPrototype = useCallback((event) => {
    bridgeCleanupRef.current?.()
    try {
      const frameWindow = event.currentTarget.contentWindow
      const backButton = frameWindow?.document.getElementById("backHomeBtn")
      if (!frameWindow || typeof frameWindow.createProject !== "function" || !backButton) {
        throw new Error("prototype bridge unavailable")
      }

      const themeStyle = frameWindow.document.createElement("style")
      themeStyle.id = prototypeThemeStyleId
      themeStyle.textContent = prototypeThemeStyles
      frameWindow.document.head.appendChild(themeStyle)

      function handlePrototypeBack(backEvent) {
        backEvent.preventDefault()
        backEvent.stopImmediatePropagation()
        onExit()
      }

      backButton.addEventListener("click", handlePrototypeBack, true)
      bridgeCleanupRef.current = () => {
        backButton.removeEventListener("click", handlePrototypeBack, true)
        themeStyle.remove()
      }
      frameWindow.createProject(project.name)
      setStatus("ready")
    } catch {
      setStatus("error")
    }
  }, [onExit, project.name])

  useEffect(() => () => bridgeCleanupRef.current?.(), [])

  function retry() {
    setStatus("loading")
    setFrameKey((current) => current + 1)
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-white">
      {status === "ready" && (
        <Button
          type="button"
          variant="outline"
          onClick={onExit}
          aria-label="返回项目列表"
          title="返回项目列表"
          className="fixed left-5 top-[18px] z-[1001] h-10 rounded-[10px] border-[var(--gray-700)] bg-[var(--gray-900)] px-3 text-[var(--brand-on-primary)] shadow-[var(--shadow-card-hover)] hover:border-[var(--brand-primary)] hover:bg-[var(--gray-800)] hover:text-[var(--brand-on-primary)] focus-visible:border-[var(--brand-primary)] focus-visible:shadow-[var(--focus-ring)]"
        >
          <ArrowLeft size={16} />
          返回项目
        </Button>
      )}
      <iframe
        key={frameKey}
        src={prototypePath}
        title={`${project.name} - 无限画布`}
        className="h-full w-full border-0 bg-white"
        onLoad={connectPrototype}
        onError={() => setStatus("error")}
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white text-[var(--text-secondary)]" role="status">
          <LoaderCircle className="animate-spin text-[var(--brand-primary)]" size={28} />
          <span className="text-sm">正在打开无限画布</span>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white p-6 text-center">
          <AlertTriangle className="text-[var(--danger)]" size={30} />
          <div>
            <h2 className="text-base font-semibold text-[var(--text-title)]">画布加载失败</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">请重试，或返回项目列表后重新进入。</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onExit}><ArrowLeft />返回项目</Button>
            <Button onClick={retry}>重试</Button>
          </div>
        </div>
      )}
    </div>
  )
}
