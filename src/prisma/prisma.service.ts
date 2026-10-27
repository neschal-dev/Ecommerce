import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { db } from './db.js';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  readonly db = db;
  readonly orm: typeof db.orm.public = db.orm.public;

  async onModuleInit() {
    try {
      await this.orm.User.limit(1).first();

      this.logger.log('💖 Database Connected!');
    } catch (error) {
      this.logger.error(
        '😢 Database connection failed',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
  
  async onModuleDestroy() {
    await db.close();
  }
}
