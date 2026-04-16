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
exports.ListingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ListingsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('listings'), (0, common_1.Controller)('listings')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createListing_decorators;
    let _getAllListings_decorators;
    let _getListingById_decorators;
    let _updateListing_decorators;
    let _deleteListing_decorators;
    let _getMyListings_decorators;
    var ListingsController = _classThis = class {
        constructor(listingsService) {
            this.listingsService = (__runInitializers(this, _instanceExtraInitializers), listingsService);
        }
        async createListing(user, dto) {
            const listing = await this.listingsService.create(user.sub, dto);
            return {
                message: 'Listing publish ho gaya',
                data: listing,
            };
        }
        async getAllListings(city, type) {
            const listings = await this.listingsService.findAll({
                city,
                propertyType: type,
            });
            return {
                message: 'Tamam listings',
                data: listings,
                count: listings.length,
            };
        }
        async getListingById(id) {
            const listing = await this.listingsService.findById(id);
            return {
                message: 'Listing details',
                data: listing,
            };
        }
        async updateListing(id, user, dto) {
            const listing = await this.listingsService.update(id, user.sub, dto);
            return {
                message: 'Listing update ho gaya',
                data: listing,
            };
        }
        async deleteListing(id, user) {
            await this.listingsService.delete(id, user.sub);
            return {
                message: 'Listing delete ho gaya',
            };
        }
        async getMyListings(user) {
            const listings = await this.listingsService.getByLandlord(user.sub);
            return {
                message: 'Aapki listings',
                data: listings,
                count: listings.length,
            };
        }
    };
    __setFunctionName(_classThis, "ListingsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createListing_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getAllListings_decorators = [(0, common_1.Get)()];
        _getListingById_decorators = [(0, common_1.Get)(':id')];
        _updateListing_decorators = [(0, common_1.Patch)(':id'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _deleteListing_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getMyListings_decorators = [(0, common_1.Get)('landlord/my-listings'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        __esDecorate(_classThis, null, _createListing_decorators, { kind: "method", name: "createListing", static: false, private: false, access: { has: obj => "createListing" in obj, get: obj => obj.createListing }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllListings_decorators, { kind: "method", name: "getAllListings", static: false, private: false, access: { has: obj => "getAllListings" in obj, get: obj => obj.getAllListings }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getListingById_decorators, { kind: "method", name: "getListingById", static: false, private: false, access: { has: obj => "getListingById" in obj, get: obj => obj.getListingById }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateListing_decorators, { kind: "method", name: "updateListing", static: false, private: false, access: { has: obj => "updateListing" in obj, get: obj => obj.updateListing }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteListing_decorators, { kind: "method", name: "deleteListing", static: false, private: false, access: { has: obj => "deleteListing" in obj, get: obj => obj.deleteListing }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyListings_decorators, { kind: "method", name: "getMyListings", static: false, private: false, access: { has: obj => "getMyListings" in obj, get: obj => obj.getMyListings }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ListingsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ListingsController = _classThis;
})();
exports.ListingsController = ListingsController;
