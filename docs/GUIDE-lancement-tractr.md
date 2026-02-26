# Guide de lancement — Tractr IDE (monorepo)

Ce guide couvre le setup et le lancement du fork Tractr d'OpenSumi, qui ajoute le support S3/cloud storage, des viewers multimedia, et WOPI/Collabora.

## Prerequis

- **Node 18** (`fnm use 18`) — node-pty est incompatible avec Node 20+
- **Yarn** (Yarn 4.4.1, inclus via corepack)
- Docker (pour MinIO et Collabora, optionnel)

## Setup initial (apres clone)

```bash
# 1. Installer les dependances
yarn install --ignore-engines

# 2. Telecharger les extensions VS Code (themes, icones, langages)
yarn download-extension

# 3. Builder le worker host (extension host pour le browser)
cd packages/extension && yarn compile:worker && cd ../..

# 4. Rebuild les modules natifs (node-pty)
npm rebuild node-pty
```

> **Sans l'etape 2**, l'IDE n'a pas d'icones de fichiers (vscode-icons), pas de themes de couleur, et pas de coloration syntaxique.
>
> **Sans l'etape 3**, les extensions ne peuvent pas s'activer dans le browser (erreur "Worker host activate fail" dans la console).

## Lancement (filesystem local)

```bash
cd packages/startup-tractr
yarn start
```

Ouvrir http://localhost:8080

## Lancement avec S3 (MinIO)

### 1. Lancer MinIO

```bash
docker run -d --name minio \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```

Console MinIO : http://localhost:9001 (minioadmin/minioadmin)

### 2. Creer un bucket et ajouter des fichiers

```bash
brew install minio/stable/mc
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/test-ide
mc cp test.pdf local/test-ide/
mc cp test.png local/test-ide/
```

### 3. Lancer l'IDE avec S3

```bash
cd packages/startup-tractr

AWS_ACCESS_KEY_ID=minioadmin \
AWS_SECRET_ACCESS_KEY=minioadmin \
S3_BUCKET=test-ide \
S3_ENDPOINT=http://localhost:9000 \
S3_FORCE_PATH_STYLE=true \
WORKSPACE_DIR=s3://test-ide/ \
yarn start
```

Ouvrir http://localhost:8080

Le workspace peut aussi etre passe via query string :

```
http://localhost:8080/?workspaceDir=s3://test-ide/
```

### Variables d'environnement S3

| Variable                | Description                | Exemple                 |
| ----------------------- | -------------------------- | ----------------------- |
| `WORKSPACE_DIR`         | URI du workspace S3        | `s3://test-ide/`        |
| `S3_BUCKET`             | Nom du bucket              | `test-ide`              |
| `AWS_REGION`            | Region AWS                 | `eu-west-3`             |
| `S3_ENDPOINT`           | Endpoint custom (MinIO/R2) | `http://localhost:9000` |
| `S3_FORCE_PATH_STYLE`   | Path-style (MinIO/R2)      | `true`                  |
| `AWS_ACCESS_KEY_ID`     | Access key                 | `minioadmin`            |
| `AWS_SECRET_ACCESS_KEY` | Secret key                 | `minioadmin`            |

Pour un vrai bucket AWS, les credentials sont geres par le SDK (env vars, profil, IAM role). `S3_ENDPOINT` et `S3_FORCE_PATH_STYLE` ne sont necessaires que pour MinIO/R2.

## Collabora Online (edition DOCX/XLSX)

### Lancer Collabora

```bash
docker run -d --name collabora \
  -p 9980:9980 \
  -e "extra_params=--o:ssl.enable=false" \
  -e "aliasgroup1=http://host.docker.internal:8000" \
  collabora/code:latest
```

Les fichiers `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.odp` s'ouvrent automatiquement dans Collabora via le protocole WOPI.

## Architecture des packages Tractr

| Package                      | Role                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| `packages/cloud-storage`     | S3 filesystem provider, cloud proxy HTTP, WOPI                    |
| `packages/multimedia-viewer` | Viewers PDF, images, audio, video, CSV, JSON, Markdown, Collabora |
| `packages/startup-tractr`    | Point d'entree (entry web/node, webpack, layout, modules)         |

## Ports utilises

| Port | Service                          |
| ---- | -------------------------------- |
| 8080 | webpack-dev-server (IDE browser) |
| 8899 | Webview iframe                   |
| 8000 | Koa backend Node.js              |
| 9999 | Node inspector (debug)           |
| 9000 | MinIO API                        |
| 9001 | MinIO Console                    |
| 9980 | Collabora Online                 |

## Problemes courants

### Pas d'icones de fichiers dans l'explorer

`yarn download-extension` n'a pas ete execute. Les extensions vscode-icons et opensumi-default-themes doivent etre dans `tools/extensions/`.

### "Worker host activate fail" dans la console

`worker-host.js` n'est pas compile. C'est un bundle webpack separe :

```bash
cd packages/extension && yarn compile:worker
```

### node-pty: NODE_MODULE_VERSION mismatch

Node n'est pas en version 18. Verifier avec `node -v`, puis :

```bash
fnm use 18
npm rebuild node-pty
```

### Port deja utilise (EADDRINUSE)

```bash
lsof -ti :8080,:8899,:8000,:9999 | xargs kill -9
```

### "Could not load credentials from any providers"

Les variables `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` ne sont pas definies. Pour MinIO : `minioadmin`/`minioadmin`.

### Erreur "Extension Host Process is crashed"

Verifier que les chemins sont corrects dans `start-server.ts` :

- `extHost` → `packages/extension/lib/hosted/ext.process.js`
- `watcherHost` → `packages/file-service/lib/node/hosted/watcher.process.js`
- `extensionDir` → `tools/extensions/`

Ces trois fichiers doivent exister sur le filesystem.
