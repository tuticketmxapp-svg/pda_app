import { Component } from '@angular/core';
import { AlertController, MenuController, NavController, Platform } from '@ionic/angular';
import { Location } from '@angular/common';
import { AuthService, LanguageService, SharedService } from './services';
import { Storage } from '@ionic/storage-angular';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { environment } from 'src/environments/environment';
import { SplashScreen } from '@capacitor/splash-screen';
import { SqliteService } from './services/sqlite.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: false,
})
export class AppComponent {
  pages: Array<{ title: string, url: string, icon: string }> = [
    // { title: 'Inicio', url: 'home', icon: 'home' }
  ];
  user: any;
  exit = false;
  version = environment.version;

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private navCtrl: NavController,
    private alertController: AlertController,
    private location: Location,
    private menuCtrl: MenuController,
    private storage: Storage,
    private sharedService: SharedService,
    private router: Router,
    private activateRoute: ActivatedRoute,
    private langSvc: LanguageService,
    private sqliteService: SqliteService // ✅ Inyección correcta
  ) {
    this.initializeApp();
    this.langSvc.getSelectedIdiom$().subscribe((result: { idioma: string }) => {
      // Aquí puedes manejar traducciones si usas ngx-translate o similar
    });
  }

  async ngOnInit() {
    await this.storage.create();
    await this.sqliteService.initDB();
  }

  getUserInfo() {
    this.sharedService.getHttpUsuarioInfo().subscribe(async response => {
      // Manejo de info de usuario
    }, err => {
      console.error(err);
    });
  }

  async initializeApp() {
    await this.platform.ready();
    SplashScreen.hide();

    this.authService.isAuth.subscribe(async r => {
      const idUser = await this.storage.get('access_user');
      if (idUser) {
        this.getUserInfo();
        this.navCtrl.navigateForward('/home');
      } else {
        this.navCtrl.navigateForward('/login');
      }
    }, err => {
      this.navCtrl.navigateForward('/login');
    });

    // Back button
    this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.location.isCurrentPathEqualTo('/home')) {
        this.showExitConfirm();
      } else {
        this.location.back();
      }
    });
  }

  showExitConfirm() {
    this.exit = true;
    this.alertController.create({
      header: 'Salir',
      message: '¿Desea cerrar la aplicación?',
      backdropDismiss: false,
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Si', handler: () => navigator['app'].exitApp() }
      ]
    }).then(alert => alert.present());
  }

  closeMenu() {
    this.menuCtrl.close();
  }

  openPage(page: string | any[] | UrlTree) {
    this.navCtrl.navigateRoot(page);
    this.closeMenu();
  }

  async logout() {
    this.closeMenu();
    await this.authService.logout();
    await this.navCtrl.navigateRoot('/login');
  }
}
