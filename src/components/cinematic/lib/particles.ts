import { smoothstep } from './smoothstep'

export type DustParticle = {
  seed: number
  nx: number
  ny: number
  baseR: number
  twinkleOffset: number
}

function fract(x: number): number {
  return x - Math.floor(x)
}

export function createDustParticles(count: number, seedBase = 0): DustParticle[] {
  const out: DustParticle[] = []
  for (let i = 0; i < count; i++) {
    const seed = seedBase + i * 9973.123
    const rx = fract(Math.sin(seed * 12.9898) * 43758.5453)
    const ry = fract(Math.sin(seed * 78.233) * 43758.5453)
    const rr = fract(Math.sin(seed * 91.7) * 31415.9265)
    const tw = fract(Math.sin(seed * 3.14159) * 92749.1828)
    out.push({
      seed,
      nx: rx * 0.92 + 0.04,
      ny: ry * 0.92 + 0.04,
      baseR: 0.35 + rr * 1.35,
      twinkleOffset: tw * Math.PI * 2,
    })
  }
  return out
}

export function dustIntensityFromProgress(p: number): number {
  if (p <= 0.5) return 0
  if (p < 0.55) return smoothstep(0.5, 0.55, p) * 0.28
  if (p < 0.85) return 0.28 + smoothstep(0.55, 0.85, p) * 0.55
  return 0.83 + smoothstep(0.85, 1, p) * 0.17
}

export function drawDustParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: DustParticle[],
  intensity: number,
  timeSec: number,
): void {
  if (intensity <= 0.001 || particles.length === 0) return

  const t = timeSec * 0.42
  const w = Math.max(1, width)
  const h = Math.max(1, height)

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  for (const p of particles) {
    const nx =
      p.nx +
      Math.sin(t * 0.62 + p.seed * 0.011) * 0.015 * (0.6 + intensity * 0.4)
    const ny =
      p.ny +
      Math.cos(t * 0.48 + p.seed * 0.014) * 0.015 * (0.6 + intensity * 0.4)

    const px = nx * w
    const py = ny * h

    const twinkle =
      0.55 +
      0.45 *
        Math.sin(timeSec * 2.2 + p.twinkleOffset + p.seed * 0.002) *
        (0.5 + 0.5 * intensity)

    const alpha = 0.045 * intensity * twinkle
    const glow = p.baseR * (0.85 + 0.15 * intensity)

    const grd = ctx.createRadialGradient(px, py, 0, px, py, glow * 2.2)
    grd.addColorStop(0, `rgba(230, 248, 255, ${alpha * 2.2})`)
    grd.addColorStop(0.35, `rgba(200, 230, 255, ${alpha * 0.9})`)
    grd.addColorStop(1, 'rgba(200, 230, 255, 0)')

    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(px, py, glow * 2.8, 0, Math.PI * 2)
    ctx.fill()

    if (fract(p.seed * 0.001 + timeSec * 0.13) > 0.93) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.06 * intensity})`
      ctx.beginPath()
      ctx.arc(px, py, glow * 0.45, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}

