import * as React from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import { useInjectable } from '@opensumi/ide-core-browser';
import { StaticResourceService } from '@opensumi/ide-core-browser/lib/static-resource';
import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: '#1e1e1e',
  overflow: 'hidden',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  padding: '8px',
  justifyContent: 'center',
  background: '#252526',
  borderBottom: '1px solid #3c3c3c',
};

const buttonStyle: React.CSSProperties = {
  padding: '4px 12px',
  background: '#3c3c3c',
  color: '#cccccc',
  border: '1px solid #555',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '13px',
};

const viewportStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const ImageViewer: ReactEditorComponent<null> = ({ resource }) => {
  const staticService = useInjectable<StaticResourceService>(StaticResourceService);
  const url = React.useMemo(() => staticService.resolveStaticResource(resource.uri).toString(), [resource]);

  return (
    <div style={containerStyle}>
      <TransformWrapper initialScale={1} minScale={0.1} maxScale={20}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div style={toolbarStyle}>
              <button style={buttonStyle} onClick={() => zoomIn()}>
                Zoom +
              </button>
              <button style={buttonStyle} onClick={() => zoomOut()}>
                Zoom -
              </button>
              <button style={buttonStyle} onClick={() => resetTransform()}>
                Reset
              </button>
            </div>
            <TransformComponent
              wrapperStyle={viewportStyle}
              contentStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <img
                src={url}
                alt={resource.uri.path.base}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default ImageViewer;
