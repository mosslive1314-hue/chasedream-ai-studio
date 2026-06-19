# 360 度全景图提示词

## 统一生成规范

建议尺寸：`8192x4096` 或 `4096x2048`，比例 `2:1`。

统一正向关键词：

```text
沉浸式 360 度全景图, equirectangular panorama, seamless 2:1, viewer standing at the center, first-person perspective, cinematic urban romance, realistic photography style, natural skin texture, soft film lighting, detailed environment, characters distributed around the viewer, clear depth, no text, no logo, no UI, no watermark, adult women aged 22-29, stylish and elegant, romantic but non-explicit
```

统一反向关键词：

```text
underage, childlike face, nude, explicit sexual content, see-through clothing, lingerie, pornographic pose, coercion, violence, distorted face, extra fingers, extra limbs, merged bodies, duplicate faces, bad hands, unreadable signage, text, logo, watermark, UI panel, fisheye artifact, broken panorama seam, blurry, low resolution
```

角色一致性备注：

- 后续正式生成时，建议先为六位角色分别生成角色参考图，再在每个全景提示词中引用参考图。
- 所有角色必须保持成年人气质，服装可时尚、有吸引力，但避免露骨或未成年感。
- 主角为第一人称，通常不出镜；需要互动时只出现一只手或肩部轮廓。
- 全景底部 15% 尽量留出干净暗部或桌面区域，方便后续放置对白 UI。

## 角色视觉锚点

### 林知夏

```text
27-year-old adult Chinese woman, intelligent and composed brand strategist, shoulder-length dark hair, ivory silk blouse, tailored dark green blazer, minimal gold earrings, calm confident eyes, elegant mature style
```

### 祁蔓

```text
24-year-old adult Chinese woman, energetic dance coach and lifestyle creator, high ponytail, cropped athletic jacket over fitted dance top, wide-leg training pants, bright smile, expressive body language, stylish and healthy
```

### 苏晚晴

```text
26-year-old adult Chinese woman, warm coffee shop owner, soft wavy hair, knitted cardigan, linen dress, gentle eyes, quiet mature charm, holding a ceramic cup or fruit plate
```

### 夏若璃

```text
23-year-old adult Chinese woman, independent game streamer, short hair with subtle blue highlights, oversized hoodie, pleated skirt or cargo pants, playful confident expression, headset around neck, youthful adult style
```

### 程安雅

```text
29-year-old adult Chinese woman, sharp professional lawyer, long straight black hair, white shirt, charcoal suit vest or tailored suit, red lipstick used subtly, composed and principled, mature aura
```

### 阮星遥

```text
25-year-old adult Chinese woman, planetarium curator, long dark hair, navy dress with small star-like accessories, translucent shawl, dreamy but mature expression, elegant poetic style
```

## 剧情节点提示词

### S00 雨夜搬家

剧情用途：序章开场，主角低谷，第一次见到群像。

```text
帮我做一个身临其境的 360 度全景图, 雨夜的城市合租公寓楼下, viewer standing beside stacked moving boxes and a wet suitcase, neon reflections on puddles, warm apartment windows above, six stylish adult Chinese women aged 23-29 positioned naturally around the scene with different personalities, one gentle woman offering a small plate of cut fruit, one energetic dance coach reaching out to help pull the viewer away from rain, one mature lawyer holding an umbrella and contract folder, one intellectual strategist protecting camera equipment, one playful gamer holding a portable console, one poetic curator looking toward the rooftop lights, cinematic urban romance, first-person perspective, intimate but respectful, no nudity, non-explicit, seamless equirectangular panorama, 2:1
```

### S01 停电楼顶

剧情用途：主角修设备，六位角色的第一印象被放大。

```text
360 度全景图, old apartment rooftop during a sudden blackout, city skyline under rain clouds, emergency lanterns and camera gear on the ground, viewer kneeling near a wet power cable, six adult women arranged around the rooftop in a circle of warm lantern light, Lin Zhixia calmly pointing at the damaged equipment, Qi Man holding a towel and smiling confidently, Su Wanqing offering hot tea in a thermos, Xia Ruoli shining a phone flashlight playfully, Cheng Anya checking safety with a serious expression, Ruan Xingyao watching lightning above distant towers, cinematic suspenseful romance, realistic photography, seamless 2:1 equirectangular, no text, no logo, no explicit content
```

### S02 合租公寓早餐

剧情用途：第一章，玩家通过环视餐桌发现角色线索。

```text
沉浸式 360 度全景图, bright shared apartment dining room in the morning, viewer seated at the center of a round breakfast table, warm sunlight through curtains, breakfast plates, sliced fruit, coffee, contract papers, dance shoes, game controller, planetarium ticket, legal folder placed around the table as clues, six adult Chinese women around the viewer with distinct fashion and personalities, relaxed but slightly awkward first morning atmosphere, romantic comedy tone, realistic cinematic lighting, bottom area clean for dialogue UI, seamless equirectangular 2:1, no watermark, non-explicit
```

### S03 咖啡店样片

剧情用途：苏晚晴场景，温柔真实的项目基调。

```text
360 度全景图, cozy independent coffee shop after closing, viewer standing near the bar counter, warm amber lights, bookshelves, plants, rain on the window, Su Wanqing adult woman in soft cardigan offering a ceramic cup and a small fruit plate toward the viewer, Lin Zhixia reviewing notes at a side table, Cheng Anya checking release forms, Qi Man filming a casual behind-the-scenes clip, Xia Ruoli pointing at a laptop mockup, Ruan Xingyao observing reflections in the window, intimate healing urban romance, realistic photography, seamless 2:1 panorama, no text, no logo, no nudity
```

### S04 舞室热浪

剧情用途：祁蔓路线第一深度节点。

```text
沉浸式 360 度全景图, modern dance studio with mirrored walls, sunset orange light, viewer standing in the center of the wooden floor, Qi Man adult dance coach in stylish athletic outfit reaching her hand toward the viewer after a dance take, sweat glow but tasteful and non-explicit, other adult women watching or preparing around the room, speaker, towel, fruit water, camera tripod, social media comments visible only as abstract blurred phone screen without readable text, energetic romantic tension, cinematic motion blur, realistic, seamless 2:1 equirectangular, no explicit content
```

### S05 品牌路演会场

剧情用途：林知夏路线与事业线关键节点。

```text
360 度全景图, premium urban brand roadshow venue, viewer standing on a small presentation stage surrounded by investors and creative team, large abstract projection wall with no readable text, Lin Zhixia adult strategist beside the viewer with calm confident posture, pointing to a panoramic demo monitor, Cheng Anya near the legal documents table, Qi Man and Xia Ruoli testing interactive props, Su Wanqing serving coffee to guests, Ruan Xingyao studying the lighting design, sophisticated business romance atmosphere, cinematic, realistic, seamless equirectangular 2:1, no logos, no UI
```

### S06 游戏房通宵

剧情用途：夏若璃路线，共同创作与陪伴。

```text
沉浸式 360 度全景图, late-night game room and small streaming studio, RGB lights balanced with warm desk lamp, viewer sitting at the center desk with laptop and game controllers, Xia Ruoli adult gamer leaning forward excitedly, offering one controller toward the viewer, snack bowls and fruit tea nearby, walls with posters but no readable text, other heroines appear as video call windows represented by blurred abstract portraits on monitors without text, cozy creative chaos, playful romantic mood, realistic cinematic photography, seamless 2:1 panorama, no explicit content
```

### S07 律所会议室

剧情用途：程安雅路线，边界与真相。

```text
360 度全景图, elegant law firm conference room at night, city lights through floor-to-ceiling windows, viewer seated at one end of a long table, Cheng Anya adult lawyer in tailored suit standing close but respectful, placing a folder in front of the viewer, serious principled expression, contract pages spread around, Lin Zhixia in the background observing, rain reflections on glass, tense mature romance, clean professional atmosphere, realistic cinematic lighting, seamless equirectangular 2:1, no readable text, no logo
```

### S08 天文馆闭馆后

剧情用途：阮星遥路线与隐藏群像结局种子。

```text
沉浸式 360 度全景图, closed planetarium after hours, viewer standing beneath a glowing artificial star dome, Ruan Xingyao adult curator in navy dress with subtle star accessories gently pointing upward, soft blue and silver light, empty seats around, projection equipment, concept sketches without readable text, the other adult women placed quietly around the dome watching different constellations, poetic urban romance, dreamy but realistic, first-person perspective, seamless 2:1 equirectangular panorama, no nudity, no watermark
```

### S09 海边团建

剧情用途：第二幕转折，轻松氛围下矛盾浮现。

```text
360 度全景图, sunset beach team outing, viewer standing near a picnic blanket, ocean around one side and city skyline far behind, six adult women distributed naturally around the viewer, Qi Man laughing near a portable speaker, Su Wanqing preparing fruit and drinks, Xia Ruoli flying a small drone, Lin Zhixia looking at project notes, Cheng Anya holding sandals and watching the tide, Ruan Xingyao collecting shells, warm romantic group atmosphere with subtle emotional tension, cinematic golden hour, seamless equirectangular 2:1, tasteful fashion, no explicit content
```

### S10 雨中便利店

剧情用途：中段短支线，玩家选择追随某位角色。

```text
沉浸式 360 度全景图, small convenience store on a rainy night, viewer standing by the glass entrance with umbrellas and wet reflections, shelves curve around the scene, one adult heroine close to the viewer offering a warm drink, other heroines visible in different aisles as route possibilities, soft fluorescent light mixed with neon outside, quiet intimate pause after conflict, cinematic urban romance, first-person perspective, realistic, seamless 2:1 panorama, no readable product logos, no explicit content
```

### S11 公寓厨房疗愈夜

剧情用途：苏晚晴深线，照顾者被照顾。

```text
360 度全景图, shared apartment kitchen late at night, viewer standing beside a kitchen island, warm under-cabinet lights, gentle steam from soup pot, Su Wanqing adult woman sitting on a stool looking tired but relieved, viewer's hand visible offering a bowl of soup, sliced fruit on a plate, rain outside the window, soft blankets and mugs, intimate healing atmosphere, respectful closeness, cinematic realistic photography, seamless equirectangular 2:1, no nudity, no explicit content
```

### S12 玻璃花房谈判

剧情用途：林知夏深线，野心与信任。

```text
沉浸式 360 度全景图, rooftop glass greenhouse used as a private meeting space, night city lights all around, plants and reflections on glass panels, viewer standing at a small table with proposal documents, Lin Zhixia adult strategist facing the viewer with a rare vulnerable expression, one hand lightly touching the proposal as if asking for honesty, elegant mature romance, quiet tension, cinematic green and gold lighting, seamless 2:1 equirectangular, no readable text, non-explicit
```

### S13 Livehouse 聚光

剧情用途：祁蔓深线，流量与真实自我。

```text
360 度全景图, small livehouse stage during rehearsal, viewer standing at the front edge of stage, colored spotlights and dark audience area, Qi Man adult dancer in tasteful stage outfit finishing a powerful pose and reaching her hand toward the viewer, not revealing, stylish and confident, mirrors, cables, fruit water bottle, friends watching from backstage, emotional performance atmosphere, cinematic, realistic, seamless equirectangular 2:1, no text, no explicit content
```

### S14 游戏展试玩区

剧情用途：夏若璃深线，公开展示失败与勇气。

```text
沉浸式 360 度全景图, indie game exhibition booth, viewer standing inside a playable demo area, Xia Ruoli adult streamer beside a demo station holding two controllers, excited but nervous smile, visitors around as soft blurred crowd, screens showing abstract game art without readable text, colorful lights, Lin Zhixia and Cheng Anya discussing booth details nearby, energetic creative romance, realistic cinematic style, seamless 2:1 panorama, no logos, no UI, non-explicit
```

### S15 合同危机工作室

剧情用途：第三幕危机，团队信任测试。

```text
360 度全景图, creative studio during a stormy night before launch, viewer standing in the middle of messy desks, panoramic monitors, camera rigs, scattered documents with no readable text, rain hitting large windows, six adult heroines around the room in serious emotional positions, Cheng Anya holding a legal folder, Lin Zhixia arms crossed analyzing risk, Qi Man hurt but determined, Su Wanqing worried with coffee cups, Xia Ruoli at laptop, Ruan Xingyao near projection model, dramatic cinematic tension, realistic, seamless equirectangular 2:1, no logo, no explicit content
```

### S16 天桥坦白

剧情用途：危机后主角坦白过去失败。

```text
沉浸式 360 度全景图, pedestrian skybridge above night traffic after rain, viewer standing near the railing, city lights and wet glass all around, selected adult heroine standing close at a respectful distance listening to the viewer's confession, other city pedestrians blurred in distance, one handrail, soft neon reflection, emotional quiet romance, realistic cinematic photography, seamless 2:1 equirectangular, no text, no explicit content
```

### S17 展演入口

剧情用途：终章开始，玩家选择最终主题。

```text
360 度全景图, entrance hall of immersive city romance exhibition, viewer standing at the center of a circular lobby, six doorways or light portals around the viewer representing warmth, dance, strategy, game, law, stars, six adult heroines positioned near their themed portal, elegant exhibition lighting, audience silhouettes, no readable signage, anticipation before final choice, cinematic premium atmosphere, seamless equirectangular 2:1, no logo, no UI, non-explicit
```

## 结局全景提示词

### E01 林知夏：并肩谈判

```text
360 度全景图, high-rise sky garden after successful negotiation, viewer standing beside a glass table with city skyline around, Lin Zhixia adult woman in elegant blazer smiling softly for the first time, offering her hand for a calm handshake that feels romantic and equal, warm sunrise, plants and glass reflections, mature partnership atmosphere, cinematic realistic, seamless 2:1 panorama, no text, no explicit content
```

### E02 祁蔓：聚光灯之外

```text
沉浸式 360 度全景图, empty dance stage after the show, colored lights fading, viewer standing near backstage curtain, Qi Man adult dancer in tasteful performance outfit wrapped in a light jacket, laughing with relief and offering a piece of fruit to the viewer, seats and stage lights around, intimate joyful romance after success, realistic cinematic, seamless equirectangular 2:1, no nudity, no explicit content
```

### E03 苏晚晴：有人为你留灯

```text
360 度全景图, quiet coffee shop at dawn with closed sign turned away and no readable text, viewer standing behind the counter making coffee, Su Wanqing adult woman sitting by the window wrapped in a cardigan, finally relaxed, small breakfast and fruit plate between them, golden morning light, healing tender romance, realistic cinematic photography, seamless 2:1, no logo, non-explicit
```

### E04 夏若璃：双人通关

```text
沉浸式 360 度全景图, cozy game studio after demo success, viewer sitting on carpet surrounded by controllers, laptops, sticky notes without readable text, Xia Ruoli adult gamer leaning back laughing and raising a controller like a toast, city night outside, playful intimate creative partnership, realistic cinematic, seamless equirectangular 2:1, no explicit content, no logos
```

### E05 程安雅：清晰边界

```text
360 度全景图, courthouse plaza in soft evening light, viewer standing beside stone steps and trees, Cheng Anya adult lawyer in tailored suit holding a closed folder, looking relieved and principled, offering her hand to walk forward together, city people blurred around, mature restrained romance, realistic cinematic photography, seamless 2:1 panorama, no readable text, no explicit content
```

### E06 阮星遥：星空落地

```text
沉浸式 360 度全景图, open-air observatory on a clear night, viewer standing beside a telescope, Ruan Xingyao adult curator in navy dress pointing at the real sky, soft blankets, warm tea, distant city lights below, stars visible across the entire panorama, poetic grounded romance, realistic cinematic, seamless equirectangular 2:1, no nudity, no text
```

### E07 独立成长：回到自己

```text
360 度全景图, quiet creative studio in early morning after project completion, viewer standing alone at the center, finished panoramic equipment around, sunlight entering through windows, coffee cup, paid invoice represented as blank document without readable text, city waking outside, calm self-growth atmosphere, realistic cinematic photography, seamless 2:1 equirectangular, no people in foreground, no text, no logo
```

### E08 群像隐藏：不是被包围，是被看见

```text
沉浸式 360 度全景图, final immersive exhibition hall filled with warm light, viewer standing at the center of a circular installation, six adult women positioned around the space as equal creators, each beside her own themed visual element: strategy notes, dance ribbon, coffee light, game controller, legal folder, star projector, they look confident and self-defined rather than posing for the viewer, audience silhouettes around, celebratory respectful group ending, cinematic premium urban romance, seamless equirectangular 2:1, no text, no logo, no explicit content
```

