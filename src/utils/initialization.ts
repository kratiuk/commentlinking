import * as vscode from "vscode";

import { AnchorsTreeDataProvider } from "../anchors/AnchorsTreeDataProvider";
import messages from "../constants/messages";

/**
 * Starts initial indexing (wrapper with error handling)
 */
export const kickoff = async (provider: AnchorsTreeDataProvider) => {
  try {
    // Start main indexing process
    await provider.debouncedRebuild();
  } catch (error) {
    vscode.window.showErrorMessage(
      messages.indexingError.replace(
        "{error}",
        error instanceof Error ? error.message : messages.unknownError
      )
    );
  }
};
