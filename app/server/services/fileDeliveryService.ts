import { cloudinary } from '../config/cloudinary';

type FileLike = {
  fileUrl?: string;
  filePublicId?: string;
  fileMimeType?: string;
  fileFormat?: string;
  fileResourceType?: string;
};

const normalizeUrl = (url?: string): string => {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://')) return `https://${trimmed.slice('http://'.length)}`;
  return trimmed;
};

const isLikelyPdf = (item: FileLike): boolean => {
  const mime = String(item.fileMimeType || '').toLowerCase();
  if (mime.includes('pdf')) return true;

  const format = String(item.fileFormat || '').toLowerCase();
  if (format === 'pdf') return true;

  const url = normalizeUrl(item.fileUrl).toLowerCase();
  return /\.pdf(?:$|[?#])/.test(url);
};

const extractPublicIdFromCloudinaryUrl = (url?: string): string => {
  const normalized = normalizeUrl(url);
  if (!normalized.includes('res.cloudinary.com')) return '';

  const marker = '/upload/';
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) return '';

  let pathPart = normalized.slice(markerIndex + marker.length);
  pathPart = pathPart.replace(/^v\d+\//, '');
  pathPart = pathPart.split('?')[0] || '';

  if (!pathPart) return '';
  return pathPart;
};

const resolvePublicId = (item: FileLike): string => {
  const direct = String(item.filePublicId || '').trim();
  if (direct) return direct;
  return extractPublicIdFromCloudinaryUrl(item.fileUrl);
};

const resolveResourceType = (item: FileLike): 'image' | 'video' | 'raw' | 'auto' => {
  const explicit = String(item.fileResourceType || '').trim().toLowerCase();
  if (explicit === 'image' || explicit === 'video' || explicit === 'raw') return explicit;
  return isLikelyPdf(item) ? 'raw' : 'auto';
};

export const buildCloudinaryDeliveryUrl = (item: FileLike): string => {
  const fallbackUrl = normalizeUrl(item.fileUrl);
  const publicId = resolvePublicId(item);

  if (!publicId) return fallbackUrl;

  const resourceType = resolveResourceType(item);
  const pdf = isLikelyPdf(item);

  // Signed URLs avoid 401 responses for restricted PDF delivery configurations.
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: resourceType,
    type: 'upload',
    sign_url: pdf,
  });
};

export const buildCloudinaryFetchCandidates = (item: FileLike): string[] => {
  const fallbackUrl = normalizeUrl(item.fileUrl);
  const publicId = resolvePublicId(item);
  const resourceType = resolveResourceType(item);
  const pdf = isLikelyPdf(item);

  const candidates: string[] = [];

  if (publicId) {
    candidates.push(
      cloudinary.url(publicId, {
        secure: true,
        resource_type: resourceType,
        type: 'upload',
        sign_url: pdf,
      })
    );

    // Some Cloudinary accounts enforce authenticated delivery for PDFs.
    candidates.push(
      cloudinary.url(publicId, {
        secure: true,
        resource_type: resourceType,
        type: 'authenticated',
        sign_url: true,
      })
    );
  }

  if (fallbackUrl) {
    candidates.push(fallbackUrl);
  }

  return Array.from(new Set(candidates.filter(Boolean)));
};
