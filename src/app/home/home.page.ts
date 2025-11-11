import { Component } from '@angular/core';
import { ModalController, NavController, LoadingController, AlertController, ActionSheetController } from '@ionic/angular';
import { IonicStorageModule, Storage } from '@ionic/storage-angular';
// import { LanguageService } from 'src/services';
// import { EventoService } from 'src/services/evento.service';
import * as moment from 'moment';
// import { forEach } from 'lodash';
import { AuthService } from '../services/auth.service';
import { SharedService } from '../services/shared.service';
import { EventoService } from '../services/evento.service';
import { LanguageService } from '../services';
import { SqliteService } from '../services/sqlite.service';
export interface Ticket {
  code: string;
  view: boolean;
  ticket_status: number;
  [key: string]: any;
  event_id: any;
  ticket_id: string;
  acceso: string;
  numeroOrden: any;
  evento_id: string;
  username: any;
  fecha_lectura: string;
  created_at: string;
  updated_at: string;
  sent: number;
  codeNumericQR: string;
  checkin: number;
  codigoCompra?: string;
}
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
    private sqliteService: SqliteService
  ) {
    this.langSvc.getSelectedIdiom$().subscribe((result: { idioma: any; }) => {
      // translate.addLangs(['es', 'pt']);
      // translate.setDefaultLang(result.idioma);
      // translate.use(result.idioma);
    });
    this.getUser();
  }
  async ngOnInit() {
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
    console.log('event.id', event.id);

    event.accesos.forEach(element => {
      buttons.push({
        text: element,
        handler: async () => {
          // Inicia la base de datos antes de guardar
          await this.sqliteService.initEventDB(event.id);

          this.eventoService.getTicekts(event.id, '').subscribe({
            next: async (tickets: Ticket[]) => {
              try {
                // Guardar cada ticket en SQLite
                for (const t of tickets) {
                  t.event_id = event.id;
                  await this.sqliteService.addTicket(t);
                }

                console.log('✅ Tickets guardados en SQLite');

                // Navegar a scanner pasando el evento, acceso y tickets
                await this.navCtrl.navigateRoot(['/scanner', event.id], {
                  queryParams: { name: event.name, acceso: element }
                });
              } catch (err) {
                console.error('Error guardando tickets en SQLite:', err);
              }
            },
            error: async (error) => {
              console.error('Error descargando tickets:', error);
            }
          });
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
