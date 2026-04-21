"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Global prefix
    app.setGlobalPrefix('api');
    // CORS - Allow localhost on any port for development
    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:5175',
                'http://localhost:5176',
                'http://localhost:5177',
                'http://localhost:5178',
                'http://localhost:5179',
                'http://localhost:5180',
                'http://localhost:5181',
                'http://localhost:5182',
                'http://localhost:5183',
                'http://localhost:5184',
                'http://localhost:5185',
                'http://localhost:5186',
            ];
            const isAllowed = !origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin || '');
            if (isAllowed) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    });
    // Global Validation
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // Swagger Documentation
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Rentra API')
        .setDescription('Pakistan ka pehla AI-powered transparent rental platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`
  🚀 Rentra Backend chal raha hai!
  📡 API: http://localhost:${port}/api
  📖 Swagger Docs: http://localhost:${port}/api/docs
  `);
}
void bootstrap();
