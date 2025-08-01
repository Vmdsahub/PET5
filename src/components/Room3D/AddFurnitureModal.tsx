import React, { useState, useRef } from 'react';
import { Upload, Package, X } from 'lucide-react';
import { SimpleModal } from './SimpleModal';
import { GLBPreview3D } from './GLBPreview3D';
import { blobCache } from '../../utils/blobCache';
import { mockStorageService } from '../../services/mockStorage';

interface AddFurnitureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFurniture: (furnitureData: any) => void;
  sectionsVersion?: number;
}

interface GLBPreviewProps {
  file: File | null;
}

// Componente para preview 3D do modelo GLB
const GLBPreview: React.FC<GLBPreviewProps> = ({ file }) => {
  return (
    <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 relative bg-transparent">
      {file ? (
        <div className="w-full h-full flex">
          {/* Preview 3D */}
          <div className="flex-1 bg-transparent">
            <GLBPreview3D file={file} width="100%" height="100%" />
          </div>

          {/* Info do arquivo */}
          <div className="w-32 p-3 bg-gray-50 border-l border-gray-200 flex flex-col justify-center">
            <Package size={24} className="mx-auto mb-2 text-gray-500" />
            <p className="text-xs text-gray-600 text-center break-words">{file.name}</p>
            <p className="text-xs text-green-600 text-center mt-1">✓ Válido</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Upload size={48} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Faça upload de um arquivo .glb</p>
            <p className="text-xs text-gray-400 mt-1">Preview 3D será exibido aqui</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const AddFurnitureModal: React.FC<AddFurnitureModalProps> = ({
  isOpen,
  onClose,
  onAddFurniture,
  sectionsVersion = 0
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'basicos',
    price: '',
    currency: 'xenocoins' as 'xenocoins' | 'xenocash',
    furnitureType: 'simples' as 'simples' | 'janela'
  });

  // Usar React.useMemo para atualizar dinamicamente as seções
  const availableSections = React.useMemo(() => {
    const sections = mockStorageService.getAllSections();
    return sections.map(section => ({
      value: section,
      label: section === 'basicos' ? 'Móveis Básicos' :
             section === 'limitados' ? 'Móveis Limitados' :
             section.charAt(0).toUpperCase() + section.slice(1)
    }));
  }, [isOpen, sectionsVersion]); // Re-executar quando o modal abrir ou seções mudarem

  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'model/gltf-binary' || file.name.endsWith('.glb')) {
        setGlbFile(file);
        setErrors(prev => ({ ...prev, file: '' }));
      } else {
        setErrors(prev => ({ ...prev, file: 'Por favor, selecione um arquivo .glb válido' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Preço deve ser um número válido maior que 0';
    }
    if (!glbFile) newErrors.file = 'Arquivo GLB é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    try {
      // Verificar se o arquivo ainda é válido
      if (!glbFile || glbFile.size === 0) {
        setErrors(prev => ({ ...prev, file: 'Arquivo GLB inválido' }));
        return;
      }

      // Criar chave única para o arquivo
      const fileKey = `${glbFile.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Criar URL de blob usando o cache
      const modelUrl = blobCache.createBlobUrl(glbFile, fileKey);

      const furnitureData = {
        name: formData.name,
        description: formData.description,
        category: formData.category === 'basicos' ? 'sala' :
                 formData.category === 'limitados' ? 'decoração' :
                 formData.category, // Para seções customizadas, usar o nome diretamente
        price: Number(formData.price),
        currency: formData.currency,
        model: modelUrl,
        isCustom: true,
        fileKey: fileKey, // Chave para recuperar do cache
        furnitureType: formData.furnitureType
      };

      onAddFurniture(furnitureData);
    } catch (error) {
      console.error('Erro ao processar arquivo GLB:', error);
      setErrors(prev => ({ ...prev, file: 'Erro ao processar arquivo GLB' }));
      return;
    }
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      category: availableSections[0]?.value || 'basicos',
      price: '',
      currency: 'xenocoins',
      furnitureType: 'simples'
    });
    setGlbFile(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <SimpleModal
      title="Adicionar Novo Móvel"
      onClose={onClose}
      initialPosition={{ x: 150, y: 50 }}
      width="650px"
      height="700px"
    >
      <div className="p-4 space-y-4 overflow-y-auto max-h-[600px]">
        {/* Upload do arquivo GLB */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modelo 3D (.glb)
          </label>
          <GLBPreview file={glbFile} />
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg border border-gray-300 transition-colors"
            >
              Selecionar Arquivo GLB
            </button>
            {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
          </div>
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Móvel
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: Sofá Moderno Azul"
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
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Descreva o móvel e suas características..."
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Tipo de Móvel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Móvel
          </label>
          <select
            value={formData.furnitureType}
            onChange={(e) => setFormData(prev => ({ ...prev, furnitureType: e.target.value as 'simples' | 'janela' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="simples">Simples</option>
            <option value="janela">Janela</option>
          </select>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-1">
              {formData.furnitureType === 'simples' ? '🪑 Móvel Simples' : '🪟 Móvel Janela'}
            </p>
            <p className="text-xs text-blue-600">
              {formData.furnitureType === 'simples'
                ? 'Móvel que pode ser colocado em qualquer lugar do ambiente'
                : 'Móvel exclusivo para paredes. Ao ser colocado, criará um "buraco" na parede, integrando-se perfeitamente ao ambiente'
              }
            </p>
          </div>
        </div>

        {/* Seção */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seção
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableSections.map(section => (
              <option key={section.value} value={section.value}>
                {section.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Para criar novas seções, use o Painel de Administração
          </p>
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="100"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="xenocoins">Xenocoins</option>
              <option value="xenocash">Xenocash</option>
            </select>
          </div>
        </div>

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
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Adicionar Móvel
          </button>
        </div>
      </div>
    </SimpleModal>
  );
};
