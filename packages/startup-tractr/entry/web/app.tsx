import '@opensumi/ide-i18n/lib/browser';
import { AILayout } from '@opensumi/ide-ai-native/lib/browser/layout/ai-layout';
import '@opensumi/ide-core-browser/lib/style/index.less';
import '@opensumi/ide-core-browser/lib/style/icon.less';
import { ExpressFileServerModule } from '@opensumi/ide-express-file-server/lib/browser';

import { AIModules, CommonBrowserModules } from '../../src/browser/common-modules';
import { layoutConfig } from '../../src/browser/layout-config';
import { renderApp } from '../../src/browser/render-app';
import '../../src/browser/main.less';
import '../../src/browser/styles.less';

renderApp({
  modules: [...CommonBrowserModules, ...AIModules, ExpressFileServerModule],
  layoutConfig,
  layoutComponent: AILayout,
  useCdnIcon: true,
  defaultPreferences: {
    'general.theme': 'opensumi-design-dark-theme',
    'general.icon': 'vscode-icons',
    'general.productIconTheme': 'opensumi-icons',
    'general.language': 'en-US',
  },
  designLayout: {
    useMenubarView: true,
    useMergeRightWithLeftPanel: true,
  },
  defaultPanels: {
    bottom: '@opensumi/ide-output',
    right: '',
  },
});
