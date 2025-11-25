import * as vscode from 'vscode';

export const fileState = {
    selection: null as { files: vscode.Uri[] } | null,
    
    setCurrentSelection(files: vscode.Uri[]) {
        this.selection = files.length ? { files } : null;
    },
    
    getCurrentSelection() {
        return this.selection;
    },
    
    clearSelection() {
        this.selection = null;
    }
};