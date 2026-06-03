import { Controller, Get, Post, Body, Query, HttpCode, BadRequestException, Version } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@common/decorators/roles.decorator';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { CreateAgencyUseCase } from '../application/use-cases/create-agency.use-case';
import { CheckSlugUseCase } from '../application/use-cases/check-slug.use-case';

@Public()
@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly createAgencyUseCase: CreateAgencyUseCase,
    private readonly checkSlugUseCase: CheckSlugUseCase,
  ) {}

  @Get('check-slug')
  @Version('1')
  @ApiOperation({ summary: 'Verifica disponibilidade de slug para novo subdomínio' })
  async checkSlug(@Query('slug') slug: string) {
    if (!slug) throw new BadRequestException('O parâmetro slug é obrigatório');
    return this.checkSlugUseCase.execute(slug);
  }

  @Post('agency')
  @Version('1')
  @HttpCode(201)
  @ApiOperation({ summary: 'Cria uma nova agência via self-service (trial 14 dias)' })
  async createAgency(@Body() dto: CreateAgencyDto) {
    return this.createAgencyUseCase.execute(dto);
  }
}
