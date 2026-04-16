"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_response_dto_1 = require("./dto/user-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let UsersController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('users'), (0, common_1.Controller)('users')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createUser_decorators;
    let _getAllUsers_decorators;
    let _getUser_decorators;
    let _updateUser_decorators;
    let _updateUser_patch_decorators;
    let _updateTrustScore_decorators;
    let _suspendUser_decorators;
    let _unsuspendUser_decorators;
    let _verifyUser_decorators;
    let _deleteUser_decorators;
    var UsersController = _classThis = class {
        constructor(usersService) {
            this.usersService = (__runInitializers(this, _instanceExtraInitializers), usersService);
        }
        async createUser(dto) {
            const user = await this.usersService.create(dto);
            return {
                message: 'User create ho gaya',
                data: user,
            };
        }
        async getAllUsers() {
            const users = await this.usersService.findAll();
            return {
                message: 'Tamam users list',
                data: users,
                count: users.length,
            };
        }
        async getUser(id) {
            const user = await this.usersService.findById(id);
            return {
                message: 'User profile',
                data: user,
            };
        }
        async replaceUser(id, dto) {
            const user = await this.usersService.update(id, dto);
            return {
                message: 'User update ho gaya',
                data: user,
            };
        }
        async patchUser(id, dto) {
            const user = await this.usersService.update(id, dto);
            return {
                message: 'User update ho gaya',
                data: user,
            };
        }
        async updateTrustScore(id, body) {
            const user = await this.usersService.updateTrustScore(id, body.score);
            return {
                message: 'Trust score update ho gaya',
                data: user,
            };
        }
        async suspendUser(id) {
            const user = await this.usersService.suspend(id);
            return {
                message: 'User suspend kar diya gaya',
                data: user,
            };
        }
        async unsuspendUser(id) {
            const user = await this.usersService.unsuspend(id);
            return {
                message: 'User unsuspend kar diya gaya',
                data: user,
            };
        }
        async verifyUser(id) {
            const user = await this.usersService.verify(id);
            return {
                message: 'User verify kar diya gaya',
                data: user,
            };
        }
        async deleteUser(id) {
            const user = await this.usersService.delete(id);
            return {
                message: 'User delete kar diya gaya',
                data: user,
            };
        }
    };
    __setFunctionName(_classThis, "UsersController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createUser_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiResponse)({ status: 201, type: user_response_dto_1.UserResponseDto })];
        _getAllUsers_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiResponse)({ status: 200, type: [user_response_dto_1.UserResponseDto] })];
        _getUser_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiResponse)({ status: 200, type: user_response_dto_1.UserResponseDto })];
        _updateUser_decorators = [(0, common_1.Put)(':id'), (0, swagger_1.ApiResponse)({ status: 200, type: user_response_dto_1.UserResponseDto })];
        _updateUser_patch_decorators = [(0, common_1.Patch)(':id'), (0, swagger_1.ApiResponse)({ status: 200, type: user_response_dto_1.UserResponseDto })];
        _updateTrustScore_decorators = [(0, common_1.Patch)(':id/trust-score'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiResponse)({ status: 200, type: user_response_dto_1.UserResponseDto })];
        _suspendUser_decorators = [(0, common_1.Post)(':id/suspend'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiResponse)({ status: 200, type: user_response_dto_1.UserResponseDto })];
        _unsuspendUser_decorators = [(0, common_1.Post)(':id/unsuspend'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiResponse)({ status: 200, type: user_response_dto_1.UserResponseDto })];
        _verifyUser_decorators = [(0, common_1.Post)(':id/verify'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiResponse)({ status: 200, type: user_response_dto_1.UserResponseDto })];
        _deleteUser_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiResponse)({ status: 200, type: user_response_dto_1.UserResponseDto })];
        __esDecorate(_classThis, null, _createUser_decorators, { kind: "method", name: "createUser", static: false, private: false, access: { has: obj => "createUser" in obj, get: obj => obj.createUser }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllUsers_decorators, { kind: "method", name: "getAllUsers", static: false, private: false, access: { has: obj => "getAllUsers" in obj, get: obj => obj.getAllUsers }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUser_decorators, { kind: "method", name: "getUser", static: false, private: false, access: { has: obj => "getUser" in obj, get: obj => obj.getUser }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateUser_decorators, { kind: "method", name: "replaceUser", static: false, private: false, access: { has: obj => "replaceUser" in obj, get: obj => obj.replaceUser }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateUser_patch_decorators, { kind: "method", name: "patchUser", static: false, private: false, access: { has: obj => "patchUser" in obj, get: obj => obj.patchUser }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateTrustScore_decorators, { kind: "method", name: "updateTrustScore", static: false, private: false, access: { has: obj => "updateTrustScore" in obj, get: obj => obj.updateTrustScore }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _suspendUser_decorators, { kind: "method", name: "suspendUser", static: false, private: false, access: { has: obj => "suspendUser" in obj, get: obj => obj.suspendUser }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _unsuspendUser_decorators, { kind: "method", name: "unsuspendUser", static: false, private: false, access: { has: obj => "unsuspendUser" in obj, get: obj => obj.unsuspendUser }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyUser_decorators, { kind: "method", name: "verifyUser", static: false, private: false, access: { has: obj => "verifyUser" in obj, get: obj => obj.verifyUser }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteUser_decorators, { kind: "method", name: "deleteUser", static: false, private: false, access: { has: obj => "deleteUser" in obj, get: obj => obj.deleteUser }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersController = _classThis;
})();
exports.UsersController = UsersController;
