"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
exports.client = (0, openapi_fetch_1.default)({
    baseUrl: "https://fresh.nsuts.ru/nsuts-new/api/",
});
//# sourceMappingURL=client.js.map