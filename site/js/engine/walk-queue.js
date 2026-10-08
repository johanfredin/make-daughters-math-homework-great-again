// Map walking input (0002 R12): one push = one stone. A push made while the cat is walking is
// remembered (the latest one wins) and carried out on arrival; with no push the cat stops on the stone.
// Pure reducer: main.js keeps the state and acts on `go`.

export const idle = () => ({ walking: false, queued: null })

/** She pushes a direction. → { q, go }: go is the angle to walk now, or null when it was queued. */
export function push(q, angle) {
  return q.walking ? { q: { ...q, queued: angle }, go: null } : { q, go: angle }
}

/** The cat set off along a path. */
export const started = (q) => ({ ...q, walking: true })

/** The cat reached a stone. → { q, go }: go is the remembered push to carry out, or null to stop. */
export function arrived(q) {
  return { q: idle(), go: q.queued }
}
