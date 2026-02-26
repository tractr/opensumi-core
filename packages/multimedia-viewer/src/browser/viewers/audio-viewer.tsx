import WavesurferPlayer from '@wavesurfer/react';
import * as React from 'react';

import { useInjectable } from '@opensumi/ide-core-browser';
import { StaticResourceService } from '@opensumi/ide-core-browser/lib/static-resource';
import { ReactEditorComponent } from '@opensumi/ide-editor/lib/browser';

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#1e1e1e',
  padding: '40px',
  boxSizing: 'border-box',
};

const waveformStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '900px',
};

const buttonStyle: React.CSSProperties = {
  marginTop: '20px',
  padding: '8px 24px',
  background: '#3c3c3c',
  color: '#cccccc',
  border: '1px solid #555',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '14px',
};

const AudioViewer: ReactEditorComponent<null> = ({ resource }) => {
  const staticService = useInjectable<StaticResourceService>(StaticResourceService);
  const url = React.useMemo(() => staticService.resolveStaticResource(resource.uri).toString(), [resource]);

  const [wavesurfer, setWavesurfer] = React.useState<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const onReady = React.useCallback((ws: any) => {
    setWavesurfer(ws);
  }, []);

  const onPlayPause = React.useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const togglePlay = React.useCallback(() => {
    if (wavesurfer) {
      wavesurfer.playPause();
    }
  }, [wavesurfer]);

  return (
    <div style={containerStyle}>
      <div style={waveformStyle}>
        <WavesurferPlayer
          url={url}
          waveColor='#4a9eff'
          progressColor='#1a6dd4'
          height={128}
          onReady={onReady}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
      <button style={buttonStyle} onClick={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};

export default AudioViewer;
