import { Autowired } from '@opensumi/di';
import { KeybindingContribution, KeybindingRegistry } from '@opensumi/ide-core-browser';
import { CommandContribution, CommandRegistry, Domain, Schemes } from '@opensumi/ide-core-common';
import {
  BrowserEditorContribution,
  EditorComponentRegistry,
  EditorOpenType,
  WorkbenchEditorService,
} from '@opensumi/ide-editor/lib/browser';
import { IFileServiceClient } from '@opensumi/ide-file-service/lib/common';

import { MultimediaViewerComponent } from './multimedia-viewer.component';

const MULTIMEDIA_VIEWER_ID = 'multimedia-viewer';

const SUPPORTED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
  '.pdf',
  '.docx',
  '.xlsx',
  '.xls',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
  '.mp4',
  '.webm',
  '.ogv',
  '.mov',
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.aac',
  '.m4a',
]);

const SWITCH_TO_CODE_COMMAND = 'multimedia-viewer.switchToCode';

@Domain(BrowserEditorContribution, CommandContribution, KeybindingContribution)
export class MultimediaViewerContribution
  implements BrowserEditorContribution, CommandContribution, KeybindingContribution
{
  @Autowired(WorkbenchEditorService)
  private editorService: WorkbenchEditorService;

  @Autowired(IFileServiceClient)
  private fileServiceClient: IFileServiceClient;

  registerEditorComponent(registry: EditorComponentRegistry) {
    registry.registerEditorComponent({
      uid: MULTIMEDIA_VIEWER_ID,
      component: MultimediaViewerComponent,
      scheme: Schemes.file,
    });

    registry.registerEditorComponentResolver(
      (scheme: string) => {
        if (scheme === Schemes.file || this.fileServiceClient?.handlesScheme(scheme)) {
          return 10;
        }
        return -1;
      },
      (resource, results) => {
        const ext = resource.uri.path.ext.toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          results.push({
            type: EditorOpenType.component,
            componentId: MULTIMEDIA_VIEWER_ID,
            weight: 10,
          });
        }
      },
    );
  }

  registerCommands(commands: CommandRegistry) {
    commands.registerCommand(
      { id: SWITCH_TO_CODE_COMMAND, label: 'Multimedia Viewer: Switch to Code Editor' },
      {
        execute: () => {
          const group = this.editorService.currentEditorGroup;
          if (group?.currentOpenType?.componentId === MULTIMEDIA_VIEWER_ID) {
            group.changeOpenType('code');
          }
        },
      },
    );
  }

  registerKeybindings(keybindings: KeybindingRegistry) {
    keybindings.registerKeybinding({
      command: SWITCH_TO_CODE_COMMAND,
      keybinding: 'e',
      when: '!editorFocus',
    });
  }
}
