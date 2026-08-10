import "./globals.css"
import LayoutClient from "@/components/LayoutClient"

export const metadata = {
  title: "先马AI内容与视觉平台",
  description: "企业智能设计工作台",
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="h-full flex flex-col">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  )
}
