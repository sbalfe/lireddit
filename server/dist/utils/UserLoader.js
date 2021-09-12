"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCreatorLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
// [1, 78, 7, 9] 
// returns user for each one of the keys [user y, user b, user c, user d]
const createCreatorLoader = () => new dataloader_1.default(keys => {
});
exports.createCreatorLoader = createCreatorLoader;
