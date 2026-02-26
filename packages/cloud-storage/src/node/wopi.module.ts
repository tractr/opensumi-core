import { Injectable, Provider } from '@opensumi/di';
import { NodeModule } from '@opensumi/ide-core-node';

import { WopiContribution } from './wopi.contribution';

@Injectable()
export class WopiModule extends NodeModule {
  providers: Provider[] = [WopiContribution];
}
