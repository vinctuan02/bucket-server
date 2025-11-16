import { Injectable } from '@nestjs/common';
import { FileNodeFM } from 'src/file-node/fm/file-node.fm';
import { PermissionFM } from 'src/permission/enums/permission.enum';
import { UserFM } from 'src/users/enum/user.enum';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { RoleFM } from '../../role/constant/orm.role.fm';
import { OrmFilterDto } from '../dto/orm-utils.dto';

@Injectable()
export class OrmUtilsWhere {
	applyFilter({
		filter,
		qb,
	}: {
		qb: SelectQueryBuilder<any>;
		filter: OrmFilterDto;
	}) {
		const {
			keywordsUser,
			keywordsPermission,
			keywordsRole,
			keywordsFileNode,
			keywordsPlan,
			pageSize,
			skip,
			fieldOrder,
			orderBy,

			fileNodeParentId,
			fileNodeIsDelete,

			fileNodeId,
		} = filter;

		qb.orderBy(fieldOrder, orderBy).take(pageSize).skip(skip);

		this.andWhereUserKeywords({ qb, keywords: keywordsUser });
		this.andWherePermissionKeywords({ qb, keywords: keywordsPermission });
		this.andWhereRoleKeywords({ qb, keywords: keywordsRole });
		this.andWhereFileNodeKeywords({ qb, keywords: keywordsFileNode });
		this.andWherePlanKeywords({ qb, keywords: keywordsPlan });
		this.andWhereFileNodeParentId({ qb, fileNodeParentId });
		this.andWhereFileNodeIsDelete({ qb, fileNodeIsDelete });
	}

	andWhereUserKeywords({
		qb,
		keywords,
	}: {
		qb: SelectQueryBuilder<any>;
		keywords?: string[];
	}) {
		if (keywords && keywords.length > 0) {
			qb.andWhere(
				new Brackets((subQb) => {
					keywords.forEach((keyword, index) => {
						const trimmed = keyword.trim();
						if (!trimmed) return;

						const paramName = `kw${index}`;
						const paramValue = `%${trimmed}%`;

						const condition = `
                            (${UserFM.NAME} ILIKE :${paramName})
                            OR (${UserFM.EMAIL} ILIKE :${paramName})
                        `;

						if (index === 0) {
							subQb.where(condition, { [paramName]: paramValue });
						} else {
							subQb.orWhere(condition, {
								[paramName]: paramValue,
							});
						}
					});
				}),
			);
		}

		return qb;
	}

	andWherePermissionKeywords({
		qb,
		keywords,
	}: {
		qb: SelectQueryBuilder<any>;
		keywords?: string[];
	}) {
		if (keywords && keywords.length > 0) {
			qb.andWhere(
				new Brackets((subQb) => {
					keywords.forEach((keyword, index) => {
						const trimmed = keyword.trim();
						if (!trimmed) return;

						const paramName = `kw${index}`;
						const paramValue = `%${trimmed}%`;

						const condition = `
                            (${PermissionFM.NAME} ILIKE :${paramName})
                            OR (${PermissionFM.RESOURCE} ILIKE :${paramName})
                            OR (CAST(${PermissionFM.DESCRIPTION} AS TEXT) ILIKE :${paramName})
                            OR (${PermissionFM.ACTION} ILIKE :${paramName})
                        `;

						if (index === 0) {
							subQb.where(condition, { [paramName]: paramValue });
						} else {
							subQb.orWhere(condition, {
								[paramName]: paramValue,
							});
						}
					});
				}),
			);
		}

		return qb;
	}

	andWhereRoleKeywords({
		qb,
		keywords,
	}: {
		qb: SelectQueryBuilder<any>;
		keywords?: string[];
	}) {
		if (keywords && keywords.length > 0) {
			qb.andWhere(
				new Brackets((subQb) => {
					keywords.forEach((keyword, index) => {
						const trimmed = keyword.trim();
						if (!trimmed) return;

						const paramName = `kw${index}`;
						const paramValue = `%${trimmed}%`;

						const condition = `
                            (${RoleFM.NAME} ILIKE :${paramName})
                            OR (CAST(${RoleFM.DESCRIPTION} AS TEXT) ILIKE :${paramName})
                        `;

						if (index === 0) {
							subQb.where(condition, { [paramName]: paramValue });
						} else {
							subQb.orWhere(condition, {
								[paramName]: paramValue,
							});
						}
					});
				}),
			);
		}

		return qb;
	}

	andWhereFileNodeKeywords({
		qb,
		keywords,
	}: {
		qb: SelectQueryBuilder<any>;
		keywords?: string[];
	}) {
		if (keywords && keywords.length > 0) {
			qb.andWhere(
				new Brackets((subQb) => {
					keywords.forEach((keyword, index) => {
						const trimmed = keyword.trim();
						if (!trimmed) return;

						const paramName = `kw${index}`;
						const paramValue = `%${trimmed}%`;

						const condition = `
                            (${FileNodeFM.name} ILIKE :${paramName})
                        `;

						if (index === 0) {
							subQb.where(condition, { [paramName]: paramValue });
						} else {
							subQb.orWhere(condition, {
								[paramName]: paramValue,
							});
						}
					});
				}),
			);
		}

		return qb;
	}

	andWhereUserId({
		userId,
		qb,
	}: {
		qb: SelectQueryBuilder<any>;
		userId?: string;
	}) {
		if (userId) {
			qb.andWhere(`${UserFM.ID} = :userId`, {
				userId,
			});
		}
	}

	andWhereFileNodeId({
		fileNodeId,
		qb,
	}: {
		qb: SelectQueryBuilder<any>;
		fileNodeId?: string;
	}) {
		if (fileNodeId !== undefined) {
			qb.andWhere(`${FileNodeFM.id} = :fileNodeId`, {
				fileNodeId,
			});
		}
	}

	andWhereFileNodeParentId({
		fileNodeParentId,
		qb,
	}: {
		qb: SelectQueryBuilder<any>;
		fileNodeParentId?: string;
	}) {
		if (fileNodeParentId) {
			qb.andWhere(`${FileNodeFM.fileNodeParentId} = :fileNodeParentId`, {
				fileNodeParentId,
			});
		}
	}

	andWhereFileNodeIsDelete({
		fileNodeIsDelete,
		qb,
	}: {
		qb: SelectQueryBuilder<any>;
		fileNodeIsDelete?: boolean;
	}) {
		if (fileNodeIsDelete !== undefined) {
			qb.andWhere(`${FileNodeFM.isDelete} = :fileNodeIsDelete`, {
				fileNodeIsDelete,
			});
		}
	}

	andWherePlanKeywords({
		qb,
		keywords,
	}: {
		qb: SelectQueryBuilder<any>;
		keywords?: string[];
	}) {
		if (keywords && keywords.length > 0) {
			qb.andWhere(
				new Brackets((subQb) => {
					keywords.forEach((keyword, index) => {
						const trimmed = keyword.trim();
						if (!trimmed) return;

						const paramName = `kw${index}`;
						const paramValue = `%${trimmed}%`;

						const condition = `
                            (plan.name ILIKE :${paramName})
                            OR (CAST(plan.description AS TEXT) ILIKE :${paramName})
                        `;

						if (index === 0) {
							subQb.where(condition, { [paramName]: paramValue });
						} else {
							subQb.orWhere(condition, {
								[paramName]: paramValue,
							});
						}
					});
				}),
			);
		}

		return qb;
	}
}
