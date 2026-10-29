import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { clampView, cropRect, drawCrop, initialView, maxZoomFor, type CropView } from '@/lib/image'

/**
 * Resolucao interna do canvas: 2x o maior tamanho exibido (288 px), para ficar nitido
 * em tela de alta densidade. O tamanho na tela e CSS e encolhe em celular estreito.
 */
const CANVAS_SIZE = 576

/** Fracao do recorte que uma seta do teclado move. */
const KEY_STEP = 0.05

/**
 * Enquadramento da foto: arrastar move, zoom por controle, roda do mouse ou pinca.
 *
 * Mostra o quadrado que sera salvo, com o que fica FORA do circulo escurecido — o
 * avatar e redondo, entao so o circulo aparece depois.
 *
 * Controlado: nao guarda o enquadramento, so o desenha e avisa as mudancas. Toda
 * mudanca passa por `clampView`, entao nunca sobra borda vazia nem zoom invalido.
 */
export function PhotoCropper({
  bitmap,
  view,
  onChange,
}: {
  bitmap: ImageBitmap
  view: CropView
  onChange: (view: CropView) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())

  // Varios eventos de movimento podem chegar no mesmo quadro, antes de o React
  // re-renderizar: cada um precisa partir do enquadramento MAIS RECENTE, nao do que
  // veio nas props, ou os deslocamentos intermediarios se perdem e o arrasto engasga.
  const latest = useRef(view)
  useEffect(() => {
    latest.current = view
  }, [view])

  const maxZoom = maxZoomFor(bitmap)

  const update = useCallback(
    (next: CropView) => {
      const safe = clampView(bitmap, next)
      latest.current = safe
      onChange(safe)
    },
    [bitmap, onChange],
  )

  // Desenho: a mesma `drawCrop` do arquivo final, mais a mascara circular.
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    drawCrop(context, bitmap, view, CANVAS_SIZE)

    const mid = CANVAS_SIZE / 2
    const radius = mid - 2

    context.save()
    context.fillStyle = 'rgba(15, 23, 42, 0.55)'
    context.beginPath()
    context.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    context.moveTo(mid + radius, mid)
    context.arc(mid, mid, radius, 0, Math.PI * 2)
    context.fill('evenodd') // preenche so o que esta fora do circulo
    context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    context.lineWidth = 3
    context.beginPath()
    context.arc(mid, mid, radius, 0, Math.PI * 2)
    context.stroke()
    context.restore()
  }, [bitmap, view])

  // Roda do mouse: o React registra onWheel como passivo, e `preventDefault` (para a
  // pagina nao rolar junto) so funciona em listener nao passivo.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function handleWheel(event: WheelEvent) {
      event.preventDefault()
      update({ ...latest.current, zoom: latest.current.zoom * Math.exp(-event.deltaY * 0.002) })
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [update])

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return

    const current = { x: event.clientX, y: event.clientY }
    const view = latest.current

    // Dois dedos: pinca. A razao entre as distancias antes e depois e o fator de zoom.
    if (pointers.current.size === 2) {
      const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1]
      pointers.current.set(event.pointerId, current)
      if (!other) return

      const before = Math.hypot(previous.x - other.x, previous.y - other.y)
      const after = Math.hypot(current.x - other.x, current.y - other.y)
      if (before > 0) update({ ...view, zoom: view.zoom * (after / before) })
      return
    }

    // Um dedo/mouse: arrastar. Puxar a imagem para a direita desloca o recorte para a
    // esquerda, por isso o sinal negativo. A escala converte pixels da TELA em pixels
    // da IMAGEM (o canvas encolhe em celular estreito).
    pointers.current.set(event.pointerId, current)
    const screenWidth = event.currentTarget.getBoundingClientRect().width
    const imagePerScreen = cropRect(bitmap, view).side / screenWidth

    update({
      ...view,
      cx: view.cx - (current.x - previous.x) * imagePerScreen,
      cy: view.cy - (current.y - previous.y) * imagePerScreen,
    })
  }

  function handlePointerEnd(event: PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId)
  }

  // Teclado: sem isso o enquadramento seria so para quem usa mouse ou dedo.
  function handleKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    const view = latest.current
    const step = cropRect(bitmap, view).side * KEY_STEP

    const moves: Record<string, Partial<CropView>> = {
      ArrowLeft: { cx: view.cx - step },
      ArrowRight: { cx: view.cx + step },
      ArrowUp: { cy: view.cy - step },
      ArrowDown: { cy: view.cy + step },
      '+': { zoom: view.zoom * 1.1 },
      '=': { zoom: view.zoom * 1.1 },
      '-': { zoom: view.zoom / 1.1 },
    }

    const change = moves[event.key]
    if (!change) return

    event.preventDefault()
    update({ ...view, ...change })
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        tabIndex={0}
        role="img"
        aria-label="Enquadramento da foto. Arraste para mover; setas movem, mais e menos ampliam."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
        // touch-none: sem isso o navegador usa o gesto para rolar a pagina ou dar
        // zoom na tela inteira, em vez de entregar o arrasto e a pinca para ca.
        className="aspect-square w-full max-w-72 cursor-grab touch-none rounded-xl bg-slate-100 active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      />

      <div className="flex w-full max-w-72 items-center gap-3">
        <span aria-hidden className="text-sm text-slate-400">
          −
        </span>
        <input
          type="range"
          aria-label="Zoom"
          min={1}
          max={maxZoom}
          step={0.01}
          value={view.zoom}
          disabled={maxZoom <= 1}
          onChange={(event) => update({ ...latest.current, zoom: Number(event.target.value) })}
          className="flex-1 accent-teal-600"
        />
        <span aria-hidden className="text-sm text-slate-400">
          +
        </span>
      </div>

      <Button variant="ghost" size="sm" onClick={() => update(initialView(bitmap))}>
        Centralizar
      </Button>
    </div>
  )
}
