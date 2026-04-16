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
exports.DisputesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let DisputesController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('disputes'), (0, common_1.Controller)('disputes')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createDispute_decorators;
    let _getAllDisputes_decorators;
    let _getDisputeById_decorators;
    let _resolveDispute_decorators;
    let _closeDispute_decorators;
    var DisputesController = _classThis = class {
        constructor(disputesService) {
            this.disputesService = (__runInitializers(this, _instanceExtraInitializers), disputesService);
        }
        async createDispute(user, body) {
            const dispute = await this.disputesService.create(user.sub, body.agreementId, body.title, body.description);
            return {
                message: 'Dispute file ho gaya',
                data: dispute,
            };
        }
        async getAllDisputes() {
            const disputes = await this.disputesService.findAll();
            return {
                message: 'Tamam disputes',
                data: disputes,
                count: disputes.length,
            };
        }
        async getDisputeById(id) {
            const dispute = await this.disputesService.findById(id);
            return {
                message: 'Dispute details',
                data: dispute,
            };
        }
        async resolveDispute(id, body) {
            const dispute = await this.disputesService.resolve(id, body.resolution);
            return {
                message: 'Dispute resolve ho gaya',
                data: dispute,
            };
        }
        async closeDispute(id) {
            const dispute = await this.disputesService.close(id);
            return {
                message: 'Dispute close kar diya',
                data: dispute,
            };
        }
    };
    __setFunctionName(_classThis, "DisputesController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createDispute_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getAllDisputes_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getDisputeById_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _resolveDispute_decorators = [(0, common_1.Patch)(':id/resolve'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _closeDispute_decorators = [(0, common_1.Patch)(':id/close'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        __esDecorate(_classThis, null, _createDispute_decorators, { kind: "method", name: "createDispute", static: false, private: false, access: { has: obj => "createDispute" in obj, get: obj => obj.createDispute }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllDisputes_decorators, { kind: "method", name: "getAllDisputes", static: false, private: false, access: { has: obj => "getAllDisputes" in obj, get: obj => obj.getAllDisputes }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDisputeById_decorators, { kind: "method", name: "getDisputeById", static: false, private: false, access: { has: obj => "getDisputeById" in obj, get: obj => obj.getDisputeById }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resolveDispute_decorators, { kind: "method", name: "resolveDispute", static: false, private: false, access: { has: obj => "resolveDispute" in obj, get: obj => obj.resolveDispute }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _closeDispute_decorators, { kind: "method", name: "closeDispute", static: false, private: false, access: { has: obj => "closeDispute" in obj, get: obj => obj.closeDispute }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DisputesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DisputesController = _classThis;
})();
exports.DisputesController = DisputesController;
