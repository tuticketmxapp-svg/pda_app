import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController } from '@ionic/angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { AuthService, LanguageService } from 'src/app/services';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: false,

})
export class LoginPage {
  loginForm: FormGroup;
  mostrarForm: boolean | undefined;
  logoVisible = false;
  language = "Español-Latinoamérica";
  loadingLogin: boolean = false;
  version = environment.version;
  private submitted: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private langSvc: LanguageService
  ) {
    this.langSvc.getSelectedIdiom$().subscribe((result) => {
      // translate.addLangs(['es', 'pt']);
      // translate.setDefaultLang(result.idioma);
      // translate.use(result.idioma);
      if (result.idioma === "es") {
        this.language = "Español-Latinoamérica"
      } else if (result.idioma === "pt") {
        this.language = "Portugués - Brasil"
      }

    })
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

  }

  ngOnInit() {
    this.checkAuth();
  }
  async checkAuth() {
    if (this.authService.isAuthenticaded()) {
      await this.navCtrl.navigateForward('/home');
    }
  }
  async login(credentials: any) {

    if (this.loadingLogin === false) {
      if (this.loginForm.invalid) {
        const alert = await this.alertCtrl.create({
          mode: 'ios',
          header: 'Datos no válidos',
          message: 'Por favor, ingresa tus credenciales',
          buttons: ['Aceptar']
        });
        await alert.present();
        return;
      }
      this.loadingLogin = true;
      const loading = await this.loadingCtrl.create({
        mode: 'ios',
        message: 'Loading',
      });
      await loading.present();
      this.authService.login(credentials).subscribe(async result => {
        console.log('result',result);
        this.loadingLogin = false;
        await loading.dismiss();
        if (result) {
          await this.navCtrl.navigateForward('/home');
          return;
        } else {
          const alert = await this.alertCtrl.create({
            mode: 'ios',
            header: result.title,
            message: result.message,
            buttons: ['Aceptar']
          });
          await alert.present();
        }
      }, async error => {
        console.log('error',error);
        loading.dismiss();
        this.loadingLogin = false;
        let title = '';
        let message = '';
        if (error.status != 0) {
          const responseObject = error.error;
          title = "Error al iniciar sesión"
          for (const key in responseObject) {
            if (responseObject.hasOwnProperty(key)) {
              message += `${key}: ${responseObject[key]}\n`;
            }
          }
        } else {
          title = "Error de conexión"
          message = "Parece que hay un problem a con la conexión de internet, revise su conexión"
        }
        const alert = await this.alertCtrl.create({
          mode: 'ios',
          header: title,
          message: message,
          buttons: ['Aceptar']
        });
        await alert.present();
      });
      this.mostrarForm = false;
    }


  }

  showHideLog(invalue: string) {
    if (invalue == 'in') {
      this.logoVisible = true;
    } else {
      this.logoVisible = false;
    }
  }

  goToForgot() {
    this.navCtrl.navigateRoot('/forgot');
  }
  goToChangeLanguage() {
    this.navCtrl.navigateRoot('/language');
  }
  mostrarFormulario() {
    this.mostrarForm = true;
  }


}
