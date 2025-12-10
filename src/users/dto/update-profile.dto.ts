import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProfileDto {
	@ApiProperty({
		example: 'John Doe',
		description: 'User name',
		required: false,
	})
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty({
		example: 'https://example.com/avatar.jpg',
		description: 'Avatar URL',
		required: false,
	})
	@IsOptional()
	@IsString()
	avatar?: string;

	@ApiProperty({
		example: 30,
		description:
			'Number of days before files are permanently deleted from trash (null to use system default)',
		required: false,
		nullable: true,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	trashRetentionDays?: number | null;
}
