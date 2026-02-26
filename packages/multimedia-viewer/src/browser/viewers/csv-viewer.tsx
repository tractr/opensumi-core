import * as React from 'react';
import { usePapaParse } from 'react-papaparse';

import { useInjectable } from '@opensumi/ide-core-browser';
import { StaticResourceService } from '@opensumi/ide-core-browser/lib/static-resource';
import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'auto',
  padding: '16px',
  boxSizing: 'border-box',
  background: '#1e1e1e',
  color: '#d4d4d4',
};

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  fontSize: '13px',
  fontFamily: 'monospace',
};

const thStyle: React.CSSProperties = {
  padding: '6px 12px',
  textAlign: 'left',
  borderBottom: '2px solid #555',
  background: '#2d2d2d',
  color: '#e0e0e0',
  fontWeight: 600,
  position: 'sticky' as const,
  top: 0,
};

const tdStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderBottom: '1px solid #3c3c3c',
};

const tdAltStyle: React.CSSProperties = {
  ...tdStyle,
  background: '#252526',
};

const statusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#999',
};

const CsvViewer: ReactEditorComponent<null> = ({ resource }) => {
  const staticService = useInjectable<StaticResourceService>(StaticResourceService);
  const url = React.useMemo(() => staticService.resolveStaticResource(resource.uri).toString(), [resource]);

  const { readString } = usePapaParse();
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<string[][]>([]);
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
        readString(text, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as string[][];
            if (data.length > 0) {
              setHeaders(data[0]);
              setRows(data.slice(1));
            }
            setLoading(false);
          },
        });
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
    return <div style={statusStyle}>Error loading CSV: {error}</div>;
  }

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={ri % 2 === 0 ? tdStyle : tdAltStyle}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CsvViewer;
