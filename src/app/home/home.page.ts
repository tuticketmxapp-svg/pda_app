import { Component } from '@angular/core';
import { ModalController, NavController, LoadingController, AlertController, ActionSheetController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
// import { LanguageService } from 'src/services';
// import { EventoService } from 'src/services/evento.service';
import * as moment from 'moment';
// import { forEach } from 'lodash';
import { AuthService } from '../services/auth.service';
import { SharedService } from '../services/shared.service';
import { EventoService } from '../services/evento.service';
import { LanguageService } from '../services';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  user: any;
  eventos: any;
  token: any;
  constructor(
    private eventoService: EventoService,
    private navCtrl: NavController,
    private authService: AuthService,
    private actionSheetController: ActionSheetController,
    private sharedService: SharedService,
    private storage: Storage,
    private langSvc: LanguageService,
    private loadingCtrl: LoadingController,
  ) {
    this.langSvc.getSelectedIdiom$().subscribe((result: { idioma: any; }) => {
      // translate.addLangs(['es', 'pt']);
      // translate.setDefaultLang(result.idioma);
      // translate.use(result.idioma);
    });
    this.getUser();
  }
  ngOnInit() {
    this.getUpcomingEvents();
  }
  async ionViewWillEnter() {
    this.token = await this.storage.get('access_token');
  }
  async localEvents() {
    this.storage.get('eventos').then((eventos: any) => {
      this.eventos = eventos;
    });
  }
  async getUpcomingEvents() {

    this.localEvents();
    const loading = await this.loadingCtrl.create({
      mode: 'ios',
      message: 'Loading',
    });
    await loading.present();
    const today = moment().subtract(3, 'days').format();
    const to = moment().add(30, 'days').format();
    this.eventoService.getUpcomingEvents(today, to).subscribe(async (data: any) => {
      await loading.dismiss();
      const filteredList = data.filter((obj: { sale_channel_ticket_office: number; }) => obj.sale_channel_ticket_office === 1);
      this.eventos = filteredList;
      this.storage.set('eventos', this.eventos);
    }, async () => { await loading.dismiss(); });
    this.getUser();
  }
  async getUser() {
    this.eventoService.getUser().subscribe(async (data: any) => {
      this.storage.set('user', data);
    });
  }
  async selectEntrada(event: { accesos: any[]; id: any | string; name: any; }) {
    let buttons: { text: any; handler: () => Promise<void>; }[] = [];
    event.accesos.forEach(element => {
      buttons.push({
        text: element,
        handler: async () => {
          await this.navCtrl.navigateRoot(['/scanner', event.id], { queryParams: { name: event.name, acceso: element } })
        }
      });
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione entrada',
      buttons
    });
    await actionSheet.present();
  }
}
