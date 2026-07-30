// Temporary presentation data for AI 买家秀. Replace with API-backed data when the platform backend is ready.
// Runtime mutations (scene library edits, new tasks, reviews) live in component state only — refresh resets to this seed.

export const RULE_DIMENSIONS = [
  { key: "people", label: "人物", hint: "年龄/状态/表情/着装" },
  { key: "scene", label: "场景描述", hint: "具体地点/环境" },
  { key: "light", label: "光线", hint: "明暗/光源" },
  { key: "angle", label: "角度构图", hint: "机位/景别" },
  { key: "action", label: "动作姿态", hint: "在做什么/避免什么" },
  { key: "real", label: "真实感画风", hint: "整体基调/风格" },
]

export const modelOptions = [
  { name: "Nano Banana 2", desc: "多参考图生成，适合复杂主体与长文本画面", eta: "75s", icon: "/assets/gemini.png" },
  { name: "Wan 2.7 Image Pro", desc: "中文指令稳定，适合商品、场景与主体编辑", eta: "61s", icon: "/assets/wan.png" },
  { name: "Nano Banana Pro", desc: "多参考图生成，适合复杂主体与长文本画面", eta: "79s", icon: "/assets/gemini.png" },
  { name: "Seedream 5.0", desc: "生成速度快，适合批量创意与商业出图", eta: "40s", icon: "/assets/seedream.svg" },
  { name: "GPT Image 2", desc: "细节还原强，适合高质量生成与局部修改", eta: "140s", icon: "/assets/gpt.svg" },
]

export const resolutionOptions = ["1K", "2K", "4K"]
export const ratioOptions = ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"]
export const qualityOptions = ["标准", "高画质"]
export const countOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]

export const quickEditTemplates = [
  { key: "pose", title: "修正人物状态", desc: "人物姿势更自然，减少僵硬感" },
  { key: "wear", title: "修正佩戴位置", desc: "护具位置更准，贴合关系更真实" },
  { key: "background", title: "调整背景", desc: "保留主体，只换成更合适场景" },
  { key: "reality", title: "提升真实感", desc: "降低美颜感，像真实手机拍摄" },
]

export const assetPool = ["/assets/buyer.webp", "/assets/expert.webp", "/assets/prompt.webp", "/assets/repaint.webp"]

export const defaultLibrary = {
  public: [
    {
      id: "cat-waist", name: "护腰带", sellingPoints: "支撑稳、佩戴贴合、日常活动方便、透气不闷热",
      baseRules: "以用户上传的商品图为基准，保持产品结构、颜色、材质与图案不变，禁止重新生成或臆造产品细节；护腰带需紧贴腰腹部，不上滑至胸口、不下滑至臀部；绑带方向符合真实使用逻辑，产品边缘和魔术贴细节清晰，不漂浮、不穿模。",
      scenes: [
        { id: "sc-medical", name: "医疗康复", desc: "医院康复科候诊区", dims: {
          people: "60 岁左右中老年人，皮肤保留真实纹理和毛孔质感，有自然的表情皱纹，无磨皮痕迹。",
          scene: "医院康复科候诊区，米白墙面、康复科指示牌、窗边自然光洒入。",
          light: "窗边自然光，柔和不刺眼。", angle: "半侧面、颈部以下构图，手机原相机抓拍感。",
          action: "坐在候诊椅上弯腰系鞋带或捡拾物品，动作缓慢自然不吃力，旁边可放置折叠拐杖作为环境元素。",
          real: "生活化随手拍质感，非商业广告精修感。" } },
        { id: "sc-elder", name: "中老年居家", desc: "客厅、厨房、日常活动", dims: {
          people: "人物年龄感偏中老年，表情自然放松，避免年轻化过度修饰。", scene: "客厅、卧室、餐桌等家庭空间。",
          light: "室内自然光，氛围温和。", angle: "全景与腰部近景结合，露出比例适中。",
          action: "起身、走动等日常轻活动。", real: "生活气息强，可信不摆拍。" } },
        { id: "sc-homecare", name: "居家治疗", desc: "床边、沙发、明亮室内", dims: {
          people: "主体比例真实，不夸大体态变化。", scene: "沙发、床边、靠垫等辅助休息环境。",
          light: "室内明亮柔和。", angle: "坐姿、半躺视角，兼顾细节特写。",
          action: "休息、起身、轻度活动为主，避免运动场景与误导性治疗动作。", real: "轻治疗氛围，不做强医疗暗示。" } },
        { id: "sc-outdoor", name: "户外休闲", desc: "公园、小区、轻松走动", dims: {
          people: "人物姿态轻松自然，不过度磨皮。", scene: "公园、小区等户外轻活动场地。",
          light: "户外自然光，画面明亮。", angle: "行走全景与侧面特写结合。",
          action: "慢走等日常轻活动，避免跑跳等高强度动作。", real: "像手机随手拍，真实通透。" } },
      ],
    },
    {
      id: "cat-knee", name: "护膝", sellingPoints: "贴合膝盖、柔软舒适、运动防护、透气材质",
      baseRules: "以用户上传的商品图为基准，保持产品结构、颜色、材质与图案不变，禁止重新生成或臆造产品细节；护膝需紧贴膝盖，不上滑至大腿、不下滑至小腿。",
      scenes: [
        { id: "sc-knee-hospital", name: "医院坐姿/轮椅场景", desc: "医院走廊、病房或候诊区，轮椅或拄拐", dims: {
          people: "60 岁左右中老年患者，皮肤保留真实纹理和自然表情皱纹，无磨皮痕迹。",
          scene: "医院走廊、病房或候诊区，画面中出现轮椅或拄拐作为环境元素。", light: "医院日光灯或自然光，明亮干净。",
          angle: "坐姿平视构图，清晰露出膝部佩戴护膝的状态。", action: "静坐或缓慢移动，可倚靠拐杖或轮椅，不做剧烈动作。",
          real: "生活化医院实拍质感，非商业精修感。" } },
      ],
    },
    {
      id: "cat-knee-double", name: "双拉带护膝", sellingPoints: "双拉带固定、硅胶防滑、支撑性好、运动不跑位",
      baseRules: "以用户上传的商品图为基准，保持产品结构、颜色、材质与图案不变，禁止重新生成或臆造产品细节；双拉带护膝的硅胶垫、支撑条、绑带纹理需保持清晰，绑带长度适中；佩戴需紧贴膝盖，硅胶垫对准膝盖骨，不错位到大腿、不下滑到小腿。",
      scenes: [
        { id: "sc-double-medical", name: "中老年人医疗场景", desc: "医院各类场所，突出医用属性", dims: {
          people: "60 岁左右气质型中老年人，服装整齐干净，皮肤保留真实纹理和自然表情皱纹。",
          scene: "医院各类场所（诊室、走廊、候诊区），突出医用属性。", light: "医院自然光或日光灯，明亮真实。",
          angle: "清晰露出膝部佩戴双拉带护膝的状态，硅胶垫位置可见。", action: "不出现剧烈运动，可有轻微行走或候诊等待动作。",
          real: "真实可信，非产品误导性夸大宣传。" } },
      ],
    },
    {
      id: "cat-knee-heating", name: "电加热护膝", sellingPoints: "电加热恒温、二十八味药盐灸、亚麻亲肤、控温便捷",
      baseRules: "以用户上传的商品图为基准，保持产品结构、颜色、材质与图案不变，禁止重新生成或臆造产品细节；电加热护膝材质为浅米色亚麻面料，古典美人刺绣，二十八味药盐灸，刺绣文字需清晰；电源线清晰不变形。控制面板按键文字属于精细图案渲染，建议出图后人工检查这个细节。",
      scenes: [
        { id: "sc-heating-home", name: "居家生活场景", desc: "居家卧室或客厅，躺在床上或沙发上", dims: {
          people: "60 岁左右中老年人，居家放松状态，皮肤保留真实纹理和自然表情。", scene: "居家卧室或客厅，躺在床上或沙发上。",
          light: "室内自然光，明亮温暖。", angle: "侧躺或半坐姿态，清晰露出护膝佩戴状态及电源线与控制面板的连接关系。",
          action: "静躺或轻微调整姿势，不做剧烈动作，体现居家休养放松感。", real: "生活化居家实拍质感，温暖休养氛围。" } },
      ],
    },
  ],
  mine: [],
}
export const seedTasks = [
  {
    id: "683973d5", title: "4 张买家秀 · 15:45", time: "今天 15:45", status: "已完成", progress: 100, doneText: "4/4",
    scene: "医疗康复", productType: "护腰带", model: "GPT Image 2", resolution: "2K", ratio: "4:3", quality: "高画质", count: "4 张",
    prompt: "真实中老年康复场景，画面像手机随手拍，强调佩戴护腰带的舒适与可信感。",
    rules: "【品类基础】护腰带主体不变形，佩戴位置准确，绑带方向符合真实使用逻辑。\n【人物】人物状态真实自然，不做夸张美颜。\n【场景】医院、候诊区、康复训练区为主。\n【动作】动作轻缓，不出现剧烈运动。",
    storyboard: [
      { index: "01", title: "沙发正面全景展示", desc: "正面平视，完整看到佩戴状态与人物体态。" },
      { index: "02", title: "侧向俯拍细节展示", desc: "斜侧方构图，清晰展示绑带贴合与结构细节。" },
      { index: "03", title: "半躺小憩使用场景", desc: "体现居家休息感，动作轻缓自然。" },
      { index: "04", title: "特写局部材质展示", desc: "展示印花、材质纹理与魔术贴细节。" },
    ],
    results: [
      { id: "r1", shot: "01", title: "沙发正面全景展示", label: "认可", note: "适合作为主图位候选。", src: "/assets/buyer.webp", version: "原始结果", editHistory: [] },
      { id: "r2", shot: "02", title: "侧向俯拍细节展示", label: "认可", note: "绑带与腰部贴合关系清晰。", src: "/assets/expert.webp", version: "原始结果", editHistory: [] },
      { id: "r3", shot: "03", title: "半躺小憩使用场景", label: "待调整", note: "人物手部有些别扭，可单图返修。", src: "/assets/prompt.webp", version: "原始结果", editHistory: [] },
      { id: "r4", shot: "04", title: "特写局部材质展示", label: "认可", note: "细节图可直接下载使用。", src: "/assets/repaint.webp", version: "原始结果", editHistory: [] },
    ],
    reviews: [],
  },
  {
    id: "2f104247", title: "4 张买家秀 · 15:35", time: "今天 15:35", status: "已完成", progress: 100, doneText: "4/4",
    scene: "中老年居家", productType: "护腰带", model: "Nano Banana 2", resolution: "2K", ratio: "4:3", quality: "标准", count: "4 张",
    prompt: "居家生活化的中老年护腰带使用场景，强调可信与舒适。",
    rules: "【品类基础】护腰带主体不变形，佩戴位置准确，绑带方向符合真实使用逻辑。\n【人物】人物年龄感偏中老年，表情自然放松。\n【场景】客厅、卧室、餐桌等家庭空间。\n【动作】起身、走动等日常轻活动。",
    storyboard: [
      { index: "01", title: "客厅起身场景", desc: "人物从沙发起身，护腰带自然露出。" },
      { index: "02", title: "餐桌侧身场景", desc: "居家桌边动作，展示日常轻活动。" },
      { index: "03", title: "腰部细节近景", desc: "突出腰部贴合与结构。" },
      { index: "04", title: "窗边站姿全景", desc: "体现室内自然光与日常可信感。" },
    ],
    results: [
      { id: "r5", shot: "01", title: "客厅起身场景", label: "认可", note: "适合投放居家模版。", src: "/assets/expert.webp", version: "原始结果", editHistory: [] },
      { id: "r6", shot: "02", title: "餐桌侧身场景", label: "认可", note: "生活气息较强。", src: "/assets/prompt.webp", version: "原始结果", editHistory: [] },
      { id: "r7", shot: "03", title: "腰部细节近景", label: "认可", note: "结构展示清楚。", src: "/assets/repaint.webp", version: "原始结果", editHistory: [] },
      { id: "r8", shot: "04", title: "窗边站姿全景", label: "待调整", note: "背景略杂，可以单图改。", src: "/assets/buyer.webp", version: "原始结果", editHistory: [] },
    ],
    reviews: [],
  },
  {
    id: "ea9d40cb", title: "4 张买家秀 · 15:28", time: "今天 15:28", status: "已完成", progress: 100, doneText: "4/4",
    scene: "居家治疗", productType: "护腰带", model: "GPT Image 2", resolution: "2K", ratio: "4:3", quality: "高画质", count: "4 张",
    prompt: "卧室与沙发结合的轻治疗氛围，不出现强医疗暗示。",
    rules: "【品类基础】护腰带主体不变形，佩戴位置准确，绑带方向符合真实使用逻辑。\n【场景】沙发、床边、靠垫等辅助休息环境。\n【动作】休息、起身、轻度活动为主，避免运动场景。",
    storyboard: [
      { index: "01", title: "床边起身", desc: "居家治疗氛围中的轻动作。" },
      { index: "02", title: "沙发坐姿", desc: "体现舒适度与支撑感。" },
      { index: "03", title: "侧身调整", desc: "展示腰带调节细节。" },
      { index: "04", title: "材质补充图", desc: "补充商品结构和面料纹理。" },
    ],
    results: [
      { id: "r9", shot: "01", title: "床边起身", label: "认可", note: "动作自然。", src: "/assets/prompt.webp", version: "原始结果", editHistory: [] },
      { id: "r10", shot: "02", title: "沙发坐姿", label: "认可", note: "适合详情页中段。", src: "/assets/repaint.webp", version: "原始结果", editHistory: [] },
      { id: "r11", shot: "03", title: "侧身调整", label: "认可", note: "佩戴逻辑正确。", src: "/assets/buyer.webp", version: "原始结果", editHistory: [] },
      { id: "r12", shot: "04", title: "材质补充图", label: "认可", note: "适合补充图位。", src: "/assets/expert.webp", version: "原始结果", editHistory: [] },
    ],
    reviews: [],
  },
  {
    id: "4ac8e745", title: "4 张买家秀 · 00:42", time: "昨天 00:42", status: "已终止", progress: 50, doneText: "2/4",
    scene: "户外休闲", productType: "护腰带", model: "Nano Banana 2", resolution: "2K", ratio: "4:3", quality: "标准", count: "4 张",
    prompt: "户外轻活动场景，人物自然行走，背景明亮。",
    rules: "【品类基础】护腰带主体不变形，佩戴位置准确，绑带方向符合真实使用逻辑。\n【场景】公园、小区等户外轻活动场地。\n【光线】户外自然光，画面明亮。\n【动作】慢走等日常轻活动，避免跑跳等高强度动作。",
    storyboard: [
      { index: "01", title: "小区散步全景", desc: "慢走状态，姿态轻松。" },
      { index: "02", title: "公园长椅休息", desc: "户外休闲氛围。" },
      { index: "03", title: "腰部侧面特写", desc: "强调贴合度。" },
      { index: "04", title: "步行动作补拍", desc: "轻动作展示。" },
    ],
    results: [
      { id: "r13", shot: "01", title: "小区散步全景", label: "处理中", note: "只完成前两张。", src: "/assets/buyer.webp", version: "原始结果", editHistory: [] },
      { id: "r14", shot: "02", title: "公园长椅休息", label: "处理中", note: "任务中途终止。", src: "/assets/expert.webp", version: "原始结果", editHistory: [] },
    ],
    reviews: [],
  },
]
const reviewTemplates = [
  "{obs}。贴合度比想象中好，{point}，平时在家活动也不会觉得特别碍事。",
  "给家里人买的，{obs}。腰部包得比较稳，坐着休息时也挺自然。",
  "用了几天才来评价，{obs}。穿在外套里面不怎么显，松紧调整起来顺手。",
  "{obs}，和我平时用的时候很像。做工摸着扎实，细节没有敷衍。",
  "本来担心戴着会勒，实际调好以后还可以，腰两侧有支撑感，日常用够了。",
  "图片看着挺真实，收到的佩戴效果也比较接近。绑带好调，固定住以后不容易乱跑。",
  "家里老人试了说支撑感不错，坐沙发和慢慢走动时都能用，操作也不复杂。",
  "材质摸起来不硬，贴着衣服戴没有明显磨人的感觉。细节位置做得规整，整体符合预期。",
  "戴上以后腰部有被托住的感觉，但不会影响正常活动。尺寸按客服建议选的，比较合适。",
  "不是那种夸张的效果，不过日常需要支撑的时候挺实用，穿脱方便，清洗起来也省事。",
  "刚开始还不太会调，看了一下就弄明白了。调整好后贴合得稳，走动时没有明显移位。",
  "实物比预想中轻一些，坐着休息的时候戴着也可以。边缘处理得比较柔和，没有硌人的地方。",
  "给爸爸准备的，他自己就能穿戴。支撑位置比较准，家里做些轻活动时用着方便。",
  "用了一周，魔术贴粘得牢，反复开合也没有松。腰部包裹感明显，整体做工可以。",
  "日常在家戴得比较多，衣服盖住后不突兀。调节范围够用，不会一动就往上跑。",
  "侧面的贴合效果和图里差不多，受力比较均匀。戴久一点也没有特别闷，体验不错。",
  "包装完整，拿出来没有异味。试戴后感觉支撑够用，尤其坐久了再起身时更踏实一些。",
  "买来主要是做家务和散步时用，固定效果不错，动作幅度不大的时候基本不影响。",
  "细节图拍得很清楚，实物的面料和走线也对得上。大小合适，佩戴步骤简单。",
  "整体属于实用型，外观不花哨，腰部需要支撑时随手就能戴上，家里人也说挺方便。",
]

export function buildReviewText(sellingPoints, resultTitle, index) {
  const points = String(sellingPoints || "").split(/[、,，]/).map((s) => s.trim()).filter(Boolean)
  const point = points[index % Math.max(points.length, 1)] || "用起来很方便"
  let obs = "实际戴上的状态和图里比较接近"
  if (/材质|特写|细节/.test(resultTitle)) obs = "细节和图里拍得差不多，走线和贴合位置都看得清"
  else if (/沙发|半躺|休息|小憩/.test(resultTitle)) obs = "平时坐沙发休息时就像图里这样戴着，用起来挺自然"
  else if (/起身|走|活动|站姿/.test(resultTitle)) obs = "起身和慢慢走动时都试过，没有明显影响动作"
  else if (/侧向|侧身/.test(resultTitle)) obs = "侧面看贴合得比较稳，位置和图里基本一致"
  const tpl = reviewTemplates[index % reviewTemplates.length]
  const text = tpl.replace("{obs}", obs).replace("{point}", point)
  return index % reviewTemplates.length < 4 ? text : `${obs}。${text}`
}

export function buildQuickInstruction(productType, scene, templateKey, resultTitle) {
  const map = {
    pose: `保持${productType}不变，只调整人物姿势和手部动作，让状态更自然。`,
    wear: `保持人物和背景不变，修正${productType}的佩戴位置与贴合关系。`,
    background: `保持人物和产品不变，把背景调整为更符合"${scene}"的场景。`,
    reality: "保持构图不变，降低美颜感和修饰感，让画面更像真实手机拍摄。",
  }
  return map[templateKey] || `围绕"${resultTitle}"做轻量优化。`
}
