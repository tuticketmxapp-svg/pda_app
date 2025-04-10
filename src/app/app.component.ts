import { Component } from '@angular/core';
import { AlertController, MenuController, NavController, Platform } from '@ionic/angular';
import { Location } from '@angular/common';
import { AuthService, LanguageService, SharedService } from './services';
import { Storage } from '@ionic/storage';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { environment } from 'src/environments/environment';
import { SplashScreen } from '@capacitor/splash-screen';

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
    private langSvc: LanguageService
  ) {
    this.initializeApp();
    this.langSvc.getSelectedIdiom$().subscribe((result: { idioma: string; }) => {
      // translate.addLangs(['es', 'pt']);
      // translate.setDefaultLang(result.idioma);
      // translate.use(result.idioma);
    });
  }
  getUserInfo() {
    this.sharedService.getHttpUsuarioInfo().subscribe(async response => {
      // if (response.status == "success") {
      //   this.sharedService.setUsuarioInfo(response);
      // }
    }, err => {
    });

  }
  async initializeApp() {
    this.platform.ready().then(() => {
      
      SplashScreen.hide();
    });
    let isAuth = this.authService.isAuth.subscribe(async r => {
      let idUser = await this.storage.get('access_user');
      if (idUser != "" && idUser != null) {
        this.getUserInfo();
        this.navCtrl.navigateForward('/home');
        // SplashScreen.hide();
      } else {
        this.navCtrl.navigateForward('/login');
        // SplashScreen.hide();
      }
    }, err => {
      this.navCtrl.navigateForward('/login');
      // SplashScreen.hide();
    });
    this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.location.isCurrentPathEqualTo('/home')) {
        this.showExitConfirm();
        if (this.exit) {
          window.location.hash = 'no-back-button';
          window.location.hash = 'Again-No-back-button'; // Chrome
          window.onhashchange = function () {
            window.location.hash = 'no-back-button';
          };
        }
      } else {
        this.location.back();
      }
    });
    
    this.platform.backButton.subscribeWithPriority(5, () => {
      this.alertController.getTop().then((r) => {
        if (r) {
          navigator.app.exitApp();
        }
      }).catch((e) => {
        console.error(e);
      });
    });
    
  }

  showExitConfirm() {
    this.exit = true;
    this.alertController.create({
      header: 'Salir',
      message: '¿Desea cerrar la aplicación?',
      backdropDismiss: false,
      buttons: [{
        text: 'No',
        role: 'cancel',
        handler: () => {
        }
      }, {
        text: 'Si',
        handler: () => {
          navigator['app'].exitApp();
        }
      }]
    })
      .then(alert => {
        alert.present();
      });
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
  async ngOnInit() {
    // If using a custom driver:
    // await this.storage.defineDriver(MyCustomDriver)
    await this.storage.create();
  }
  // navigateToValladolid() {
  //   this.router.navigate(['/valladolid']);
  //   this.closeMenu();
  // }
}
