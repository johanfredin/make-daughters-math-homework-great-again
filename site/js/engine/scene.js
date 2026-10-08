// Canvas renderer (R4, R7): a 320×180 pixel scene scaled up crisply. DOM/canvas module, not unit tested;
// all game decisions come in through the `view` objects from main.js.
import { MAP_W, MAP_H, levels } from "./world.js"
import * as S from "./sprites.js"

const COLORS = {
  grass: "#5aa04a",
  grassDark: "#4a8a3c",
  grassLight: "#74b85e",
  path: "#e3cf96",
  pathEdge: "#b89f63",
  pathDot: "#c8b273",
  stone: "#cfc6ad",
  stoneDark: "#8f866f",
  ring: "#fff3a6",
  flag: "#ffd23f",
  sky1: "#7cc4ec",
  sky2: "#a6d8f2",
  sky3: "#cdebf7",
  ground: "#5aa04a",
  groundDark: "#3f7f36",
}

const makeCanvas = (w, h) => {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  return c
}

const hash = (x, y) => {
  let h = (x * 374761393 + y * 668265263) >>> 0
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0
  return h ^ (h >>> 16)
}

export function createScene(canvas) {
  const ctx = canvas.getContext("2d")
  canvas.width = MAP_W
  canvas.height = MAP_H
  ctx.imageSmoothingEnabled = false

  const cache = new Map()
  const sprite = (key, rows, palette) => {
    if (!cache.has(key)) cache.set(key, S.renderSprite(rows, palette, makeCanvas))
    return cache.get(key)
  }
  let mapLayer = null
  let mapLayerWorld = null

  function draw(img, x, y, { flip = false, scale = 1 } = {}) {
    const w = img.width * scale
    const h = img.height * scale
    ctx.save()
    if (flip) {
      ctx.translate(Math.round(x + w), Math.round(y))
      ctx.scale(-1, 1)
      ctx.drawImage(img, 0, 0, w, h)
    } else {
      ctx.drawImage(img, Math.round(x), Math.round(y), w, h)
    }
    ctx.restore()
  }

  function catImage(fur, dir, frame) {
    const pal = S.catPalette(fur)
    const key = (name) => `${name}-${frame}-${pal.f}`
    if (dir === "up") return sprite(key("back"), S.CAT_BACK[frame], pal)
    if (dir === "down") return sprite(key("front"), S.CAT_FRONT[frame], pal)
    return sprite(key("side"), S.CAT_SIDE[frame], pal)
  }

  // ---- World map ----

  function buildMapLayer(world) {
    const layer = makeCanvas(MAP_W, MAP_H)
    const g = layer.getContext("2d")
    g.fillStyle = COLORS.grass
    g.fillRect(0, 0, MAP_W, MAP_H)
    for (let y = 0; y < MAP_H; y += 4) {
      for (let x = 0; x < MAP_W; x += 4) {
        const h = hash(x, y) % 23
        if (h === 0) (g.fillStyle = COLORS.grassDark), g.fillRect(x, y, 1, 2)
        else if (h === 1) (g.fillStyle = COLORS.grassLight), g.fillRect(x + 1, y, 1, 1)
      }
    }
    const byId = Object.fromEntries(world.nodes.map((n) => [n.id, n]))
    const segs = world.paths.map(([a, b]) => [byId[a], byId[b]])
    for (const [a, b] of segs) {
      const x = Math.min(a.x, b.x) - 5
      const y = Math.min(a.y, b.y) - 5
      const w = Math.abs(a.x - b.x) + 10
      const h = Math.abs(a.y - b.y) + 10
      g.fillStyle = COLORS.pathEdge
      g.fillRect(x - 1, y - 1, w + 2, h + 2)
    }
    for (const [a, b] of segs) {
      const x = Math.min(a.x, b.x) - 5
      const y = Math.min(a.y, b.y) - 5
      g.fillStyle = COLORS.path
      g.fillRect(x, y, Math.abs(a.x - b.x) + 10, Math.abs(a.y - b.y) + 10)
      g.fillStyle = COLORS.pathDot
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      for (let d = 6; d < len; d += 8) {
        const t = d / len
        g.fillRect(Math.round(a.x + (b.x - a.x) * t), Math.round(a.y + (b.y - a.y) * t), 2, 2)
      }
    }
    // Trees wherever there is room, deterministic so the map always looks the same.
    const tree = sprite("tree", S.TREE.rows, S.TREE.palette)
    const nearPath = (cx, cy) =>
      segs.some(([a, b]) => {
        const minX = Math.min(a.x, b.x) - 16, maxX = Math.max(a.x, b.x) + 16
        const minY = Math.min(a.y, b.y) - 16, maxY = Math.max(a.y, b.y) + 16
        return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY
      })
    for (let r = 0; r < Math.floor(MAP_H / 16); r++) {
      for (let c = 0; c < MAP_W / 16; c++) {
        const cx = c * 16 + 8
        const cy = r * 16 + 8
        if (!nearPath(cx, cy) && hash(c, r) % 3 === 0) g.drawImage(tree, cx - 8, cy - 8)
      }
    }
    return layer
  }

  function drawDigits(n, cx, cy, color) {
    const str = String(n)
    const w = str.length * 4 - 1
    ctx.fillStyle = color
    ;[...str].forEach((ch, i) => {
      S.DIGITS[ch].forEach((row, y) => {
        for (let x = 0; x < 3; x++) if (row[x] === "1") ctx.fillRect(cx - Math.floor(w / 2) + i * 4 + x, cy - 2 + y, 1, 1)
      })
    })
  }

  function drawNode(node, number, view) {
    const locked = view.isLocked(node)
    const { x, y } = node
    if (node.kind === "start") {
      ctx.fillStyle = COLORS.pathEdge
      ctx.fillRect(x - 4, y - 4, 8, 8)
      ctx.fillStyle = COLORS.stone
      ctx.fillRect(x - 3, y - 3, 6, 6)
    } else if (node.kind === "level") {
      const pulse = !locked && !view.isCleared(node) && !view.reducedMotion && Math.floor(view.time / 400) % 2 === 0
      ctx.fillStyle = pulse ? COLORS.ring : S.OUTLINE
      ctx.fillRect(x - 7, y - 6, 14, 12)
      ctx.fillRect(x - 6, y - 7, 12, 14)
      ctx.fillStyle = COLORS.stone
      ctx.fillRect(x - 6, y - 5, 12, 10)
      ctx.fillRect(x - 5, y - 6, 10, 12)
      ctx.fillStyle = COLORS.stoneDark
      ctx.fillRect(x - 5, y + 4, 10, 1)
      drawDigits(number, x, y, S.OUTLINE)
      if (view.isCleared(node)) {
        ctx.fillStyle = S.OUTLINE
        ctx.fillRect(x + 4, y - 14, 1, 9)
        ctx.fillStyle = COLORS.flag
        ctx.fillRect(x + 5, y - 14, 5, 4)
      }
    } else if (node.kind === "camp") {
      draw(sprite("tent", S.TENT.rows, S.TENT.palette), x - 8, y - 12)
    } else if (node.kind === "boss") {
      draw(sprite("den", S.DEN.rows, S.DEN.palette), x - 8, y - 12)
      // "n/7" under the den (R5)
      const label = view.bossLabel
      const w = label.length * 4 + 3
      ctx.fillStyle = S.OUTLINE
      ctx.fillRect(x - Math.ceil(w / 2), y + 5, w, 9)
      drawDigits(label, x, y + 9, COLORS.flag)
    }
    if (locked && node.kind !== "start") draw(sprite("lock", S.LOCK.rows, S.LOCK.palette), x + 3, y - 12)
  }

  /**
   * view: { world, isLocked(node), isCleared(node), cat: {x, y, dir, frame, bump}, fur, time, reducedMotion }
   */
  function drawMap(view) {
    if (mapLayerWorld !== view.world) {
      mapLayer = buildMapLayer(view.world)
      mapLayerWorld = view.world
    }
    ctx.drawImage(mapLayer, 0, 0)
    const numbers = new Map(levels(view.world).map((n, i) => [n.id, i + 1]))
    for (const node of view.world.nodes) drawNode(node, numbers.get(node.id), view)
    const { cat } = view
    const img = catImage(view.fur, cat.dir, cat.frame)
    draw(img, cat.x - 8 + (cat.bump ?? 0), cat.y - 14, { flip: cat.dir === "left" })
  }

  // ---- Side scenes: level (cat vs foe) and camp ----

  function drawBackdrop(time) {
    const bands = [COLORS.sky1, COLORS.sky2, COLORS.sky3]
    bands.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(0, i * 30, MAP_W, 30)
    })
    ctx.fillStyle = COLORS.grassLight // meadow behind the tree line
    ctx.fillRect(0, 90, MAP_W, 38)
    const tree = sprite("tree", S.TREE.rows, S.TREE.palette)
    for (let x = -8; x < MAP_W; x += 22) draw(tree, x + ((x * 7) % 5), 58 + ((x * 3) % 6), { scale: 2 })
    ctx.fillStyle = COLORS.ground
    ctx.fillRect(0, 128, MAP_W, MAP_H - 128)
    ctx.fillStyle = COLORS.groundDark
    for (let x = 0; x < MAP_W; x += 6) ctx.fillRect(x + (hash(x, 1) % 4), 128 + (hash(x, 2) % 40), 2, 1)
    ctx.fillRect(0, 128, MAP_W, 2)
  }

  const FOE_SPRITES = { rat: S.RAT } // keep in sync with world.js FOES

  /** view: { fur, catX, catY, catFrame, foe: {kind, x, y, visible, flip}, key: {x, y, sparkle} | null, time } — 3× sprites */
  function drawLevel(view) {
    drawBackdrop(view.time)
    const cat = catImage(view.fur, "right", view.catFrame ?? 0)
    draw(cat, view.catX, view.catY, { scale: 3 })
    if (view.foe?.visible) {
      const foe = FOE_SPRITES[view.foe.kind] ?? S.RAT
      draw(sprite(`foe-${view.foe.kind}`, foe.rows, foe.palette), view.foe.x, view.foe.y, { scale: 3, flip: view.foe.flip })
    }
    if (view.key) {
      draw(sprite("key", S.KEY.rows, S.KEY.palette), view.key.x, view.key.y, { scale: 3 })
      if (view.key.sparkle) {
        ctx.fillStyle = "#fff6c2"
        for (let i = 0; i < 6; i++) {
          const a = view.time / 300 + (i * Math.PI) / 3
          ctx.fillRect(Math.round(view.key.x + 21 + Math.cos(a) * 30), Math.round(view.key.y + 9 + Math.sin(a) * 18), 2, 2)
        }
      }
    }
  }

  /** view: { fur, catFrame, time } */
  function drawCamp(view) {
    drawBackdrop(view.time)
    draw(sprite("tent", S.TENT.rows, S.TENT.palette), 30, 80, { scale: 3 })
    const mentor = catImage(S.MENTOR_FUR, "down", 0)
    draw(mentor, 150, 86, { scale: 3 })
    draw(sprite("leaf", S.LEAF.rows, S.LEAF.palette), 190, 118, { scale: 3 })
    draw(catImage(view.fur, "right", view.catFrame ?? 0), 230, 86, { scale: 3, flip: true })
  }

  /** Scale the canvas to fit its container: whole-number scaling when ≥ 2×, otherwise fit exactly. */
  function fit(containerW, containerH) {
    const s = Math.min(containerW / MAP_W, containerH / MAP_H)
    const scale = s >= 2 ? Math.floor(s) : s
    canvas.style.width = `${Math.floor(MAP_W * scale)}px`
    canvas.style.height = `${Math.floor(MAP_H * scale)}px`
  }

  return { drawMap, drawLevel, drawCamp, fit }
}
