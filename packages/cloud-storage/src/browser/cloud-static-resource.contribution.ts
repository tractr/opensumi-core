import { Injectable } from '@opensumi/di';
import { URI } from '@opensumi/ide-core-browser';
import {
  StaticResourceContribution,
  StaticResourceService,
} from '@opensumi/ide-core-browser/lib/static-resource/static.definition';
import { Domain } from '@opensumi/ide-core-common';

const CLOUD_SCHEMES = ['s3', 'gcs', 'azure', 'drive'];

@Injectable()
@Domain(StaticResourceContribution)
export class CloudStaticResourceContribution implements StaticResourceContribution {
  registerStaticResolver(service: StaticResourceService): void {
    const baseUrl = this.getBaseUrl();

    for (const scheme of CLOUD_SCHEMES) {
      service.registerStaticResourceProvider({
        scheme,
        resolveStaticResource: (uri: URI): URI => {
          const authority = uri.authority || '';
          const path = uri.path.toString();
          const authoritySegment = authority ? `/${encodeURIComponent(authority)}` : '';
          return new URI(`${baseUrl}/cloud-proxy/${scheme}${authoritySegment}${path}`);
        },
        roots: [baseUrl],
      });
    }
  }

  private getBaseUrl(): string {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const port = process.env.IS_DEV ? '8000' : typeof window !== 'undefined' ? window.location.port : '8000';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
  }
}
