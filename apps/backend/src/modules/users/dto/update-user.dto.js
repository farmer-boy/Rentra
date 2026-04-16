"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var Role;
(function (Role) {
    Role["TENANT"] = "TENANT";
    Role["LANDLORD"] = "LANDLORD";
    Role["ADMIN"] = "ADMIN";
})(Role || (Role = {}));
let UpdateUserDto = (() => {
    var _a;
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _phone_decorators;
    let _phone_initializers = [];
    let _phone_extraInitializers = [];
    let _cnic_decorators;
    let _cnic_initializers = [];
    let _cnic_extraInitializers = [];
    let _role_decorators;
    let _role_initializers = [];
    let _role_extraInitializers = [];
    let _trustScore_decorators;
    let _trustScore_initializers = [];
    let _trustScore_extraInitializers = [];
    let _isVerified_decorators;
    let _isVerified_initializers = [];
    let _isVerified_extraInitializers = [];
    let _isSuspended_decorators;
    let _isSuspended_initializers = [];
    let _isSuspended_extraInitializers = [];
    return _a = class UpdateUserDto {
            constructor() {
                this.firstName = __runInitializers(this, _firstName_initializers, void 0);
                this.lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
                this.email = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.phone = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
                this.cnic = (__runInitializers(this, _phone_extraInitializers), __runInitializers(this, _cnic_initializers, void 0));
                this.role = (__runInitializers(this, _cnic_extraInitializers), __runInitializers(this, _role_initializers, void 0));
                this.trustScore = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _trustScore_initializers, void 0));
                this.isVerified = (__runInitializers(this, _trustScore_extraInitializers), __runInitializers(this, _isVerified_initializers, void 0));
                this.isSuspended = (__runInitializers(this, _isVerified_extraInitializers), __runInitializers(this, _isSuspended_initializers, void 0));
                __runInitializers(this, _isSuspended_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _firstName_decorators = [(0, swagger_1.ApiProperty)({ example: 'Ali', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _lastName_decorators = [(0, swagger_1.ApiProperty)({ example: 'Raza', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _email_decorators = [(0, swagger_1.ApiProperty)({ example: 'ali@example.com', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _phone_decorators = [(0, swagger_1.ApiProperty)({ example: '+923001234567', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _cnic_decorators = [(0, swagger_1.ApiProperty)({ example: '35202-1234567-1', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _role_decorators = [(0, swagger_1.ApiProperty)({ enum: Role, required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(Role)];
            _trustScore_decorators = [(0, swagger_1.ApiProperty)({ example: 75, minimum: 0, maximum: 100, required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100)];
            _isVerified_decorators = [(0, swagger_1.ApiProperty)({ example: true, required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _isSuspended_decorators = [(0, swagger_1.ApiProperty)({ example: false, required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
            __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: obj => "phone" in obj, get: obj => obj.phone, set: (obj, value) => { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
            __esDecorate(null, null, _cnic_decorators, { kind: "field", name: "cnic", static: false, private: false, access: { has: obj => "cnic" in obj, get: obj => obj.cnic, set: (obj, value) => { obj.cnic = value; } }, metadata: _metadata }, _cnic_initializers, _cnic_extraInitializers);
            __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: obj => "role" in obj, get: obj => obj.role, set: (obj, value) => { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
            __esDecorate(null, null, _trustScore_decorators, { kind: "field", name: "trustScore", static: false, private: false, access: { has: obj => "trustScore" in obj, get: obj => obj.trustScore, set: (obj, value) => { obj.trustScore = value; } }, metadata: _metadata }, _trustScore_initializers, _trustScore_extraInitializers);
            __esDecorate(null, null, _isVerified_decorators, { kind: "field", name: "isVerified", static: false, private: false, access: { has: obj => "isVerified" in obj, get: obj => obj.isVerified, set: (obj, value) => { obj.isVerified = value; } }, metadata: _metadata }, _isVerified_initializers, _isVerified_extraInitializers);
            __esDecorate(null, null, _isSuspended_decorators, { kind: "field", name: "isSuspended", static: false, private: false, access: { has: obj => "isSuspended" in obj, get: obj => obj.isSuspended, set: (obj, value) => { obj.isSuspended = value; } }, metadata: _metadata }, _isSuspended_initializers, _isSuspended_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.UpdateUserDto = UpdateUserDto;
