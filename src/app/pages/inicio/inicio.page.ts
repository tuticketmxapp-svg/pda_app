import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LanguageService } from 'src/app/services';
@Component({
    selector: 'app-inicio',
    templateUrl: './inicio.page.html',
    standalone: false,
})
export class InicioPage {
    mostrarForm: boolean | undefined;
    logoVisible = false;

    constructor(
        private navCtrl: NavController,
        private langSvc: LanguageService
    ) {
        this.langSvc.getSelectedIdiom$().subscribe((result) => {
            // translate.addLangs(['es', 'pt']);
            // translate.setDefaultLang(result.idioma);
            // translate.use(result.idioma);
        })
    }
    goToLogin() {
        this.navCtrl.navigateRoot('/login');
    }
    goToForgot() {
        this.navCtrl.navigateRoot('/forgot');
    }
}
