import { setupServer } from "msw/node";
import { postsHandlers } from "./handlers/posts";
import { categoriesHandlers } from "./handlers/categories";
import { tagsHandlers } from "./handlers/tags";
import { uploadHandlers } from "./handlers/upload";
import { authHandlers } from "./handlers/auth";
import { canvaExportHandlers } from "./handlers/canva-export";

export const server = setupServer(
  ...postsHandlers,
  ...categoriesHandlers,
  ...tagsHandlers,
  ...uploadHandlers,
  ...authHandlers,
  ...canvaExportHandlers,
);
