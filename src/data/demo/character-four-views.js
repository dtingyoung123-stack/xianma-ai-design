// Explicit reference/result pairs: local prototype fixtures, never model outputs for arbitrary uploads.
export const characterViewSamples = [
  { id: "gray", title: "酒红发灰衣角色" },
  { id: "bow", title: "棕发领结角色" },
  { id: "denim", title: "盘发牛仔外套角色" },
].map(sample => ({ ...sample, reference: `/assets/character-views/${sample.id}-reference.png`, result: `/assets/character-views/${sample.id}-result.png` }))

export const characterViewSettings = { mode: "character-four-views", promptVersion: "08-v1.0", width: 1536, height: 1024 }

// Final 08 template. Kept below the UI; a production adapter must submit this text.
export const characterViewPrompt = "根据输入的角色参考图，生成一张横向角色四视图设定图。\n\n【排版】\n从左到右严格排列四个人物展示：\n1. 正面面部近景，展示完整头顶、面部及肩部，约占画面宽度的三分之一。\n2. 正面全身。\n3. 朝画面左侧的标准90度侧面全身。\n4. 正后方全身，不回头。\n后三个人物展示必须保持相同身高、相同缩放比例，脚底对齐。\n完整展示头顶至鞋底，不裁切，不重叠，保留适当间距。\n全身人物自然站立，双臂放松。\n\n【角色一致性】\n四个展示必须是参考图中的同一角色。\n保留参考图的脸型、五官、年龄感、肤色、发色、发型、发长、服装、配饰、材质及整体画风，不主动美化、换脸或改变角色设计。\n各视角中的服装结构、配饰位置和头发长度应相互对应。\n侧面和背面应符合合理的人体与服装结构。\n\n【原图缺失部分与服装补全】\n参考图已经展示的服装和配饰必须保留，不得替换。\n如果参考图已经展示下装或鞋子的一部分，优先延续其设计。\n对于完全不可见的下装与鞋子，根据角色的整体风格、上装版型、色彩、材质、时代背景和使用场景，设计协调且完整的搭配。\n可根据角色适配裙装、裤装、连体服装，以及不同款式和颜色的鞋履；选择应有视觉依据，不为追求多样性而随机混搭，也不刻意增加装饰。\n先确定一套完整搭配，再将其一致地呈现在正面、侧面和背面：款式、颜色、材质、长度、图案及鞋履必须对应，不能各视角各自设计。\n补全部分属于新的设计推断，不代表角色原始设定。\n不额外增加武器、道具或无依据的装饰。\n\n【画面】\n纯白背景，均匀柔和的光照，清晰呈现角色细节。\n保持参考图原有的写实、3D、插画或其他视觉风格。\n去除输入图片中的标签、文字、水印、按钮、界面和边框。\n输出仅包含四个人物展示，不添加标题、说明文字或其他人物。\n"


// Names and options observed in the production canvas; this list does not call models.
export const canvasImageModels = ["GPT Image 2", "GPT Image 2.5", "Nano Banana Pro QH", "Nano Banana 2 QH", "Nano Banana 2.1", "Seedream 5.0 Pro"]
export const canvasImageRatios = ["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "auto"]
