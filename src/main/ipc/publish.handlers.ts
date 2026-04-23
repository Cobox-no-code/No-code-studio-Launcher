import { IPC } from "@shared/ipc-contract";
import { BrowserWindow, ipcMain } from "electron";

import {
  createGameVersion,
  deletePublishedGame,
  listMyPublishedGames,
  updatePublishedGame,
} from "@main/services/publish/crud.service";
import { publishDirect } from "@main/services/publish/direct.service";
import {
  getPresignedUrl,
  publishPresigned,
  uploadToS3,
} from "@main/services/publish/presigned.service";

import { stageThumbnailBytes } from "@main/services/publish/staging";
import type {
  PresignParams,
  PublishDirectParams,
  PublishPresignedParams,
  PublishVersionParams,
  UpdatePublishedGameParams,
  UploadProgressEvent,
  UploadToS3Params,
} from "@shared/types/publish";

export function registerPublishHandlers(getWin: () => BrowserWindow | null) {
  ipcMain.handle(IPC.publish.listMine, () => listMyPublishedGames());

  ipcMain.handle(IPC.publish.publishDirect, (_e, params: PublishDirectParams) =>
    publishDirect(params, getWin),
  );

  ipcMain.handle(IPC.publish.presign, (_e, params: PresignParams) =>
    getPresignedUrl(params),
  );
  ipcMain.handle(
    IPC.publish.uploadToS3,
    (_e, args: UploadToS3Params & { kind: UploadProgressEvent["kind"] }) => {
      const { kind, ...params } = args;
      return uploadToS3(params, kind, getWin);
    },
  );

  ipcMain.handle(
    IPC.publish.publishPresigned,
    (_e, params: PublishPresignedParams) => publishPresigned(params),
  );

  ipcMain.handle(IPC.publish.update, (_e, params: UpdatePublishedGameParams) =>
    updatePublishedGame(params, getWin),
  );

  ipcMain.handle(IPC.publish.delete, (_e, gameId: string) =>
    deletePublishedGame(gameId),
  );

  ipcMain.handle(
    IPC.publish.createVersion,
    (_e, params: PublishVersionParams) => createGameVersion(params, getWin),
  );
  ipcMain.handle(
    IPC.publish.stageThumbnail,
    (
      _e,
      params: {
        bytes: Uint8Array;
        originalName: string;
        mimeType: string;
      },
    ) => stageThumbnailBytes(params),
  );
}
