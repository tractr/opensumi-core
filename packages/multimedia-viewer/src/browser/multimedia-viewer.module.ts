import { Injectable } from '@opensumi/di';
import { BrowserModule } from '@opensumi/ide-core-browser';

import { MultimediaViewerContribution } from './multimedia-viewer.contribution';

@Injectable()
export class MultimediaViewerModule extends BrowserModule {
  providers = [MultimediaViewerContribution];
}
