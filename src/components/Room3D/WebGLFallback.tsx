import React from 'react';
import { AlertTriangle, Monitor, RefreshCw } from 'lucide-react';

interface WebGLFallbackProps {
  errorMessage: string;
  onRetry?: () => void;
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = ({ errorMessage, onRetry }) => {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-2" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            WebGL Não Disponível
          </h2>
        </div>
        
        <div className="text-gray-600 text-sm space-y-2 mb-6 text-left">
          {errorMessage.split('\n').map((line, index) => (
            <div key={index} className={line.startsWith('•') ? 'ml-4' : ''}>
              {line}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Tentar Novamente</span>
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Monitor size={16} />
            <span>Recarregar Página</span>
          </button>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Navegadores Recomendados:</strong><br />
            Chrome, Firefox, Safari ou Edge (versões recentes)
          </p>
        </div>
      </div>
    </div>
  );
};
