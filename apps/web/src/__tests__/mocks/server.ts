import { setupServer } from "msw/node";
import { postsHandlers } from "./handlers/posts";
import { categoriesHandlers } from "./handlers/categories";
import { tagsHandlers } from "./handlers/tags";
import { uploadHandlers } from "./handlers/upload";

export const server = setupServer(
  ...postsHandlers,
  ...categoriesHandlers,
  ...tagsHandlers,
  ...uploadHandlers,
);
