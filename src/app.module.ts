import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { User } from './auth/entities/user.entity';
import { Service } from './services/entities/service.entity';
import { Booking } from './bookings/entities/booking.entity';


@Controller()
export class AppController {
  @Get()
  getHome() {
    return {
      status: 'success',
      message: 'Welcome to the Booking Platform API!',
      documentation: '/api/docs',
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE') || 'sqlite';

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST') || 'localhost',
            port: configService.get<number>('DB_PORT') || 5432,
            username: configService.get<string>('DB_USERNAME') || 'postgres',
            password: configService.get<string>('DB_PASSWORD') || 'postgres',
            database: configService.get<string>('DB_NAME') || 'booking_platform',
            entities: [User, Service, Booking],
            synchronize: true, // Auto-create tables in dev. For migrations, we use standard flows.
          };
        }

        // Default to SQLite
        return {
          type: 'sqlite',
          database: configService.get<string>('DB_DATABASE') || 'database.sqlite',
          entities: [User, Service, Booking],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    ServicesModule,
    BookingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
