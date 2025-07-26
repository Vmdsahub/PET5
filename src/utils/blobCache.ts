// Cache para URLs de blob de modelos GLB
class BlobCacheService {
  private cache = new Map<string, string>();
  private files = new Map<string, File>();

  createBlobUrl(file: File, key: string): string {
    // Revogar URL anterior se existir
    if (this.cache.has(key)) {
      URL.revokeObjectURL(this.cache.get(key)!);
    }

    // Criar nova URL
    const url = URL.createObjectURL(file);
    
    // Salvar no cache
    this.cache.set(key, url);
    this.files.set(key, file);
    
    return url;
  }

  getBlobUrl(key: string): string | null {
    return this.cache.get(key) || null;
  }

  getFile(key: string): File | null {
    return this.files.get(key) || null;
  }

  revokeBlobUrl(key: string): void {
    const url = this.cache.get(key);
    if (url) {
      URL.revokeObjectURL(url);
      this.cache.delete(key);
      this.files.delete(key);
    }
  }

  revokeAll(): void {
    for (const url of this.cache.values()) {
      URL.revokeObjectURL(url);
    }
    this.cache.clear();
    this.files.clear();
  }

  // Verificar se URL ainda é válida
  isValidUrl(url: string): boolean {
    return Array.from(this.cache.values()).includes(url);
  }
}

export const blobCache = new BlobCacheService();
