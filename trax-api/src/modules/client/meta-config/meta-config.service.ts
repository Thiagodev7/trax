import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { defaultMetaConfig, MetaConfigShape } from './meta-config.template';

@Injectable()
export class MetaConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(agencyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, agencyId } });
    if (!client) throw new NotFoundException('Cliente não encontrado.');

    let cfg = await this.prisma.clientMetaConfig.findUnique({ where: { clientId } });
    if (!cfg) {
      const tpl = defaultMetaConfig();
      cfg = await this.prisma.clientMetaConfig.create({
        data: {
          clientId,
          products: tpl.products as any,
          states: tpl.states as any,
          stateBudgetByProduct: tpl.stateBudgetByProduct as any,
          thresholds: tpl.thresholds as any,
          reachFactor: tpl.reachFactor,
          secondaryAccountColor: tpl.secondaryAccountColor,
          sparklineDays: tpl.sparklineDays,
        },
      });
    }
    return this.serialize(cfg);
  }

  async update(agencyId: string, clientId: string, patch: Partial<MetaConfigShape>) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, agencyId } });
    if (!client) throw new NotFoundException('Cliente não encontrado.');

    this.validate(patch);

    await this.getOrCreate(agencyId, clientId);
    const updated = await this.prisma.clientMetaConfig.update({
      where: { clientId },
      data: {
        ...(patch.products !== undefined && { products: patch.products as any }),
        ...(patch.states !== undefined && { states: patch.states as any }),
        ...(patch.stateBudgetByProduct !== undefined && {
          stateBudgetByProduct: patch.stateBudgetByProduct as any,
        }),
        ...(patch.thresholds !== undefined && { thresholds: patch.thresholds as any }),
        ...(patch.reachFactor !== undefined && { reachFactor: patch.reachFactor }),
        ...(patch.secondaryAccountColor !== undefined && {
          secondaryAccountColor: patch.secondaryAccountColor,
        }),
        ...(patch.sparklineDays !== undefined && { sparklineDays: patch.sparklineDays }),
      },
    });
    return this.serialize(updated);
  }

  async reset(agencyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, agencyId } });
    if (!client) throw new NotFoundException('Cliente não encontrado.');

    const tpl = defaultMetaConfig();
    const cfg = await this.prisma.clientMetaConfig.upsert({
      where: { clientId },
      update: {
        products: tpl.products as any,
        states: tpl.states as any,
        stateBudgetByProduct: tpl.stateBudgetByProduct as any,
        thresholds: tpl.thresholds as any,
        reachFactor: tpl.reachFactor,
        secondaryAccountColor: tpl.secondaryAccountColor,
        sparklineDays: tpl.sparklineDays,
      },
      create: {
        clientId,
        products: tpl.products as any,
        states: tpl.states as any,
        stateBudgetByProduct: tpl.stateBudgetByProduct as any,
        thresholds: tpl.thresholds as any,
        reachFactor: tpl.reachFactor,
        secondaryAccountColor: tpl.secondaryAccountColor,
        sparklineDays: tpl.sparklineDays,
      },
    });
    return this.serialize(cfg);
  }

  private validate(patch: Partial<MetaConfigShape>) {
    if (patch.products) {
      const keys = new Set<string>();
      for (const p of patch.products) {
        if (!p.key || !p.label) throw new BadRequestException('Produto sem key/label.');
        if (keys.has(p.key)) throw new BadRequestException(`Produto duplicado: ${p.key}`);
        keys.add(p.key);
        if (!Array.isArray(p.namePatterns)) {
          throw new BadRequestException(`namePatterns ausente em ${p.key}`);
        }
      }
    }
    if (patch.states) {
      const codes = new Set<string>();
      for (const s of patch.states) {
        if (!s.code || !s.label) throw new BadRequestException('Estado sem code/label.');
        if (codes.has(s.code)) throw new BadRequestException(`Estado duplicado: ${s.code}`);
        codes.add(s.code);
      }
    }
    if (patch.stateBudgetByProduct) {
      for (const [productKey, pcts] of Object.entries(patch.stateBudgetByProduct)) {
        const sum = Object.values(pcts).reduce((s, v) => s + Number(v ?? 0), 0);
        if (sum > 0 && Math.abs(sum - 100) > 1) {
          throw new BadRequestException(
            `Distribuição de ${productKey} soma ${sum.toFixed(2)}% — deve somar 100%.`,
          );
        }
      }
    }
  }

  private serialize(cfg: any): MetaConfigShape & { id: string; clientId: string } {
    return {
      id: cfg.id,
      clientId: cfg.clientId,
      products: cfg.products as any,
      states: cfg.states as any,
      stateBudgetByProduct: cfg.stateBudgetByProduct as any,
      thresholds: cfg.thresholds as any,
      reachFactor: cfg.reachFactor,
      secondaryAccountColor: cfg.secondaryAccountColor,
      sparklineDays: cfg.sparklineDays,
    };
  }
}
