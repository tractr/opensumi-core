import { Autowired } from '@opensumi/di';
import { Domain, ServerAppContribution } from '@opensumi/ide-core-node';
import { IFileService } from '@opensumi/ide-file-service/lib/common';

import { IS3FileProvider } from '../common/s3-tokens';

import { S3FileSystemProvider } from './s3-file-system.provider';
import { S3Driver } from './s3.driver';

@Domain(ServerAppContribution)
export class S3Contribution implements ServerAppContribution {
  @Autowired(IFileService)
  private fileService!: IFileService;

  @Autowired(IS3FileProvider)
  private s3Provider!: S3FileSystemProvider;

  initialize() {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      return;
    }

    this.s3Provider.configure(
      new S3Driver({
        bucket,
        region: process.env.AWS_REGION || 'eu-west-3',
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      }),
    );

    this.fileService.registerProvider('s3', this.s3Provider);
    // eslint-disable-next-line no-console
    console.log('[S3] Provider registered for scheme s3://, bucket:', bucket);
  }
}
