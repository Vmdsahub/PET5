import React from 'react';

interface TexturePreviewProps {
  textureData: any;
  width: string | number;
  height: string | number;
}

export const TexturePreview: React.FC<TexturePreviewProps> = ({
  textureData,
  width,
  height
}) => {
  if (!textureData?.textureUrls?.diffuse) {
    return (
      <div 
        className="bg-gray-200 flex items-center justify-center"
        style={{ width, height }}
      >
        <span className="text-gray-500 text-xs">Sem preview</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <img
        src={textureData.textureUrls.diffuse}
        alt={textureData.name}
        className="w-full h-full object-cover rounded"
        style={{ width, height }}
      />
      
      {/* Indicador do tipo de textura */}
      <div className="absolute top-1 right-1 text-xs px-1 py-0.5 rounded text-white font-bold shadow-sm"
           style={{
             backgroundColor: 
               textureData.type === 'floor' ? '#8B7355' :
               textureData.type === 'wall' ? '#9CA3AF' :
               textureData.type === 'ceiling' ? '#E5E7EB'
           }}>
        {textureData.type === 'floor' ? '🏠' : 
         textureData.type === 'wall' ? '🧱' : '🏢'}
      </div>
      
      {/* Nome da textura */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 truncate">
        {textureData.name}
      </div>
    </div>
  );
};