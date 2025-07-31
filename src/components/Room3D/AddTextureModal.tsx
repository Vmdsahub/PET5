import React, { useState, useRef } from 'react';
import { Upload, Settings, X, Image } from 'lucide-react';
import { SimpleModal } from './SimpleModal';
import { blobCache } from '../../utils/blobCache';
import { mockStorageService } from '../../services/mockStorage';

interface AddTextureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTexture: (textureData: any) => void;
  sectionsVersion?: number;
}

interface TextureMapPreviewProps {
  file: File | null;
  label: string;
  description: string;
}

const TextureMapPreview: React.FC<TextureMapPreviewProps> = ({ file, label, description }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">{description}</span>
      </div>
      <div className="w-full h-24 rounded border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
        {file ? (
          <div className="flex items-center space-x-2">
            <div className="w-16 h-16 rounded overflow-hidden">
              <img 
                src={URL.createObjectURL(file)} 
                alt={label}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">{file.name}</p>
              <p className="text-xs text-green-600">✓ Carregado</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Image size={20} className="mx-auto mb-1 text-gray-400" />
            <p className="text-xs text-gray-500">Nenhuma imagem</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const AddTextureModal: React.FC<AddTextureModalProps> = ({
  isOpen,
  onClose,
  onAddTexture,
  sectionsVersion = 0
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'floor' as 'floor' | 'wall' | 'ceiling',
    price: '',
    currency: 'xenocoins' as 'xenocoins' | 'xenocash'
  });

  // Estados para diferentes mapas de textura
  const [textureFiles, setTextureFiles] = useState({
    diffuse: null as File | null,
    normal: null as File | null,
    roughness: null as File | null,
    displacement: null as File | null,
    metallic: null as File | null,
    ao: null as File | null // Ambient Occlusion
  });

  // Usar React.useMemo para atualizar dinamicamente as seções
  const availableSections = React.useMemo(() => {
    const sections = mockStorageService.getAllSections();
    return sections.map(section => ({
      value: section,
      label: section.charAt(0).toUpperCase() + section.slice(1)
    }));
  }, [isOpen, sectionsVersion]);

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const handleFileChange = (mapType: keyof typeof textureFiles) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setTextureFiles(prev => ({ ...prev, [mapType]: file }));
        setErrors(prev => ({ ...prev, [mapType]: '' }));
      } else {
        setErrors(prev => ({ ...prev, [mapType]: 'Por favor, selecione uma imagem válida' }));
      }
    }
  };

  const removeFile = (mapType: keyof typeof textureFiles) => {
    setTextureFiles(prev => ({ ...prev, [mapType]: null }));
    if (fileInputRefs.current[mapType]) {
      fileInputRefs.current[mapType]!.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!formData.category) newErrors.category = 'Seção é obrigatória';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Preço deve ser um número válido maior que 0';
    }
    if (!textureFiles.diffuse) newErrors.diffuse = 'Mapa difuso é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    try {
      // Criar URLs para os mapas de textura
      const textureUrls: any = {};
      const fileKeys: any = {};

      Object.entries(textureFiles).forEach(([mapType, file]) => {
        if (file) {
          const fileKey = `texture_${mapType}_${file.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          textureUrls[mapType] = blobCache.createBlobUrl(file, fileKey);
          fileKeys[mapType] = fileKey;
        }
      });

      const textureData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        price: Number(formData.price),
        currency: formData.currency,
        textureUrls,
        fileKeys,
        isTexture: true, // Flag para identificar como textura
        isCustom: true
      };

      onAddTexture(textureData);
    } catch (error) {
      console.error('Erro ao processar texturas:', error);
      setErrors(prev => ({ ...prev, general: 'Erro ao processar texturas' }));
      return;
    }
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      category: availableSections[0]?.value || '',
      type: 'floor',
      price: '',
      currency: 'xenocoins'
    });
    setTextureFiles({
      diffuse: null,
      normal: null,
      roughness: null,
      displacement: null,
      metallic: null,
      ao: null
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <SimpleModal
      title="Adicionar Textura de Ambiente"
      onClose={onClose}
      initialPosition={{ x: 150, y: 50 }}
      width="700px"
      height="750px"
    >
      <div className="p-4 space-y-4 overflow-y-auto max-h-[650px]">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Textura
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: Madeira Carvalho Claro"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Descreva a textura e suas características..."
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Tipo e Seção */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Aplicação
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="floor">Chão</option>
              <option value="wall">Parede</option>
              <option value="ceiling">Teto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seção no Catálogo
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecionar seção</option>
              {availableSections.map(section => (
                <option key={section.value} value={section.value}>
                  {section.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>
        </div>

        {/* Mapas de Textura */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Mapas de Textura
          </h3>

          {/* Mapa Difuso (Obrigatório) */}
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <TextureMapPreview 
              file={textureFiles.diffuse} 
              label="Mapa Difuso *" 
              description="Cor base da textura (obrigatório)"
            />
            <div className="flex space-x-2 mt-2">
              <input
                ref={(el) => fileInputRefs.current.diffuse = el}
                type="file"
                accept="image/*"
                onChange={handleFileChange('diffuse')}
                className="hidden"
              />
              <button
                onClick={() => fileInputRefs.current.diffuse?.click()}
                className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-1 px-3 rounded text-sm transition-colors"
              >
                Selecionar Imagem
              </button>
              {textureFiles.diffuse && (
                <button
                  onClick={() => removeFile('diffuse')}
                  className="bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded text-sm transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {errors.diffuse && <p className="text-red-500 text-xs mt-1">{errors.diffuse}</p>}
          </div>

          {/* Mapas Opcionais em Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Normal Map */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <TextureMapPreview 
                file={textureFiles.normal} 
                label="Mapa Normal" 
                description="Detalhes de superfície"
              />
              <div className="flex space-x-2 mt-2">
                <input
                  ref={(el) => fileInputRefs.current.normal = el}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange('normal')}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRefs.current.normal?.click()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm transition-colors"
                >
                  Selecionar
                </button>
                {textureFiles.normal && (
                  <button
                    onClick={() => removeFile('normal')}
                    className="bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded text-sm transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Roughness Map */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <TextureMapPreview 
                file={textureFiles.roughness} 
                label="Mapa Roughness" 
                description="Rugosidade da superfície"
              />
              <div className="flex space-x-2 mt-2">
                <input
                  ref={(el) => fileInputRefs.current.roughness = el}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange('roughness')}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRefs.current.roughness?.click()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm transition-colors"
                >
                  Selecionar
                </button>
                {textureFiles.roughness && (
                  <button
                    onClick={() => removeFile('roughness')}
                    className="bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded text-sm transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Displacement Map */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <TextureMapPreview 
                file={textureFiles.displacement} 
                label="Mapa Displacement" 
                description="Altura da superfície"
              />
              <div className="flex space-x-2 mt-2">
                <input
                  ref={(el) => fileInputRefs.current.displacement = el}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange('displacement')}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRefs.current.displacement?.click()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm transition-colors"
                >
                  Selecionar
                </button>
                {textureFiles.displacement && (
                  <button
                    onClick={() => removeFile('displacement')}
                    className="bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded text-sm transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Metallic Map */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <TextureMapPreview
                file={textureFiles.metallic}
                label="Mapa Metallic"
                description="Propriedades metálicas"
              />
              <div className="flex space-x-2 mt-2">
                <input
                  ref={(el) => fileInputRefs.current.metallic = el}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange('metallic')}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRefs.current.metallic?.click()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm transition-colors"
                >
                  Selecionar
                </button>
                {textureFiles.metallic && (
                  <button
                    onClick={() => removeFile('metallic')}
                    className="bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded text-sm transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* AO Map */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <TextureMapPreview
                file={textureFiles.ao}
                label="Mapa AO"
                description="Oclusão ambiente"
              />
              <div className="flex space-x-2 mt-2">
                <input
                  ref={(el) => fileInputRefs.current.ao = el}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange('ao')}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRefs.current.ao?.click()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded text-sm transition-colors"
                >
                  Selecionar
                </button>
                {textureFiles.ao && (
                  <button
                    onClick={() => removeFile('ao')}
                    className="bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded text-sm transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preço e Moeda */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço
            </label>
            <input
              type="number"
              min="1"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="50"
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moeda
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as 'xenocoins' | 'xenocash' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="xenocoins">Xenocoins</option>
              <option value="xenocash">Xenocash</option>
            </select>
          </div>
        </div>

        {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

        {/* Botões */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Adicionar Textura
          </button>
        </div>
      </div>
    </SimpleModal>
  );
};
