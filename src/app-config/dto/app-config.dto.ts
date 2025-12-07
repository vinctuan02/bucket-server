import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateAppConfigDto {
	@ApiProperty({
		example: 30,
		description: 'Number of days before permanent deletion from trash',
	})
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	trashRetentionDays: number;
}

export class AppConfigResponseDto {
	@ApiProperty({
		example: 30,
		description: 'Number of days before permanent deletion from trash',
	})
	trashRetentionDays: number;
}
