import { Autowired } from '@opensumi/di';
import { Domain, IServerApp, ServerAppContribution } from '@opensumi/ide-core-node';
import { IFileService } from '@opensumi/ide-file-service/lib/common';

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  json: 'application/json',
  csv: 'text/csv',
  xml: 'application/xml',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[ext] || 'application/octet-stream';
}

@Domain(ServerAppContribution)
export class CloudProxyContribution implements ServerAppContribution {
  @Autowired(IFileService)
  private fileService!: IFileService;

  initialize(app: IServerApp) {
    app.use(async (ctx, next) => {
      const match = ctx.path.match(/^\/cloud-proxy\/([a-z][a-z0-9]*)(?:\/([^/]*))?(\/.*)?$/);
      if (!match || !match[3]) {return next();}

      const scheme = match[1];
      const authority = match[2] ? decodeURIComponent(match[2]) : '';
      const filePath = decodeURIComponent(match[3]);
      const uri = authority ? `${scheme}://${authority}${filePath}` : `${scheme}://${filePath}`;

      try {
        const stat = await this.fileService.getFileStat(uri);
        if (!stat || stat.isDirectory) {
          ctx.status = 404;
          ctx.body = 'File not found';
          return;
        }

        const { content } = await this.fileService.resolveContent(uri, {
          encoding: 'binary',
        });

        ctx.status = 200;
        ctx.set('Content-Type', getMimeType(filePath));
        ctx.set('Content-Disposition', 'inline');
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.set('Cache-Control', 'public, max-age=3600');
        ctx.body = Buffer.from(content, 'binary');
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error(`[CloudProxy] Error serving ${uri}:`, err.message);
        ctx.status = err.code === 'ENOENT' ? 404 : 500;
        ctx.body = ctx.status === 404 ? 'File not found' : 'Internal server error';
      }
    });
  }
}
