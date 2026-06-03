import { Module } from '@nestjs/common';
import { CompanyController } from './presentation/company.controller';
import { ListCompaniesUseCase } from './application/use-cases/list-companies.use-case';
import { CreateCompanyUseCase } from './application/use-cases/create-company.use-case';
import { GetCompanyUseCase } from './application/use-cases/get-company.use-case';
import { UpdateCompanyUseCase } from './application/use-cases/update-company.use-case';
import { DeleteCompanyUseCase } from './application/use-cases/delete-company.use-case';

@Module({
  controllers: [CompanyController],
  providers: [
    ListCompaniesUseCase,
    CreateCompanyUseCase,
    GetCompanyUseCase,
    UpdateCompanyUseCase,
    DeleteCompanyUseCase,
  ],
})
export class CompanyModule {}
