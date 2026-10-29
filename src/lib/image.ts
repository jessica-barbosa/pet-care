/**
 * Preparo de imagem no navegador, antes do upload.
 *
 * Foto de celular tem 3-8 MB e milhares de pixels de lado; o avatar aparece em
 * ate ~144 px. Reduzir aqui poupa banda de quem envia, espaco no Storage (o plano
 * gratuito tem 1 GB) e tempo de carregamento de quem abre a tela de pets.
 *
 * O fluxo e em tres passos, e cada um e uma funcao deste arquivo:
 *   1. `loadImage`   — valida e decodifica o arquivo;
 *   2. o usuario enquadra (a tela mexe em um `CropView`);
 *   3. `cropToBlob`  — recorta exatamente aquele enquadramento e reduz.
 *
 * O preview da tela e o arquivo final usam a MESMA `drawCrop`, entao o que o usuario
 * ve enquadrado e o que sobe.
 */

/** Teto do arquivo de ENTRADA — evita travar a aba decodificando algo gigante. */
const MAX_INPUT_BYTES = 20 * 1024 * 1024

/** Lado do quadrado final. 512 cobre o maior avatar em telas 2x/3x. */
const AVATAR_SIZE = 512

/** Mais que isso so mostra pixel. */
const MAX_ZOOM = 4

/** Menor trecho da imagem ORIGINAL (em px) que ainda vale mostrar ampliado. */
const MIN_SOURCE_SIDE = 128

export class ImageError extends Error {}

/**
 * Enquadramento: qual parte da imagem aparece no quadrado.
 *
 * `cx`/`cy` e o centro do recorte, em pixels da imagem original; `zoom` 1 mostra o
 * maior quadrado possivel (o lado menor da imagem inteiro) e 2 mostra metade disso.
 */
export type CropView = { cx: number; cy: number; zoom: number }

/** Valida e decodifica. Quem chama e dono do bitmap e deve chamar `close()`. */
export async function loadImage(file: File): Promise<ImageBitmap> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('Escolha um arquivo de imagem (JPG, PNG ou WebP).')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('Essa imagem é grande demais. Escolha uma de até 20 MB.')
  }

  try {
    // `from-image` aplica a rotacao EXIF: sem isso, foto de celular tirada em pe
    // chega deitada.
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Acontece com HEIC fora do Safari, ou arquivo corrompido.
    throw new ImageError('Não foi possível ler essa imagem. Tente um JPG, PNG ou WebP.')
  }
}

/** Zoom maximo permitido: imagem pequena nao pode ser ampliada ate virar borrao. */
export function maxZoomFor(bitmap: ImageBitmap): number {
  const shortSide = Math.min(bitmap.width, bitmap.height)
  return Math.max(1, Math.min(MAX_ZOOM, shortSide / MIN_SOURCE_SIDE))
}

/** Comeco: o maior quadrado possivel, centralizado. */
export function initialView(bitmap: ImageBitmap): CropView {
  return { cx: bitmap.width / 2, cy: bitmap.height / 2, zoom: 1 }
}

/** Mantem o zoom no intervalo valido e o recorte inteiro dentro da imagem. */
export function clampView(bitmap: ImageBitmap, view: CropView): CropView {
  const zoom = Math.min(Math.max(view.zoom, 1), maxZoomFor(bitmap))
  const half = Math.min(bitmap.width, bitmap.height) / zoom / 2

  return {
    zoom,
    cx: Math.min(Math.max(view.cx, half), bitmap.width - half),
    cy: Math.min(Math.max(view.cy, half), bitmap.height - half),
  }
}

/** O quadrado da imagem original que o enquadramento mostra. */
export function cropRect(bitmap: ImageBitmap, view: CropView) {
  const side = Math.min(bitmap.width, bitmap.height) / view.zoom
  return { sx: view.cx - side / 2, sy: view.cy - side / 2, side }
}

/** Desenha o enquadramento preenchendo o canvas de `outSize` x `outSize`. */
export function drawCrop(
  context: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  view: CropView,
  outSize: number,
) {
  const { sx, sy, side } = cropRect(bitmap, view)
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, outSize, outSize)
}

/** Recorta o enquadramento escolhido e reduz para o tamanho final, em WebP. */
export async function cropToBlob(bitmap: ImageBitmap, view: CropView): Promise<Blob> {
  const safe = clampView(bitmap, view)
  const { side } = cropRect(bitmap, safe)

  // Nunca amplia: trecho pequeno fica no tamanho original em vez de borrar.
  const target = Math.max(1, Math.min(AVATAR_SIZE, Math.round(side)))

  const canvas = document.createElement('canvas')
  canvas.width = target
  canvas.height = target

  const context = canvas.getContext('2d')
  if (!context) throw new ImageError('Seu navegador não conseguiu processar a imagem.')

  drawCrop(context, bitmap, safe, target)
  return toBlob(canvas)
}

/** WebP quando o navegador codifica; JPEG como plano B (Safari antigo). */
function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (webp) => {
        if (webp && webp.type === 'image/webp') return resolve(webp)

        // Quando nao suporta WebP, o navegador devolve PNG em silencio — grande
        // demais para uma foto. Tenta JPEG explicitamente.
        canvas.toBlob(
          (jpeg) =>
            jpeg ? resolve(jpeg) : reject(new ImageError('Não foi possível preparar a imagem.')),
          'image/jpeg',
          0.85,
        )
      },
      'image/webp',
      0.85,
    )
  })
}

/** Extensao do arquivo no Storage, a partir do tipo que `cropToBlob` produziu. */
export function extensionFor(blob: Blob): 'webp' | 'jpg' {
  return blob.type === 'image/webp' ? 'webp' : 'jpg'
}
