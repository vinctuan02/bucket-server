import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEventType } from 'src/app-event/enum/app-event.enum';
import { Permission } from 'src/permission/entities/permission.entity';
import {
	PermissionAction,
	Resource,
} from 'src/permission/enums/permission.enum';
import { RolePermission } from 'src/role-permission/entities/role-permission.entity';
import { Role } from 'src/role/entities/role.entity';
import { Plan } from 'src/subscription/entities/plan.entity';
import { UserRole } from 'src/user-role/entities/user-role.entity';
import { User } from 'src/users/entities/user.entity';
import { hashPass } from 'src/users/util/user.ulti';
import { DataSource, Repository } from 'typeorm';
import { PERMISSIONS_SEED } from './permission/constants/permission.constant';
import { ROLE_CONSTANTS, ROLES_SEED } from './role/constant/role.constant';

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
			// Sử dụng hằng số ROLES_SEED
			const entities = this.roleRepo.create(ROLES_SEED);

			await this.roleRepo.save(entities);
			this.logger.verbose('Roles initialization completed');
		} else {
			this.logger.verbose('Skip init roles');
		}
	}

	private async initPermissions() {
		const count = await this.permissionRepo.count();

		if (count === 0) {
			// Sử dụng hằng số PERMISSIONS_SEED
			const entities = this.permissionRepo.create(PERMISSIONS_SEED);

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
			(role) => role.name === ROLE_CONSTANTS.ADMIN,
		);
		const userRole = rolesFromDatabase.find(
			(role) => role.name === ROLE_CONSTANTS.USER,
		);
		const viewerRole = rolesFromDatabase.find(
			(role) => role.name === ROLE_CONSTANTS.VIEWER,
		);
		const saleRole = rolesFromDatabase.find(
			(role) => role.name === ROLE_CONSTANTS.SALE,
		);

		if (!adminRole) {
			this.logger.warn('Admin role not found, skip role-permission init');
			return;
		}

		const allRolePermissions: RolePermission[] = [];

		// 1. Admin: all permissions
		const adminRolePermissions = permissionsFromDatabase.map((permission) =>
			this.rolePermissionRepo.create({
				roleId: adminRole.id,
				permissionId: permission.id,
			}),
		);
		allRolePermissions.push(...adminRolePermissions);

		// 2. User: file operations and profile access
		if (userRole) {
			const userPermissions = permissionsFromDatabase.filter(
				(permission) =>
					// File Operations (CREATE/READ/UPDATE/DELETE)
					(permission.resource === Resource.FILE_NODE &&
						[
							PermissionAction.CREATE,
							PermissionAction.READ,
							PermissionAction.UPDATE,
							PermissionAction.DELETE,
						].includes(permission.action)) ||
					// User's own Profile (READ/UPDATE)
					(permission.resource === Resource.PROFILE &&
						[
							PermissionAction.READ,
							PermissionAction.UPDATE,
						].includes(permission.action)) ||
					// Storage and Trash View
					(permission.resource === Resource.STORAGE &&
						permission.action === PermissionAction.READ) ||
					(permission.resource === Resource.TRASH &&
						permission.action === PermissionAction.READ),
			);

			const userRolePermissions = userPermissions.map((permission) =>
				this.rolePermissionRepo.create({
					roleId: userRole.id,
					permissionId: permission.id,
				}),
			);
			allRolePermissions.push(...userRolePermissions);
		}

		// 3. Viewer: read-only access (files, profile, storage)
		if (viewerRole) {
			const viewerPermissions = permissionsFromDatabase.filter(
				(permission) =>
					permission.action === PermissionAction.READ &&
					[
						Resource.FILE_NODE,
						Resource.PROFILE,
						Resource.STORAGE,
						Resource.TRASH,
						Resource.PLAN,
						Resource.SUBSCRIPTION,
					].includes(permission.resource),
			);

			const viewerRolePermissions = viewerPermissions.map((permission) =>
				this.rolePermissionRepo.create({
					roleId: viewerRole.id,
					permissionId: permission.id,
				}),
			);
			allRolePermissions.push(...viewerRolePermissions);
		}

		// 4. Sale: plans and subscription management
		if (saleRole) {
			const salePermissions = permissionsFromDatabase.filter(
				(permission) =>
					// Plan Management (READ, MANAGE)
					(permission.resource === Resource.PLAN &&
						[
							PermissionAction.READ,
							PermissionAction.CREATE,
							PermissionAction.UPDATE,
							PermissionAction.DELETE,
							PermissionAction.MANAGE,
						].includes(permission.action)) ||
					// Subscription Management (CRUD)
					(permission.resource === Resource.SUBSCRIPTION &&
						[
							PermissionAction.READ,
							PermissionAction.CREATE,
							PermissionAction.UPDATE,
							PermissionAction.DELETE,
						].includes(permission.action)),
			);

			const saleRolePermissions = salePermissions.map((permission) =>
				this.rolePermissionRepo.create({
					roleId: saleRole.id,
					permissionId: permission.id,
				}),
			);
			allRolePermissions.push(...saleRolePermissions);
		}

		await this.rolePermissionRepo.save(allRolePermissions);

		this.logger.log('Role-Permissions initialized successfully');
	}

	private async initializeUserRole() {
		const user = await this.userRepo.findOne({
			where: { email: this.configService.get<string>('DEFAULT_EMAIL') },
		});
		const adminRole = await this.roleRepo.findOne({
			where: { name: ROLE_CONSTANTS.ADMIN },
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
