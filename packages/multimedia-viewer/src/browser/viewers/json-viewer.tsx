import JsonView from '@uiw/react-json-view';
import { darkTheme } from '@uiw/react-json-view/dark';
import * as React from 'react';

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
};

const statusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#999',
};

const JsonViewerComponent: ReactEditorComponent<null> = ({ resource }) => {
  const staticService = useInjectable<StaticResourceService>(StaticResourceService);
  const url = React.useMemo(() => staticService.resolveStaticResource(resource.uri).toString(), [resource]);

  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
        return res.json();
      })
      .then((json) => {
        setData(json);
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
    return <div style={statusStyle}>Error loading JSON: {error}</div>;
  }

  return (
    <div style={containerStyle}>
      <JsonView value={data} style={darkTheme} displayDataTypes={false} />
    </div>
  );
};

export default JsonViewerComponent;
