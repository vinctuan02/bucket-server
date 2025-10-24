import { Injectable } from '@nestjs/common';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { OrmFilterDto } from '../dto/orm-utils.dto';
import { PermissionFieldMapping } from '../field-mapping/orm.permission.fm';

@Injectable()
export class OrmUtilsWhere {
	applyFilter({
		filter,
		qb,
	}: {
		qb: SelectQueryBuilder<any>;
		filter: OrmFilterDto;
	}) {
		const { keywordsPermission } = filter;

		this.andWhereKeywordsPermission({ qb, keywords: keywordsPermission });
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
                            (${PermissionFieldMapping.name} ILIKE :${paramName})
                            OR (${PermissionFieldMapping.description} ILIKE :${paramName})
                            OR (CAST(${PermissionFieldMapping.description} AS TEXT) ILIKE :${paramName})
                            OR (${PermissionFieldMapping.resouce} ILIKE :${paramName})
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
