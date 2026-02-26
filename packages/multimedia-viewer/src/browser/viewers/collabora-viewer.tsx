import * as React from 'react';

import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';

// Browser → Koa server (same pattern as render-app.ts:14-17)
const hostname = window.location.hostname || 'localhost';
const serverPort = process.env.IS_DEV ? '8000' : window.location.port;
const BROWSER_WOPI_HOST = `${window.location.protocol}//${hostname}:${serverPort}`;

// Collabora Docker → Koa (host.docker.internal resolves to macOS host from inside Docker)
const WOPI_CALLBACK_HOST =
  process.env.WOPI_CALLBACK_HOST ||
  (process.env.IS_DEV ? `http://host.docker.internal:${serverPort}` : BROWSER_WOPI_HOST);

// Supported extensions (without dot, matching Collabora discovery XML action ext attribute)
const SUPPORTED_EXTS = new Set(['docx', 'xlsx', 'pptx', 'xls', 'odt', 'ods', 'odp']);

function encodeFileId(filePath: string): string {
  const b64 = btoa(unescape(encodeURIComponent(filePath)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function findUrlSrcByExt(xml: string, fileExt: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const actions = Array.from(doc.querySelectorAll('action'));
  for (const action of actions) {
    if (action.getAttribute('ext') === fileExt && action.getAttribute('name') === 'edit') {
      return action.getAttribute('urlsrc');
    }
  }
  // Fallback: accept view action if no edit action found
  for (const action of actions) {
    if (action.getAttribute('ext') === fileExt) {
      return action.getAttribute('urlsrc');
    }
  }
  return null;
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  hiddenForm: {
    display: 'none' as const,
  },
};

const IFRAME_NAME = 'collabora-frame';

const CollaboraViewer: ReactEditorComponent<null> = ({ resource }) => {
  const [iframeUrl, setIframeUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const fileUri = resource.uri.toString();
  const ext = resource.uri.path.ext.toLowerCase();

  React.useEffect(() => {
    let cancelled = false;

    const bareExt = ext.replace(/^\./, '');
    if (!SUPPORTED_EXTS.has(bareExt)) {
      setError(`Unsupported Collabora format: ${ext}`);
      return;
    }

    const fileId = encodeFileId(fileUri);

    fetch(`${BROWSER_WOPI_HOST}/wopi/discovery`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Discovery failed: HTTP ${res.status}`);
        }
        return res.text();
      })
      .then((xml) => {
        if (cancelled) {
          return;
        }
        const urlsrc = findUrlSrcByExt(xml, bareExt);
        if (!urlsrc) {
          throw new Error(`No Collabora action found for extension: ${ext}`);
        }
        // WOPISrc uses callback host (accessible from Collabora Docker container)
        const wopiSrc = encodeURIComponent(`${WOPI_CALLBACK_HOST}/wopi/files/${fileId}`);
        const url = `${urlsrc}WOPISrc=${wopiSrc}`;
        setIframeUrl(url);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to connect to Collabora Online');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileUri, ext]);

  React.useEffect(() => {
    if (iframeUrl && formRef.current && !submitted) {
      formRef.current.submit();
      setSubmitted(true);
    }
  }, [iframeUrl, submitted]);

  if (error) {
    return <div style={styles.center}>Error: {error}</div>;
  }

  if (!iframeUrl) {
    return <div style={styles.center}>Connecting to Collabora Online...</div>;
  }

  return (
    <div style={styles.container}>
      <form ref={formRef} action={iframeUrl} method='POST' target={IFRAME_NAME} style={styles.hiddenForm}>
        <input type='hidden' name='access_token' value='dev-token' />
        <input type='hidden' name='access_token_ttl' value='0' />
      </form>
      <iframe name={IFRAME_NAME} style={styles.iframe} allow='clipboard-read; clipboard-write' />
    </div>
  );
};

export default CollaboraViewer;
