export function getBackendBaseUrl() {
  return (
    process.env.LARAVEL_API_BASE_URL ??
    process.env.NEXT_PUBLIC_LARAVEL_API_BASE_URL ??
    "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");
}
