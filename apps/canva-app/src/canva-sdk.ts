import { exportContent } from "@canva/design";

export type ExportResult = {
  title: string;
  exportBlobs: { url: string }[];
};

export const canvaSDK = {
  exportContent: (options: {
    acceptedFileTypes: string[];
  }): Promise<ExportResult> => exportContent(options) as Promise<ExportResult>,
};
