import { Injectable } from '@opensumi/di';
import { BrowserModule } from '@opensumi/ide-core-browser';

import { CloudStaticResourceContribution } from './cloud-static-resource.contribution';

@Injectable()
export class CloudStaticResourceModule extends BrowserModule {
  providers = [CloudStaticResourceContribution];
}
