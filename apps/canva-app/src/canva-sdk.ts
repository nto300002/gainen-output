import { requestExport } from "@canva/design";

export type ExportResult =
  | { status: "completed"; title?: string; exportBlobs: { url: string }[] }
  | { status: "aborted" };

export const canvaSDK = {
  requestExport: (options: {
    acceptedFileTypes: string[];
  }): Promise<ExportResult> => requestExport(options) as Promise<ExportResult>,
};
