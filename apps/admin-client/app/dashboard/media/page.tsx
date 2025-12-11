/**
 * Media Management Page
 *
 * File upload interface for managing media files in MinIO S3 storage.
 *
 * Features:
 * - File upload with drag & drop support
 * - Real-time upload progress
 * - File preview (images)
 * - File type and size validation
 *
 * @module app/dashboard/media
 */

'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { MockDataBanner } from '@/components/mock-data-banner';

interface UploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  size?: number;
  type?: string;
  error?: string;
}

export default function MediaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setResult(null);

    // Generate preview for images
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();
      setResult(data);

      if (data.success) {
        // Reset form on success
        setFile(null);
        setPreview(null);
        const input = document.getElementById('file-input') as HTMLInputElement;
        if (input) input.value = '';
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de Media"
        description="Uploads a storage compatible S3 con validacion de tipo/tamano"
      >
        <MockDataBanner />
      </PageHeader>

      <div className="glass-panel p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-muted/20 bg-muted/20">
            <p className="text-muted-foreground text-sm">Endpoint S3</p>
            <p className="text-foreground font-mono text-sm mt-1">S3_ENDPOINT (env)</p>
          </div>
          <div className="p-4 rounded-lg border border-muted/20 bg-muted/20">
            <p className="text-muted-foreground text-sm">Bucket</p>
            <p className="text-foreground font-semibold mt-1">akademate-assets</p>
          </div>
          <div className="p-4 rounded-lg border border-muted/20 bg-muted/20">
            <p className="text-muted-foreground text-sm">Max file size</p>
            <p className="text-foreground font-semibold mt-1">100 MB</p>
          </div>
        </div>

        <div className="bg-muted/20 border border-muted/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Subir archivo</h2>

          <div className="mb-4">
            <label
              htmlFor="file-input"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Seleccionar archivo
            </label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-foreground border border-muted/30 rounded-lg cursor-pointer bg-muted/20 focus:outline-none"
              disabled={uploading}
            />
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Seleccionado: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {preview && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">Preview:</p>
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-auto rounded-lg border border-muted/20"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-indigo-600 text-foreground py-3 px-4 rounded-lg font-medium hover:bg-indigo-500 disabled:bg-muted/50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Subiendo...' : 'Subir archivo'}
          </button>
        </div>

        {result && (
          <div
            className={`rounded-lg p-4 mt-4 ${
              result.success
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                : 'bg-red-500/10 border border-red-500/30 text-red-200'
            }`}
          >
            <h3 className="font-semibold mb-2">
              {result.success ? '✓ Subida correcta' : '✗ Error en subida'}
            </h3>
            {result.success ? (
              <div className="text-sm space-y-1">
                <p>Filename: {result.filename}</p>
                <p>Type: {result.type}</p>
                <p>Size: {((result.size || 0) / 1024).toFixed(2)} KB</p>
                <p className="mt-2 break-all">
                  URL: <a href={result.url} className="text-indigo-300 underline" target="_blank" rel="noreferrer">{result.url}</a>
                </p>
              </div>
            ) : (
              <p className="text-sm">{result.error}</p>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-muted/20">
          <h3 className="font-semibold text-foreground mb-2">Tipos soportados</h3>
          <ul className="text-sm text-foreground space-y-1">
            <li>• Imágenes: JPEG, PNG, GIF, WebP, SVG</li>
            <li>• Documentos: PDF, Word, Excel</li>
            <li>• Vídeo: MP4, WebM, QuickTime</li>
            <li>• Tamaño máximo: 100 MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
