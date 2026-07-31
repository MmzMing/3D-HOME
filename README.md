# 3D Home

一个使用 React、Three.js 与 GSAP 程序化绘制的可交互矢量线稿房间。房间中的电脑、个人壁画、RSS 书架、风铃、留声机、键盘和家具都是可交互入口。

## Development

```powershell
corepack pnpm install
corepack pnpm dev
```

质量门禁：

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm format:check
corepack pnpm build
```

GitHub 与和风天气密钥仅配置在 EdgeOne 环境变量中，参考 `.env.example`。浏览器只访问同源 `/api/*`。
