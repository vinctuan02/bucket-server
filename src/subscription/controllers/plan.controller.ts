import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
} from '@nestjs/common';
import {
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { PageDto, ResponseSuccess } from 'src/common/dto/common.response-dto';
import {
	CreatePlanDto,
	GetListPlanDto,
	PlanResponseDto,
	UpdatePlanDto,
} from '../dto/plan.dto';
import { PlanService } from '../services/plan.service';

@ApiTags('Subscription - Plans')
@Controller('subscription/plans')
export class PlanController {
	constructor(private readonly service: PlanService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new plan' })
	@ApiBody({ type: CreatePlanDto })
	@ApiResponse({
		status: 201,
		description: 'Plan created successfully',
		type: PlanResponseDto,
	})
	async create(@Body() dto: CreatePlanDto) {
		const data = await this.service.create(dto);
		return new ResponseSuccess({ data });
	}

	@Get()
	@ApiOperation({
		summary: 'Get list of plans with pagination and filtering',
	})
	@ApiQuery({ type: GetListPlanDto })
	@ApiResponse({
		status: 200,
		description: 'List of plans',
		type: PageDto,
	})
	async findAll(@Query() filter: GetListPlanDto) {
		const data = await this.service.findAll(filter);
		return new ResponseSuccess({ data });
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get plan by ID' })
	@ApiParam({ name: 'id', type: 'string', description: 'Plan ID (UUID)' })
	@ApiResponse({
		status: 200,
		description: 'Plan details',
		type: PlanResponseDto,
	})
	@ApiResponse({ status: 404, description: 'Plan not found' })
	async findById(@Param('id') id: string) {
		const data = await this.service.findById(id);
		return new ResponseSuccess({ data });
	}

	@Put(':id')
	@ApiOperation({ summary: 'Update plan' })
	@ApiParam({ name: 'id', type: 'string', description: 'Plan ID (UUID)' })
	@ApiBody({ type: UpdatePlanDto })
	@ApiResponse({
		status: 200,
		description: 'Plan updated successfully',
		type: PlanResponseDto,
	})
	async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
		const data = await this.service.update(id, dto);
		return new ResponseSuccess({ data });
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete plan' })
	@ApiParam({ name: 'id', type: 'string', description: 'Plan ID (UUID)' })
	@ApiResponse({ status: 200, description: 'Plan deleted successfully' })
	async delete(@Param('id') id: string) {
		await this.service.delete(id);
		return new ResponseSuccess({ data: null });
	}
}
