import { Injectable } from '@nestjs/common';
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
			pageSize,
			skip,
			fieldOrder,
			orderBy,
		} = filter;

		qb.orderBy(fieldOrder, orderBy).take(pageSize).skip(skip);

		this.andWhereKeywordsUser({ qb, keywords: keywordsUser });
		this.andWhereKeywordsPermission({ qb, keywords: keywordsPermission });
		this.andWhereKeywordsRole({ qb, keywords: keywordsRole });
	}

	andWhereKeywordsUser({
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

	andWhereKeywordsPermission({
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

	andWhereKeywordsRole({
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
}
