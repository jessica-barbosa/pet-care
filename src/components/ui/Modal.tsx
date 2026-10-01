import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Janela sobreposta, sobre o `<dialog>` nativo.
 *
 * O elemento nativo entrega de graca o que uma div sobreposta exigiria escrever
 * a mao: fundo escurecido (`::backdrop`, estilizado em index.css), fechar no Esc,
 * foco preso dentro da janela e o resto da pagina inerte para leitor de tela.
 *
 * O conteudo so e montado com a janela aberta, entao o formulario volta limpo a
 * cada abertura sem ninguem precisar resetar estado.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      // `close` cobre o Esc, que fecha o dialog sem passar por nenhum onClick.
      onClose={onClose}
      // Um clique que cai no proprio <dialog> veio do fundo: a janela e o filho.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl bg-transparent p-0"
      aria-labelledby="modal-title"
    >
      {open && (
        <div className="rounded-xl bg-white p-5 text-left shadow-xl ring-1 ring-slate-200">
          <div className="mb-4">
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>

          {children}
        </div>
      )}
    </dialog>
  )
}
