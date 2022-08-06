'strict';
import {
  commands,
  CompleteResult,
  executable,
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  languages,
  listManager,
  ServerOptions,
  sources,
  services,
  window,
  workspace,
  Location,
} from 'coc.nvim';

const SCOPE = 'csharp-ls';
const INSTALL = SCOPE + '.install';
const START = SCOPE + '.start';

export async function activate(context: ExtensionContext): Promise<void> {
  const logger = context.logger;
  const cfg = workspace.getConfiguration(SCOPE);
  const path = cfg.get<string>('path')!;

  let client: LanguageClient | undefined;

  const install = () => {
    window.openTerminal('dotnet tool install --global csharp-ls');
    window.showInformationMessage(`Run ${START} to start or restart server`);
  };

  const start = () => {
    if (client) {
      client.started ? client.restart() : client.needsStart() ? client.start() : null;
    } else {
      const serverOptions: ServerOptions = { command: executable(path) ? path : 'csharp-ls' };
      const clientOptions: LanguageClientOptions = {
        documentSelector: [{ language: 'cs' }],
        progressOnInitialization: true,
        // middleware: {
        //   provideDefinition: async (doc, pos, token, next) => {
        //     const c: LanguageClient = client!;
        //     // @ts-ignore
        //     const defs: Location[] = await next(doc, pos, token);
        //     if (!defs) return;
        //     logger.info(defs);
        //     if (Array.isArray(defs)) {
        //       logger.info(await c.sendRequest('csharp/metadata', { textDocument: { uri: defs[0].uri } }));
        //     }
        //     return defs;
        //   },
        // },
      };
      client = new LanguageClient(SCOPE, SCOPE, serverOptions, clientOptions);
      context.subscriptions.push(services.registLanguageClient(client));
    }
  };

  commands.registerCommand(INSTALL, () => {
    install();
  });
  commands.registerCommand(START, () => {
    start();
  });

  if (executable(path)) {
    start();
  } else {
    if (await window.showPrompt(`${path} is not executable. Install csharp-ls now?`)) {
      install();
    } else {
      window.showInformationMessage(`Run ${INSTALL} to install csharp-ls`);
    }
  }
}
