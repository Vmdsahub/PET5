/**
 * Utility to detect WebGL support and provide fallback options
 */

export interface WebGLCapabilities {
  webgl: boolean;
  webgl2: boolean;
  hasSupport: boolean;
  failureReason?: string;
}

export const detectWebGLSupport = (): WebGLCapabilities => {
  const canvas = document.createElement('canvas');
  let webgl = false;
  let webgl2 = false;
  let failureReason: string | undefined;

  try {
    // Test WebGL 1
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      webgl = true;
    }

    // Test WebGL 2
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      webgl2 = true;
    }

    if (!webgl && !webgl2) {
      failureReason = 'WebGL is not supported by your browser';
    }
  } catch (error) {
    failureReason = `WebGL context creation failed: ${error}`;
  }

  return {
    webgl,
    webgl2,
    hasSupport: webgl || webgl2,
    failureReason
  };
};

export const getWebGLErrorMessage = (capabilities: WebGLCapabilities): string => {
  if (capabilities.hasSupport) {
    return '';
  }

  const messages = [
    'Seu navegador não suporta WebGL, necessário para visualizar o quarto 3D.',
    '',
    'Soluções possíveis:',
    '• Atualize seu navegador para a versão mais recente',
    '• Habilite aceleração de hardware nas configurações do navegador',
    '• Verifique se WebGL está habilitado em about:flags (Chrome) ou about:config (Firefox)',
    '• Tente usar outro navegador (Chrome, Firefox, Safari, Edge)',
    '',
    capabilities.failureReason ? `Detalhes: ${capabilities.failureReason}` : ''
  ];

  return messages.filter(Boolean).join('\n');
};

export const isWebGLAvailable = (): boolean => {
  return detectWebGLSupport().hasSupport;
};
