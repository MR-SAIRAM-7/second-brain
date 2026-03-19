import { PDFParse } from 'pdf-parse';

const DEFAULT_MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const DEFAULT_MAX_EXTRACTED_CHARS = 40_000;
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 20_000;

const MAX_DOWNLOAD_BYTES = Number(process.env.FILE_MAX_DOWNLOAD_BYTES || DEFAULT_MAX_DOWNLOAD_BYTES);
const MAX_EXTRACTED_CHARS = Number(process.env.FILE_MAX_EXTRACTED_CHARS || DEFAULT_MAX_EXTRACTED_CHARS);
const DOWNLOAD_TIMEOUT_MS = Number(process.env.FILE_DOWNLOAD_TIMEOUT_MS || DEFAULT_DOWNLOAD_TIMEOUT_MS);

type UploadedCloudinaryFile = Express.Multer.File & {
  path?: string;
  secure_url?: string;
  resource_type?: string;
  format?: string;
};

const normalizeExtractedText = (text: string): string =>
  text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const getSafeUrl = (file: UploadedCloudinaryFile): string => {
  const secureUrl = String((file as any).secure_url || '').trim();
  if (secureUrl) return secureUrl;

  const pathUrl = String(file.path || '').trim();
  if (!pathUrl) return '';
  if (pathUrl.startsWith('http://')) return `https://${pathUrl.slice('http://'.length)}`;
  return pathUrl;
};

const isPdfUpload = (file: UploadedCloudinaryFile): boolean => {
  const mimeType = String(file.mimetype || '').toLowerCase();
  if (mimeType.includes('pdf')) return true;

  const format = String((file as any).format || '').toLowerCase();
  if (format === 'pdf') return true;

  const originalName = String(file.originalname || '').toLowerCase();
  return originalName.endsWith('.pdf');
};

export const normalizeUploadedFileUrl = (file: UploadedCloudinaryFile): string => getSafeUrl(file);

export async function extractTextFromUploadedFile(file: UploadedCloudinaryFile): Promise<string> {
  if (!isPdfUpload(file)) return '';

  const fileUrl = getSafeUrl(file);
  if (!fileUrl) return '';

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(fileUrl, { signal: abortController.signal });
    if (!response.ok) {
      console.warn(`Could not download uploaded PDF for text extraction: HTTP ${response.status}`);
      return '';
    }

    const contentLengthHeader = Number(response.headers.get('content-length') || 0);
    if (Number.isFinite(contentLengthHeader) && contentLengthHeader > MAX_DOWNLOAD_BYTES) {
      console.warn('Skipping PDF text extraction because file is larger than FILE_MAX_DOWNLOAD_BYTES');
      return '';
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
      console.warn('Skipping PDF text extraction because downloaded file exceeded FILE_MAX_DOWNLOAD_BYTES');
      return '';
    }

    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const normalized = normalizeExtractedText(parsed.text || '');

    if (!normalized) return '';
    return normalized.slice(0, MAX_EXTRACTED_CHARS);
  } catch (error) {
    console.error('Failed to extract uploaded PDF text:', error);
    return '';
  } finally {
    clearTimeout(timeout);
  }
}
