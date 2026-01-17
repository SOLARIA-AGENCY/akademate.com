import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

let sdk: NodeSDK | null = null

export const startTelemetry = async () => {
  if (process.env.OTEL_ENABLED !== 'true') {
    return
  }

  if (sdk) {
    return
  }

  if (process.env.OTEL_DIAG_LOGS === 'true') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)
  }

  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  })

  sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  })

  await sdk.start()

  process.on('SIGTERM', async () => {
    try {
      await sdk?.shutdown()
    } catch (error) {
      console.error('[otel] shutdown error', error)
    }
  })
}

export const stopTelemetry = async () => {
  if (!sdk) {
    return
  }
  await sdk.shutdown()
  sdk = null
}
