"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UsersService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
        }
        async create(dto) {
            // Check if user already exists
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: dto.email },
                        { phone: dto.phone },
                        { cnic: dto.cnic },
                    ],
                },
            });
            if (existingUser) {
                throw new common_1.BadRequestException('User already exists with this email, phone, or CNIC');
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(dto.password, 10);
            return await this.prisma.user.create({
                data: {
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    email: dto.email,
                    phone: dto.phone,
                    cnic: dto.cnic,
                    password: hashedPassword,
                    role: dto.role || 'TENANT',
                    trustScore: dto.trustScore || 50,
                },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    cnic: true,
                    role: true,
                    trustScore: true,
                    isVerified: true,
                    isSuspended: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        }
        async findAll() {
            return await this.prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    trustScore: true,
                    isVerified: true,
                    isSuspended: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        }
        async findById(id) {
            const user = await this.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    cnic: true,
                    role: true,
                    trustScore: true,
                    isVerified: true,
                    isSuspended: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user) {
                throw new common_1.BadRequestException('User nahi mila');
            }
            return user;
        }
        async findByEmail(email) {
            return await this.prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    trustScore: true,
                    isVerified: true,
                    isSuspended: true,
                },
            });
        }
        async update(id, dto) {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new common_1.BadRequestException('User nahi mila');
            }
            // Check for unique constraints if email, phone, or cnic are being updated
            if (dto.email && dto.email !== user.email) {
                const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
                if (existingEmail) {
                    throw new common_1.BadRequestException('Email already exists');
                }
            }
            if (dto.phone && dto.phone !== user.phone) {
                const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
                if (existingPhone) {
                    throw new common_1.BadRequestException('Phone number already exists');
                }
            }
            if (dto.cnic && dto.cnic !== user.cnic) {
                const existingCnic = await this.prisma.user.findUnique({ where: { cnic: dto.cnic } });
                if (existingCnic) {
                    throw new common_1.BadRequestException('CNIC already exists');
                }
            }
            return await this.prisma.user.update({
                where: { id },
                data: {
                    firstName: dto.firstName ?? user.firstName,
                    lastName: dto.lastName ?? user.lastName,
                    email: dto.email ?? user.email,
                    phone: dto.phone ?? user.phone,
                    cnic: dto.cnic ?? user.cnic,
                    role: dto.role ?? user.role,
                    trustScore: dto.trustScore ?? user.trustScore,
                    isVerified: dto.isVerified ?? user.isVerified,
                    isSuspended: dto.isSuspended ?? user.isSuspended,
                },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    cnic: true,
                    role: true,
                    trustScore: true,
                    isVerified: true,
                    isSuspended: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        }
        async updateTrustScore(id, score) {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new common_1.BadRequestException('User nahi mila');
            }
            const newScore = Math.min(100, Math.max(0, user.trustScore + score));
            return await this.prisma.user.update({
                where: { id },
                data: { trustScore: newScore },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    trustScore: true,
                    updatedAt: true,
                },
            });
        }
        async suspend(id) {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new common_1.BadRequestException('User nahi mila');
            }
            return await this.prisma.user.update({
                where: { id },
                data: { isSuspended: true },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    isSuspended: true,
                    updatedAt: true,
                },
            });
        }
        async unsuspend(id) {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new common_1.BadRequestException('User nahi mila');
            }
            return await this.prisma.user.update({
                where: { id },
                data: { isSuspended: false },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    isSuspended: true,
                    updatedAt: true,
                },
            });
        }
        async verify(id) {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new common_1.BadRequestException('User nahi mila');
            }
            return await this.prisma.user.update({
                where: { id },
                data: { isVerified: true },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    isVerified: true,
                    updatedAt: true,
                },
            });
        }
        async delete(id) {
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                throw new common_1.BadRequestException('User nahi mila');
            }
            return await this.prisma.user.delete({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            });
        }
    };
    __setFunctionName(_classThis, "UsersService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersService = _classThis;
})();
exports.UsersService = UsersService;
