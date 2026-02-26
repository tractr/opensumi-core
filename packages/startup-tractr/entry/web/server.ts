import 'tsconfig-paths/register';

import { CloudProxyModule, S3Module, WopiModule } from '@opensumi/ide-cloud-storage/lib/node';
import { ExpressFileServerModule } from '@opensumi/ide-express-file-server/lib/node';
import { OpenerModule } from '@opensumi/ide-remote-opener/lib/node';

import { CommonNodeModules } from '../../src/node/common-modules';
import { startServer } from '../../src/node/start-server';


startServer({
  modules: [...CommonNodeModules, ExpressFileServerModule, OpenerModule, S3Module, CloudProxyModule, WopiModule],
});
