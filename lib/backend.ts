const DEFAULT_BACKEND_URL = "http://127.0.0.1:3001";

function normalizeBackendUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getBackendApiUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    process.env.BACKEND_API_URL ??
    DEFAULT_BACKEND_URL;

  return normalizeBackendUrl(configuredUrl);
}

export function buildBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendApiUrl()}${normalizedPath}`;
}
