import { Module } from '@nestjs/common';
import { DatabaseSeeder } from './database.seeder';

@Module({
  providers: [DatabaseSeeder],
})
export class DatabaseModule {}
