import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

// Configuración de GitHub
const GITHUB_OWNER = 'jonathan1173';
const GITHUB_REPO = 'liwa-movil';
const RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

export interface VersionCheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseUrl: string;
  downloadUrl?: string;
  releaseNotes?: string;
}

/**
 * Normaliza y compara dos versiones semánticas (ej: "v5.0.0" vs "5.0.1" o "5.0.0").
 * Retorna true si latest es mayor que current.
 */
function isNewerVersion(current: string, latest: string): boolean {
  const cleanCurrent = current.replace(/^v/i, '').trim();
  const cleanLatest = latest.replace(/^v/i, '').trim();

  const currentParts = cleanCurrent.split('.').map(Number);
  const latestParts = cleanLatest.split('.').map(Number);

  const maxLength = Math.max(currentParts.length, latestParts.length);

  for (let i = 0; i < maxLength; i++) {
    const currPart = currentParts[i] || 0;
    const latPart = latestParts[i] || 0;

    if (latPart > currPart) return true;
    if (latPart < currPart) return false;
  }

  return false;
}

/**
 * Consulta la API de GitHub para verificar si existe una nueva versión disponible.
 */
export async function checkForAppUpdate(): Promise<VersionCheckResult | null> {
  try {
    const currentVersion = Constants.expoConfig?.version || '1.0.0';

    const response = await fetch(RELEASES_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Liwa-Mobile-App',
      },
    });

    if (!response.ok) {
      console.warn('No se pudo obtener la información de releases de GitHub:', response.status);
      return null;
    }

    const data = await response.json();
    const latestVersion = data.tag_name || data.name || '';
    const releaseUrl = data.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

    // Buscar si entre los assets adjuntos hay un archivo APK o similar
    let downloadUrl: string | undefined = undefined;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const apkAsset = data.assets.find(
        (asset: any) => asset.name.endsWith('.apk') || asset.content_type === 'application/vnd.android.package-archive'
      );
      if (apkAsset) {
        downloadUrl = apkAsset.browser_download_url;
      }
    }

    const hasUpdate = isNewerVersion(currentVersion, latestVersion);

    return {
      hasUpdate,
      latestVersion,
      currentVersion,
      releaseUrl,
      downloadUrl,
      releaseNotes: data.body,
    };
  } catch (error) {
    console.error('Error al comprobar actualizaciones de la app:', error);
    return null;
  }
}

/**
 * Abre el enlace para descargar el APK o la página del Release en GitHub.
 */
export async function openUpdateLink(updateInfo: VersionCheckResult) {
  const targetUrl = updateInfo.downloadUrl || updateInfo.releaseUrl;
  const canOpen = await Linking.canOpenURL(targetUrl);
  if (canOpen) {
    await Linking.openURL(targetUrl);
  } else {
    await Linking.openURL(updateInfo.releaseUrl);
  }
}
