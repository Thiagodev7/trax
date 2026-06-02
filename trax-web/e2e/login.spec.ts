import { test, expect } from '@playwright/test';

test.describe('Autenticação White-Label', () => {
  test('deve fazer login com sucesso e ir para o dashboard', async ({ page }) => {
    // Acessa o login no subdomínio da agência demo
    await page.goto('http://agenciademo.localhost:3001/login');

    // Verifica se a página carregou corretamente
    await expect(page.getByRole('heading', { name: /Bem-vindo de volta/i })).toBeVisible();

    // Preenche credenciais
    await page.getByPlaceholder('seu@email.com').fill('admin@agenciademo.com');
    await page.getByPlaceholder('••••••••').fill('senha123');

    // Submete formulário
    await page.getByRole('button', { name: /Entrar/i }).click();

    // Verifica redirecionamento para o dashboard
    await expect(page).toHaveURL('http://agenciademo.localhost:3001/');
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByText('admin@agenciademo.com')).toBeVisible();

    // Faz logout
    await page.getByRole('button', { name: /Sair/i }).click();
    await expect(page).toHaveURL('http://agenciademo.localhost:3001/login');
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('http://agenciademo.localhost:3001/login');

    await page.getByPlaceholder('seu@email.com').fill('invalido@teste.com');
    await page.getByPlaceholder('••••••••').fill('errada123');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await expect(page.getByText(/Credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL('http://agenciademo.localhost:3001/login');
  });
});
