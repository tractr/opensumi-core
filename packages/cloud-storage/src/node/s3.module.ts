import { Injectable, Provider } from '@opensumi/di';
import { NodeModule } from '@opensumi/ide-core-node';

import { IS3FileProvider, S3FileServicePath } from '../common/s3-tokens';

import { S3FileSystemProvider } from './s3-file-system.provider';
import { S3Contribution } from './s3.contribution';

@Injectable()
export class S3Module extends NodeModule {
  providers: Provider[] = [S3Contribution, { token: IS3FileProvider, useClass: S3FileSystemProvider }];

  backServices = [
    {
      servicePath: S3FileServicePath,
      token: IS3FileProvider,
    },
  ];
}
