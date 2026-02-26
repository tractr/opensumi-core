import { Injectable } from '@opensumi/di';
import { RPCService } from '@opensumi/ide-connection';
import {
  FileChangeEvent,
  FileStat,
  FileSystemProvider,
  FileSystemProviderCapabilities,
  FileSystemProviderErrorCode,
  FileType,
  createFileSystemProviderError,
} from '@opensumi/ide-file-service/lib/common';
import { Emitter, Event } from '@opensumi/ide-utils';


import { FS_CAPABILITIES } from '../common/fs-capabilities';

import { CloudStorageAdapter } from './cloud-storage.adapter';

import type { Uri } from '@opensumi/ide-core-common';

@Injectable()
export class S3FileSystemProvider extends RPCService implements FileSystemProvider {
  private static sharedAdapter: CloudStorageAdapter | undefined;

  private get adapter(): CloudStorageAdapter {
    if (!S3FileSystemProvider.sharedAdapter) {
      throw new Error('[S3] adapter not configured — configure() must be called before any FS operation');
    }
    return S3FileSystemProvider.sharedAdapter;
  }

  private readonly _onDidChangeFile = new Emitter<FileChangeEvent>();
  readonly onDidChangeFile: Event<FileChangeEvent> = this._onDidChangeFile.event;

  private readonly _onDidChangeCapabilities = new Emitter<void>();
  readonly onDidChangeCapabilities: Event<void> = this._onDidChangeCapabilities.event;

  readonly capabilities: FileSystemProviderCapabilities = (FS_CAPABILITIES.FileReadWrite |
    FS_CAPABILITIES.PathCaseSensitive) as FileSystemProviderCapabilities;

  readonly readonly = false;

  private watchIdCounter = 0;

  configure(adapter: CloudStorageAdapter): void {
    S3FileSystemProvider.sharedAdapter = adapter;
  }

  watch(_uri: Uri, _options: { excludes?: string[]; recursive?: boolean; pollingWatch?: boolean }): number {
    return ++this.watchIdCounter;
  }

  unwatch(_watcherId: number): void {}

  async stat(uri: Uri): Promise<FileStat> {
    const key = this.keyFromUri(uri);

    if (key === '') {
      const children = await this.resolveChildren(uri, '');
      return {
        uri: this.uriToString(uri),
        lastModification: Date.now(),
        isDirectory: true,
        type: FileType.Directory,
        children,
      };
    }

    try {
      const meta = await this.adapter.getMetadata(key);
      const isDir = meta.isDirectory;
      const result: FileStat = {
        uri: this.uriToString(uri),
        lastModification: meta.lastModified.getTime(),
        createTime: meta.lastModified.getTime(),
        isDirectory: isDir,
        size: meta.size,
        type: isDir ? FileType.Directory : FileType.File,
      };
      if (isDir) {
        result.children = await this.resolveChildren(uri, key);
      }
      return result;
    } catch (err: unknown) {
      if (this.isNotFoundError(err)) {
        const dirPrefix = key.endsWith('/') ? key : key + '/';
        const listing = await this.adapter.list({ prefix: dirPrefix, maxResults: 1 });
        if (listing.objects.length > 0) {
          const children = await this.resolveChildren(uri, key);
          return {
            uri: this.uriToString(uri),
            lastModification: Date.now(),
            isDirectory: true,
            type: FileType.Directory,
            children,
          };
        }
        throw createFileSystemProviderError(`File not found: ${key}`, FileSystemProviderErrorCode.FileNotFound);
      }
      throw this.toProviderError(err, key);
    }
  }

  async readDirectory(uri: Uri): Promise<[string, FileType][]> {
    const key = this.keyFromUri(uri);

    try {
      const prefix = key === '' ? '' : key.endsWith('/') ? key : key + '/';

      const entries: [string, FileType][] = [];
      let paginationToken: string | undefined;

      do {
        const result = await this.adapter.list({ prefix, paginationToken });

        for (const obj of result.objects) {
          const name = this.extractName(obj.key, prefix);
          if (name) {
            entries.push([name, obj.isDirectory ? FileType.Directory : FileType.File]);
          }
        }

        paginationToken = result.paginationToken;
      } while (paginationToken);

      return entries;
    } catch (err: unknown) {
      throw this.toProviderError(err, key);
    }
  }

  async readFile(uri: Uri): Promise<Uint8Array> {
    const key = this.keyFromUri(uri);

    try {
      return await this.adapter.getBytes(key);
    } catch (err: unknown) {
      throw this.toProviderError(err, key);
    }
  }

  async writeFile(
    uri: Uri,
    content: Uint8Array,
    _options: { create: boolean; overwrite: boolean; encoding?: string },
  ): Promise<void> {
    const key = this.keyFromUri(uri);
    await this.adapter.put(key, content);
  }

  async createDirectory(uri: Uri): Promise<void> {
    const key = this.keyFromUri(uri);
    const dirKey = key.endsWith('/') ? key : key + '/';
    await this.adapter.put(dirKey, new Uint8Array(0));
  }

  async delete(uri: Uri, options: { recursive: boolean; moveToTrash?: boolean }): Promise<void> {
    const key = this.keyFromUri(uri);

    if (options.recursive) {
      const prefix = key.endsWith('/') ? key : key + '/';
      await this.adapter.deleteAll(prefix);
      if (!key.endsWith('/')) {
        await this.adapter.delete(key);
      }
    } else {
      await this.adapter.delete(key);
    }
  }

  async rename(oldUri: Uri, newUri: Uri, _options: { overwrite: boolean }): Promise<void> {
    const oldKey = this.keyFromUri(oldUri);
    const newKey = this.keyFromUri(newUri);
    await this.adapter.move(oldKey, newKey);
  }

  private async resolveChildren(parentUri: Uri, parentKey: string): Promise<FileStat[]> {
    const prefix = parentKey === '' ? '' : parentKey.endsWith('/') ? parentKey : parentKey + '/';
    const u = parentUri as any;
    const scheme = u.scheme || 's3';
    const authority = u.authority || '';

    const children: FileStat[] = [];
    let paginationToken: string | undefined;

    do {
      const result = await this.adapter.list({ prefix, paginationToken });

      for (const obj of result.objects) {
        const name = this.extractName(obj.key, prefix);
        if (!name) {continue;}

        const childPath = prefix + name;
        const childUri = `${scheme}://${authority}/${childPath}`;
        const isDir = obj.isDirectory;

        children.push({
          uri: childUri,
          lastModification: obj.lastModified ? obj.lastModified.getTime() : Date.now(),
          isDirectory: isDir,
          size: obj.size || 0,
          type: isDir ? FileType.Directory : FileType.File,
        });
      }

      paginationToken = result.paginationToken;
    } while (paginationToken);

    return children;
  }

  private keyFromUri(uri: Uri): string {
    const path = (uri as any).path || '';
    return path.startsWith('/') ? path.slice(1) : path;
  }

  private uriToString(uri: Uri): string {
    const u = uri as any;
    const path = u.path || '/';
    return `${u.scheme}://${u.authority || ''}${path}`;
  }

  private extractName(fullKey: string, prefix: string): string {
    const relative = fullKey.slice(prefix.length);
    return relative.endsWith('/') ? relative.slice(0, -1) : relative;
  }

  private isNotFoundError(err: unknown): boolean {
    if (err && typeof err === 'object' && 'name' in err) {
      const name = (err as { name: string }).name;
      return name === 'NoSuchKey' || name === 'NotFound' || name === '404';
    }
    if (err && typeof err === 'object' && '$metadata' in err) {
      const meta = (err as { $metadata: { httpStatusCode?: number } }).$metadata;
      return meta.httpStatusCode === 404;
    }
    return false;
  }

  private isAccessDeniedError(err: unknown): boolean {
    if (err && typeof err === 'object' && 'name' in err) {
      const name = (err as { name: string }).name;
      return name === 'AccessDenied' || name === 'Forbidden';
    }
    if (err && typeof err === 'object' && '$metadata' in err) {
      const meta = (err as { $metadata: { httpStatusCode?: number } }).$metadata;
      return meta.httpStatusCode === 403;
    }
    return false;
  }

  private toProviderError(err: unknown, key: string): Error {
    if (this.isNotFoundError(err)) {
      return createFileSystemProviderError(`File not found: ${key}`, FileSystemProviderErrorCode.FileNotFound);
    }
    if (this.isAccessDeniedError(err)) {
      return createFileSystemProviderError(`Access denied: ${key}`, FileSystemProviderErrorCode.NoPermissions);
    }
    const message = err instanceof Error ? err.message : String(err);
    return createFileSystemProviderError(`S3 error for ${key}: ${message}`, FileSystemProviderErrorCode.Unknown);
  }
}

export default S3FileSystemProvider;
