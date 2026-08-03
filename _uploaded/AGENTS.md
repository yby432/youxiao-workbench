# UI 设计指南

> **设计类型**: App 设计（应用架构设计）
> **确认检查**: 本指南适用于可交互的应用/网站/工具。

> ℹ️ Section 1 为设计意图与决策上下文。Code agent 实现时以 Section 2 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解

- **目标用户**: 5-7岁幼小衔接儿童 + 家长辅助；移动端高频短时使用；期待趣味成就感
- **核心目的**: 引导行动（完成每日任务）+ 建立信任（学习进度可视化）
- **情绪基调**: 温暖鼓励 / 避免焦虑挫败

### 1.2 设计方向

- **Design Style**: Rounded 圆润几何 + Soft Blocks 柔色块叠加 — 大圆角适配儿童触控，马卡龙柔色降低认知压力
- **Application Type**: Mobile-first Learning Tool — 底部Tab导航，单手可操作
- **Aesthetic Direction**: 奶油质感马卡龙配色 + 积木式卡片布局 + 手绘感图标

## 2. Color System (色彩系统)

**色彩关系**: 暖白基底 + 六色马卡龙模块色 + 深灰文字 + 金黄奖励色
**配色设计理由**: 低饱和马卡龙色系保护儿童视力，六色区分模块降低记忆负担，暖白底营造安全感
**主色推导**: primary 取暖橙色关联"学习豆"奖励核心机制，强化正向反馈循环
**使用比例**: 60% 暖白/浅灰底 · 30% 模块马卡龙色块 · 10% primary 橙 + 语义状态色

### 2.1 主题颜色

| Token                | HSL 值              | 说明                              |
| -------------------- | ------------------- | --------------------------------- |
| `background`         | hsl(40 30% 98%)     | 暖白底色，护眼不刺眼              |
| `card`               | hsl(0 0% 100%)      | 纯白卡片，与暖白底形成微层次      |
| `foreground`         | hsl(220 15% 25%)    | 深灰蓝文字，柔和可读              |
| `muted-foreground`   | hsl(220 10% 55%)    | 次级说明文字                      |
| `primary`            | hsl(28 90% 62%)     | 暖橙主色，学习豆/主CTA            |
| `primary-foreground` | hsl(0 0% 100%)      | 主按钮白色文字                    |
| `accent`             | hsl(28 60% 94%)     | 极浅橙交互反馈背景                |
| `accent-foreground`  | hsl(28 90% 40%)     | accent 上的深色文字               |
| `border`             | hsl(40 20% 90%)     | 暖调边框，融入底色                |

**模块专属色（卡片/标签/进度条）**：

| 模块   | HSL 值             | 用途                 |
| ------ | ------------------ | -------------------- |
| 识字   | hsl(145 45% 78%)   | 浅绿卡片/状态-已掌握 |
| 拼音   | hsl(270 40% 82%)   | 浅紫卡片             |
| 古诗   | hsl(25 50% 80%)    | 浅橙卡片             |
| 英语   | hsl(185 40% 80%)   | 浅青卡片             |
| 数学   | hsl(210 45% 80%)   | 浅蓝卡片             |
| 科普   | hsl(50 45% 82%)    | 浅黄卡片             |
| 未学习 | hsl(220 10% 78%)   | 灰色状态             |
| 已学习 | hsl(48 70% 72%)    | 黄色状态             |

### 2.2 导航区配色

- **基调关系**: 复用主配色 `card` 白底 + `border` 顶部分隔线，与内容区无缝衔接
- **关键状态**: 激活态用 `primary` 填充图标+文字；未激活态 `muted-foreground`；hover 态 `accent` 背景
- **边界与背景**: 非透明白底，顶部 1px `border` 分隔；高度 ≥ 64px 适配儿童手指

### 2.3 语义颜色

| 用途     | HSL 值             | 衍生说明                     |
| -------- | ------------------ | ---------------------------- |
| 成功/完成 | hsl(145 50% 65%)  | 识字绿色加深，用于对勾/完成态 |
| 警告/补签 | hsl(38 70% 65%)   | 暖黄，补打卡/部分完成        |
| 错误/薄弱 | hsl(0 60% 70%)    | 柔红，薄弱字/答错反馈        |

## 3. Typography (字体排版)

- **Heading**: "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif
- **Body**: "Nunito", "PingFang SC", "Microsoft YaHei", sans-serif
- **Mono/数字**: "Nunito", monospace — 学习豆数值/统计数字等宽对齐
- **字体策略**: 标题用 ZCOOL KuaiLe 圆润手写体传递童趣；正文 Nunito 保证小字号可读性；中文回退苹方/微软雅黑

## 4. Layout Strategy (布局策略)

- **导航意图**: 固定底部 5-Tab 导航（首页/学习任务/打卡/商城/我的）；移动端常驻；桌面端保持相同结构居中限宽
- **页面架构**: 移动端全屏流式 · 桌面端 `max-w-lg` 居中模拟手机视口 · 内容区底部预留 80px Tab 安全区
- **响应式**: 移动端原生体验优先；≥768px 居中容器 + 两侧留白装饰背景

## 5. Visual Language (视觉语言)

- **形态参数**: 圆角 `rounded-2xl`(16px) 卡片 / `rounded-full` 按钮 · 阴影 `shadow-sm` 柔和投影 · 间距 `spacious`(p-5/gap-4)
- **识别签名**: 所有按钮 pill 全圆角 · 模块卡片左上角彩色圆形图标徽章 · 学习豆数字带弹跳缩放动效
- **装饰策略**: 仅用手绘风模块图标 + 完成态星星粒子特效，无额外纹理/渐变飘带
- **动效原则**: 点击反馈 150ms scale(0.95) · 完成任务 300ms 弹跳+星星 · 页面切换 200ms fade
- **可及性**: 文字对比度 ≥ 4.5:1 · 触控热区 ≥ 48×48px · 状态色同时配图标/文字标签

## 6. Component Principles (组件原则)

- **状态完整性**: Button/Card/Tab 覆盖 Default/Hover/Active/Focus/Disabled；Active 态 scale(0.95)+阴影收缩
- **层级清晰**: Primary 按钮 `bg-primary text-primary-foreground rounded-full`；Secondary 用 `bg-accent text-accent-foreground`；禁用态 opacity-50
- **一致性**: 汉字状态色=模块色板中定义值；所有弹窗/Toast 统一圆角 16px + 居中弹出

## 7. Image Direction (图片与视觉资产)

- **Image Role**: 模块入口卡片图标 + 古诗配图插画 + 科普知识封面图 + 积分商城奖品图
- **Image Art Direction**: 扁平手绘卡通风 · 圆润线条 · 马卡龙同色系 · 纯色/微渐变背景 · 温馨明亮光线
- **Image Prompt Keywords**: flat vector illustration, macaron pastel palette, rounded cute style, children education theme, simple clean background, kawaii hand-drawn feel, warm lighting, no text overlay
- **Image Avoidance**: 写实摄影风格、暗黑恐怖元素、密集文字水印、AI 生成人脸、成人化商务素材

## 8. 应避免 (Anti-patterns)

- ❌ 高饱和荧光色/纯黑纯白大面积使用 — 刺激儿童视觉，违背护眼原则
- ❌ 小尺寸点击目标(<48px)/密集列表无间距 — 儿童精细动作未发育完全
- ❌ 失败状态用红色大字/刺耳音效 — 造成学习焦虑，应改为温和提示+鼓励重试