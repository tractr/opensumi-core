import { Autowired, Injectable } from '@opensumi/di';
import { FsProviderContribution } from '@opensumi/ide-core-browser';
import { Domain } from '@opensumi/ide-core-common';

import { IS3FileProvider } from '../common/s3-tokens';

import type { IDisposable } from '@opensumi/ide-core-common';
import type { FileSystemProvider } from '@opensumi/ide-file-service/lib/common';

@Injectable()
@Domain(FsProviderContribution)
export class S3FsContribution implements FsProviderContribution {
  @Autowired(IS3FileProvider)
  private s3Provider!: FileSystemProvider;

  registerProvider(registry: { registerProvider(scheme: string, provider: FileSystemProvider): IDisposable }): void {
    registry.registerProvider('s3', this.s3Provider);
  }
}
