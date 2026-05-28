export type Letterbox = { dx: number; dy: number; dw: number; dh: number }

export function drawWatermarkMask(ctx: CanvasRenderingContext2D, letterbox: Letterbox): void {
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#000000'

  {
    const nx0 = 0.84
    const ny0 = 0.91
    const nx1 = 1
    const ny1 = 1
    const x = letterbox.dx + nx0 * letterbox.dw
    const y = letterbox.dy + ny0 * letterbox.dh
    const w = (nx1 - nx0) * letterbox.dw
    const h = (ny1 - ny0) * letterbox.dh
    ctx.fillRect(x, y, w, h)
  }

  {
    const nx0 = 0.86
    const ny0 = 0.8
    const nx1 = 1
    const ny1 = 0.99
    const x = letterbox.dx + nx0 * letterbox.dw
    const y = letterbox.dy + ny0 * letterbox.dh
    const w = (nx1 - nx0) * letterbox.dw
    const h = (ny1 - ny0) * letterbox.dh
    ctx.fillRect(x, y, w, h)
  }

  {
    const nx0 = 0.1
    const ny0 = 0.1
    const nx1 = 0.24
    const ny1 = 0.26
    const x = letterbox.dx + nx0 * letterbox.dw
    const y = letterbox.dy + ny0 * letterbox.dh
    const w = (nx1 - nx0) * letterbox.dw
    const h = (ny1 - ny0) * letterbox.dh
    ctx.fillRect(x, y, w, h)
  }

  ctx.restore()
}

