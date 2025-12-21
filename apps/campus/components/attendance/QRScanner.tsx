/**
 * @fileoverview QR Scanner component for attendance check-in
 * Uses @yudiel/react-qr-scanner for camera access
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner'

export interface QRScanResult {
  sessionId: string
  courseRunId: string
  timestamp: string
  signature?: string
}

export interface QRScannerProps {
  onScan: (result: QRScanResult) => void
  onError?: (error: Error) => void
  enabled?: boolean
  className?: string
}

/**
 * Parse QR code data into attendance check-in payload
 * Expected format: akademate://attendance?session={id}&course={id}&ts={timestamp}&sig={signature}
 */
export function parseQRCode(data: string): QRScanResult | null {
  try {
    // Support both URL format and JSON format
    if (data.startsWith('akademate://attendance')) {
      const url = new URL(data)
      const sessionId = url.searchParams.get('session')
      const courseRunId = url.searchParams.get('course')
      const timestamp = url.searchParams.get('ts')
      const signature = url.searchParams.get('sig')

      if (!sessionId || !courseRunId || !timestamp) {
        return null
      }

      return {
        sessionId,
        courseRunId,
        timestamp,
        signature: signature ?? undefined,
      }
    }

    // Try JSON format
    const json = JSON.parse(data)
    if (json.sessionId && json.courseRunId && json.timestamp) {
      return {
        sessionId: json.sessionId,
        courseRunId: json.courseRunId,
        timestamp: json.timestamp,
        signature: json.signature,
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * QR Scanner component for student attendance check-in
 */
export function QRScanner({ onScan, onError, enabled = true, className }: QRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastScannedData, setLastScannedData] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  const handleScan = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (!enabled || isProcessing || detectedCodes.length === 0) return

      const code = detectedCodes[0]
      const rawData = code.rawValue

      // Debounce: prevent re-scanning same code within 3 seconds
      if (rawData === lastScannedData) return

      setIsProcessing(true)
      setLastScannedData(rawData)
      setScanError(null)

      const result = parseQRCode(rawData)

      if (result) {
        onScan(result)
        // Reset after 3 seconds to allow re-scan
        setTimeout(() => {
          setIsProcessing(false)
          setLastScannedData(null)
        }, 3000)
      } else {
        setScanError('QR code invalido. Asegurate de escanear el codigo de asistencia correcto.')
        setIsProcessing(false)
        setTimeout(() => setLastScannedData(null), 1000)
      }
    },
    [enabled, isProcessing, lastScannedData, onScan]
  )

  const handleError = useCallback(
    (error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error))
      setScanError(err.message)
      onError?.(err)
    },
    [onError]
  )

  if (!enabled) {
    return (
      <div className={`flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 ${className}`}>
        <p className="text-sm text-muted-foreground">Scanner deshabilitado</p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Scanner */}
      <Scanner
        onScan={handleScan}
        onError={handleError}
        constraints={{
          facingMode: 'environment', // Use back camera on mobile
        }}
        formats={['qr_code']}
        components={{
          audio: false,
          torch: true,
          finder: true,
        }}
        styles={{
          container: {
            width: '100%',
            paddingTop: '100%', // Square aspect ratio
            position: 'relative',
          },
          video: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          },
        }}
      />

      {/* Overlay for processing state */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-2 text-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <span className="text-sm">Procesando...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {scanError && (
        <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 p-3 text-center text-sm text-destructive-foreground">
          {scanError}
        </div>
      )}

      {/* Scan guide overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-48 rounded-lg border-4 border-white/50 shadow-lg" />
      </div>
    </div>
  )
}

export default QRScanner
