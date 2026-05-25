import { Controller, Get, Post, Body, Query, HttpCode, BadRequestException, Version } from '@nestjs/common';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { CreateAgencyUseCase } from '../application/use-cases/create-agency.use-case';
import { PrismaService } from '@/prisma/prisma.service';
import { Public } from '@common/decorators/roles.decorator';

@Public()
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly createAgencyUseCase: CreateAgencyUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get('check-slug')
  @Version('1')
  async checkSlug(@Query('slug') slug: string) {
    if (!slug) throw new BadRequestException('O parâmetro slug é obrigatório');
    
    const lowercaseSlug = slug.toLowerCase();
    const reservedSlugs = ['www', 'api', 'admin', 'app', 'static', 'assets', 'trax'];
    
    if (reservedSlugs.includes(lowercaseSlug)) {
      return { available: false, message: 'Slug reservado' };
    }

    const existing = await this.prisma.agency.findUnique({ 
      where: { slug: lowercaseSlug },
      select: { id: true } 
    });

    return { available: !existing };
  }

  @Post('agency')
  @Version('1')
  @HttpCode(201)
  async createAgency(@Body() dto: CreateAgencyDto) {
    return this.createAgencyUseCase.execute(dto);
  }
}
