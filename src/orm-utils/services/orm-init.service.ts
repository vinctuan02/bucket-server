import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/permission/entities/permission.entity';
import { PermissionAction } from 'src/permission/enums/permission.enum';
import { RolePermission } from 'src/role-permission/entities/role-permission.entity';
import { Role } from 'src/role/entities/role.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { User } from 'src/users/entities/user.entity';
import { hashPass } from 'src/users/util/user.ulti';
import { Repository } from 'typeorm';

@Injectable()
export class OrmInitService implements OnModuleInit {
	private readonly logger = new Logger(OrmInitService.name);
	constructor(
		private readonly configService: ConfigService,

		@InjectRepository(User)
		private readonly userRepo: Repository<User>,

		@InjectRepository(UserRole)
		private readonly userRoleRepo: Repository<UserRole>,

		@InjectRepository(Role)
		private readonly roleRepo: Repository<Role>,

		@InjectRepository(Permission)
		private readonly permissionRepo: Repository<Permission>,

		@InjectRepository(RolePermission)
		private readonly rolePermissionRepo: Repository<RolePermission>,
	) {}

	async onModuleInit() {
		await this.initUser();
		await this.initRoles();
		await this.initPermissions();
		await this.initRolePermissions();
		await this.initializeUserRole();
	}

	private async initUser() {
		const count = await this.userRepo.count();

		if (count === 0) {
			this.logger.log('Init user');

			const password = await hashPass(
				this.configService.get<string>('DEFAULT_PASS')!,
			);

			const entity = this.userRepo.create({
				id: this.configService.get<string>('DEFAULT_USER_ID'),
				name: this.configService.get<string>('DEFAULT_NAME'),
				password,
				isActive: this.configService.get<boolean>('DEFAULT_IS_ACTIVE'),
				email: this.configService.get<string>('DEFAULT_EMAIL'),
			});

			return await this.userRepo.save(entity);
		}

		this.logger.log('Skip init user');
	}

	private async initRoles() {
		const count = await this.roleRepo.count();

		if (!count) {
			const entities = this.roleRepo.create(roles);

			await this.roleRepo.save(entities);
			this.logger.verbose('Roles initialization completed');
		} else {
			this.logger.verbose('Skip init roles');
		}
	}

	private async initPermissions() {
		const count = await this.permissionRepo.count();

		if (count === 0) {
			const entities = this.permissionRepo.create(permissions);

			await this.permissionRepo.save(entities);
			this.logger.log('Permissions initialized successfully');
		} else {
			this.logger.verbose('Skip init permissions');
		}
	}

	private async initRolePermissions() {
		const totalRolePermissions = await this.rolePermissionRepo.count();
		if (totalRolePermissions > 0) {
			this.logger.verbose('Skip init role-permissions');
			return;
		}

		const [rolesFromDatabase, permissionsFromDatabase] = await Promise.all([
			this.roleRepo.find(),
			this.permissionRepo.find(),
		]);

		if (
			rolesFromDatabase.length === 0 ||
			permissionsFromDatabase.length === 0
		) {
			this.logger.warn(
				'Cannot init role-permissions: missing roles or permissions',
			);
			return;
		}

		const adminRole = rolesFromDatabase.find(
			(role) => role.name === 'Admin',
		);
		const userRole = rolesFromDatabase.find((role) => role.name === 'User');
		const viewerRole = rolesFromDatabase.find(
			(role) => role.name === 'Viewer',
		);

		if (!adminRole) {
			this.logger.warn('Admin role not found, skip role-permission init');
			return;
		}

		if (!userRole) {
			this.logger.warn(
				'User role not found, skip user role-permission init',
			);
		}

		if (!viewerRole) {
			this.logger.warn(
				'Viewer role not found, skip viewer role-permission init',
			);
		}

		const adminRolePermissions = permissionsFromDatabase.map((permission) =>
			this.rolePermissionRepo.create({
				roleId: adminRole.id,
				permissionId: permission.id,
			}),
		);

		let userRolePermissions: RolePermission[] = [];
		if (userRole) {
			const userPermissions = permissionsFromDatabase.filter(
				(permission) =>
					(permission.resource === 'file' &&
						[
							PermissionAction.CREATE,
							PermissionAction.READ,
						].includes(permission.action)) ||
					(permission.resource === 'user' &&
						permission.action === PermissionAction.READ),
			);

			userRolePermissions = userPermissions.map((permission) =>
				this.rolePermissionRepo.create({
					roleId: userRole.id,
					permissionId: permission.id,
				}),
			);
		}

		let viewerRolePermissions: RolePermission[] = [];
		if (viewerRole) {
			const viewerPermissions = permissionsFromDatabase.filter(
				(permission) => permission.action === PermissionAction.READ,
			);

			viewerRolePermissions = viewerPermissions.map((permission) =>
				this.rolePermissionRepo.create({
					roleId: viewerRole.id,
					permissionId: permission.id,
				}),
			);
		}

		await this.rolePermissionRepo.save([
			...adminRolePermissions,
			...userRolePermissions,
			...viewerRolePermissions,
		]);

		this.logger.log('Role-Permissions initialized successfully');
	}

	private async initializeUserRole() {
		const user = await this.userRepo.findOne({
			where: { email: this.configService.get<string>('DEFAULT_EMAIL') },
		});
		const adminRole = await this.roleRepo.findOne({
			where: { name: 'Admin' },
		});

		if (!user || !adminRole) {
			this.logger.warn(
				'Cannot initialize user-role: missing user or admin role',
			);
			return;
		}

		const existingUserRole = await this.userRoleRepo.findOne({
			where: { userId: user.id, roleId: adminRole.id },
		});

		if (existingUserRole) {
			this.logger.verbose(
				'Skip initializing user-role (already assigned)',
			);
			return;
		}

		const userRoleEntity = this.userRoleRepo.create({
			userId: user.id,
			roleId: adminRole.id,
		});

		await this.userRoleRepo.save(userRoleEntity);

		this.logger.log('User-Role (Admin) initialized successfully');
	}
}

const permissions = [
	{
		name: 'Create User',
		action: PermissionAction.CREATE,
		resource: 'user',
		description: 'Allow creating new users',
	},
	{
		name: 'Read User',
		action: PermissionAction.READ,
		resource: 'user',
		description: 'Allow viewing user information',
	},
	{
		name: 'Update User',
		action: PermissionAction.UPDATE,
		resource: 'user',
		description: 'Allow editing user information',
	},
	{
		name: 'Delete User',
		action: PermissionAction.DELETE,
		resource: 'user',
		description: 'Allow deleting users',
	},

	// --- File management ---
	{
		name: 'Create File',
		action: PermissionAction.CREATE,
		resource: 'file',
		description: 'Allow uploading new files',
	},
	{
		name: 'Read File',
		action: PermissionAction.READ,
		resource: 'file',
		description: 'Allow viewing files',
	},
	{
		name: 'Update File',
		action: PermissionAction.UPDATE,
		resource: 'file',
		description: 'Allow renaming or updating files',
	},
	{
		name: 'Delete File',
		action: PermissionAction.DELETE,
		resource: 'file',
		description: 'Allow deleting files',
	},
];

const roles = [
	{
		name: 'Admin',
	},
	{
		name: 'User',
	},
	{
		name: 'Viewer',
	},
];
