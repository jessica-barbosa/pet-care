import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PetAvatar } from '@/features/pets/components/PetAvatar'
import { PhotoCropper } from '@/features/pets/components/PhotoCropper'
import { useClearPetPhoto, useSetPetPhoto } from '@/features/pets/queries'
import type { Pet } from '@/features/pets/types'
import { cropToBlob, ImageError, initialView, loadImage, type CropView } from '@/lib/image'

/**
 * Conteudo do modal. Vive dentro do `<Modal>`, que so monta os filhos com a janela
 * aberta — entao a imagem, o enquadramento e o erro nascem limpos a cada abertura,
 * sem ninguem precisar resetar estado.
 */
function PhotoForm({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [view, setView] = useState<CropView>({ cx: 0, cy: 0, zoom: 1 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setPhoto = useSetPetPhoto()
  const clearPhoto = useClearPetPhoto()
  const busy = loading || saving || clearPhoto.isPending

  // Libera a memoria da imagem decodificada ao trocar por outra e ao fechar o modal.
  useEffect(() => {
    return () => bitmap?.close()
  }, [bitmap])

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Limpa o input: sem isso, escolher o MESMO arquivo de novo nao dispara onChange.
    event.target.value = ''
    if (!file) return

    setError(null)
    setLoading(true)

    try {
      // Um arquivo invalido (HEIC, corrompido) falha aqui, antes de qualquer rede.
      const loaded = await loadImage(file)
      setBitmap(loaded)
      setView(initialView(loaded))
    } catch (err) {
      setError(err instanceof ImageError ? err.message : 'Não foi possível usar essa imagem.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!bitmap) return
    setError(null)
    setSaving(true)

    try {
      const photo = await cropToBlob(bitmap, view)
      await setPhoto.mutateAsync({ pet, photo })
      onClose()
    } catch (err) {
      // A mensagem da tela e generica de proposito; a causa real (bucket ausente,
      // policy, sessao) vai para o console, onde da para diagnosticar.
      console.error('Falha ao salvar a foto do pet:', err)
      setError(
        err instanceof ImageError ? err.message : 'Não foi possível salvar a foto. Tente de novo.',
      )
    } finally {
      setSaving(false)
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

  return (
    <div className="flex flex-col items-center gap-5">
      {bitmap ? (
        <PhotoCropper bitmap={bitmap} view={view} onChange={setView} />
      ) : (
        <PetAvatar pet={pet} size="xl" />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        tabIndex={-1}
      />

      <Button variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
        {loading ? 'Abrindo...' : bitmap ? 'Escolher outra' : 'Escolher imagem'}
      </Button>

      <p className="-mt-2 text-center text-xs text-slate-400">
        {bitmap
          ? 'Arraste para posicionar e ajuste o zoom. Só o que está dentro do círculo aparece como foto.'
          : 'Escolha uma imagem do aparelho. Em seguida você poderá enquadrá-la.'}
      </p>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <div className="flex w-full items-center justify-between gap-2 border-t border-slate-100 pt-4">
        {pet.photoUrl && !bitmap ? (
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
          <Button disabled={busy || !bitmap} onClick={handleSave}>
            {saving ? 'Salvando...' : 'Salvar'}
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
