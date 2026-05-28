export type GoldParticle = {
  seed: number
  nx: number
  ny: number
  depth: number
  baseR: number
  twinkleOffset: number
}

function fract(x: number): number {
  return x - Math.floor(x)
}

export function createGoldParticles(count: number, seedBase = 8800): GoldParticle[] {
  const out: GoldParticle[] = []
  for (let i = 0; i < count; i++) {
    const seed = seedBase + i * 7919.17
    out.push({
      seed,
      nx: fract(Math.sin(seed * 12.9898) * 43758.5453) * 0.9 + 0.05,
      ny: fract(Math.sin(seed * 78.233) * 43758.5453) * 0.9 + 0.05,
      depth: fract(Math.sin(seed * 45.164) * 22739.123),
      baseR: 0.3 + fract(Math.sin(seed * 91.7) * 31415.9265) * 1.1,
      twinkleOffset: fract(Math.sin(seed * 3.14159) * 92749.1828) * Math.PI * 2,
    })
  }
  return out
}

export function drawGoldParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: GoldParticle[],
  intensity: number,
  timeSec: number,
): void {
  if (intensity <= 0.001 || particles.length === 0) return

  const t = timeSec * 0.22
  const w = Math.max(1, width)
  const h = Math.max(1, height)

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  for (const p of particles) {
    const drift = 0.008 * (0.5 + p.depth)
    const nx =
      p.nx +
      Math.sin(t * 0.5 + p.seed * 0.009) * drift * (0.7 + intensity * 0.3)
    const ny =
      p.ny +
      Math.cos(t * 0.42 + p.seed * 0.011) * drift * (0.7 + intensity * 0.3)

    const px = nx * w
    const py = ny * h

    const twinkle =
      0.5 +
      0.5 *
        Math.sin(timeSec * 1.4 + p.twinkleOffset + p.seed * 0.001) *
        (0.55 + 0.45 * intensity)

    const depthAlpha = 0.025 + p.depth * 0.04
    const alpha = depthAlpha * intensity * twinkle
    const glow = p.baseR * (0.9 + p.depth * 0.9)

    const r = 212
    const g = 175 + p.depth * 25
    const b = 55 + p.depth * 40

    const grd = ctx.createRadialGradient(px, py, 0, px, py, glow * 2.4)
    grd.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 2})`)
    grd.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`)
    grd.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(px, py, glow * 2.6, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

