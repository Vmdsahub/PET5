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
      directionalIntensity: 0.8,
      directionalColor: '#ffffff',
      directionalPosition: [5, 10, 5],
      castShadows: true,
      pointIntensity: 0.4,
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
        <button
          onClick={resetToDefaults}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
        >
          🔄 Resetar
        </button>
      </div>

      {/* Ambient Light */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-3">🌌 Luz Ambiente</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intensidade: {settings.ambientIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
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

      {/* Point Light */}
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h4 className="font-medium text-orange-800 mb-3">💡 Luz Pontual (Lâmpada)</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intensidade: {settings.pointIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.pointIntensity}
              onChange={(e) => updateSetting('pointIntensity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <input
              type="color"
              value={settings.pointColor}
              onChange={(e) => updateSetting('pointColor', e.target.value)}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600">X: {settings.pointPosition[0]}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={settings.pointPosition[0]}
                onChange={(e) => updatePointPosition(0, parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Y: {settings.pointPosition[1]}</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={settings.pointPosition[1]}
                onChange={(e) => updatePointPosition(1, parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Z: {settings.pointPosition[2]}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={settings.pointPosition[2]}
                onChange={(e) => updatePointPosition(2, parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600">
                Alcance: {settings.pointDistance}
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={settings.pointDistance}
                onChange={(e) => updateSetting('pointDistance', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">
                Decay: {settings.pointDecay}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={settings.pointDecay}
                onChange={(e) => updateSetting('pointDecay', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
