import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateShareLinkDto {
	@IsUUID()
	fileNodeId: string;

	@IsOptional()
	@IsBoolean()
	canView?: boolean = true;

	@IsOptional()
	@IsBoolean()
	canEdit?: boolean = false;

	@IsOptional()
	@IsBoolean()
	canDownload?: boolean = true;
}

export class DeleteShareLinkDto {
	@IsUUID()
	id: string;
}

export class GetShareLinkDto {
	@IsString()
	token: string;
}
