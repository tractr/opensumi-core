import * as http from 'http';

import { Autowired } from '@opensumi/di';
import { Domain, IServerApp, ServerAppContribution } from '@opensumi/ide-core-node';
import { IFileService } from '@opensumi/ide-file-service/lib/common';

const COLLABORA_URL = process.env.COLLABORA_URL || 'http://localhost:9980';

function proxyGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        const chunks: any[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode || 500, body: Buffer.concat(chunks).toString() }));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

function decodeFileId(encoded: string): string {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function collectRequestBody(req: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function baseNameFromUri(uri: string): string {
  const pathPart = uri.split('?')[0];
  return pathPart.split('/').pop() || 'file';
}

@Domain(ServerAppContribution)
export class WopiContribution implements ServerAppContribution {
  @Autowired(IFileService)
  private fileService!: IFileService;

  initialize(app: IServerApp) {
    app.use(async (ctx, next) => {
      if (!ctx.path.startsWith('/wopi/')) {
        return next();
      }

      ctx.set('Access-Control-Allow-Origin', '*');
      ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      ctx.set('Access-Control-Allow-Headers', 'Content-Type, X-WOPI-Override, X-WOPI-Lock, X-WOPI-OldLock');

      if (ctx.method === 'OPTIONS') {
        ctx.status = 200;
        return;
      }

      if (ctx.path === '/wopi/discovery' && ctx.method === 'GET') {
        try {
          const result = await proxyGet(`${COLLABORA_URL}/hosting/discovery`);
          ctx.set('Content-Type', 'application/xml');
          ctx.status = result.status;
          ctx.body = result.body;
        } catch {
          ctx.status = 502;
          ctx.body = 'Cannot reach Collabora Online';
        }
        return;
      }

      const contentsMatch = ctx.path.match(/^\/wopi\/files\/([^/]+)\/contents$/);
      if (contentsMatch) {
        const uri = decodeFileId(contentsMatch[1]);

        if (ctx.method === 'GET') {
          try {
            const { content } = await this.fileService.resolveContent(uri, { encoding: 'binary' });
            ctx.set('Content-Type', 'application/octet-stream');
            ctx.body = Buffer.from(content, 'binary');
          } catch (err: any) {
            ctx.status = err.code === 'ENOENT' ? 404 : 500;
            ctx.body = ctx.status === 404 ? 'File not found' : 'Internal server error';
          }
          return;
        }

        if (ctx.method === 'POST') {
          try {
            const body = await collectRequestBody(ctx.req);
            const stat = await this.fileService.getFileStat(uri);
            if (!stat) {
              ctx.status = 404;
              ctx.body = 'File not found';
              return;
            }
            await this.fileService.setContent(stat, body.toString('binary'), { encoding: 'binary' });
            ctx.status = 200;
            ctx.body = '';
          } catch {
            ctx.status = 500;
            ctx.body = 'Write error';
          }
          return;
        }

        ctx.status = 405;
        return;
      }

      const fileInfoMatch = ctx.path.match(/^\/wopi\/files\/([^/]+)$/);
      if (fileInfoMatch && ctx.method === 'GET') {
        const uri = decodeFileId(fileInfoMatch[1]);

        try {
          const stat = await this.fileService.getFileStat(uri);
          if (!stat) {
            ctx.status = 404;
            ctx.body = 'File not found';
            return;
          }

          ctx.set('Content-Type', 'application/json');
          ctx.body = JSON.stringify({
            BaseFileName: baseNameFromUri(uri),
            OwnerId: 'cloud-storage',
            Size: stat.size,
            UserId: 'default-user',
            UserFriendlyName: 'Cloud User',
            UserCanWrite: true,
            UserCanNotWriteRelative: true,
            LastModifiedTime: new Date(stat.lastModification).toISOString(),
          });
        } catch {
          ctx.status = 500;
          ctx.body = 'Internal server error';
        }
        return;
      }

      ctx.status = 404;
      ctx.body = 'Not found';
    });
  }
}
