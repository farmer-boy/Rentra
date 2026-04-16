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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
let ReviewsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ReviewsService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
        }
        async create(userId, listingId, rating, comment) {
            if (rating < 1 || rating > 5) {
                throw new common_1.BadRequestException('Rating 1 se 5 ke beech hona chahiye');
            }
            return await this.prisma.review.create({
                data: {
                    userId,
                    listingId,
                    rating,
                    comment,
                },
            });
        }
        async findAll() {
            return await this.prisma.review.findMany({
                include: {
                    user: { select: { id: true, fullName: true } },
                },
            });
        }
        async findById(id) {
            const review = await this.prisma.review.findUnique({
                where: { id },
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                },
            });
            if (!review)
                throw new common_1.BadRequestException('Review nahi mila');
            return review;
        }
        async getByListing(listingId) {
            return await this.prisma.review.findMany({
                where: { listingId },
                include: {
                    user: { select: { id: true, fullName: true } },
                },
            });
        }
        async getAverageRating(listingId) {
            const reviews = await this.prisma.review.findMany({
                where: { listingId },
            });
            if (reviews.length === 0)
                return 0;
            const total = reviews.reduce((sum, r) => sum + r.rating, 0);
            return (total / reviews.length).toFixed(2);
        }
        async delete(id, userId) {
            const review = await this.prisma.review.findUnique({ where: { id } });
            if (!review || review.userId !== userId) {
                throw new common_1.BadRequestException('Review delete nahi kar sakte');
            }
            return await this.prisma.review.delete({ where: { id } });
        }
    };
    __setFunctionName(_classThis, "ReviewsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReviewsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReviewsService = _classThis;
})();
exports.ReviewsService = ReviewsService;
