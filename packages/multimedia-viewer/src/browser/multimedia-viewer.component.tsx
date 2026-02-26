import * as React from 'react';

import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';

const ImageViewer = React.lazy(() => import('./viewers/image-viewer'));
const MarkdownViewer = React.lazy(() => import('./viewers/markdown-viewer'));
const JsonViewer = React.lazy(() => import('./viewers/json-viewer'));
const CsvViewer = React.lazy(() => import('./viewers/csv-viewer'));
const PdfViewer = React.lazy(() => import('./viewers/pdf-viewer'));
const VideoViewer = React.lazy(() => import('./viewers/video-viewer'));
const AudioViewer = React.lazy(() => import('./viewers/audio-viewer'));
const CollaboraViewer = React.lazy(() => import('./viewers/collabora-viewer'));

const VIEWER_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  '.png': ImageViewer,
  '.jpg': ImageViewer,
  '.jpeg': ImageViewer,
  '.gif': ImageViewer,
  '.webp': ImageViewer,
  '.svg': ImageViewer,
  '.bmp': ImageViewer,
  '.ico': ImageViewer,
  '.pdf': PdfViewer,
  '.docx': CollaboraViewer,
  '.xlsx': CollaboraViewer,
  '.xls': CollaboraViewer,
  '.pptx': CollaboraViewer,
  '.odt': CollaboraViewer,
  '.ods': CollaboraViewer,
  '.odp': CollaboraViewer,
  '.md': MarkdownViewer,
  '.markdown': MarkdownViewer,
  '.json': JsonViewer,
  '.csv': CsvViewer,
  '.mp4': VideoViewer,
  '.webm': VideoViewer,
  '.ogv': VideoViewer,
  '.mov': VideoViewer,
  '.mp3': AudioViewer,
  '.wav': AudioViewer,
  '.ogg': AudioViewer,
  '.flac': AudioViewer,
  '.aac': AudioViewer,
  '.m4a': AudioViewer,
};

const LoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
    Loading...
  </div>
);

const UnsupportedFormat: React.FC<{ ext: string }> = ({ ext }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
    Unsupported format: {ext}
  </div>
);

export const MultimediaViewerComponent: ReactEditorComponent<null> = ({ resource }) => {
  const ext = resource.uri.path.ext.toLowerCase();
  const ViewerComponent = VIEWER_MAP[ext];

  if (!ViewerComponent) {
    return <UnsupportedFormat ext={ext} />;
  }

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <ViewerComponent resource={resource} />
    </React.Suspense>
  );
};
