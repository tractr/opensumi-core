import * as React from 'react';
import * as XLSX from 'xlsx';

import { useInjectable } from '@opensumi/ide-core-browser';
import { StaticResourceService } from '@opensumi/ide-core-browser/lib/static-resource';
import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: '#1e1e1e',
  color: '#cccccc',
  overflow: 'hidden',
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2px',
  padding: '8px 8px 0',
  background: '#252526',
  borderBottom: '1px solid #3c3c3c',
  overflowX: 'auto',
  flexShrink: 0,
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px',
  background: active ? '#1e1e1e' : '#2d2d2d',
  color: active ? '#ffffff' : '#999999',
  border: 'none',
  borderTopLeftRadius: '3px',
  borderTopRightRadius: '3px',
  cursor: 'pointer',
  fontSize: '13px',
  whiteSpace: 'nowrap',
});

const tableContainerStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '8px',
};

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  fontSize: '13px',
};

const thStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  padding: '6px 12px',
  background: '#2d2d2d',
  borderBottom: '2px solid #3c3c3c',
  borderRight: '1px solid #3c3c3c',
  textAlign: 'left',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle = (rowIndex: number): React.CSSProperties => ({
  padding: '4px 12px',
  borderBottom: '1px solid #3c3c3c',
  borderRight: '1px solid #3c3c3c',
  background: rowIndex % 2 === 0 ? '#1e1e1e' : '#252526',
  whiteSpace: 'nowrap',
});

const centerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#999',
};

interface WorkbookData {
  sheetNames: string[];
  sheets: Record<string, any[][]>;
}

const XlsxViewer: ReactEditorComponent<null> = ({ resource }) => {
  const staticService = useInjectable<StaticResourceService>(StaticResourceService);
  const url = React.useMemo(() => staticService.resolveStaticResource(resource.uri).toString(), [resource]);

  const [data, setData] = React.useState<WorkbookData | null>(null);
  const [activeSheet, setActiveSheet] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (cancelled) {return;}
        const workbook = XLSX.read(arrayBuffer);
        const sheets: Record<string, any[][]> = {};
        for (const name of workbook.SheetNames) {
          sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
        }
        setData({ sheetNames: workbook.SheetNames, sheets });
        setActiveSheet(0);
      })
      .catch((err) => {
        if (!cancelled) {setError(err.message);}
      })
      .finally(() => {
        if (!cancelled) {setLoading(false);}
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return <div style={centerStyle}>Loading spreadsheet...</div>;
  }

  if (error) {
    return <div style={centerStyle}>Error: {error}</div>;
  }

  if (!data || data.sheetNames.length === 0) {
    return <div style={centerStyle}>Empty spreadsheet</div>;
  }

  const sheetName = data.sheetNames[activeSheet];
  const rows = data.sheets[sheetName];
  const headers = rows.length > 0 ? rows[0] : [];
  const bodyRows = rows.slice(1);

  return (
    <div style={containerStyle}>
      {data.sheetNames.length > 1 && (
        <div style={tabBarStyle}>
          {data.sheetNames.map((name, i) => (
            <button key={name} style={tabStyle(i === activeSheet)} onClick={() => setActiveSheet(i)}>
              {name}
            </button>
          ))}
        </div>
      )}
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {headers.map((h: any, i: number) => (
                <th key={i} style={thStyle}>
                  {h != null ? String(h) : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row: any[], rowIdx: number) => (
              <tr key={rowIdx}>
                {headers.map((_: any, colIdx: number) => (
                  <td key={colIdx} style={tdStyle(rowIdx)}>
                    {row[colIdx] != null ? String(row[colIdx]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default XlsxViewer;
