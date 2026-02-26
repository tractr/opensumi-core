import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { CloudStorageAdapter, ListOptions, ListResult, StorageObject, WriteOptions } from './cloud-storage.adapter';

export interface S3DriverOptions {
  bucket: string;
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  /** Prefix a ajouter a tous les keys (ex: 'workspace/') */
  keyPrefix?: string;
  /** Endpoint custom pour MinIO/R2 */
  endpoint?: string;
  forcePathStyle?: boolean;
}

export class S3Driver implements CloudStorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly keyPrefix: string;

  constructor(options: S3DriverOptions) {
    this.bucket = options.bucket;
    this.keyPrefix = options.keyPrefix ?? '';

    this.client = new S3Client({
      region: options.region ?? process.env.AWS_REGION ?? 'eu-west-3',
      credentials: options.credentials,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
    });
  }

  private prefixedKey(key: string): string {
    return this.keyPrefix + key;
  }

  private stripPrefix(key: string): string {
    if (this.keyPrefix && key.startsWith(this.keyPrefix)) {
      return key.slice(this.keyPrefix.length);
    }
    return key;
  }

  async getBytes(key: string): Promise<Uint8Array> {
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: this.prefixedKey(key) }));
    if (!response.Body) {
      return new Uint8Array(0);
    }
    return Buffer.from(await response.Body.transformToByteArray());
  }

  async put(key: string, contents: Uint8Array, options?: WriteOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.prefixedKey(key),
        Body: Buffer.from(contents),
        ContentType: options?.contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.prefixedKey(key) }));
    } catch (err: unknown) {
      if (!this.isNotFound(err)) {
        throw err;
      }
    }
  }

  async deleteAll(prefix: string): Promise<void> {
    let continuationToken: string | undefined;

    do {
      const list = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: this.prefixedKey(prefix),
          ContinuationToken: continuationToken,
        }),
      );

      if (list.Contents && list.Contents.length > 0) {
        const batch = list.Contents.filter((obj) => obj.Key != null).map((obj) => ({
          Key: obj.Key!,
        }));

        if (batch.length > 0) {
          for (let i = 0; i < batch.length; i += 1000) {
            await this.client.send(
              new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: { Objects: batch.slice(i, i + 1000) },
              }),
            );
          }
        }
      }

      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  async copy(source: string, destination: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${this.prefixedKey(source)}`,
        Key: this.prefixedKey(destination),
      }),
    );
  }

  async move(source: string, destination: string): Promise<void> {
    await this.copy(source, destination);
    await this.delete(source);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.prefixedKey(key) }));
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<StorageObject> {
    const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.prefixedKey(key) }));
    return {
      key,
      size: head.ContentLength ?? 0,
      lastModified: head.LastModified ?? new Date(),
      etag: head.ETag,
      contentType: head.ContentType,
      isDirectory: key.endsWith('/'),
    };
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const prefix = this.prefixedKey(options?.prefix ?? '');
    const recursive = options?.recursive ?? false;

    const command: ConstructorParameters<typeof ListObjectsV2Command>[0] = {
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: options?.maxResults,
      ContinuationToken: options?.paginationToken,
    };

    if (!recursive) {
      command.Delimiter = '/';
    }

    const response = await this.client.send(new ListObjectsV2Command(command));

    const objects: StorageObject[] = [];

    if (response.CommonPrefixes) {
      for (const cp of response.CommonPrefixes) {
        if (cp.Prefix) {
          objects.push({
            key: this.stripPrefix(cp.Prefix),
            size: 0,
            lastModified: new Date(),
            isDirectory: true,
          });
        }
      }
    }

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && obj.Key !== prefix) {
          objects.push({
            key: this.stripPrefix(obj.Key),
            size: obj.Size ?? 0,
            lastModified: obj.LastModified ?? new Date(),
            etag: obj.ETag,
            isDirectory: false,
          });
        }
      }
    }

    return {
      objects,
      paginationToken: response.IsTruncated ? response.NextContinuationToken : undefined,
    };
  }

  private isNotFound(err: unknown): boolean {
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
}

export default S3Driver;
