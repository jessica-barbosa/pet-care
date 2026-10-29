/**
 * Preparo de imagem no navegador, antes do upload.
 *
 * Foto de celular tem 3-8 MB e milhares de pixels de lado; o avatar aparece em
 * ate ~144 px. Reduzir aqui poupa banda de quem envia, espaco no Storage (o plano
 * gratuito tem 1 GB) e tempo de carregamento de quem abre a tela de pets.
 */

/** Teto do arquivo de ENTRADA — evita travar a aba decodificando algo gigante. */
const MAX_INPUT_BYTES = 20 * 1024 * 1024

/** Lado do quadrado final. 512 cobre o maior avatar em telas 2x/3x. */
const AVATAR_SIZE = 512

export class ImageError extends Error {}

/**
 * Recorta o centro da imagem em um quadrado e reduz para `AVATAR_SIZE`, em WebP.
 *
 * Quadrado porque o avatar e um circulo: guardar a foto inteira so desperdicaria
 * bytes nas bordas que o `object-cover` descartaria de qualquer jeito.
 */
export async function prepareAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('Escolha um arquivo de imagem (JPG, PNG ou WebP).')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('Essa imagem e grande demais. Escolha uma de ate 20 MB.')
  }

  let bitmap: ImageBitmap
  try {
    // `from-image` aplica a rotacao EXIF: sem isso, foto de celular tirada em pe
    // chega deitada.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Acontece com HEIC fora do Safari, ou arquivo corrompido.
    throw new ImageError('Não foi possível ler essa imagem. Tente um JPG, PNG ou WebP.')
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - side) / 2
    const sy = (bitmap.height - side) / 2

    // Nunca amplia: imagem pequena fica no tamanho original em vez de borrar.
    const target = Math.min(AVATAR_SIZE, side)

    const canvas = document.createElement('canvas')
    canvas.width = target
    canvas.height = target

    const context = canvas.getContext('2d')
    if (!context) throw new ImageError('Seu navegador nao conseguiu processar a imagem.')

    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, sx, sy, side, side, 0, 0, target, target)

    return await toBlob(canvas)
  } finally {
    bitmap.close()
  }
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

/** Extensao do arquivo no Storage, a partir do tipo que `prepareAvatar` produziu. */
export function extensionFor(blob: Blob): 'webp' | 'jpg' {
  return blob.type === 'image/webp' ? 'webp' : 'jpg'
}
