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
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ReviewsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('reviews'), (0, common_1.Controller)('reviews')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createReview_decorators;
    let _getAllReviews_decorators;
    let _getReviewById_decorators;
    let _getListingReviews_decorators;
    let _deleteReview_decorators;
    var ReviewsController = _classThis = class {
        constructor(reviewsService) {
            this.reviewsService = (__runInitializers(this, _instanceExtraInitializers), reviewsService);
        }
        async createReview(user, body) {
            const review = await this.reviewsService.create(user.sub, body.listingId, body.rating, body.comment);
            return {
                message: 'Review post ho gaya',
                data: review,
            };
        }
        async getAllReviews() {
            const reviews = await this.reviewsService.findAll();
            return {
                message: 'Tamam reviews',
                data: reviews,
                count: reviews.length,
            };
        }
        async getReviewById(id) {
            const review = await this.reviewsService.findById(id);
            return {
                message: 'Review details',
                data: review,
            };
        }
        async getListingReviews(listingId) {
            const reviews = await this.reviewsService.getByListing(listingId);
            const avgRating = await this.reviewsService.getAverageRating(listingId);
            return {
                message: 'Listing ke reviews',
                data: reviews,
                averageRating: avgRating,
                count: reviews.length,
            };
        }
        async deleteReview(id, user) {
            await this.reviewsService.delete(id, user.sub);
            return {
                message: 'Review delete kar diya',
            };
        }
    };
    __setFunctionName(_classThis, "ReviewsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createReview_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        _getAllReviews_decorators = [(0, common_1.Get)()];
        _getReviewById_decorators = [(0, common_1.Get)(':id')];
        _getListingReviews_decorators = [(0, common_1.Get)('listing/:listingId')];
        _deleteReview_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
        __esDecorate(_classThis, null, _createReview_decorators, { kind: "method", name: "createReview", static: false, private: false, access: { has: obj => "createReview" in obj, get: obj => obj.createReview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllReviews_decorators, { kind: "method", name: "getAllReviews", static: false, private: false, access: { has: obj => "getAllReviews" in obj, get: obj => obj.getAllReviews }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getReviewById_decorators, { kind: "method", name: "getReviewById", static: false, private: false, access: { has: obj => "getReviewById" in obj, get: obj => obj.getReviewById }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getListingReviews_decorators, { kind: "method", name: "getListingReviews", static: false, private: false, access: { has: obj => "getListingReviews" in obj, get: obj => obj.getListingReviews }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteReview_decorators, { kind: "method", name: "deleteReview", static: false, private: false, access: { has: obj => "deleteReview" in obj, get: obj => obj.deleteReview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReviewsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReviewsController = _classThis;
})();
exports.ReviewsController = ReviewsController;
