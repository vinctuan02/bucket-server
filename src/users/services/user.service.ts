import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { AppEventType } from 'src/app-event/enum/app-event.enum';
import { UploadPurpose } from 'src/bucket/enum/bucket.enum';
import { BucketService } from 'src/bucket/services/bucket.service';
import { PageDto } from 'src/common/dto/common.response-dto';
import { UserRoleService } from 'src/user-role/services/user-role.service';
import { Repository } from 'typeorm';
import { CreateUserDto, GetListUserDto, UpdateUserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { hashPass } from '../util/user.ulti';
import { UserQueryService } from './user.query.service';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,

		private readonly userQueryService: UserQueryService,
		private readonly userRolesService: UserRoleService,
		private readonly eventEmitter: EventEmitter2,
		private readonly bucketService: BucketService,
		private readonly configService: ConfigService,
	) {}

	async handleCreate(dto: CreateUserDto) {
		const { userRoles, ...rest } = dto;

		const user = await this.create(rest);
		await Promise.all(
			userRoles.map((item) =>
				this.userRolesService.createSafe({
					roleId: item.roleId,
					userId: user.id,
				}),
			),
		);

		return await this.findOneWithPermissions(user.id);
	}

	async create(input: Omit<CreateUserDto, 'userRoles'>): Promise<User> {
		const { password, email } = input;
		await this.userQueryService.ensureEmailNotExists(email);
		input.password = password ? await hashPass(password) : null;
		const user = await this.userQueryService.create(input);
		this.eventEmitter.emit(AppEventType.USER_CREATED, user.id);
		return user;
	}

	async activeAccount(id: string): Promise<User> {
		const user = await this.findOne(id);
		user.isActive = true;
		return this.userRepo.save(user);
	}

	async getList(query: GetListUserDto) {
		const { page, pageSize } = query;

		const { items, totalItems } =
			await this.userQueryService.getList(query);

		return new PageDto({
			items,
			metadata: { totalItems, pageSize, page },
		});
	}

	async getListSimple(query: GetListUserDto) {
		const { page, pageSize } = query;

		const { items, totalItems } =
			await this.userQueryService.getListSimple(query);

		return new PageDto({
			items,
			metadata: { totalItems, pageSize, page },
		});
	}

	async findOne(id: string) {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) throw new NotFoundException(`User ${id} not found`);
		return user;
	}

	async findOneWithPermissions(id: string) {
		return await this.userQueryService.findOneWithPermissions(id);
	}

	async findByEmail(email: string) {
		return this.userRepo.findOne({ where: { email } });
	}

	async update(id: string, dto: UpdateUserDto): Promise<User> {
		const { userRoles, ...rest } = dto;

		rest.password = rest.password
			? await hashPass(rest.password)
			: rest.password;

		const user = await this.findOne(id);
		Object.assign(user, rest);

		await this.userRepo.save(user);
		await this.userRolesService.deleteByUserId(user.id);

		if (userRoles?.length) {
			await Promise.all(
				userRoles.map((item) =>
					this.userRolesService.createSafe({
						roleId: item.roleId,
						userId: user.id,
					}),
				),
			);
		}

		return await this.findOneWithPermissions(user.id);
	}

	async remove(id: string): Promise<void> {
		await this.eventEmitter.emitAsync(AppEventType.USER_DELETE, id);
		await this.userRepo.delete(id);
	}

	async updateProfile(
		userId: string,
		dto: Partial<{
			name: string;
			avatar: string;
			trashRetentionDays: number | null;
		}>,
	): Promise<User> {
		const user = await this.findOne(userId);

		// Only update provided fields
		if (dto.name !== undefined) {
			user.name = dto.name;
		}
		if (dto.avatar !== undefined) {
			user.avatar = dto.avatar;
		}
		if (dto.trashRetentionDays !== undefined) {
			user.trashRetentionDays = dto.trashRetentionDays;
		}

		return await this.userRepo.save(user);
	}

	async getAvatarUploadUrl(fileMetadata: {
		fileName: string;
		fileSize: number;
		contentType: string;
	}): Promise<{ uploadUrl: string; avatarUrl: string }> {
		const { fileName, fileSize, contentType } = fileMetadata;

		// Get upload URL for public bucket
		const { uploadUrl, key } = await this.bucketService.getUploadUrl({
			fileName,
			fileSize,
			contentType,
			extension: fileName.split('.').pop() || '',
			folderBucket: { uploadPurpose: UploadPurpose.CASE_1 },
			isPublic: true, // Upload to public bucket
		});

		// Construct public URL
		const minioEndpoint = this.configService.get<string>('MINIO_HOST');
		const minioPort = this.configService.get<string>('MINIO_PORT');
		const bucketName = 'public';

		const avatarUrl = `http://${minioEndpoint}:${minioPort}/${bucketName}/${key}`;

		return {
			uploadUrl: uploadUrl ?? '',
			avatarUrl,
		};
	}
}
