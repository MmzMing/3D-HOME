# 3D Home

一个使用 React、Three.js 与 GSAP 程序化绘制的可交互矢量线稿房间。房间中的电脑、个人壁画、RSS 书架、风铃、留声机、键盘和家具都是可交互入口。

## AI 生成提示词

我建议各位自己生成，本项目代码完全vibe梭哈出来的，没仔细看有没有石

其他参考同类优秀作品：https://yibi2333.github.io/line-art-style-magic-cabin

提前需求：你需要下载这里的源码https://github.com/Animnia/pure-line-room，需要一个模型排行不低于glm 5.3f的模型，需要PLAN模式或者头脑风暴skill。

本项目AI提示词，【】是你需要替换的内容：
深度学习下方源码，复刻一个矢量线条风格的可交互房间，房间布局要严格按照图片所示。【自己房间的广角图片（提供图片）】
【开源的代码的目录】、https://linehome.metagaruta.com
先进行头脑风暴和按照代码规范skill，分析代码的同时进行调研同类开发，提出更多同类需求功能，尽可能完善房间的功能，提供不低于30种房间交互方式供我选择。
最终生成计划、技术文档、后续开发调整文档、测试计划文档。

## Development

```powershell
pnpm install
pnpm build
pnpm dev
```

## 环境变量

1、GitHub 与和风天气密钥仅配置在 EdgeOne 环境变量中，参考 `.env.example`。浏览器只访问同源 `/api/*`。

2、站点信息在config里面配置JSON。

这块地方我没测试过

SEO 元信息统一维护在 `src/config/site.json`。`/robots.txt` 与 `/sitemap.xml` 由边缘函数按当前请求域名生成，不需要配置站点域名环境变量。

构建时会把 `profile.json`、`links.json`、`feeds.json`、`site-records.json` 渲染成 `index.html` 里的一段纯文本 `.seo-shell`（构建插件 `siteSeo`，见 `vite.config.ts`），供不执行 JavaScript 的搜索引擎与 AI 爬虫读取。它默认 `display: none`，只在 `<noscript>` 内联样式里被放开，所以无 JS 的用户能看到完整文字版，而正常访问的首屏不会闪一下文字墙。改那几个配置文件即会同步更新这段内容，正文里出现的都是真实链接。同一批配置还会派生出 `dist/llms.txt`。

换分享封面图时，`site.json` 里的 `image`、`imageWidth`、`imageHeight` 三个字段要一起改。og 卡片推荐 1200×630，尺寸声明必须和真实图片一致，报错的尺寸比小的尺寸更糟。`personDescription` 是 JSON-LD 里 `Person` 的简介，与描述站点的 `description` 分开维护。

当前封面 `public/assets/images/og-cover.png` 由 `docs/og-cover.html` 渲染而来（画的是 `assets/fallback/room.svg` 那张线稿房间）。改完文案后重新出图：

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="public\assets\images\og-cover.png" "file:///$PWD\docs\og-cover.html"
```
