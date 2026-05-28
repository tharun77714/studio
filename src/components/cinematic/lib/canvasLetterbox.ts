/**
 * `object-fit: contain` rect: image centered, full image visible, letterboxed on canvas.
 */
export function getLetterboxRect(
  canvasW: number,
  canvasH: number,
  imgW: number,
  imgH: number,
): { dx: number; dy: number; dw: number; dh: number } {
  if (imgW <= 0 || imgH <= 0 || canvasW <= 0 || canvasH <= 0) {
    return { dx: 0, dy: 0, dw: canvasW, dh: canvasH }
  }
  const ir = imgW / imgH
  const cr = canvasW / canvasH
  let dw: number
  let dh: number
  if (ir > cr) {
    dw = canvasW
    dh = canvasW / ir
  } else {
    dh = canvasH
    dw = canvasH * ir
  }
  const dx = (canvasW - dw) / 2
  const dy = (canvasH - dh) / 2
  return { dx, dy, dw, dh }
}

