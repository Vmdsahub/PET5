import React from 'react';

export interface LightingSettings {
  // Ambient Light
  ambientIntensity: number;
  ambientColor: string;
  
  // Directional Light (Sun)
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: [number, number, number];
  castShadows: boolean;
  
  // Point Light (Room lamp)
  pointIntensity: number;
  pointColor: string;
  pointPosition: [number, number, number];
  pointDistance: number;
  pointDecay: number;
}

interface LightingControlsProps {
  settings: LightingSettings;
  onChange: (settings: LightingSettings) => void;
  isAdmin?: boolean;
  onShowLightHelpers?: (show: boolean) => void;
  showLightHelpers?: boolean;
}

export const LightingControls: React.FC<LightingControlsProps> = ({
  settings,
  onChange,
  isAdmin = false,
  onShowLightHelpers,
  showLightHelpers = false,
}) => {
  const updateSetting = <K extends keyof LightingSettings>(
    key: K,
    value: LightingSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const updateDirectionalPosition = (index: number, value: number) => {
    const newPosition = [...settings.directionalPosition] as [number, number, number];
    newPosition[index] = value;
    updateSetting('directionalPosition', newPosition);
  };

  const updatePointPosition = (index: number, value: number) => {
    const newPosition = [...settings.pointPosition] as [number, number, number];
    newPosition[index] = value;
    updateSetting('pointPosition', newPosition);
  };

  const resetToDefaults = () => {
    onChange({
      ambientIntensity: 0.4,
      ambientColor: '#f0f8ff',
      directionalIntensity: 0.6, // Restaurada para futuras janelas
      directionalColor: '#fff8e7',
      directionalPosition: [8, 12, 6],
      castShadows: true, // Sombras realistas
      pointIntensity: 0.0, // Mantida removida
      pointColor: '#fff8dc',
      pointPosition: [0, 4, 0],
      pointDistance: 15,
      pointDecay: 2,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">⚡ Controles de Iluminação</h3>
        <div className="flex gap-2">
          {isAdmin && onShowLightHelpers && (
            <button
              onClick={() => onShowLightHelpers(!showLightHelpers)}
              className={`text-sm px-3 py-1 rounded-md transition-colors ${
                showLightHelpers
                  ? 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {showLightHelpers ? '👁️ Ocultar Trajetos' : '👁️ Ver Trajetos'}
            </button>
          )}
          <button
            onClick={resetToDefaults}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
          >
            🔄 Resetar
          </button>
        </div>
      </div>

      {/* Ambient Light - Única fonte de luz em quarto fechado */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-3">🌌 Luz Ambiente</h4>
        <p className="text-sm text-gray-600 mb-3">
          💡 Em um quarto fechado sem janelas, apenas a luz ambiente é realista.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intensidade: {settings.ambientIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={settings.ambientIntensity}
              onChange={(e) => updateSetting('ambientIntensity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <input
              type="color"
              value={settings.ambientColor}
              onChange={(e) => updateSetting('ambientColor', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Nota explicativa */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-2">ℹ️ Realismo Físico</h4>
        <p className="text-sm text-yellow-700">
          As luzes direcional (sol) e pontual foram removidas porque não são realistas
          para um quarto fechado sem janelas ou aberturas. A luz ambiente simula
          a iluminação difusa que existiria no ambiente.
        </p>
      </div>

      {/* Directional Light */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-3">☀️ Luz Direcional (Sol)</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intensidade: {settings.directionalIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.directionalIntensity}
              onChange={(e) => updateSetting('directionalIntensity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <input
              type="color"
              value={settings.directionalColor}
              onChange={(e) => updateSetting('directionalColor', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600">X: {settings.directionalPosition[0]}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={settings.directionalPosition[0]}
                onChange={(e) => updateDirectionalPosition(0, parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Y: {settings.directionalPosition[1]}</label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={settings.directionalPosition[1]}
                onChange={(e) => updateDirectionalPosition(1, parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Z: {settings.directionalPosition[2]}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={settings.directionalPosition[2]}
                onChange={(e) => updateDirectionalPosition(2, parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.castShadows}
                onChange={(e) => updateSetting('castShadows', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Projetar sombras</span>
            </label>
          </div>
        </div>
      </div>


    </div>
  );
};
