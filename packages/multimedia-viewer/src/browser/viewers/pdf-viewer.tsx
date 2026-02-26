import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { useInjectable } from '@opensumi/ide-core-browser';
import { StaticResourceService } from '@opensumi/ide-core-browser/lib/static-resource';
import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: '#2b2b2b',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#1e1e1e',
    borderBottom: '1px solid #3c3c3c',
    color: '#ccc',
    fontSize: '13px',
    flexShrink: 0,
  },
  button: {
    background: '#3c3c3c',
    color: '#ccc',
    border: '1px solid #555',
    borderRadius: '3px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
};

const PdfViewer: ReactEditorComponent<null> = ({ resource }) => {
  const staticService = useInjectable<StaticResourceService>(StaticResourceService);
  const url = React.useMemo(() => staticService.resolveStaticResource(resource.uri).toString(), [resource]);

  const [numPages, setNumPages] = React.useState<number>(0);
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [scale, setScale] = React.useState<number>(1.2);
  const [error, setError] = React.useState<string | null>(null);

  const onDocumentLoadSuccess = React.useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setPageNumber(1);
  }, []);

  const onDocumentLoadError = React.useCallback((err: Error) => {
    setError(err.message || 'Failed to load PDF');
  }, []);

  const goToPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goToNext = () => setPageNumber((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.2));
  const zoomOut = () => setScale((s) => Math.max(0.4, s - 0.2));

  if (error) {
    return <div style={styles.center}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button style={styles.button} onClick={goToPrev} disabled={pageNumber <= 1}>
          Prev
        </button>
        <span>
          Page {pageNumber} / {numPages || '...'}
        </span>
        <button style={styles.button} onClick={goToNext} disabled={pageNumber >= numPages}>
          Next
        </button>
        <span style={{ margin: '0 8px', borderLeft: '1px solid #555', height: '16px' }} />
        <button style={styles.button} onClick={zoomOut}>
          -
        </button>
        <span>{Math.round(scale * 100)}%</span>
        <button style={styles.button} onClick={zoomIn}>
          +
        </button>
      </div>
      <div style={styles.content}>
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div style={styles.center}>Loading PDF...</div>}
        >
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </div>
    </div>
  );
};

export default PdfViewer;
