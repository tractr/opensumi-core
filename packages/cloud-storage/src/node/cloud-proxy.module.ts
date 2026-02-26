import { Injectable, Provider } from '@opensumi/di';
import { NodeModule } from '@opensumi/ide-core-node';

import { CloudProxyContribution } from './cloud-proxy.contribution';

@Injectable()
export class CloudProxyModule extends NodeModule {
  providers: Provider[] = [CloudProxyContribution];
}
