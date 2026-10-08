// Original 16-bit-style pixel art (R4): each sprite is a list of rows, one character per pixel,
// mapped to colours by a palette. "." is transparent. Pure data + a render helper (no DOM at import).

export const OUTLINE = "#1b1b2f"

// Fur colours for the player's cat, in the order of T.start.furNames (Rödbrun, Grå, Svart, Ljus).
export const FUR = [
  { f: "#d9772b", d: "#a0521d", l: "#f2b76a" },
  { f: "#8f96a3", d: "#5f6573", l: "#c4c9d2" },
  { f: "#3a3a48", d: "#24242e", l: "#6a6a7c" },
  { f: "#e9dcc0", d: "#bfa97f", l: "#fff6e3" },
]
export const MENTOR_FUR = { f: "#9aa0a8", d: "#6d737c", l: "#d5d8dc" }

const CAT_BASE = { k: OUTLINE, w: "#f4f4f4", e: "#3fbf3f", p: "#e88aa0" }
export const catPalette = (fur) => ({ ...CAT_BASE, ...fur })

// Side view, facing right. Two walking frames share the top rows.
const CAT_SIDE_TOP = [
  "................",
  "..........k...k.",
  ".........kfk.kfk",
  ".k.......kfffffk",
  "kfk......kfffefk",
  "kfk......kfffffp",
  ".kfk.....kflllk.",
  "..kfkkkkkfffk...",
  "..kffdffdffdffk.",
  "..kfffffffffffk.",
  "..kflllllllllfk.",
  "...kffkkkkkffk..",
]
export const CAT_SIDE = [
  [...CAT_SIDE_TOP, "...kfk.....kfk..", "...kfk.....kfk..", "...kkk.....kkk..", "................"],
  [...CAT_SIDE_TOP, "..kfk.......kfk.", ".kfk.........kfk", ".kk...........kk", "................"],
]

const CAT_FRONT_TOP = [
  "................",
  "...k........k...",
  "..kfk......kfk..",
  "..kffkkkkkkffk..",
  "..kffffffffffk..",
  "..kfeeffffeefk..",
  "..kffffppffffk..",
  "...kfllllllfk...",
  "....kkkkkkkk....",
  "...kffllllffk...",
  "..kfffllllfffk..",
  "..kfffllllfffk..",
  "..kffkffffkffk..",
]
export const CAT_FRONT = [
  [...CAT_FRONT_TOP, "..kffk....kffk..", "..kkkk....kkkk..", "................"],
  [...CAT_FRONT_TOP, "..kffk....kkkk..", "..kkkk..........", "................"],
]

const CAT_BACK_TOP = [
  "................",
  "...k........k...",
  "..kfk......kfk..",
  "..kffkkkkkkffk..",
  "..kffffffffffk..",
  "..kffffffffffk..",
  "..kfffddddfffk..",
  "...kffffffffk...",
  "....kkkkkkkk....",
  "...kffddddffk.k.",
  "..kfffddddfffkfk",
  "..kfffddddfffkfk",
  "..kffkffffkffkk.",
]
export const CAT_BACK = [
  [...CAT_BACK_TOP, "..kffk....kffk..", "..kkkk....kkkk..", "................"],
  [...CAT_BACK_TOP, "..kkkk....kffk..", "..........kkkk..", "................"],
]

export const RAT = {
  palette: { k: OUTLINE, r: "#7a6a5a", s: "#4e4237", p: "#e88aa0" },
  rows: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...kk...........",
    "..kpsk..........",
    ".krrrrkkkkk.....",
    "krkrrrrrrrrk....",
    "prrrrrrrrrrrk...",
    ".krrrrrrrrrrkkpp",
    "..kssrrrrrsskp..",
    "...kpk...kpk...p",
    "................",
    "................",
  ],
}

export const FOX_FACE = {
  palette: { k: OUTLINE, o: "#e0702a", w: "#f4f4f4" },
  rows: [
    "................",
    "................",
    "..k..........k..",
    "..kk........kk..",
    "..kok......kok..",
    "..kook....kook..",
    "..koookkkkoook..",
    "..kooooooooook..",
    ".koookoooookoook",
    ".kwwoooooooowwk.",
    "..kwwwwkkwwwwk..",
    "...kwwwwwwwwk...",
    "....kwwwwwwk....",
    ".....kkkkkk.....",
    "................",
    "................",
  ],
}

export const TREE = {
  palette: { k: "#1b2a1b", g: "#3f8f3f", G: "#63b15a", D: "#2c6a33", t: "#6b4426" },
  rows: [
    "......kkkk......",
    "....kkGGggkk....",
    "...kGGgggggDk...",
    "..kGggggggggDk..",
    ".kGgggggggggDDk.",
    ".kggggggggggDDk.",
    ".kgggggggggDDDk.",
    "..kgggggggDDDk..",
    "...kDggDDDDDk...",
    "....kkkDDkkk....",
    "......ktk.......",
    "......ktk.......",
    "......ktk.......",
    ".....kttk.......",
    "....kkkkkk......",
    "................",
  ],
}

export const TENT = {
  palette: { k: OUTLINE, c: "#d8c79a", C: "#a8935f", r: "#c8402f" },
  rows: [
    "................",
    "................",
    "................",
    "................",
    "........r.......",
    "........rr......",
    "........k.......",
    ".......kCk......",
    "......kcCck.....",
    ".....kccCcck....",
    "....kcccCccck...",
    "...kccccCcccck..",
    "..kcccckCkcccck.",
    ".kccccckCkccccck",
    "kcccckkCCkkcccck",
    "kkkkkkkCCkkkkkkk",
  ],
}

export const DEN = {
  palette: { k: OUTLINE, r: "#8a8a8a", R: "#5c5c5c", x: "#0d0d0d", y: "#ffd23f" },
  rows: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    ".....kkkkkk.....",
    "...kkrrrrrrkk...",
    "..krrrrRrrrrrk..",
    ".krrrRkkkkrrrrk.",
    ".krrRkxxxxkrrRk.",
    "krrRkxyxxyxkrrRk",
    "krRRkxxxxxxkRRrk",
    "kRRRkxxxxxxkRRRk",
    "kkkkkkkkkkkkkkkk",
    "................",
  ],
}

export const LOCK = {
  palette: { k: OUTLINE, y: "#e8c34a" },
  rows: ["..kkk..", ".k...k.", ".k...k.", "kkkkkkk", "kyyyyyk", "kyykyyk", "kyyyyyk", "kkkkkkk"],
}

export const LEAF = {
  palette: { k: "#1b2a1b", g: "#5fb04e", G: "#8fd27a" },
  rows: ["...kk", "..kGk", ".kGgk", "kggk.", "kkk.."],
}

// 3×5 digits for level numbers on the map.
export const DIGITS = {
  0: ["111", "101", "101", "101", "111"],
  1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "011", "001", "111"],
  4: ["101", "101", "111", "001", "001"],
  5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"],
  7: ["111", "001", "010", "010", "010"],
  8: ["111", "101", "111", "101", "111"],
  9: ["111", "101", "111", "001", "111"],
}

/** Every sprite (rows + palette) in this module, for consistency tests. */
export function allSprites() {
  const cat = catPalette(FUR[0])
  return {
    ...Object.fromEntries(CAT_SIDE.map((rows, i) => [`catSide${i}`, { rows, palette: cat }])),
    ...Object.fromEntries(CAT_FRONT.map((rows, i) => [`catFront${i}`, { rows, palette: cat }])),
    ...Object.fromEntries(CAT_BACK.map((rows, i) => [`catBack${i}`, { rows, palette: cat }])),
    RAT, FOX_FACE, TREE, TENT, DEN, LOCK, LEAF,
  }
}

/**
 * Render rows + palette into a new canvas from `makeCanvas(w, h)`. Cached by the caller.
 */
export function renderSprite(rows, palette, makeCanvas) {
  const h = rows.length
  const w = rows[0].length
  const canvas = makeCanvas(w, h)
  const ctx = canvas.getContext("2d")
  rows.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const c = row[x]
      if (c === ".") continue
      ctx.fillStyle = palette[c]
      ctx.fillRect(x, y, 1, 1)
    }
  })
  return canvas
}
