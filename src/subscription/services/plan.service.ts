import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class PlanService {
	constructor(
		@InjectRepository(Plan)
		private planRepo: Repository<Plan>,
	) {}

	async create(dto: CreatePlanDto): Promise<Plan> {
		const plan = this.planRepo.create(dto);
		return this.planRepo.save(plan);
	}

	async findAll(): Promise<Plan[]> {
		return this.planRepo.find({ where: { isActive: true } });
	}

	async findById(id: string): Promise<Plan | null> {
		return this.planRepo.findOne({ where: { id } });
	}

	async update(id: string, dto: UpdatePlanDto): Promise<Plan | null> {
		await this.planRepo.update(id, dto);
		return this.findById(id);
	}

	async delete(id: string): Promise<void> {
		await this.planRepo.delete(id);
	}
}
