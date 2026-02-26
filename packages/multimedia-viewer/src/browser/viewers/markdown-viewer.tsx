import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { useInjectable } from '@opensumi/ide-core-browser';
import { StaticResourceService } from '@opensumi/ide-core-browser/lib/static-resource';
import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';


// Adapted from @opensumi/ide-markdown/src/browser/mardown.style.ts (VS Code markdown CSS)
const MARKDOWN_CSS = `
.markdown-viewer-content {
  padding: 10px 20px;
  line-height: 22px;
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}

.markdown-viewer-content img {
  max-width: 100%;
  max-height: 100%;
}

.markdown-viewer-content a {
  text-decoration: none;
  color: #3794ff;
  cursor: pointer;
}

.markdown-viewer-content a:hover {
  text-decoration: underline;
}

.markdown-viewer-content a:focus,
.markdown-viewer-content input:focus,
.markdown-viewer-content select:focus,
.markdown-viewer-content textarea:focus {
  outline: 1px solid -webkit-focus-ring-color;
  outline-offset: -1px;
}

.markdown-viewer-content hr {
  border: 0;
  height: 2px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.18);
}

.markdown-viewer-content h1 {
  padding-bottom: 0.3em;
  line-height: 1.2;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-color: rgba(255, 255, 255, 0.18);
}

.markdown-viewer-content h1,
.markdown-viewer-content h2,
.markdown-viewer-content h3 {
  font-weight: normal;
}

.markdown-viewer-content table {
  border-collapse: collapse;
}

.markdown-viewer-content table > thead > tr > th {
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.69);
}

.markdown-viewer-content table > thead > tr > th,
.markdown-viewer-content table > thead > tr > td,
.markdown-viewer-content table > tbody > tr > th,
.markdown-viewer-content table > tbody > tr > td {
  padding: 5px 10px;
}

.markdown-viewer-content table > tbody > tr + tr > td {
  border-top: 1px solid rgba(255, 255, 255, 0.18);
}

.markdown-viewer-content blockquote {
  margin: 0 7px 0 5px;
  padding: 0 16px 0 10px;
  border-left-width: 5px;
  border-left-style: solid;
  border-left-color: rgba(255, 255, 255, 0.18);
}

.markdown-viewer-content code {
  font-family: Menlo, Monaco, Consolas, "Droid Sans Mono", "Courier New", monospace, "Droid Sans Fallback";
  font-size: 14px;
  line-height: 19px;
}

.markdown-viewer-content pre {
  padding: 16px;
  border-radius: 3px;
  overflow: auto;
  background-color: rgba(10, 10, 10, 0.4);
}

.markdown-viewer-content :not(pre) > code {
  padding: 1px 4px;
  border-radius: 3px;
  background-color: rgba(10, 10, 10, 0.4);
}

/* Hover highlight bar on the left (VS Code markdown preview style) */
.markdown-viewer-content > h1,
.markdown-viewer-content > h2,
.markdown-viewer-content > h3,
.markdown-viewer-content > h4,
.markdown-viewer-content > h5,
.markdown-viewer-content > h6,
.markdown-viewer-content > p,
.markdown-viewer-content > pre,
.markdown-viewer-content > blockquote,
.markdown-viewer-content > ul,
.markdown-viewer-content > ol,
.markdown-viewer-content > table,
.markdown-viewer-content > div {
  position: relative;
  border-left: 3px solid transparent;
  padding-left: 13px;
  margin-left: -16px;
  transition: border-color 0.1s ease;
}

.markdown-viewer-content > h1:hover,
.markdown-viewer-content > h2:hover,
.markdown-viewer-content > h3:hover,
.markdown-viewer-content > h4:hover,
.markdown-viewer-content > h5:hover,
.markdown-viewer-content > h6:hover,
.markdown-viewer-content > p:hover,
.markdown-viewer-content > pre:hover,
.markdown-viewer-content > blockquote:hover,
.markdown-viewer-content > ul:hover,
.markdown-viewer-content > ol:hover,
.markdown-viewer-content > table:hover,
.markdown-viewer-content > div:hover {
  border-left-color: rgba(255, 255, 255, 0.25);
}
`;

const statusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#999',
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'auto',
  background: '#1e1e1e',
  color: '#d4d4d4',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  fontSize: '14px',
  lineHeight: 1.6,
};

const contentStyle: React.CSSProperties = {
  maxWidth: '860px',
  margin: '0 auto',
};

const MarkdownViewer: ReactEditorComponent<null> = ({ resource }) => {
  const staticService = useInjectable<StaticResourceService>(StaticResourceService);
  const url = React.useMemo(() => staticService.resolveStaticResource(resource.uri).toString(), [resource]);

  const [content, setContent] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return <div style={statusStyle}>Loading...</div>;
  }

  if (error) {
    return <div style={statusStyle}>Error loading file: {error}</div>;
  }

  return (
    <div style={containerStyle}>
      <style>{MARKDOWN_CSS}</style>
      <div className='markdown-viewer-content' style={contentStyle}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownViewer;
