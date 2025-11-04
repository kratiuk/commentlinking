/**
 * Global function declarations for VS Code extension environment
 */

declare global {
  function setInterval(
    handler: (...args: any[]) => void,
    timeout?: number,
    ...args: any[]
  ): any;

  function clearInterval(handle: any): void;

  function setTimeout(
    handler: (...args: any[]) => void,
    timeout?: number,
    ...args: any[]
  ): any;

  function clearTimeout(handle: any): void;
}

/**
 * Common types for the extension
 */

import { AnchorTreeItem } from "../tree/AnchorTreeItem";
import { FileTreeItem } from "../tree/FileTreeItem";

export type TreeNode = FileTreeItem | AnchorTreeItem;
