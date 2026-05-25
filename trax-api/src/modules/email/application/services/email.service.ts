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

  async sendWelcomeEmail(to: string, agencyName: string, adminName: string) {
    if (!this.configService.get<string>('RESEND_API_KEY')) return;

    try {
      await this.resend.emails.send({
        from: `Equipe Trax <noreply@${this.fromDomain}>`,
        to,
        subject: `Bem-vindo ao Trax, ${adminName}!`,
        html: `
          <h1>Olá ${adminName}!</h1>
          <p>Sua agência <strong>${agencyName}</strong> foi criada com sucesso no Trax.</p>
          <p>Seu período de teste de 14 dias começou. Aproveite!</p>
          <br>
          <p>Equipe Trax</p>
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
