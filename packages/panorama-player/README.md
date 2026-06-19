# @chasedream/panorama-player

全景互动影游运行端模板包，从 `meinubeibaoweila` 原型迁入。

当前定位：

- 保留原型的 360 全景场景、分支选择、角色关系和轻量游戏状态。
- 作为 ChaseDream Studio 导出链路的前端模板承载层。
- 后续由 packager 把 `.dfstory`、图片、视频和音频资源转换成这里的 `src/data/*` 与 `public/*`。

## Scripts

在主仓库根目录运行：

```bash
npm run panorama:install
npm run panorama:dev
npm run panorama:build
npm run panorama:preview
```

也可以直接在本包目录运行：

```bash
npm install
npm run dev
npm run build
```

## Asset Rules

- 小型演示素材可以放在 `public/panoramas/`。
- 大体积生成视频、TTS 音频和批量图片不要提交进仓库，后续应由对象存储/CDN 或构建前注入流程管理。
- `dist/`、`.vercel/`、`node_modules/` 保持忽略。

## Next

下一步应新增 `packages/packager`，把 ChaseDream Studio 的 1-6 步产物统一导出为 `.dfstory`，再生成本模板可直接消费的数据结构。
