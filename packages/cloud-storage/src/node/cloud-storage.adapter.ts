export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
  contentType?: string;
  isDirectory: boolean;
}

export interface ListResult {
  objects: StorageObject[];
  /** Token pour la page suivante, undefined si derniere page */
  paginationToken?: string;
}

export interface WriteOptions {
  contentType?: string;
}

export interface ListOptions {
  prefix?: string;
  recursive?: boolean;
  maxResults?: number;
  paginationToken?: string;
}

export interface CloudStorageAdapter {
  /** Lire le contenu d'un fichier en Uint8Array */
  getBytes(key: string): Promise<Uint8Array>;

  /** Ecrire un fichier */
  put(key: string, contents: Uint8Array, options?: WriteOptions): Promise<void>;

  /** Supprimer un fichier */
  delete(key: string): Promise<void>;

  /** Supprimer tous les fichiers avec un prefix */
  deleteAll(prefix: string): Promise<void>;

  /** Copier un fichier */
  copy(source: string, destination: string): Promise<void>;

  /** Deplacer un fichier (copy + delete) */
  move(source: string, destination: string): Promise<void>;

  /** Verifier si un fichier existe */
  exists(key: string): Promise<boolean>;

  /** Obtenir les metadata d'un fichier */
  getMetadata(key: string): Promise<StorageObject>;

  /** Lister les fichiers/dossiers */
  list(options?: ListOptions): Promise<ListResult>;
}
