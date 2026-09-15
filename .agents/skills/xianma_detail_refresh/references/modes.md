# 双模式规则与提示词模板

## 1. 输入契约

```json
{
  "mode": "preserve_product | replace_product",
  "detail_images": [
    { "index": 1, "role": "hero", "path": "...", "copy": "..." }
  ],
  "product": {
    "source": "confirmed_product | uploaded_images | original_image",
    "reference_images": ["..."],
    "immutable_facts": ["..."],
    "forbidden_legacy_traits": ["..."]
  },
  "visual_system": {
    "dominant_background": "...",
    "palette": "...",
    "color_allocation": "...",
    "lighting": "...",
    "wardrobe": "...",
    "typography": "...",
    "caption_treatment": "...",
    "ornament": "...",
    "space_family": "...",
    "forbidden_style_traits": ["..."],
    "style_anchor": "..."
  },
  "user_prompt": "..."
}
```

`immutable_facts` 不能为空。抽取不到的事实填 `null`，不得猜测。用户明确提供的文案必须原样保存。

## 2. 主体不变模式

### 商品事实

原详情图是商品唯一事实源。提示词中明确：保持商品外观、结构、颜色、材质、Logo、配件数量、比例和穿戴关系不变；只允许改变人物、背景、场景、光线、构图和版式。

### 参考图角色

原图可以同时承担商品、文案和版式参考，但若加入其他视觉参考图，必须明确其只提取氛围、色调、字体或装饰，不提取其他商品、人物和文字。

### 模板

```text
Mode: preserve_product.
Image {index} is the sole product and copy source.
Keep the product exactly unchanged: silhouette, proportions, construction, materials,
colors, logos, components, straps/pads/closures and wearing relationship.
Refresh only the person, environment, lighting, composition and visual system.
Preserve every provided character, number, unit, punctuation and semantic role verbatim.
Use the shared group visual system: {visual_system}.
Current role and scene: {role}; {scene}.
Forbidden: product redesign, invented facts, altered logo, garbled text, floating,
penetration, missing contact shadow or role mismatch.
```

## 3. 主体替换模式

### 商品事实

新主体参考图是唯一商品事实源。原详情图只能提供角色、文案、版式、箭头语义和场景关系。提示词必须写明“不要从原图推断商品”。

### 正向事实与排除项

先描述可见的正向事实，再列出旧商品的具体可识别特征。不要只写“不要用旧商品”，也不要用与正向要求冲突的泛化描述。

示例：

```text
The product must be the exact replacement reference: white elastic fabric and
breathable perforated mesh base; dark navy-black lining and support pads; exactly
two broad white elastic straps; white edge binding; rounded-rectangle dark closure
areas; visible seams and woven texture; soft slight curvature.
Do not carry over the source product's gray long supports, double vertical spine
structure, old buckle, old material or old color.
```

### 物理贴合

穿戴场景必须写明：沿身体曲面弯曲、尺寸比例合理、衣物遮挡关系正确、边缘有接触阴影、手部或身体与商品真实接触，不悬浮、不穿透、不透明。

### 结构图

结构卖点图允许改变人物、背景、构图和标签位置，但必须保持原文字、Logo、箭头语义和连接端点；商品本体优先使用确定性商品层或局部编辑，避免人物、商品和标注全部自由重绘。

### 模板

```text
Mode: replace_product.
Images {product_reference_indices} are the ONLY product truth.
Image {layout_source_index} is only the source for role, copy, layout geometry and
semantic connectors; do not infer product appearance, palette, wardrobe, lighting,
typography color or decoration from it.
Image {style_anchor_index} is only the AI-validated group-style anchor; use its palette
allocation, lighting, wardrobe family, typography hierarchy and decoration, but do
not copy its product pose, person, copy or layout.
Use the exact replacement product facts: {immutable_facts}.
Explicitly exclude legacy traits: {forbidden_legacy_traits}.
Keep the shared group visual system: {visual_system}.
Current role and scene: {role}; {scene}.
Preserve copy and numeric data verbatim. Keep connector meaning and detail role.
The product must follow the body or environment with correct scale, curvature,
occlusion and contact shadows; never float, penetrate or morph.
```

## 4. 组级一致性

每张请求都重复发送 `immutable_facts`、`visual_system`、全局禁止项和当前图片任务块。不要要求模型“记住上一张”。

组级视觉系统不能只写抽象形容词。至少明确：主背景、主辅色占比、人物服装颜色、标签/标题色、光线、空间家族，以及禁止出现的高饱和色或大面积色块。若详情原图承担版式来源，必须明确“只保留布局几何和文案，不继承旧配色与装饰”。

优先选择首屏或最能代表整组调性的图片作为风格锚点。由 AI 自动检查锚点是否符合商品事实、图片角色和组级视觉系统；通过后，后续单图把锚点作为独立参考图传入并声明其角色，不增加运营确认步骤。若接口不支持风格参考图，则使用确定性的背景、标签和文字模板降低漂移。
