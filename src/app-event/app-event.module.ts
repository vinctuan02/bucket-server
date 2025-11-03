import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FileNodeModule } from 'src/file-node/file-node.module';
import { AppEventConsumer } from './app-event.consumer';

@Module({
	imports: [EventEmitterModule.forRoot(), FileNodeModule],
	providers: [AppEventConsumer],
})
export class AppEventModule {}
