import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto, ResponseError } from 'src/common/dto/common.response-dto';
import { OrmFilterDto } from 'src/orm-utils/dto/orm-utils.dto';
import { OrmUtilsCreateQb } from 'src/orm-utils/services/orm-utils.create-qb';
import { OrmUtilsWhere } from 'src/orm-utils/services/orm-utils.where';
import { Repository } from 'typeorm';
import { CreatePlanDto, GetListPlanDto, UpdatePlanDto } from '../dto/plan.dto';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class PlanService {
	constructor(
		@InjectRepository(Plan)
		private planRepo: Repository<Plan>,
		private readonly createQbUtils: OrmUtilsCreateQb,
		private readonly whereUtils: OrmUtilsWhere,
	) {}

	async create(dto: CreatePlanDto): Promise<Plan> {
		const plan = this.planRepo.create(dto);
		return this.planRepo.save(plan);
	}

	async findAll(filter: GetListPlanDto): Promise<PageDto<Plan>> {
		const { keywords, isActive } = filter;

		const qb = this.planRepo.createQueryBuilder('plan');

		// Apply ORM filter (pagination, sorting)
		this.whereUtils.applyFilter({
			qb,
			filter: new OrmFilterDto({
				keywordsPlan: keywords,
				...filter,
			}),
		});

		// Filter by active status - default to true if not specified
		if (isActive !== undefined) {
			qb.andWhere('plan.isActive = :isActive', { isActive });
		}

		// Search by keywords
		if (keywords && keywords.length > 0) {
			qb.andWhere(
				'(plan.name ILIKE ANY(:keywords) OR plan.description ILIKE ANY(:keywords))',
				{
					keywords: keywords.map((k) => `%${k}%`),
				},
			);
		}

		const [items, totalItems] = await qb.getManyAndCount();

		return new PageDto({
			items,
			metadata: { ...filter, totalItems },
		});
	}

	async findById(id: string): Promise<Plan> {
		const e = await this.planRepo.findOne({ where: { id } });

		if (!e) {
			throw new ResponseError({ message: 'Plan not found' });
		}
		return e;
	}

	async update(id: string, dto: UpdatePlanDto): Promise<Plan | null> {
		await this.planRepo.update(id, dto);
		return this.findById(id);
	}

	async delete(id: string): Promise<void> {
		await this.planRepo.delete(id);
	}
}
