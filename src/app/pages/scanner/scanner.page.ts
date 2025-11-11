import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform, ToastController } from '@ionic/angular';
import { ActionSheetController, AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { HostListener } from '@angular/core';
import { Broadcaster } from '@awesome-cordova-plugins/broadcaster/ngx';
import { IonicStorageModule, Storage } from '@ionic/storage-angular';
import { ModalScannerPage } from './modal/modal.page';
import * as moment from 'moment';
import { EventoService } from 'src/app/services/evento.service';
import { Network } from '@capacitor/network';

interface Escaneado {
  code: string;
  acceso: string;
  date: string;
}
interface Ticket {
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
}
interface TicketItem {
  [key: string]: any;
  ticket_id: string;
  codeNumericQR: string;
  acceso: string;       // o el tipo que corresponda
  numeroOrden: number;
  checkin: number;

}
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { SqliteService } from 'src/app/services/sqlite.service';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  standalone: false,
})
export class ScannerPage implements OnInit {

  title = '';
  acceso = '';
  code = '';
  escaneados: Escaneado[] = [];
  event_id = '';
  key_event_history = '';
  key_event_tickets = '';
  key_event_entered = '';
  key_event_history_online = '';
  tickets: Ticket[] = [];
  last_update = '';
  last_history = '';
  list = 'local';
  seconds = 5;
  isDownloading = false;
  isDownloadingH = false;
  user: { username: any } | undefined | null;
  entered: Ticket[] = [];
  lecturaOnline: Ticket[] = [];
  displayedOnline: any[] = [];
  LIMIT1 = 50;
  LIMIT2 = 50;
  LIMIT3 = 50;
  totalTickets = 0;
  isSupported = false;
  barcodes: any;
  listQrPrev: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private broadcaster: Broadcaster,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private ref: ChangeDetectorRef,
    private storage: Storage,
    private eventoService: EventoService,
    private loadingCtrl: LoadingController,
    private modalController: ModalController,
    public toastController: ToastController,
    private platform: Platform,
    private sqliteService: SqliteService

  ) {
    this.route.queryParams.subscribe(params => {
      //   this.title = params["name"];
      this.acceso = params["acceso"];
      // });
      // this.route.params.subscribe(async params => {
      //   this.event_id = params["event_id"];
      //   this.key_event_history = 'tickets_history_' + this.event_id;
      //   this.key_event_history_online = 'tickets_history_online' + this.event_id;
      //   this.key_event_tickets = 'tickets_dataset_' + this.event_id;
      //   this.key_event_entered = 'tickets_entered_' + this.event_id;

      //   this.storage.get(this.key_event_tickets).then((tickets) => {

      //     if (!Array.isArray(tickets) || tickets.length === 0) {
      //       this.firstDownload();
      //     } else {
      //       this.tickets = tickets;
      //       console.log('this.tickets', this.tickets);
      //       this.setLastUpdate(tickets);
      //     }
      //   }).catch(error => {
      //     console.error('Error al obtener tickets desde el storage:', error);
      //     this.firstDownload();
      //   });

      //   this.getEnteder();
      //   this.getHistorialOffline()
    });
    setInterval(() => {
      this.ref.detectChanges();
    }, 100);
    //this.getUser();
  }
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const key = event.key;
    if (key === 'Enter') {
      console.log('code', this.code)
      if (this.code != '') {
        this.findTicket(this.code);
        this.escaneados.unshift({ code: this.code, acceso: this.acceso, date: moment().format('YYYY-MM-DD HH:mm:ss') });
        //this.storage.set(this.key_event_history, this.escaneados);
        this.code = '';
        // alert('entre al principio if');
      }
    } else {
      this.code += key;
      // alert('entre al principio else');

    }
  }



  async cameraScan(): Promise<void> {
    await BarcodeScanner.checkPermission({ force: true });

    // Oculta fondo (solo efecto visual)
    document.body.classList.add('scanner-active');
    await BarcodeScanner.hideBackground();

    const result = await BarcodeScanner.startScan();

    if (result.hasContent) {
      console.log('Código escaneado:', result.content);
    } else {
      console.log('No se detectó ningún código');
    }

    await BarcodeScanner.showBackground();
    document.body.classList.remove('scanner-active');
  }


  // async requestPermissions(): Promise<boolean> {
  //   try {
  //     // Solicita los permisos al usuario
  //     const result = await BarcodeScanner.requestPermissions();

  //     // En esta versión, el resultado viene en formato:
  //     // { camera: 'granted' | 'denied' | 'limited' | 'prompt' }
  //     const cameraStatus = result.camera;

  //     if (cameraStatus === 'granted' || cameraStatus === 'limited') {
  //       console.log( Permisos de cámara concedidos');
  //       return true;
  //     } else {
  //       console.warn('🚫 Permisos de cámara no concedidos:', cameraStatus);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error(' Error solicitando permisos de cámara:', error);
  //     return false;
  //   }
  // }

  async presentAlert2(response: any) {
    // Intentamos mostrar un mensaje más limpio
    let message = '';

    if (typeof response === 'string') {
      message = response;
    } else if (response && typeof response === 'object') {
      try {
        message = JSON.stringify(response, null, 2);
      } catch {
        message = 'Respuesta no se puede mostrar correctamente';
      }
    } else {
      message = 'Respuesta inesperada';
    }

    const alert = await this.alertController.create({
      header: 'Respuesta del servidor',
      message: `<pre style="white-space: pre-wrap;">${message}</pre>`, // Usa <pre> para mantener formato
      buttons: ['OK']
    });

    await alert.present();
  }

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message: 'Please grant camera permission to use the barcode scanner.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  async presentErrorAlert(
    header: string = 'Scan Error',
    message: string = 'An error occurred while scanning. Please try again.'
  ): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      cssClass: 'error-alert', // puedes crear estilos para este alert en global.scss
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
          handler: () => {
            console.log('Alert dismissed');
          }
        }
      ],
    });
    await alert.present();
  }


  // async getUser(): Promise<void> {
  //   try {
  //     const user = await this.storage.get('user');
  //     this.user = user;
  //   } catch (error) {
  //     console.error('Error al obtener el usuario del storage', error);
  //     this.user = null; // o algún valor por defecto
  //   }
  // }

  async viewTicket(ticket_id: string) {

    let idEvento = '';
    let codeTick = '';

    const tt = ticket_id.toLowerCase();
    const parts = tt.split('-');

    if (parts.length === 2) {
      [idEvento, codeTick] = parts;
    } else {
      codeTick = ticket_id;
    }

    const response = this.findOccurrences(codeTick);

    if (!response || (await response).length === 0) {
      this.presentToast('danger', 'Ticket no encontrado', 'No válido para éste evento o actualice los últimos tickets');
      return;
    }

    // Para evitar abrir muchos modales simultáneamente, esperamos uno a la vez
    for (const item of await response) {
      item.view = true;
      await this.modalScanner(item);
    }
  }

  async localScaned() {
    try {
      const eventos = await this.storage.get(this.key_event_history);
      if (eventos) {
        this.escaneados = eventos;
      }
    } catch (error) {
      console.error('Error loading scanned events:', error);
    }
  }

  async getTotalTickets() {
    try {
      const totalTickets = await this.storage.get('totalTickets-' + this.event_id);
      if (totalTickets !== undefined && totalTickets !== null) {
        this.totalTickets = totalTickets;
      }
    } catch (error) {
      console.error('Error getting total tickets:', error);
    }
  }

  async ngOnInit() {
    try {
      const isAvailable = !!BarcodeScanner.startScan;
      this.isSupported = isAvailable;
      console.log('BarcodeScanner disponible:', isAvailable);
    } catch (error) {
      console.error('Error verificando soporte de BarcodeScanner:', error);
      this.isSupported = false;
    }


    //await this.localScaned();
    //await this.getTotalTickets();
    //this.getHistorialQr();

    // await this.storage.create(); // ¡Esto es obligatorio!
    // const saved = await this.storage.get(this.key_event_entered);
    // if (saved) {
    //   this.entered = saved;
    // }

    // setInterval(() => {
    //   if (!this.isDownloading) {
    //     this.autoUpdate();
    //   }
    //   if (!this.isDownloadingH) {
    //     this.getHistorial();
    //   }
    // }, this.seconds * 1000);
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        await this.syncOfflineTickets();
      }
    });

    // También intenta sincronizar al abrir si ya hay red
    const status = await Network.getStatus();
    if (status.connected) {
      await this.syncOfflineTickets();
    }
    this.route.params.subscribe(async params => {
      this.event_id = params["event_id"];
      await this.setTotalTickets();
      // this.getEnteder();
      // this.getHistorialOffline();
    });
  }
  private async syncOfflineTickets() {
    await this.sqliteService.syncOfflineScans(async (scans) => {
      try {
        // 👇 Aquí llamas tu endpoint real para subir los escaneos
        await this.eventoService.uploadScannedTickets(scans).toPromise();

        console.log('📡 Escaneos enviados al servidor');
        return true;
      } catch (err) {
        console.error(' Error enviando escaneos:', err);
        return false;
      }
    });
  }
  maxDate(date1: string, date2: string): string {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1 > d2 ? date1 : date2;
  }
  setLastUpdateHistory(array: any[] | null) {
    if (Array.isArray(array) && array.length > 0) {
      const maxLastUpdate = array.reduce((maxDate, currentObj) => {
        return this.maxDate(currentObj.fecha_lectura, maxDate);
      }, array[0].fecha_lectura);
      this.last_history = maxLastUpdate;
    } else {
      this.last_history = '';
    }
  }

  setLastUpdate(array: any[] | null) {
    if (Array.isArray(array) && array.length > 0) {
      const maxLastUpdate = array.reduce((maxDate, currentObj) => {
        return this.maxDate(currentObj.last_update, maxDate);
      }, array[0].last_update);
      this.last_update = maxLastUpdate;
    } else {
      this.last_update = '';
    }
  }

  async initCounter() {
    await Promise.all([
      this.storage.remove(this.key_event_history),
      this.storage.remove(this.key_event_history_online),
      this.storage.remove(this.key_event_tickets),
      this.storage.remove(this.key_event_entered)
    ]);
    this.entered = [];
    this.lecturaOnline = [];
    this.escaneados = [];
  }

  async setTotalTickets(): Promise<void> {
    try {
      const result = await this.sqliteService.getTicketsByEvent(this.event_id);
      const tickets = result.values || [];
      const totalTickets = tickets.filter((ticket: { ticket_status: number; }) => ticket.ticket_status === 1).length;

      this.totalTickets = totalTickets; // puedes almacenarlo en una variable de clase
      console.log('🎟️ Total de tickets activos:', totalTickets);
    } catch (error) {
      console.error(' Error calculando totalTickets:', error);
    }
  }


  async firstDownload(): Promise<void> {
    this.initCounter();

    const loading = await this.loadingCtrl.create({
      mode: 'ios',
      message: 'Descargando tickets',
    });

    await loading.present();

    this.eventoService.getTicekts(this.event_id, '').subscribe({
      next: async (tickets) => {
        this.tickets = tickets;
        await this.storage.set(this.key_event_tickets, tickets);
        this.setLastUpdate(tickets);
        await loading.dismiss();
        this.setTotalTickets();
        this.getHistorial();
      },
      error: async (error) => {
        console.error('Error descargando tickets:', error);
        await loading.dismiss();
      }
    });
  }

  async getHistorialOffline(): Promise<void> {
    try {
      const historyOnline = await this.storage.get(this.key_event_history_online);
      if (historyOnline) {
        this.lecturaOnline = historyOnline;
        this.loadInitialItems();
      }
    } catch (error) {
      console.error('Error obteniendo historial offline:', error);
    }
  }

  async getHistorial() {
    this.isDownloadingH = true;
    const last_history = this.last_history;

    this.eventoService.getHistorial(this.event_id, last_history).subscribe({
      next: async (tickets) => {
        if (tickets && tickets.length) {
          try {
            const historyOnline = (await this.storage.get(this.key_event_history_online)) || [];

            for (const item of tickets) {
              const itemd: Ticket = {
                ticket_id: item.ticket_id,
                event_id: item.event_id,
                acceso: 'ONLINE',
                username: item.username,
                numero_orden: item.numero_orden,
                fecha_lectura: item.fecha_lectura,
                created_at: item.created_at,
                updated_at: item.updated_at,
                sent: 1,
                code: '',
                view: false,
                ticket_status: 1,
                numeroOrden: item.numero_orden,
                evento_id: this.event_id,
                codeNumericQR: item.codeNumericQR,
                checkin: 0
              };

              const exists = historyOnline.find((obj: { ticket_id: any; }) => obj.ticket_id === item.ticket_id);
              if (!exists) {
                historyOnline.push(itemd);
              }
            }

            this.lecturaOnline = historyOnline;
            this.setLastUpdateHistory(this.lecturaOnline);
            await this.storage.set(this.key_event_history_online, this.lecturaOnline);
          } catch (error) {
            console.error('Error accessing storage:', error);
          }
        }
        this.isDownloadingH = false;
      },
      error: (error) => {
        console.error('Error fetching historial:', error);
        this.isDownloadingH = false;
      }
    });
  }

  async getHistorialQr() {
    this.isDownloadingH = true;
    this.eventoService.getHistorialQr(this.event_id).subscribe({
      next: async (qr) => {
        this.isDownloadingH = false;
        if (qr) {
          this.listQrPrev = qr;
        }
      },
      error: (error) => {
        console.error('Error fetching historial QR:', error);
        this.isDownloadingH = false;
      }
    });
  }


  async autoUpdate() {
    console.log('entre a autoUpdate');
    this.isDownloading = true;
    try {
      const last_update = this.last_update;
      const params = (last_update && last_update !== '') ? `date=${last_update}` : '';
      const tickets: Ticket[] = await this.eventoService.getTicekts(this.event_id, params).toPromise();

      tickets.forEach((item: Ticket) => {
        if (item.numeroOrden === "149989") {
        }

      });
      if (tickets && tickets.length) {
        let ticketsSaved = await this.storage.get(this.key_event_tickets) || [];


        // Crear un Map para buscar tickets guardados por ticket_id
        const savedMap = new Map(ticketsSaved.map((t: Ticket) => [t.ticket_id, t]));

        // Actualizar o agregar tickets nuevos
        tickets.forEach((item: Ticket) => {
          savedMap.set(item.ticket_id, item);
        });

        // Convertir Map a array
        ticketsSaved = Array.from(savedMap.values());

        await this.storage.set(this.key_event_tickets, ticketsSaved);
        this.tickets = ticketsSaved;

        this.setLastUpdate(tickets);
        await this.setTotalTickets();
      }
    } catch (error) {
      console.error('Error en autoUpdate:', error);
    } finally {
      this.isDownloading = false;
    }

    this.upload();
  }


  async syncTickets() {
    const loading = await this.loadingCtrl.create({
      mode: 'ios',
      message: 'Descargando tickets',
    });
    await loading.present();

    this.isDownloading = true;
    try {
      const last_update = this.last_update || '';
      const tickets = await this.eventoService.getTicekts(this.event_id, `date=${last_update}`).toPromise();

      let ticketsSaved = await this.storage.get(this.key_event_tickets) || [];

      // Usamos un Map para actualizar o agregar tickets sin duplicados
      const savedMap = new Map(ticketsSaved.map((t: { ticket_id: any; }) => [t.ticket_id, t]));
      tickets.forEach((item: any) => savedMap.set(item.ticket_id, item));

      ticketsSaved = Array.from(savedMap.values());

      await this.storage.set(this.key_event_tickets, ticketsSaved);
      this.setLastUpdate(tickets);

    } catch (error) {
      console.error('Error sincronizando tickets:', error);
    } finally {
      this.isDownloading = false;
      await loading.dismiss();
    }
  }


  goBack() {
    this.navCtrl.back();
  }

  async actionSheet() {
    const buttons = [
      {
        text: "Sincronizar escaneo local",
        handler: async () => {
          await this.upload();
        }
      },
      {
        text: "Descargar todo de nuevo",
        handler: async () => {
          await this.firstDownload();
        }
      },
      {
        text: "Sincronizar Historial",
        handler: async () => {
          this.syncHistorial();
        }
      },
      {
        text: "Descargar últimos",
        handler: async () => {
          await this.syncTickets();
        }
      }
    ];

    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione una opción deseada',
      buttons
    });
    await actionSheet.present();
  }

  async presentToast(color = "medium", title = "", message = "", item: TicketItem | null = null) {
    const buttons: any[] = [
      {
        icon: 'close-outline',
        role: 'cancel',
        handler: () => { },
      }
    ];

    if (item?.ticket_id) {
      buttons.push({
        side: 'start',
        text: 'Ver',
        icon: 'eye',
        handler: () => {
          this.modalScanner(item);
        },
      });
    }

    const toast = await this.toastController.create({
      color,
      header: title || "",
      message,
      duration: 2500,
      buttons,
    });

    await toast.present();
  }

  async alert(title: string, subtitle: string, message: string, item: TicketItem | null = null) {
    const buttons: any[] = [
      {
        text: 'OK',
        handler: () => { },
      }
    ];

    if (item?.ticket_id) {
      buttons.unshift({
        text: 'Ver',
        role: 'cancel',
        cssClass: 'secondary',
        handler: () => {
          this.modalScanner(item);
        },
      });
    }

    const alert = await this.alertController.create({
      header: title,
      subHeader: subtitle,
      message,
      buttons
    });

    await alert.present();
  }


  isEntered(ticket_id: string) {
    if (this.entered.length === 0 && this.lecturaOnline.length === 0) {
      return false;
    }

    const online = this.lecturaOnline.find(obj => obj.ticket_id === ticket_id);

    if (online) {
      console.log("online")
      return online;
    }

    console.log("local")
    const local = this.entered.find(obj => obj.ticket_id === ticket_id);
    return local || false;




  }

  check(item: TicketItem | null | undefined): boolean {
    if (!item) {
      // Manejar caso cuando item es null o undefined
      return false;
    }

    if (item.acceso !== this.acceso) {
      this.alert(
        'ACCESO INCORRECTO',
        'Su acceso es por: ' + item.acceso,
        'El ticket no es válido para este acceso: ' + this.acceso,
        item
      );
      return false;
    }

    if (item['ticket_status'] === 0) {
      this.presentToast('danger', 'Ticket cancelado', item.ticket_id, item);
      return false;
    }

    console.log("ticket_id ", item.ticket_id)
    const existente = this.isEntered(item.ticket_id);
    console.log('existente', JSON.stringify(existente, null, 2));
    if (existente) {
      if (existente.checkin === 0) {
        console.log("existente sent")
        this.presentToast(
          'danger',
          'Ticket escaneado',
          'El ticket ha sido escaneado anteriormente por éste dispositivo',
          existente
        );
        return false;
      }
      console.log("sent 0")

      return true;
    }

    if (item.checkin === 0) {
      this.presentToast('danger', 'Ticket sin créditos', 'Se agotaron los créditos disponibles para entrar', item);
      return false;
    }

    return true;
  }

  async findTicket(ticket: any) {
    let idEvento = '';
    let codeTick = '';

    const isNumeric = /^\d+$/.test(ticket);
    if (isNumeric) {
      codeTick = ticket;
    } else {
      const tt = ticket.toLowerCase();
      const parts = tt.split('-');
      codeTick = parts.length !== 2 ? tt : parts[1];
      idEvento = parts.length !== 2 ? '' : parts[0];
    }

    const isOnline = navigator.onLine;
    console.log('🔍 Escaneando ticket:', codeTick, 'Online?', isOnline);

    // 🔹 Verificamos la cantidad total de tickets
    const totalTickets = await this.sqliteService.countTickets();
    console.log(`📊 Total de tickets en SQLite: ${totalTickets}`);

    let response: any[] = [];

    if (totalTickets > 70000) {
      // ⚡ Si hay muchos registros, buscar por codigoCompra
      console.log('🚀 Modo optimizado: buscando por codigoCompra');
      response = await this.findOccurrencesByCompra(codeTick);
    } else {
      // 🔹 Buscar según tipo (numérico o alfanumérico)
      response = isNumeric
        ? await this.findOccurrences(codeTick)
        : await this.findOccurrencesAlfa(codeTick);
    }

    if (!response || response.length === 0) {
      this.presentToast('danger', 'Ticket no encontrado', 'No válido o necesita actualizar');
      return;
    }

    const itemFindTicket = response[0];

    const alreadyScanned = await this.sqliteService.isTicketScanned(itemFindTicket.ticket_id);
    if (alreadyScanned) {
      this.presentToast('danger', 'Ticket duplicado', 'Ya fue escaneado anteriormente');
      return;
    }

    const isValid = this.check(itemFindTicket);
    if (!isValid) return;

    await this.sqliteService.addScannedTicket(itemFindTicket, isOnline);

    itemFindTicket.checkin--;
    this.setEnteder(itemFindTicket);
    this.presentToast('success', 'Acceso Permitido', 'Permitir entrada al evento', itemFindTicket);
  }
async findOccurrencesByCompra(ticketId: string): Promise<any[]> {
  try {
    const db = await this.sqliteService.getDatabase();
    const query = `
      SELECT * FROM tickets
      WHERE codigoCompra = ?
         OR codeNumericQR = ?
         OR LOWER(ticket_id) = ?;
    `;
    const result = await db.query(query, [ticketId, ticketId, ticketId.toLowerCase()]);
    console.log('🎯 Resultados por codigoCompra:', result.values?.length || 0);
    return result.values ?? [];
  } catch (err) {
    console.error('❌ Error buscando por codigoCompra:', err);
    return [];
  }
}

  async uploadScannedTickets() {
    try {
      const db = await this.sqliteService.getDatabase();
      const result = await db.query(`SELECT * FROM scanned_tickets WHERE sent = 0;`);
      const ticketsToUpload = result.values || [];

      for (const ticket of ticketsToUpload) {
        this.eventoService.checkin(ticket).subscribe({
          next: async () => {
            await db.run(`UPDATE scanned_tickets SET sent = 1 WHERE ticket_id = ?;`, [ticket.ticket_id]);
            console.log(`☁️ Ticket sincronizado: ${ticket.ticket_id}`);
          },
          error: (err) => {
            console.error(' Error subiendo ticket:', err);
          }
        });
      }
    } catch (err) {
      console.error(' Error en uploadScannedTickets:', err);
    }
  }




  async getEnteder() {
    try {
      const entered = await this.storage.get(this.key_event_entered);
      this.entered = Array.isArray(entered) ? entered : [];
    } catch (error) {
      console.error('Error al obtener entradas almacenadas:', error);
      this.entered = [];
    }
  }

  setEnteder(item: Ticket) {
    const dt = moment().format('YYYY-MM-DD HH:mm:ss');
    const data = {
      ticket_id: item.ticket_id,
      acceso: item.acceso,
      numeroOrden: item.numeroOrden,
      evento_id: this.event_id,
      username: this.user?.username,
      fecha_lectura: dt,
      created_at: dt,
      updated_at: dt,
      sent: 1,
      code: item.code || '',
      view: item.view ?? false,
      ticket_status: 1,
      event_id: this.event_id,
      codeNumericQR: item.codeNumericQR || '0',
      checkin: 0
    };


    this.eventoService.checkin(data).subscribe(
      async (response) => {

        this.entered.unshift(data);
        await this.storage.set(this.key_event_entered, this.entered);
      },
      async (errors) => {
        const registro = {
          ...data,
          sent: 0
        };
        this.entered.unshift(registro);
        await this.storage.set(this.key_event_entered, this.entered);
      }
    );
  }

  upload() {
    // Filtra los tickets que no han sido enviados los estan en local
    const ticketsToUpload = this.entered.filter(item => item.sent === 0);
    console.log('response upload:', JSON.stringify(ticketsToUpload, null, 2));

    //envia los pendietes que estan en local
    ticketsToUpload.forEach((item) => {

      const dt = moment().format('YYYY-MM-DD HH:mm:ss');
      const data: Ticket = {
        ticket_id: item.ticket_id,
        acceso: item.acceso,
        numeroOrden: item.numeroOrden,
        evento_id: this.event_id,
        username: this.user?.username,
        fecha_lectura: item.fecha_lectura,
        created_at: item.created_at,
        updated_at: dt, // Actualizar el tiempo de actualización
        sent: 1,
        code: '', // Asignar valor adecuado si lo tienes
        view: false, // Asignar valor adecuado si lo tienes
        ticket_status: 1,
        event_id: this.event_id,
        codeNumericQR: item.codeNumericQR,
        checkin: item.ticket_status
      };

      this.eventoService.checkin(data).subscribe({
        next: (response) => {
          //this.presentAlert2(response);

          // Actualizar la lista de tickets enviados
          const idx = this.entered.findIndex(objeto => objeto.ticket_id === item.ticket_id);
          if (idx !== -1) {
            this.entered[idx] = data;  // Reemplaza el ticket con la info actualizada
          } else {
            this.entered.push(data); // En caso que no lo encuentre (por seguridad)
          }

          // Guardar los tickets actualizados en storage
          this.storage.set(this.key_event_entered, this.entered);
        },
        error: (error) => {
          console.error('Error al subir ticket:', error);
          // Aquí puedes manejar el error, por ejemplo, mostrar un toast o alert
        }
      });
    });
  }

  async deleteItemFromList(item: any, list: any[], listType: number) {

    // Crear nuevo arreglo sin el item a eliminar
    const newList = list.filter(i => i !== item);

    switch (listType) {
      case 0:
        this.entered = newList;
        await this.storage.set(this.key_event_entered, this.entered);
        break;
      case 1:
        this.escaneados = newList;
        await this.storage.set(this.key_event_tickets, this.escaneados);
        break;
      case 2:
        this.lecturaOnline = newList;
        await this.storage.set(this.key_event_history_online, this.lecturaOnline);
        this.setLastUpdateHistory(this.lecturaOnline);
        break;
      default:
        break;
    }
  }

  // 🔹 Busca tickets por codeNumericQR (numéricos)
  // 🔹 Busca tickets por codeNumericQR (numéricos)
  async findOccurrences(ticketId: string): Promise<any[]> {
    try {
      const db = await this.sqliteService.getDatabase();
      const query = `SELECT * FROM tickets WHERE codeNumericQR = ?;`;
      const result = await db.query(query, [ticketId]);
      return result.values ?? [];
    } catch (err) {
      console.error(' Error buscando ticket numérico:', err);
      return [];
    }
  }

  // 🔹 Busca tickets por ticket_id (alfanuméricos)
  async findOccurrencesAlfa(ticketId: string): Promise<any[]> {
    try {
      const db = await this.sqliteService.getDatabase();
      const query = `SELECT * FROM tickets WHERE LOWER(ticket_id) = ?;`;
      const result = await db.query(query, [ticketId.toLowerCase()]);
      return result.values ?? [];
    } catch (err) {
      console.error(' Error buscando ticket alfanumérico:', err);
      return [];
    }
  }


  // 🔹 (Opcional) Busca por QR explícito (para compatibilidad)
  async findOccurrencesQr(_data: any, ticketQr: string): Promise<any[]> {
    try {
      const db = await this.sqliteService.getDatabase();
      const query = `SELECT * FROM tickets WHERE codeNumericQR = ?;`;
      const result = await db.query(query, [ticketQr]);
      result.values?.forEach(item => console.log('item en findqr', JSON.stringify(item, null, 2)));
      return result.values ?? [];
    } catch (err) {
      console.error(' Error buscando ticket QR:', err);
      return [];
    }
  }


  async modalScanner(item: TicketItem) {
    const modal = await this.modalController.create({
      component: ModalScannerPage,
      componentProps: {
        'item': item,
        'entered': this.entered,
        'online': this.lecturaOnline || this.entered,
      }
    });
    modal.onDidDismiss().then(response => {

    });
    return await modal.present();
  }

  segmentChanged(ev: any) {
    this.list = ev.detail.value;
  }
  loadInitialItems() {
    // Carga los primeros 10 elementos
    this.displayedOnline = this.lecturaOnline.slice(0, 10);
  }
  loadMoreLectura(event: any) {
    const startIndex = this.displayedOnline.length;
    const endIndex = startIndex + 10;

    if (startIndex < this.lecturaOnline.length) {
      this.displayedOnline = this.displayedOnline.concat(this.lecturaOnline.slice(startIndex, endIndex));
    }

    event.target.complete();

    // Si ya cargaste todos los elementos, deshabilita el infinite scroll
    if (this.displayedOnline.length >= this.lecturaOnline.length) {
      event.target.disabled = true;
    }
  }
  async syncHistorial() {
    this.escaneados.forEach((item) => {
      const rt = this.lecturaOnline.find((objeto) => objeto.codeNumericQR === item.code);

      console.log('item en sincronizar historial ', JSON.stringify(item, null, 2));
      console.log('this.lecturaOnline ', JSON.stringify(this.lecturaOnline, null, 2));
      console.log('rt', rt);
      //return;
      if (!rt) {
        this.findTicket(item.code);
      }
    });
    const alertHistorial = await this.alertController.create({
      header: "SYNC HISTORIAL",
      subHeader: "PROCESO TERMINADO",
      message: "PROCESO TERMINADO",
      buttons: ['OK']
    });
    await alertHistorial.present();
  }
}
