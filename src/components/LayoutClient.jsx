"use client"

import { Suspense, useState, createContext, useContext } from "react"
import Topbar from "./Topbar"
import Sidebar from "./Sidebar"

const SidebarContext = createContext({ open: false, setOpen: () => {} })
export const useSidebar = () => useContext(SidebarContext)

export default function LayoutClient({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
      <div className="flex flex-col h-full">
        <Topbar />
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-auto mt-14 px-4 md:px-5 lg:px-6 py-4 md:py-5 lg:py-6 pb-8 lg:ml-[240px] transition-[margin] duration-200">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  )
}
