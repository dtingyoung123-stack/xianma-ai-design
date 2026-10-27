export const defaultBackgroundColors = [
  { name: "白色", hex: "#FFFFFF" },
  { name: "浅灰", hex: "#F2F2F2" },
  { name: "深灰", hex: "#555555" },
  { name: "黑色", hex: "#000000" },
  { name: "米白", hex: "#F5F0E6" },
  { name: "红色", hex: "#D9353F" },
  { name: "橙色", hex: "#F28C28" },
  { name: "黄色", hex: "#F5D547" },
  { name: "绿色", hex: "#39845A" },
  { name: "浅蓝", hex: "#DCEBFA" },
  { name: "蓝色", hex: "#20358A" },
  { name: "紫色", hex: "#8064A2" },
  { name: "粉色", hex: "#F4CCD6" },
  { name: "棕色", hex: "#8B6148" },
]

// 色板素材值用于原型选色，不作为界面设计令牌。
const colorFamilies = [
  ["灰色", ["#FFFFFF", "#F2F2F2", "#D9D9D9", "#A6A6A6", "#595959", "#000000"]],
  ["米色", ["#FFFDF5", "#F5F0E6", "#E8DDC5", "#D0BE98", "#9A8259", "#635138"]],
  ["蓝灰", ["#EDF1F7", "#D6DFEC", "#AEBFD8", "#849CBF", "#4D658B", "#263852"]],
  ["蓝色", ["#EDF5FF", "#DCEBFA", "#B4D3F2", "#75A8DB", "#376EAD", "#20358A"]],
  ["橙色", ["#FFF3E8", "#FCE0C4", "#F8BE87", "#F29A49", "#C66C20", "#854313"]],
  ["黄色", ["#FFFAE5", "#FFF1AE", "#FFE477", "#F5D547", "#C1A020", "#806510"]],
  ["绿色", ["#EFF7EB", "#D7E9CB", "#B2D49C", "#81B566", "#39845A", "#245337"]],
  ["青色", ["#ECF8F7", "#C7E9E5", "#92D2CC", "#52B0A9", "#27817D", "#175553"]],
  ["红色", ["#FDEEEF", "#F8CFD2", "#EE9DA4", "#E26873", "#D9353F", "#8C202A"]],
  ["紫色", ["#F5EFF9", "#E5D5EF", "#CCB0DF", "#AC87C5", "#8064A2", "#543B70"]],
]

export const backgroundColorFamilies = colorFamilies.map(([name, shades]) => ({
  name,
  colors: shades.map((hex, index) => ({ name: `${name}${["极浅", "浅", "柔和", "中", "深", "极深"][index]}`, hex })),
}))
