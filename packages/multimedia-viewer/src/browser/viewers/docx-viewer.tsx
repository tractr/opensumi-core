import { renderAsync } from 'docx-preview';
import * as React from 'react';

import { useInjectable } from '@opensumi/ide-core-browser';
import { StaticResourceService } from '@opensumi/ide-core-browser/lib/static-resource';
import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';

const styles = {
  container: {
    height: '100%',
    overflow: 'auto',
    background: '#f5f5f5',
    padding: '24px',
  },
  docContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    padding: '32px',
    minHeight: '100%',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
};

const DocxViewer: ReactEditorComponent<null> = ({ resource }) => {
  const staticService = useInjectable<StaticResourceService>(StaticResourceService);
  const url = React.useMemo(() => staticService.resolveStaticResource(resource.uri).toString(), [resource]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (!res.ok) {throw new Error(`HTTP ${res.status}: ${res.statusText}`);}
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (cancelled || !containerRef.current) {return;}
        return renderAsync(arrayBuffer, containerRef.current);
      })
      .then(() => {
        if (!cancelled) {setLoading(false);}
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load document');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return <div style={styles.center}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      {loading && <div style={styles.center}>Loading document...</div>}
      <div
        ref={containerRef}
        style={{
          ...styles.docContainer,
          display: loading ? 'none' : 'block',
        }}
      />
    </div>
  );
};

export default DocxViewer;
