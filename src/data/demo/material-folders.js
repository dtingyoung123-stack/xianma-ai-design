import { initialMaterials } from "./materials"

// Additive fixtures for team-library interaction review; never real business data.
export const teamFolderDemoVersion = 1
export const initialMaterialFolders = [
  { id: "demo-team-products", name: "商品素材（示例）", scope: "team", departmentId: "org-zhongchuang-product", parentId: "" },
  { id: "demo-team-main", name: "主图参考", scope: "team", departmentId: "org-zhongchuang-product", parentId: "demo-team-products" },
  { id: "demo-team-detail", name: "细节参考", scope: "team", departmentId: "org-zhongchuang-product", parentId: "demo-team-main" },
  { id: "demo-team-scene", name: "场景参考", scope: "team", departmentId: "org-zhongchuang-product", parentId: "demo-team-products" },
  { id: "demo-team-campaign", name: "活动素材（示例）", scope: "team", departmentId: "org-zhongchuang-product", parentId: "" },
  { id: "demo-team-empty", name: "待补充素材（示例）", scope: "team", departmentId: "org-zhongchuang-product", parentId: "" },
  { id: "demo-team-home", name: "家居素材（示例）", scope: "team", departmentId: "org-zhongchuang-huaguoshan", parentId: "" },
  { id: "demo-team-jd", name: "商品素材（示例）", scope: "team", departmentId: "org-zhongchuang-jingdong", parentId: "" },
]
const examples = [
  ["material-team-2", "demo-team-products"],
  ["material-team-4", "demo-team-main"],
  ["material-team-3", "demo-team-detail"],
  ["material-team-1", "demo-team-scene"],
  ["material-team-2", "demo-team-campaign"],
  ["material-team-1", "demo-team-home"],
  ["material-team-4", "demo-team-jd"],
  ["material-team-3", ""],
]
export const teamFolderDemoMaterials = examples.map(([sourceId, folderId], index) => {
  const source = initialMaterials.find((item) => item.id === sourceId)
  const folder = initialMaterialFolders.find((item) => item.id === folderId)
  const departmentId = folder?.departmentId || "org-zhongchuang-product"
  return { ...source, id: `demo-team-folder-asset-${index + 1}`, title: `${source.title}（示例${index + 1}）`, ownerId: "demo-folder-colleague", ownerName: "演示同事", ownerDepartmentId: departmentId, ownerDepartment: departmentId === "org-zhongchuang-product" ? "众创事业群 / 商品部" : departmentId === "org-zhongchuang-huaguoshan" ? "众创事业群 / 花果山" : "众创事业群 / 京东", visibleOrgIds: [departmentId], publicReviewStatus: "none", publicSubmittedAt: undefined, publicSubmitterId: undefined, publicRejectionReason: undefined, remark: "用于文件夹浏览交互演示。", tags: [...source.tags, "示例"] }
})
export const initialTeamFolderAssignments = Object.fromEntries(examples.map(([, folderId], index) => [`team:demo-team-folder-asset-${index + 1}`, folderId]))
