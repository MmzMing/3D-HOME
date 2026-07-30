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
corepack pnpm test
corepack pnpm build
```

桌面端、移动端与主要 3D 交互在交付时通过应用内浏览器进行人工回归，不引入
Playwright E2E 测试。

GitHub 与和风天气密钥仅配置在 EdgeOne 环境变量中，参考 `.env.example`。浏览器只访问同源 `/api/*`。

## Inspiration

线稿遮挡、代理命中与物件反馈机制受到 [Animnia/pure-line-room](https://github.com/Animnia/pure-line-room) 启发。本项目使用 React Three Fiber 重新设计和实现，没有复制其单文件场景代码。
