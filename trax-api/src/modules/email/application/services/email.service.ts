import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private fromDomain: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromDomain = this.configService.get<string>('EMAIL_FROM_DOMAIN') || 'trax.app';
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY não configurada. E-mails não serão enviados.');
    }
    
    this.resend = new Resend(apiKey || 'dummy');
  }

  async sendWelcomeEmail(to: string, agencyName: string, adminName: string, slug: string) {
    if (!this.configService.get<string>('RESEND_API_KEY')) return;

    const portalUrl = `https://${slug}.${this.fromDomain}`;

    try {
      await this.resend.emails.send({
        from: `Equipe Trax <noreply@${this.fromDomain}>`,
        to,
        subject: `Bem-vindo ao Trax, ${adminName}! 🚀`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="color: #6366F1; margin: 0; font-size: 28px;">Trax</h2>
  </div>
  <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <h1 style="font-size: 24px; margin-top: 0; color: #111827;">Olá, ${adminName}! 👋</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
      Sua agência <strong>${agencyName}</strong> foi criada com sucesso. Estamos muito felizes em ter você a bordo da plataforma definitiva para painéis White-Label.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
      Seu portal exclusivo (com o domínio da sua agência) já está pronto. Você pode acessá-lo usando o link seguro abaixo:
    </p>
    <div style="text-align: center; margin: 35px 0;">
      <a href="${portalUrl}" style="background-color: #6366F1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Acessar Meu Portal</a>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">Link: ${portalUrl}</p>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #f3f4f6; margin-bottom: 20px;">
      <h3 style="margin-top: 0; font-size: 16px; color: #111827;">🚀 Próximos Passos Sugeridos:</h3>
      <ul style="padding-left: 20px; color: #4b5563; margin-bottom: 0; line-height: 1.8;">
        <li>🎨 <strong>Personalize o portal</strong> com sua logomarca e paleta de cores.</li>
        <li>👥 <strong>Cadastre seus clientes</strong> na plataforma.</li>
        <li>🔗 <strong>Conecte o Meta Ads</strong> ou Google Ads para importar dados.</li>
      </ul>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      Lembrando que o seu período de teste gratuito de 14 dias começou hoje. Aproveite para explorar todas as funcionalidades à vontade!
    </p>
  </div>
  <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
    <p>Este é um e-mail automático, por favor não responda.</p>
    <p>© ${new Date().getFullYear()} Trax Soluções. Todos os direitos reservados.</p>
  </div>
</div>
        `,
      });
      this.logger.log(`E-mail de boas-vindas enviado para ${to}`);
    } catch (error: any) {
      this.logger.error(`Falha ao enviar e-mail para ${to}: ${error.message}`);
    }
  }

  async sendPasswordReset(to: string, resetLink: string) {
    if (!this.configService.get<string>('RESEND_API_KEY')) return;

    try {
      await this.resend.emails.send({
        from: `Suporte Trax <suporte@${this.fromDomain}>`,
        to,
        subject: 'Redefinição de Senha - Trax',
        html: `
          <p>Você solicitou a redefinição de sua senha.</p>
          <p>Clique no link abaixo para criar uma nova senha:</p>
          <a href="${resetLink}">Redefinir Senha</a>
          <br>
          <p>Se você não solicitou, apenas ignore este e-mail.</p>
        `,
      });
    } catch (error: any) {
      this.logger.error(`Falha ao enviar e-mail de reset para ${to}: ${error.message}`);
    }
  }
}
