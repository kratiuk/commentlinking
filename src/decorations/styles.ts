import * as vscode from 'vscode';

export interface DecorationsBundle {
    anchorTextDecoration: vscode.TextEditorDecorationType;
    anchorTextActiveDecoration: vscode.TextEditorDecorationType;
    linkTextDecoration: vscode.TextEditorDecorationType;
    linkTextActiveDecoration: vscode.TextEditorDecorationType;
    hiddenDecoration: vscode.TextEditorDecorationType;
}

export function createDecorationTypes(context: vscode.ExtensionContext): DecorationsBundle {
    const anchorTextDecoration = vscode.window.createTextEditorDecorationType({
        fontWeight: '600',
        color: new vscode.ThemeColor('charts.green'),
        after: {
            contentText: '⚓',
            color: new vscode.ThemeColor('charts.green'),
            margin: '0 0 0 .35em'
        }
    });

    const anchorTextActiveDecoration = vscode.window.createTextEditorDecorationType({
        fontWeight: '600',
        color: new vscode.ThemeColor('foreground')
    });

    const linkTextDecoration = vscode.window.createTextEditorDecorationType({
        fontWeight: '600',
        color: new vscode.ThemeColor('charts.blue'),
        after: {
            contentText: '🔗',
            color: new vscode.ThemeColor('charts.blue'),
            margin: '0 0 0 .35em'
        }
    });

    const linkTextActiveDecoration = vscode.window.createTextEditorDecorationType({
        fontWeight: '600',
        color: new vscode.ThemeColor('foreground')
    });

    const hiddenDecoration = vscode.window.createTextEditorDecorationType({
        textDecoration: 'none; opacity:0; font-size:0; letter-spacing:-1em'
    });

    context.subscriptions.push(
        anchorTextDecoration,
        anchorTextActiveDecoration,
        linkTextDecoration,
        linkTextActiveDecoration,
        hiddenDecoration
    );

    return {
        anchorTextDecoration,
        anchorTextActiveDecoration,
        linkTextDecoration,
        linkTextActiveDecoration,
        hiddenDecoration,
    };
}


