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
exports.CreateListingDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
let CreateListingDto = (() => {
    var _a;
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _address_decorators;
    let _address_initializers = [];
    let _address_extraInitializers = [];
    let _city_decorators;
    let _city_initializers = [];
    let _city_extraInitializers = [];
    let _rent_decorators;
    let _rent_initializers = [];
    let _rent_extraInitializers = [];
    let _area_decorators;
    let _area_initializers = [];
    let _area_extraInitializers = [];
    let _sqft_decorators;
    let _sqft_initializers = [];
    let _sqft_extraInitializers = [];
    let _deposit_decorators;
    let _deposit_initializers = [];
    let _deposit_extraInitializers = [];
    let _propertyType_decorators;
    let _propertyType_initializers = [];
    let _propertyType_extraInitializers = [];
    let _bedrooms_decorators;
    let _bedrooms_initializers = [];
    let _bedrooms_extraInitializers = [];
    let _bathrooms_decorators;
    let _bathrooms_initializers = [];
    let _bathrooms_extraInitializers = [];
    let _imageUrl_decorators;
    let _imageUrl_initializers = [];
    let _imageUrl_extraInitializers = [];
    return _a = class CreateListingDto {
            constructor() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.address = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _address_initializers, void 0));
                this.city = (__runInitializers(this, _address_extraInitializers), __runInitializers(this, _city_initializers, void 0));
                this.rent = (__runInitializers(this, _city_extraInitializers), __runInitializers(this, _rent_initializers, void 0));
                this.area = (__runInitializers(this, _rent_extraInitializers), __runInitializers(this, _area_initializers, void 0));
                this.sqft = (__runInitializers(this, _area_extraInitializers), __runInitializers(this, _sqft_initializers, void 0));
                this.deposit = (__runInitializers(this, _sqft_extraInitializers), __runInitializers(this, _deposit_initializers, void 0));
                this.propertyType = (__runInitializers(this, _deposit_extraInitializers), __runInitializers(this, _propertyType_initializers, void 0));
                this.bedrooms = (__runInitializers(this, _propertyType_extraInitializers), __runInitializers(this, _bedrooms_initializers, void 0));
                this.bathrooms = (__runInitializers(this, _bedrooms_extraInitializers), __runInitializers(this, _bathrooms_initializers, void 0));
                this.imageUrl = (__runInitializers(this, _bathrooms_extraInitializers), __runInitializers(this, _imageUrl_initializers, void 0));
                __runInitializers(this, _imageUrl_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, class_validator_1.IsString)()];
            _description_decorators = [(0, class_validator_1.IsString)()];
            _address_decorators = [(0, class_validator_1.IsString)()];
            _city_decorators = [(0, class_validator_1.IsString)()];
            _rent_decorators = [(0, class_validator_1.IsNumber)()];
            _area_decorators = [(0, class_validator_1.IsString)()];
            _sqft_decorators = [(0, class_validator_1.IsNumber)()];
            _deposit_decorators = [(0, class_validator_1.IsNumber)()];
            _propertyType_decorators = [(0, class_validator_1.IsEnum)(client_1.PropertyType)];
            _bedrooms_decorators = [(0, class_validator_1.IsNumber)()];
            _bathrooms_decorators = [(0, class_validator_1.IsNumber)()];
            _imageUrl_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _address_decorators, { kind: "field", name: "address", static: false, private: false, access: { has: obj => "address" in obj, get: obj => obj.address, set: (obj, value) => { obj.address = value; } }, metadata: _metadata }, _address_initializers, _address_extraInitializers);
            __esDecorate(null, null, _city_decorators, { kind: "field", name: "city", static: false, private: false, access: { has: obj => "city" in obj, get: obj => obj.city, set: (obj, value) => { obj.city = value; } }, metadata: _metadata }, _city_initializers, _city_extraInitializers);
            __esDecorate(null, null, _rent_decorators, { kind: "field", name: "rent", static: false, private: false, access: { has: obj => "rent" in obj, get: obj => obj.rent, set: (obj, value) => { obj.rent = value; } }, metadata: _metadata }, _rent_initializers, _rent_extraInitializers);
            __esDecorate(null, null, _area_decorators, { kind: "field", name: "area", static: false, private: false, access: { has: obj => "area" in obj, get: obj => obj.area, set: (obj, value) => { obj.area = value; } }, metadata: _metadata }, _area_initializers, _area_extraInitializers);
            __esDecorate(null, null, _sqft_decorators, { kind: "field", name: "sqft", static: false, private: false, access: { has: obj => "sqft" in obj, get: obj => obj.sqft, set: (obj, value) => { obj.sqft = value; } }, metadata: _metadata }, _sqft_initializers, _sqft_extraInitializers);
            __esDecorate(null, null, _deposit_decorators, { kind: "field", name: "deposit", static: false, private: false, access: { has: obj => "deposit" in obj, get: obj => obj.deposit, set: (obj, value) => { obj.deposit = value; } }, metadata: _metadata }, _deposit_initializers, _deposit_extraInitializers);
            __esDecorate(null, null, _propertyType_decorators, { kind: "field", name: "propertyType", static: false, private: false, access: { has: obj => "propertyType" in obj, get: obj => obj.propertyType, set: (obj, value) => { obj.propertyType = value; } }, metadata: _metadata }, _propertyType_initializers, _propertyType_extraInitializers);
            __esDecorate(null, null, _bedrooms_decorators, { kind: "field", name: "bedrooms", static: false, private: false, access: { has: obj => "bedrooms" in obj, get: obj => obj.bedrooms, set: (obj, value) => { obj.bedrooms = value; } }, metadata: _metadata }, _bedrooms_initializers, _bedrooms_extraInitializers);
            __esDecorate(null, null, _bathrooms_decorators, { kind: "field", name: "bathrooms", static: false, private: false, access: { has: obj => "bathrooms" in obj, get: obj => obj.bathrooms, set: (obj, value) => { obj.bathrooms = value; } }, metadata: _metadata }, _bathrooms_initializers, _bathrooms_extraInitializers);
            __esDecorate(null, null, _imageUrl_decorators, { kind: "field", name: "imageUrl", static: false, private: false, access: { has: obj => "imageUrl" in obj, get: obj => obj.imageUrl, set: (obj, value) => { obj.imageUrl = value; } }, metadata: _metadata }, _imageUrl_initializers, _imageUrl_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.CreateListingDto = CreateListingDto;
