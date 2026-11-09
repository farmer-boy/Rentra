import * as path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { AgreementsModule } from './modules/agreements/agreements.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ContactModule } from './modules/contact/contact.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AdminModule } from './modules/admin/admin.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { SavedSearchesModule } from './modules/saved-searches/saved-searches.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RentalRequestsModule } from './modules/rental-requests/rental-requests.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { TrustScoreModule } from './modules/trust-score/trust-score.module';
import { ReportsModule } from './modules/reports/reports.module';
import { VerificationModule } from './modules/verification/verification.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { BoostModule } from './modules/boost/boost.module';
import { SupportModule } from './modules/support/support.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Prefer the workspace root .env so backend-local blank placeholders cannot mask it.
      envFilePath: [
        path.resolve(__dirname, '../../../.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'apps/backend/.env'),
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '../.env'),
        '.env.neon.local',
        '.env',
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    AgreementsModule,
    PaymentsModule,
    DisputesModule,
    ReviewsModule,
    ContactModule,
    MessagesModule,
    AdminModule,
    FavoritesModule,
    LocationsModule,
    PropertiesModule,
    SavedSearchesModule,
    NotificationsModule,
    RentalRequestsModule,
    BookingsModule,
    TrustScoreModule,
    ReportsModule,
    VerificationModule,
    RecommendationsModule,
    BoostModule,
    SupportModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
