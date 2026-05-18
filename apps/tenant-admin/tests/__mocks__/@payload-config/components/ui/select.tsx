import React from 'react'

const extractText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).filter(Boolean).join(' ')
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    if (node.type === SelectValue) return node.props.placeholder ?? ''
    return extractText(node.props.children)
  }
  return ''
}

const cleanText = (text: string) => text.replace(/\s+/g, ' ').replace(/\s+-/g, ' -').trim()

const extractItemLabel = (node: React.ReactNode): string => {
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return extractText(node)

  const children = node.props.children
  if (Array.isArray(children)) {
    const textParts = children
      .filter((child) => typeof child === 'string' || typeof child === 'number')
      .map(String)
      .filter(Boolean)

    if (textParts.length > 0) return cleanText(textParts.join(' '))
  }

  return cleanText(extractText(children))
}

const findTriggerProps = (node: React.ReactNode): Record<string, unknown> => {
  if (Array.isArray(node)) {
    return node.reduce<Record<string, unknown>>(
      (found, child) => (Object.keys(found).length > 0 ? found : findTriggerProps(child)),
      {},
    )
  }

  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return {}

  if (node.type === SelectTrigger) {
    return {
      id: node.props.id,
      'aria-label': node.props['aria-label'],
      'aria-labelledby': node.props['aria-labelledby'],
    }
  }

  return findTriggerProps(node.props.children)
}

const renderOptions = (node: React.ReactNode): React.ReactNode[] => {
  if (Array.isArray(node)) return node.flatMap(renderOptions)
  if (!React.isValidElement<{ children?: React.ReactNode; value?: string }>(node)) return []

  if (node.type === SelectItem) {
    return [
      <option key={node.key ?? node.props.value} data-testid="select-item" value={node.props.value}>
        {extractItemLabel(node.props.children)}
      </option>,
    ]
  }

  return renderOptions(node.props.children)
}

const renderSearchableText = (node: React.ReactNode): React.ReactNode[] => {
  if (Array.isArray(node)) return node.flatMap(renderSearchableText)
  if (typeof node === 'string' || typeof node === 'number') {
    return [<span key={`${node}`}>{node}</span>]
  }
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return []

  if (node.type === SelectItem) {
    return []
  }

  if (node.type === SelectValue) {
    return node.props.placeholder ? [<span key={`placeholder-${node.props.placeholder}`}>{node.props.placeholder}</span>] : []
  }

  return renderSearchableText(node.props.children)
}

export const Select = ({
  children,
  value,
  onValueChange,
  ...props
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  [key: string]: any
}) => {
  const triggerProps = findTriggerProps(children)

  return (
    <>
      <select
        data-testid="select"
        data-value={value}
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
        {...triggerProps}
        {...props}
        data-oid="jdvadqe"
      >
        {renderOptions(children)}
      </select>
      <span data-testid="select-searchable-text" hidden>
        {renderSearchableText(children)}
      </span>
    </>
  )
}

export const SelectTrigger = ({
  children,
  ...props
}: {
  children: React.ReactNode
  [key: string]: any
}) => (
  <React.Fragment>
    {children}
  </React.Fragment>
)

export const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <React.Fragment>
    {placeholder ?? ''}
  </React.Fragment>
)

export const SelectContent = ({
  children,
  ...props
}: {
  children: React.ReactNode
  [key: string]: any
}) => (
  <React.Fragment>
    {children}
  </React.Fragment>
)

export const SelectItem = ({
  children,
  value,
  ...props
}: {
  children: React.ReactNode
  value: string
  [key: string]: any
}) => (
  <React.Fragment>
    {children}
  </React.Fragment>
)
