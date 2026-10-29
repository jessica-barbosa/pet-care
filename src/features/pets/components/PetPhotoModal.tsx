import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PetAvatar } from '@/features/pets/components/PetAvatar'
import { useClearPetPhoto, useSetPetPhoto } from '@/features/pets/queries'
import type { Pet } from '@/features/pets/types'
import { ImageError, prepareAvatar } from '@/lib/image'

type Preview = { blob: Blob; url: string }

/**
 * Conteudo do modal. Vive dentro do `<Modal>`, que so monta os filhos com a janela
 * aberta — entao o preview, o erro e o input nascem limpos a cada abertura, sem
 * ninguem precisar resetar estado.
 */
function PhotoForm({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setPhoto = useSetPetPhoto()
  const clearPhoto = useClearPetPhoto()
  const busy = preparing || setPhoto.isPending || clearPhoto.isPending

  // Revoga a URL temporaria ao trocar de preview e ao fechar o modal.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Limpa o input: sem isso, escolher o MESMO arquivo de novo nao dispara onChange.
    event.target.value = ''
    if (!file) return

    setError(null)
    setPreparing(true)

    try {
      // Reduz agora, nao no envio: o preview mostra exatamente o que vai subir, e um
      // arquivo invalido (HEIC, corrompido) falha aqui, antes de qualquer rede.
      const blob = await prepareAvatar(file)
      setPreview({ blob, url: URL.createObjectURL(blob) })
    } catch (err) {
      setError(err instanceof ImageError ? err.message : 'Não foi possível usar essa imagem.')
    } finally {
      setPreparing(false)
    }
  }

  async function handleSave() {
    if (!preview) return
    setError(null)

    try {
      await setPhoto.mutateAsync({ pet, photo: preview.blob })
      onClose()
    } catch (err) {
      // A mensagem da tela e generica de proposito; a causa real (bucket ausente,
      // policy, sessao) vai para o console, onde da para diagnosticar.
      console.error('Falha ao salvar a foto do pet:', err)
      setError('Não foi possível salvar a foto. Tente de novo.')
    }
  }

  async function handleRemove() {
    setError(null)

    try {
      await clearPhoto.mutateAsync(pet)
      onClose()
    } catch (err) {
      console.error('Falha ao remover a foto do pet:', err)
      setError('Não foi possível remover a foto. Tente de novo.')
    }
  }

  // Com preview novo, mostra ele no lugar da foto atual.
  const shown: Pet = preview ? { ...pet, photoUrl: preview.url } : pet

  return (
    <div className="flex flex-col items-center gap-5">
      <PetAvatar pet={shown} size="xl" />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        tabIndex={-1}
      />

      <Button variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
        {preparing ? 'Preparando...' : preview ? 'Escolher outra' : 'Escolher imagem'}
      </Button>

      <p className="-mt-2 text-center text-xs text-slate-400">
        A imagem e recortada no centro, em quadrado, e reduzida antes de enviar.
      </p>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <div className="flex w-full items-center justify-between gap-2 border-t border-slate-100 pt-4">
        {pet.photoUrl && !preview ? (
          <Button variant="ghost" size="sm" disabled={busy} onClick={handleRemove}>
            {clearPhoto.isPending ? 'Removendo...' : 'Remover foto'}
          </Button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy || !preview} onClick={handleSave}>
            {setPhoto.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PetPhotoModal({
  pet,
  open,
  onClose,
}: {
  pet: Pet
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title={`Foto de ${pet.name}`}>
      <PhotoForm pet={pet} onClose={onClose} />
    </Modal>
  )
}
