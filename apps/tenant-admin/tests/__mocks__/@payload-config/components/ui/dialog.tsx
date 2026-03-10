import React from 'react'

export const Dialog = ({ children, open }: { children?: React.ReactNode; open?: boolean }) =>
  open ? (
    <div data-testid="dialog" data-oid="xj.olv-">
      {children}
    </div>
  ) : null

export const DialogContent = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="dialog-content" data-oid="qnyxehy">
    {children}
  </div>
)

export const DialogHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="dialog-header" data-oid="cq:w9ya">
    {children}
  </div>
)

export const DialogFooter = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <div className={className} data-testid="dialog-footer" data-oid="b.hi29m">
    {children}
  </div>
)

export const DialogTitle = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <h2 className={className} data-testid="dialog-title" data-oid="p.u6day">
    {children}
  </h2>
)

export const DialogDescription = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => (
  <p className={className} data-testid="dialog-description" data-oid="a:y3s_u">
    {children}
  </p>
)

export const DialogTrigger = ({ children }: { children?: React.ReactNode }) => <>{children}</>

export const DialogClose = ({ children }: { children?: React.ReactNode }) => <>{children}</>

export const DialogPortal = ({ children }: { children?: React.ReactNode }) => <>{children}</>

export const DialogOverlay = ({ className }: { className?: string }) => (
  <div className={className} data-testid="dialog-overlay" data-oid="_vu9if6" />
)
