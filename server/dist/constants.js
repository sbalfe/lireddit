"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORGET_PASSWORD_PREFIX = exports.COOKIE_NAME = exports.__prod__ = void 0;
/* this is true if we are in production mode */
exports.__prod__ = process.env.NODE_ENV === 'production';
exports.COOKIE_NAME = "qid";
exports.FORGET_PASSWORD_PREFIX = 'forget-password:';
