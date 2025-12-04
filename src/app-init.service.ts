import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEventType } from 'src/app-event/enum/app-event.enum';
import { Permission } from 'src/permission/entities/permission.entity';
import { PermissionAction } from 'src/permission/enums/permission.enum';
import { RolePermission } from 'src/role-permission/entities/role-permission.entity';
import { Role } from 'src/role/entities/role.entity';
import { Plan } from 'src/subscription/entities/plan.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { User } from 'src/users/entities/user.entity';
import { hashPass } from 'src/users/util/user.ulti';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AppInitService implements OnApplicationBootstrap {
	private readonly logger = new Logger(AppInitService.name);
	private readonly userRepo: Repository<User>;
	private readonly userRoleRepo: Repository<UserRole>;
	private readonly roleRepo: Repository<Role>;
	private readonly permissionRepo: Repository<Permission>;
	private readonly rolePermissionRepo: Repository<RolePermission>;
	private readonly planRepo: Repository<Plan>;

	constructor(
		private readonly configService: ConfigService,
		private readonly dataSource: DataSource,
		private readonly eventEmitter: EventEmitter2,
	) {
		this.userRepo = this.dataSource.getRepository(User);
		this.userRoleRepo = this.dataSource.getRepository(UserRole);
		this.roleRepo = this.dataSource.getRepository(Role);
		this.permissionRepo = this.dataSource.getRepository(Permission);
		this.rolePermissionRepo = this.dataSource.getRepository(RolePermission);
		this.planRepo = this.dataSource.getRepository(Plan);
	}

	async onApplicationBootstrap() {
		await this.initUser();
		await this.initRoles();
		await this.initPermissions();
		await this.initRolePermissions();
		await this.initializeUserRole();
		await this.initPlans();
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

			const user = await this.userRepo.save(entity);
			this.eventEmitter.emit(AppEventType.USER_CREATED, user.id);
			return user;
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
		const saleRole = rolesFromDatabase.find((role) => role.name === 'Sale');

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

		if (!saleRole) {
			this.logger.warn(
				'Sale role not found, skip sale role-permission init',
			);
		}

		// Admin: all permissions
		const adminRolePermissions = permissionsFromDatabase.map((permission) =>
			this.rolePermissionRepo.create({
				roleId: adminRole.id,
				permissionId: permission.id,
			}),
		);

		// User: file operations and profile access
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
						permission.action === PermissionAction.READ) ||
					(permission.resource === 'profile' &&
						permission.action === PermissionAction.READ) ||
					(permission.resource === 'storage' &&
						permission.action === PermissionAction.READ) ||
					(permission.resource === 'trash' &&
						permission.action === PermissionAction.READ),
			);

			userRolePermissions = userPermissions.map((permission) =>
				this.rolePermissionRepo.create({
					roleId: userRole.id,
					permissionId: permission.id,
				}),
			);
		}

		// Viewer: read-only access
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

		// Sale: plans and subscription management
		let saleRolePermissions: RolePermission[] = [];
		if (saleRole) {
			const salePermissions = permissionsFromDatabase.filter(
				(permission) =>
					(permission.resource === 'plan' &&
						[
							PermissionAction.READ,
							PermissionAction.MANAGE,
						].includes(permission.action)) ||
					(permission.resource === 'subscription' &&
						[
							PermissionAction.READ,
							PermissionAction.CREATE,
							PermissionAction.UPDATE,
						].includes(permission.action)),
			);

			saleRolePermissions = salePermissions.map((permission) =>
				this.rolePermissionRepo.create({
					roleId: saleRole.id,
					permissionId: permission.id,
				}),
			);
		}

		await this.rolePermissionRepo.save([
			...adminRolePermissions,
			...userRolePermissions,
			...viewerRolePermissions,
			...saleRolePermissions,
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

	private async initPlans() {
		const count = await this.planRepo.count();

		if (count > 0) {
			this.logger.verbose('Skip init plans (already exist)');
			return;
		}

		const plans = [
			{
				name: 'Basic 100GB',
				description: 'Perfect for getting started',
				storageLimit: 107374182400, // 100GB in bytes
				price: 29000, // VND
				durationDays: 30,
				isActive: true,
			},
			{
				name: 'Pro 500GB',
				description: 'Great for professionals',
				storageLimit: 536870912000, // 500GB in bytes
				price: 99000, // VND
				durationDays: 30,
				isActive: true,
			},
			{
				name: 'Premium 1TB',
				description: 'For power users',
				storageLimit: 1099511627776, // 1TB in bytes
				price: 199000, // VND
				durationDays: 30,
				isActive: true,
			},
			{
				name: 'Enterprise 2TB',
				description: 'For teams and businesses',
				storageLimit: 2199023255552, // 2TB in bytes
				price: 349000, // VND
				durationDays: 30,
				isActive: true,
			},
		];

		const entities = this.planRepo.create(plans);
		await this.planRepo.save(entities);

		this.logger.log('Plans initialized successfully');
	}
}

const permissions = [
	// --- User management ---
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

	// --- Role management ---
	{
		name: 'Read Role',
		action: PermissionAction.READ,
		resource: 'role',
		description: 'Allow viewing roles',
	},
	{
		name: 'Create Role',
		action: PermissionAction.CREATE,
		resource: 'role',
		description: 'Allow creating new roles',
	},
	{
		name: 'Update Role',
		action: PermissionAction.UPDATE,
		resource: 'role',
		description: 'Allow editing roles',
	},
	{
		name: 'Delete Role',
		action: PermissionAction.DELETE,
		resource: 'role',
		description: 'Allow deleting roles',
	},

	// --- Permission management ---
	{
		name: 'Read Permission',
		action: PermissionAction.READ,
		resource: 'permission',
		description: 'Allow viewing permissions',
	},
	{
		name: 'Create Permission',
		action: PermissionAction.CREATE,
		resource: 'permission',
		description: 'Allow creating new permissions',
	},
	{
		name: 'Update Permission',
		action: PermissionAction.UPDATE,
		resource: 'permission',
		description: 'Allow editing permissions',
	},
	{
		name: 'Delete Permission',
		action: PermissionAction.DELETE,
		resource: 'permission',
		description: 'Allow deleting permissions',
	},

	// --- Profile management ---
	{
		name: 'Read Profile',
		action: PermissionAction.READ,
		resource: 'profile',
		description: 'Allow viewing user profile',
	},
	{
		name: 'Update Profile',
		action: PermissionAction.UPDATE,
		resource: 'profile',
		description: 'Allow editing user profile',
	},

	// --- Storage management ---
	{
		name: 'Read Storage',
		action: PermissionAction.READ,
		resource: 'storage',
		description: 'Allow viewing storage information',
	},

	// --- Trash management ---
	{
		name: 'Read Trash',
		action: PermissionAction.READ,
		resource: 'trash',
		description: 'Allow viewing trash',
	},
	{
		name: 'Delete Trash',
		action: PermissionAction.DELETE,
		resource: 'trash',
		description: 'Allow permanently deleting items from trash',
	},

	// --- Plan management ---
	{
		name: 'Read Plan',
		action: PermissionAction.READ,
		resource: 'plan',
		description: 'Allow viewing storage plans',
	},
	{
		name: 'Manage Plan',
		action: PermissionAction.MANAGE,
		resource: 'plan',
		description: 'Allow managing storage plans',
	},

	// --- Subscription management ---
	{
		name: 'Read Subscription',
		action: PermissionAction.READ,
		resource: 'subscription',
		description: 'Allow viewing subscriptions',
	},
	{
		name: 'Create Subscription',
		action: PermissionAction.CREATE,
		resource: 'subscription',
		description: 'Allow creating new subscriptions',
	},
	{
		name: 'Update Subscription',
		action: PermissionAction.UPDATE,
		resource: 'subscription',
		description: 'Allow updating subscriptions',
	},

	// --- Config management ---
	{
		name: 'Read Config',
		action: PermissionAction.READ,
		resource: 'config',
		description: 'Allow viewing app configuration',
	},
	{
		name: 'Update Config',
		action: PermissionAction.UPDATE,
		resource: 'config',
		description: 'Allow updating app configuration',
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
	{
		name: 'Sale',
	},
];
