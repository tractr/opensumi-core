import { Autowired, Injectable } from '@opensumi/di';
import { Event } from '@opensumi/ide-core-common';
import { CoreFileServiceProviderClient } from '@opensumi/ide-file-service/lib/browser/file-service-provider-client';

import { S3FileServicePath } from '../common/s3-tokens';

import type { FileSystemProvider } from '@opensumi/ide-file-service/lib/common';

const FileReadWrite = 2;
const PathCaseSensitive = 1024;

@Injectable()
export class S3FsProviderClient extends CoreFileServiceProviderClient {
  @Autowired(S3FileServicePath)
  fileServiceProvider!: FileSystemProvider;

  readonly onDidChangeCapabilities: Event<void> = Event.None;

  private _capabilities = (FileReadWrite | PathCaseSensitive) as number;

  get capabilities() {
    return this._capabilities;
  }
}
