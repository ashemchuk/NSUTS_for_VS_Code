"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = helloWorldHandler;
const vscode = __importStar(require("vscode"));
const client_1 = require("../api/client");
async function getAuthCookie(email, password) {
    const { response } = await client_1.client.POST("/login", {
        body: {
            email,
            password,
            method: "internal",
        },
    });
    const cookie = response.headers.getSetCookie().at(0);
    if (!cookie) {
        throw new Error("Auth cookie not found in server response");
    }
    return cookie;
}
async function helloWorldHandler() {
    const config = vscode.workspace.getConfiguration();
    const email = config.get("nsuts.email"), password = config.get("nsuts.password");
    if (!email || !password) {
        vscode.window.showErrorMessage("Email or password is not setted up!");
        return;
    }
    const cookie = await getAuthCookie(email, password);
    vscode.window.showInformationMessage(`Got cookie = ${cookie}`);
}
//# sourceMappingURL=helloWorld.js.map