import { Component } from '@angular/core';
import { AuthService } from '../../features/auth/services/auth.service';
import { UserRegistration } from '../../features/auth/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  constructor(private authService: AuthService) {}

  tokenTeste: string = '';

  // Coloque um e-mail REAL seu aqui para o Resend conseguir entregar!
  emailTeste: string = 'pedrolcrisp@gmail.com';
  senhaTeste: string = 'senha123';

  testarRegistro() {
    console.log('1. Iniciando registro...');
    const novoUser: UserRegistration = {
      name: 'Pedro Teste',
      email: this.emailTeste,
      password: this.senhaTeste,
      user_type: 'STUDENT' as const,
    };

    this.authService.register(novoUser).subscribe({
      next: (res) => console.log('✅ Usuário registrado! Olhe sua caixa de entrada.', res),
      error: (err) => console.error('❌ Erro no registro', err),
    });
  }

  testarLogin() {
    console.log('2. Tentando fazer login...');
    this.authService.login(this.emailTeste, this.senhaTeste).subscribe({
      next: (res) => console.log('✅ Logado com sucesso! Token gerado.', res),
      error: (err) =>
        console.error('❌ Erro no login (Se não verificou, DEVE dar erro 403 aqui)', err),
    });
  }

  testarVerificacao() {
    console.log('3. Enviando token para o backend...');
    if (!this.tokenTeste) {
      console.error('⚠️ Cole o token no input primeiro!');
      return;
    }

    this.authService.verifyEmail(this.tokenTeste).subscribe({
      next: (res) => console.log('✅ E-mail verificado com sucesso no banco!', res),
      error: (err) => console.error('❌ Erro ao verificar token', err),
    });
  }
}
