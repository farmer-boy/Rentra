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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let PaymentsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('payments'), (0, common_1.Controller)('payments')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createPayment_decorators;
    let _getAllPayments_decorators;
    let _getPaymentById_decorators;
    let _completePayment_decorators;
    let _failPayment_decorators;
    let _getMyPayments_decorators;
    var PaymentsController = _classThis = class {
        constructor(paymentsService) {
            this.paymentsService = (__runInitializers(this, _instanceExtraInitializers), paymentsService);
        }
        async createPayment(user, body) {
            const payment = await this.paymentsService.create(user.sub, body.amount, body.method, body.agreementId);
            return {
                message: 'Payment create ho gaya',
                data: payment,
            };
        }
        async getAllPayments() {
            const payments = await this.paymentsService.findAll();
            return {
                message: 'Tamam payments',
                data: payments,
                count: payments.length,
            };
        }
        async getPaymentById(id) {
            const payment = await this.paymentsService.findById(id);
            return {
                message: 'Payment details',
                data: payment,
            };
        }
        async completePayment(id) {
            const payment = await this.paymentsService.complete(id);
            return {
                message: 'Payment complete ho gaya',
                data: payment,
            };
        }
        async failPayment(id) {
            const payment = await this.paymentsService.fail(id);
            return {
                message: 'Payment fail ho gaya',
                data: payment,
            };
        }
        async getMyPayments(user) {
            const payments = await this.paymentsService.getByTenant(user.sub);
            return {
                message: 'Aapki payments',
                data: payments,
                count: payments.length,
            };
        }
    };
    __setFunctionName(_classThis, "PaymentsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createPayment_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getAllPayments_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getPaymentById_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _completePayment_decorators = [(0, common_1.Patch)(':id/complete'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _failPayment_decorators = [(0, common_1.Patch)(':id/fail'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getMyPayments_decorators = [(0, common_1.Get)('tenant/my-payments'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        __esDecorate(_classThis, null, _createPayment_decorators, { kind: "method", name: "createPayment", static: false, private: false, access: { has: obj => "createPayment" in obj, get: obj => obj.createPayment }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllPayments_decorators, { kind: "method", name: "getAllPayments", static: false, private: false, access: { has: obj => "getAllPayments" in obj, get: obj => obj.getAllPayments }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPaymentById_decorators, { kind: "method", name: "getPaymentById", static: false, private: false, access: { has: obj => "getPaymentById" in obj, get: obj => obj.getPaymentById }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _completePayment_decorators, { kind: "method", name: "completePayment", static: false, private: false, access: { has: obj => "completePayment" in obj, get: obj => obj.completePayment }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _failPayment_decorators, { kind: "method", name: "failPayment", static: false, private: false, access: { has: obj => "failPayment" in obj, get: obj => obj.failPayment }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyPayments_decorators, { kind: "method", name: "getMyPayments", static: false, private: false, access: { has: obj => "getMyPayments" in obj, get: obj => obj.getMyPayments }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PaymentsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PaymentsController = _classThis;
})();
exports.PaymentsController = PaymentsController;
