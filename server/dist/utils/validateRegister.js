"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
const validateRegister = (options) => {
    if (!options.email.includes('@')) {
        return [
            {
                field: 'email',
                message: 'invalid email'
            }
        ];
    }
    if (options.username.length <= 2) {
        return [{
                field: 'username',
                message: 'username too short, must be > 2'
            }
        ];
    }
    if (options.password.length <= 3) {
        return [
            {
                field: 'password',
                message: 'password too short, must be > 3'
            }
        ];
    }
    return null;
};
exports.validateRegister = validateRegister;
