import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type DialogContextValue = { open: boolean; setOpen: (v: boolean) => void }
const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogCtx() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>")
  return ctx
}

const Dialog: React.FC<{ children: React.ReactNode } & { defaultOpen?: boolean; open?: boolean; onOpenChange?: (v: boolean) => void }> = ({ children, defaultOpen, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = React.useState<boolean>(!!defaultOpen)
  const isControlled = typeof open === 'boolean'
  const value = {
    open: isControlled ? (open as boolean) : internalOpen,
    setOpen: (v: boolean) => {
      if (isControlled) onOpenChange?.(v)
      else setInternalOpen(v)
    }
  }
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactElement | string }> = ({ asChild, children }) => {
  const { setOpen } = useDialogCtx()
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: () => setOpen(true) })
  }
  return <button onClick={() => setOpen(true)}>{children}</button>
}

const DialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>

const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("fixed inset-0 z-50 bg-background/80 backdrop-blur-sm", className)} {...props} />
))
DialogOverlay.displayName = "DialogOverlay"

const DialogClose: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const { setOpen } = useDialogCtx()
  return <button {...props} onClick={(e) => { props.onClick?.(e); setOpen(false) }} />
}

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useDialogCtx()
  if (!open) return null
  return (
    <DialogPortal>
      <DialogOverlay onClick={() => setOpen(false)} />
      <div
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-[10000] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </div>
    </DialogPortal>
  )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = "DialogDescription"

export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
