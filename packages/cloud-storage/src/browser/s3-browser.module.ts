import { Injectable, Provider } from '@opensumi/di';
import { BrowserModule } from '@opensumi/ide-core-browser';

import { IS3FileProvider, S3FileServicePath } from '../common/s3-tokens';

import { S3FsProviderClient } from './s3-fs-provider-client';
import { S3FsContribution } from './s3-fs.contribution';

@Injectable()
export class S3BrowserModule extends BrowserModule {
  providers: Provider[] = [{ token: IS3FileProvider, useClass: S3FsProviderClient }, S3FsContribution];

  backServices = [
    {
      servicePath: S3FileServicePath,
      clientToken: IS3FileProvider,
    },
  ];
}
