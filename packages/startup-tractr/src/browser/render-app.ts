import { Injector } from '@opensumi/di';
import { IClientAppOpts } from '@opensumi/ide-core-browser';
import { ClientApp } from '@opensumi/ide-core-browser/lib/bootstrap/app';

import { CoreCommandContribution } from './core-commands';
import { MenuBarContribution } from './menu-bar/menu-bar.contribution';
import { StatusBarContribution } from './status-bar/status-bar.contribution';

export async function renderApp(opts: IClientAppOpts) {
  // Prevent terminal panel from auto-opening on startup.
  // OpenSumi persists layout state and terminal sessions in localStorage.
  // The terminal module auto-creates a PTY when its tab is active,
  // causing unwanted terminals to accumulate across reloads.
  for (const key of Object.keys(localStorage)) {
    if (key.includes('OPENSUMI_TERMINAL_RESTORE')) {
      localStorage.removeItem(key);
    }
    if (key === 'layout' || key.endsWith(':/layout')) {
      try {
        const layout = JSON.parse(localStorage.getItem(key)!);
        if (layout.bottom && layout.bottom.currentId === 'terminal') {
          layout.bottom.currentId = '';
          layout.bottom.size = 0;
          localStorage.setItem(key, JSON.stringify(layout));
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  const injector = new Injector();
  injector.addProviders(StatusBarContribution);
  injector.addProviders(MenuBarContribution);
  injector.addProviders(CoreCommandContribution);

  const hostname = window.location.hostname;
  const query = new URLSearchParams(window.location.search);
  const isDev = process.env.IS_DEV;
  const serverPort = isDev ? 8000 : window.location.port;
  const staticServerPort = isDev ? 8080 : window.location.port;
  const webviewEndpointPort = isDev ? 8899 : window.location.port;
  opts.workspaceDir = opts.workspaceDir || query.get('workspaceDir') || process.env.WORKSPACE_DIR;

  opts.extensionDir = opts.extensionDir || process.env.EXTENSION_DIR;
  opts.injector = injector;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  opts.wsPath = process.env.WS_PATH || `${wsProtocol}://${hostname}:${serverPort}`;
  opts.extWorkerHost =
    opts.extWorkerHost || process.env.EXTENSION_WORKER_HOST || `http://${hostname}:${staticServerPort}/worker-host.js`;
  opts.staticServicePath = `http://${hostname}:${serverPort}`;
  const anotherHostName = process.env.WEBVIEW_HOST || hostname;
  opts.webviewEndpoint = `http://${anotherHostName}:${webviewEndpointPort}/webview`;
  const app = new ClientApp(opts);

  app.fireOnReload = () => {
    window.location.reload();
  };

  app.start(document.getElementById('main')!, 'web');
}
