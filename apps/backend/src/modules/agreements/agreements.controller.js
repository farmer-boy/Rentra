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
exports.AgreementsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AgreementsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('agreements'), (0, common_1.Controller)('agreements')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createAgreement_decorators;
    let _getAllAgreements_decorators;
    let _getAgreementById_decorators;
    let _approveAgreement_decorators;
    let _rejectAgreement_decorators;
    let _terminateAgreement_decorators;
    var AgreementsController = _classThis = class {
        constructor(agreementsService) {
            this.agreementsService = (__runInitializers(this, _instanceExtraInitializers), agreementsService);
        }
        async createAgreement(body) {
            const agreement = await this.agreementsService.create(body.tenantId, body.landlordId, body.listingId, body.rent, body.deposit, body.startDate, body.endDate);
            return {
                message: 'Agreement create ho gaya',
                data: agreement,
            };
        }
        async getAllAgreements() {
            const agreements = await this.agreementsService.findAll();
            return {
                message: 'Tamam agreements',
                data: agreements,
                count: agreements.length,
            };
        }
        async getAgreementById(id) {
            const agreement = await this.agreementsService.findById(id);
            return {
                message: 'Agreement details',
                data: agreement,
            };
        }
        async approveAgreement(id) {
            const agreement = await this.agreementsService.approve(id);
            return {
                message: 'Agreement approve ho gaya',
                data: agreement,
            };
        }
        async rejectAgreement(id) {
            const agreement = await this.agreementsService.reject(id);
            return {
                message: 'Agreement reject kar diya',
                data: agreement,
            };
        }
        async terminateAgreement(id) {
            const agreement = await this.agreementsService.terminate(id);
            return {
                message: 'Agreement terminate kar diya',
                data: agreement,
            };
        }
    };
    __setFunctionName(_classThis, "AgreementsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createAgreement_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getAllAgreements_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getAgreementById_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _approveAgreement_decorators = [(0, common_1.Patch)(':id/approve'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _rejectAgreement_decorators = [(0, common_1.Patch)(':id/reject'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _terminateAgreement_decorators = [(0, common_1.Patch)(':id/terminate'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        __esDecorate(_classThis, null, _createAgreement_decorators, { kind: "method", name: "createAgreement", static: false, private: false, access: { has: obj => "createAgreement" in obj, get: obj => obj.createAgreement }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllAgreements_decorators, { kind: "method", name: "getAllAgreements", static: false, private: false, access: { has: obj => "getAllAgreements" in obj, get: obj => obj.getAllAgreements }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAgreementById_decorators, { kind: "method", name: "getAgreementById", static: false, private: false, access: { has: obj => "getAgreementById" in obj, get: obj => obj.getAgreementById }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approveAgreement_decorators, { kind: "method", name: "approveAgreement", static: false, private: false, access: { has: obj => "approveAgreement" in obj, get: obj => obj.approveAgreement }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _rejectAgreement_decorators, { kind: "method", name: "rejectAgreement", static: false, private: false, access: { has: obj => "rejectAgreement" in obj, get: obj => obj.rejectAgreement }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _terminateAgreement_decorators, { kind: "method", name: "terminateAgreement", static: false, private: false, access: { has: obj => "terminateAgreement" in obj, get: obj => obj.terminateAgreement }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgreementsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgreementsController = _classThis;
})();
exports.AgreementsController = AgreementsController;
