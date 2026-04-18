import { ipcMain, BrowserWindow } from "electron";
import { IPC } from "@shared/ipc-contract";

import { publishDirect } from "@main/services/publish/direct.service";
import {
  getPresignedUrl,
  uploadToS3,
  publishPresigned,
} from "@main/services/publish/presigned.service";
import {
  listMyPublishedGames,
  updatePublishedGame,
  deletePublishedGame,
  createGameVersion,
} from "@main/services/publish/crud.service";

import type {
  PublishDirectParams,
  PresignParams,
  UploadToS3Params,
  PublishPresignedParams,
  UpdatePublishedGameParams,
  PublishVersionParams,
  UploadProgressEvent,
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
    (_e, args: UploadToS3Params & { kind: UploadProgressEvent["kind"] }) =>
      uploadToS3(args, args.kind, getWin),
  );

  ipcMain.handle(
    IPC.publish.publishPresigned,
    (_e, params: PublishPresignedParams) => publishPresigned(params),
  );

  ipcMain.handle(IPC.publish.update, (_e, params: UpdatePublishedGameParams) =>
    updatePublishedGame(params),
  );

  ipcMain.handle(IPC.publish.delete, (_e, gameId: string) =>
    deletePublishedGame(gameId),
  );

  ipcMain.handle(
    IPC.publish.createVersion,
    (_e, params: PublishVersionParams) => createGameVersion(params, getWin),
  );
}
