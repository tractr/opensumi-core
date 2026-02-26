import * as React from 'react';
import ReactPlayer from 'react-player';

import { useInjectable } from '@opensumi/ide-core-browser';
import { StaticResourceService } from '@opensumi/ide-core-browser/lib/static-resource';
import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#1e1e1e',
};

const VideoViewer: ReactEditorComponent<null> = ({ resource }) => {
  const staticService = useInjectable<StaticResourceService>(StaticResourceService);
  const url = React.useMemo(() => staticService.resolveStaticResource(resource.uri).toString(), [resource]);

  return (
    <div style={containerStyle}>
      <ReactPlayer src={url} controls={true} width='100%' height='100%' />
    </div>
  );
};

export default VideoViewer;
