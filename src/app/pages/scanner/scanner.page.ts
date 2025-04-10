import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ActionSheetController, AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { HostListener } from '@angular/core';
import { Broadcaster } from '@awesome-cordova-plugins/broadcaster/ngx';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Storage } from '@ionic/storage';
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
  ticket_id: any;
  acceso: any;
  numeroOrden: any;
  evento_id: string;
  username: any;
  fecha_lectura: string;
  created_at: string;
  updated_at: string;
  sent: number;
  codeNumericQR: string;
}
interface TicketItem {
  ticket_id: string;
  [key: string]: any;
  acceso: string;
  ticket_status: number;
  checkin: number;
}

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
  user: { username: any; } | undefined;
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
  ) {
    this.route.queryParams.subscribe(params => {
      this.title = params["name"];
      this.acceso = params["acceso"];
    });
    this.route.params.subscribe(async params => {
      this.event_id = params["event_id"];
      this.key_event_history = 'tickets_history_' + this.event_id;
      this.key_event_history_online = 'tickets_history_online' + this.event_id;
      this.key_event_tickets = 'tickets_dataset_' + this.event_id;
      this.key_event_entered = 'tickets_entered_' + this.event_id;
      this.storage.get(this.key_event_tickets).then((tickets) => {
        if (tickets == null || tickets == '') {
          this.firstDownload();
        } else {
          this.tickets = tickets;
          console.log('this.tickets',this.tickets);
          this.setLastUpdate(tickets);
        }
      });
      this.getEnteder();
      this.getHistorialOffline()
    });
    setInterval(() => {
      this.ref.detectChanges();
    }, 100);
    this.getUser();
  }
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const key = event.key;
    if (key === 'Enter') {
      if (this.code != '') {
        this.findTicket(this.code);
        this.escaneados.unshift({ code: this.code, acceso: this.acceso, date: moment().format('YYYY-MM-DD HH:mm:ss') });
        this.storage.set(this.key_event_history, this.escaneados);
        this.code = '';
        // alert('entre al principio if');
      }
    } else {
      this.code += key;
      // alert('entre al principio else');

    }
  }

  async cameraScan(): Promise<void> {
    try {
      const granted = await this.requestPermissions();
      if (!granted) {
        this.presentAlert();
        return;
      }
      // Inicia el escaneo
      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes && barcodes.length > 0) {
        this.barcodes.push(...barcodes);
      } else {
      }
    } catch (err) {
      this.presentErrorAlert();
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === 'granted' || camera === 'limited';
    } catch (err) {
      return false;
    }
  }
  async presentAlert2(response: any) {
    const alert = await this.alertController.create({
      header: 'Response Data',
      message: JSON.stringify(response, null, 2), // Convierte el objeto a string
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

  async presentErrorAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Scan Error',
      message: 'An error occurred while scanning. Please try again.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  async getUser() {
    this.storage.get('user').then((user) => {
      this.user = user;
    });
  }
  async viewTicket(ticket_id:any) {
    console.log('ticket_id en ', JSON.stringify(ticket_id, null, 2));
   
    let idEvento = '';
    let codeTick = '';
    const tt = ticket_id.toLowerCase();
    const parts = tt.split('-');
    if (parts.length !== 2) {
      codeTick = ticket_id;
    } else {
      [idEvento, codeTick] = parts;
    }
    // this.eventoService.getQr(ticket_id).subscribe(response => {
    //   idEvento = response.eventID;
    //   codeTick = response.ticket_id;
    //   this.presentToast('success', response.eventID, response.ticket_id);
    // }, errors => {
    //   this.presentToast('danger', errors);
    // });

    const response = this.findOccurrences(this.tickets, codeTick);
    if (!response || response.length == 0) {
      this.presentToast('danger', 'Ticket no encontrado viewTicket', 'No válido para éste evento o actualice los últimos tickets');
    } else {
      response.forEach(item => {
        item["view"] = true;
        this.modalScanner(item);
      });
    }
  }
  async localScaned() {
    this.storage.get(this.key_event_history).then((eventos) => {
      if (eventos) {
        this.escaneados = eventos;
      }
    });
  }
  getTotalTickets() {
    this.storage.get('totalTickets-' + this.event_id).then((totalTickets) => {
      if (totalTickets) {
        this.totalTickets = totalTickets;
      }
    });
  }
  ngOnInit() {
    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });
    this.localScaned();
    this.getTotalTickets();
    setInterval(() => {
      if (!this.isDownloading) {
        this.autoUpdate();
      }
      if (!this.isDownloadingH) {
        this.getHistorial();
      }

    }, this.seconds * 1000);
    this.getHistorialQr();
  }
  maxDate(date1: string, date2: string): string {
    return date1 > date2 ? date1 : date2;
  }
  setLastUpdateHistory(array: any[] | null) {
    if (typeof array != "undefined"
      && array != null
      && array.length != null
      && array.length > 0) {
      const maxLastUpdate = array.reduce((maxDate, currentObj) => {
        return this.maxDate(currentObj.fecha_lectura, maxDate);
      }, array[0].fecha_lectura);
      this.last_history = maxLastUpdate;
    } else {
      this.last_history = '';
    }
  }
  setLastUpdate(array: any[] | null) {
    if (typeof array != "undefined"
      && array != null
      && array.length != null
      && array.length > 0) {
      const maxLastUpdate = array.reduce((maxDate, currentObj) => {
        return this.maxDate(currentObj.last_update, maxDate);
      }, array[0].last_update);
      this.last_update = maxLastUpdate;
    } else {
      this.last_update = '';
    }
  }
  initCounter() {
    this.storage.remove(this.key_event_history);
    this.storage.remove(this.key_event_history_online);
    this.storage.remove(this.key_event_tickets);
    this.storage.remove(this.key_event_entered);
    this.entered = [];
    this.lecturaOnline = [];
    this.escaneados = [];
  }
  async setTotalTickets() {
    //filter ARRAY of this.tickets  by ticket_status = 1
    const totalTickets = this.tickets.filter(ticket => ticket.ticket_status === 1).length;
    this.storage.set('totalTickets-' + this.event_id, totalTickets);
    console.log('totalTickets',totalTickets);
    // totalTickets
  }
  async firstDownload() {
    this.initCounter();
    const loading = await this.loadingCtrl.create({
      mode: 'ios',
      message: 'Descargando tickets',
    });
    await loading.present();
    this.eventoService.getTicekts(this.event_id, '').subscribe(async (tickets) => {
      console.log('tickets',tickets);
      await loading.dismiss();
      this.tickets = tickets;
      this.storage.set(this.key_event_tickets, tickets);
      this.setLastUpdate(tickets);
    }, async error => { await loading.dismiss(); });
    this.getHistorial();
    this.setTotalTickets();
  

  }
  async getHistorialOffline() {
    this.storage.get(this.key_event_history_online).then((historyOnline) => {
      if (historyOnline) {
        this.lecturaOnline = historyOnline;
        this.loadInitialItems();
      }
    });
  }
  async getHistorial() {
    const last_history = this.last_history;
    this.isDownloadingH = true;
    this.eventoService.getHistorial(this.event_id, last_history).subscribe(async (tickets) => {
      this.isDownloadingH = false;
      if (tickets) {
        this.storage.get(this.key_event_history_online).then((historyOnline) => {
          tickets.forEach((item: {
            codeNumericQR: string; ticket_id: any; event_id: any; username: any; numero_orden: any; fecha_lectura: any; created_at: any; updated_at: any;
          }) => {
            let itemd: Ticket = {
              ticket_id: item.ticket_id,
              event_id: item.event_id,
              acceso: "ONLINE",
              username: item.username,
              numero_orden: item.numero_orden,
              fecha_lectura: item.fecha_lectura,
              created_at: item.created_at,
              updated_at: item.updated_at,
              sent: 1,
              code: '', // Asigna un valor adecuado a 'code'
              view: false, // Asigna un valor adecuado a 'view'
              ticket_status: 1, // Asigna un valor adecuado a 'ticket_status'
              numeroOrden: item.numero_orden, // Asigna un valor adecuado a 'numeroOrden'
              evento_id: this.event_id, // Asegúrate de que 'evento_id' sea correcto
              codeNumericQR: item.codeNumericQR
            };

            const rt = this.lecturaOnline.find((objeto) => objeto.ticket_id === item.ticket_id);
            if (!rt) {
              this.lecturaOnline.push(itemd);
            }
          });
          this.setLastUpdateHistory(this.lecturaOnline);
          this.storage.set(this.key_event_history_online, this.lecturaOnline);
        });
      }
    }, error => {
      this.isDownloadingH = false;
    });
  }
  async getHistorialQr(){
    console.log('entre getHistorialQr');
    this.eventoService.getHistorialQr(this.event_id).subscribe(async (qr) => {
      this.isDownloadingH = false;
      console.log('qr',qr);
      if (qr) {
        this.listQrPrev = qr;
      
      }
    }, error => {
      this.isDownloadingH = false;
    });
  }

  async autoUpdate() {
    const last_update = this.last_update;
    this.isDownloading = true;
    const $params = (last_update != '' && typeof last_update != 'undefined') ? 'date=' + last_update : '';
    this.eventoService.getTicekts(this.event_id, $params).subscribe(async (tickets) => {
      this.isDownloading = false;
      this.storage.get(this.key_event_tickets).then((ticketsSaved) => {
        if (tickets) {
          tickets.forEach((item: { ticket_id: any; }) => {
            const rt = ticketsSaved.find((objeto: { ticket_id: any; }) => objeto.ticket_id === item.ticket_id);
            if (rt) {
              const idx = ticketsSaved.indexOf(rt);
              if (idx !== -1) {
                ticketsSaved.splice(idx, 1);
                ticketsSaved.push(item);
              }
            } else {
              ticketsSaved.push(item);
            }
          });
          this.storage.set(this.key_event_tickets, ticketsSaved);
          this.tickets = ticketsSaved;
          this.setLastUpdate(tickets);
          this.setTotalTickets();
        }
      });
    }, async error => {
      this.isDownloading = false;
    });
    this.upload();
  }
  async syncTickets() {
    const loading = await this.loadingCtrl.create({
      mode: 'ios',
      message: 'Descargando tickets',
    });
    await loading.present();
    const last_update = this.last_update;
    this.isDownloading = true;
    this.eventoService.getTicekts(this.event_id, 'date=' + last_update).subscribe(async (tickets) => {
      this.isDownloading = false;
      await loading.dismiss();
      this.storage.get(this.key_event_tickets).then((ticketsSaved) => {
        tickets.forEach((item: { ticket_id: any; }) => {
          const rt = ticketsSaved.find((objeto: { ticket_id: any; }) => objeto.ticket_id === item.ticket_id);
          if (rt) {
            const idx = ticketsSaved.indexOf(rt);
            if (idx !== -1) {
              ticketsSaved.splice(idx, 1);
              ticketsSaved.push(item);
            }
          } else {
            ticketsSaved.push(item);
          }
        });
        this.storage.set(this.key_event_tickets, ticketsSaved);
        this.setLastUpdate(tickets);
      });
    }, async error => {
      this.isDownloading = false;
      await loading.dismiss();
    });
  }

  goBack() {
    this.navCtrl.back();
  }
  async actionSheet() {
    let buttons = [];
    buttons.push({
      text: "Sincronizar escaneo local",
      handler: async () => {
        this.upload();

      }
    }, {
      text: "Descargar todo de nuevo",
      handler: async () => {
        this.firstDownload();
      }
    },
      {
        text: "Descargar últimos",
        handler: async () => {
          this.syncTickets();
        }
      },
    );
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccione una opción deseada',
      buttons
    });
    await actionSheet.present();
  }
  async presentToast(color = "medium", title = "", message = "", item: TicketItem | null = null) {
    let buttons: any[] = [];
    buttons = [
      {
        icon: 'close-outline',
        role: 'cancel',
        handler: () => { },
      }
    ];

    if (item) {
      if (item.ticket_id) {
        buttons.push({
          side: 'start',
          text: 'Ver',
          icon: 'eye',
          handler: () => {
            this.modalScanner(item);
          },
        });
      }
    }

    const toast = await this.toastController.create({
      color: color,
      header: title || "",
      message: message,
      duration: 2500,
      buttons: buttons,
    });
    toast.present();
  }
  async alert(title: string, subtitle: string, message: string, item: TicketItem) {  // Cambié el tipo de item a TicketItem
    let buttons = [];
    buttons = [
      {
        text: 'OK',
        handler: () => {
        },
      }
    ];
    if (item && typeof item.ticket_id !== 'undefined') {
      // Asegúrate de que el item tenga las propiedades necesarias
      buttons = [
        {
          text: 'Ver',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.modalScanner(item);  // Aquí item será un TicketItem válido
          },
        },
        {
          text: 'OK',
          handler: () => {
          },
        },
      ];
    }

    const alert = await this.alertController.create({
      header: title,
      subHeader: subtitle,
      message: message,
      buttons: buttons
    });
    await alert.present();
  }

  isEntered(ticket_id: string) {
    const occurrences = [];
    if (this.entered.length == 0 && this.lecturaOnline.length == 0) {
      return false;
    } else {
      let local = this.entered.find((objeto) => objeto.ticket_id === ticket_id);
      let online = this.lecturaOnline.find((objeto) => objeto.ticket_id === ticket_id);
      if (online) {
        return online;
      } else {
        return local;
      }
    }
  }
  check(item: TicketItem | null | undefined) {
    if (!item) {
      // Manejar caso cuando item es null o undefined
      return false;
    }

    if (item.acceso != this.acceso) {
      this.alert('ACCESO INCORRECTO', 'Su acceso es por: ' + item.acceso, "El ticket no es válido para este acceso: " + this.acceso, item);
      return false;
    }
    if (item.ticket_status == 0) {
      this.presentToast('danger', 'Ticket cancelado', item.ticket_id, item);
      return false;
    }
    if (this.isEntered(item.ticket_id)) {
      if (item.checkin == 0) {
        this.presentToast('danger', 'Ticket escaneado', 'El ticket ha sido escaneado anteriormente por éste dispositivo', item);
        return false;
      } else {
        console.log('true');
        return true;

      }
    }
    if (item.checkin == 0) {
      this.presentToast('danger', 'Ticket sin créditos', 'Se agotaron los créditos disponibles para entrar', item);
      return false;
    }
    return true;
  }

  findTicket(ticket: any) {
    console.log('ticket',ticket);
    let idEvento = '';
    let codeTick = '';
    // const tt = ticket.toLowerCase();
    // const parts = tt.split('-');
    // if (parts.length !== 2) {
    //   codeTick = tt;
    // } else {
    //   [idEvento, codeTick] = parts;

    // }
    this.eventoService.getQr(ticket).subscribe(r => {
      idEvento = r.eventID;
      codeTick = r.ticket_id;
      //this.presentToast('success', codeTick);
      const response = this.findOccurrences(this.tickets, codeTick);
      //this.presentAlert2(response);
      // this.presentToast('success', response);
      if (!response || response.length == 0) {
        this.presentToast('danger', 'Ticket no encontrado findTicket', 'No válido para éste evento o actualice los últimos tickets');
      } else {
        response.forEach(item => {

          const isValid = this.check(item);
          if (isValid) {
            item.checkin--;

            this.setEnteder(item).then(success => {
              if (success) {
                this.presentToast('success', 'Acceso Permitido', 'Permitir entrada al evento', item);
              }
            });
          }

        });
        // } else {
        //   this.presentAlert2('else');

        //   const item = response[0];
        //   const isValid = this.check(item);
        //   if (isValid) {
        //     item.checkin--;
        //     this.setEnteder(item);
        //     this.presentToast('success', 'Acceso Permitido', 'Permitir entrada al evento', item);
        //   }
        // }
      }
    }, errors => {
      //this.presentToast('danger', 'entre al primer error');
      console.log('response', ticket);

      const responseQR = this.findOccurrencesQr(this.listQrPrev, ticket);
      console.log('response', JSON.stringify(responseQR, null, 2));
      const response = this.findOccurrences(this.tickets, responseQR[0].ticket_id)
     
      //return;
      if (!response || response.length == 0) {
        this.presentToast('danger', 'Ticket no encontrado findTicket', 'No válido para éste evento o actualice los últimos tickets');
      } else {
        response.forEach(item => {

          const isValid = this.check(item);
          if (isValid) {
            item.checkin--;

            this.setEnteder(item).then(success => {
              if (success) {
                this.presentToast('success', 'Acceso Permitido', 'Permitir entrada al evento', item);
              }
            });
          }

        });
        // } else {
        //   this.presentAlert2('else');

        //   const item = response[0];
        //   const isValid = this.check(item);
        //   if (isValid) {
        //     item.checkin--;
        //     this.setEnteder(item);
        //     this.presentToast('success', 'Acceso Permitido', 'Permitir entrada al evento', item);
        //   }
        // }
      }
    });

  }
  getEnteder() {
    this.storage.get(this.key_event_entered).then((entered) => {
      if (entered) {
        this.entered = entered;
      }
    });
  }
  async setEnteder(item: { codeNumericQR: string; ticket_id: any; acceso: any; numeroOrden: any; checkin: any }): Promise<boolean> {
    const status = await Network.getStatus();
    return new Promise((resolve, reject) => {
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
        sent: 0,
        code: '',
        view: false,
        ticket_status: 0,
        event_id: undefined,
        codeNumericQR: item.codeNumericQR,
        checkin: item.checkin
      };

      this.eventoService.checkin(data).subscribe(response => {
        this.entered.unshift(data); // Si la operación es exitosa, se guarda localmente
        resolve(true); // Éxito
      }, errors => {
        console.log('errors',errors);
          // Si se detecta un error específico (Código 423), se busca el ticket localmente
          if (errors.includes("Código 423")) {
            console.log('errors',errors);
            this.presentToast('danger', 'Ticket ya escaneado', 'Este ticket ya ha sido usado anteriormente.');
            this.entered.unshift(data);

            this.storage.set(this.key_event_entered, this.entered);

            resolve(false); // Falló

          }
          if(errors.includes("Código 0")){
            this.presentToast('danger', '"Modo offlineo', 'Ticket no procesado');
            console.log("Modo offline - Ticket no procesado");
            this.entered.unshift(data); 
            this.storage.set(this.key_event_entered, this.entered);
            resolve(true); 
          }
      });
    });
  }



  upload() {
    //console.log('item en ', JSON.stringify(this.entered, null, 2));


    // Filtra los tickets que no han sido enviados
    const ticketsToUpload = this.entered.filter(item => item.sent === 0);

    ticketsToUpload.forEach((item) => {
      // Si el ticket ya ha sido utilizado, no lo proceses
      if (item.ticket_status === 1) {  // 1 podría significar que el ticket ya fue utilizado
        return;  // Salta este ticket
      }

      const dt = moment().format('YYYY-MM-DD HH:mm:ss');
      let data: Ticket = {
        ticket_id: item.ticket_id,
        acceso: item.acceso,
        numeroOrden: item.numeroOrden,
        evento_id: this.event_id,
        username: this.user?.username,
        fecha_lectura: item.fecha_lectura,
        created_at: item.created_at,
        updated_at: item.updated_at,
        sent: 1,
        code: '', // Asigna un valor adecuado a 'code'
        view: false, // Asigna un valor adecuado a 'view'
        ticket_status: 1, // Marca el ticket como "utilizado"
        event_id: this.event_id,
        codeNumericQR: item.codeNumericQR,
      };

      // Hacer la solicitud al backend para el check-in
      this.eventoService.checkin(data).subscribe(
        response => {
          this.presentAlert2(response);

          // Actualizar la lista de tickets enviados
          const rt = this.entered.find((objeto) => objeto.ticket_id === item.ticket_id);
          if (rt) {
            const idx = this.entered.indexOf(rt);
            if (idx !== -1) {
              this.entered.splice(idx, 1);
              this.entered.push(data);
            }
          }

          // Guardar los tickets actualizados en storage
          this.storage.set(this.key_event_entered, this.entered);
        },
        error => {

        }
      );
    });
  }


  deleteItemFromList(item: any, list: any[], listType: number) {
    console.log('entre a la funcion de deleteItemFromList');
    const index = list.indexOf(item);
    if (index > -1) {
      list.splice(index, 1);
      switch (listType) {
        case 0:
          this.entered = list;
          this.storage.set(this.key_event_entered, this.entered);
          break;
        case 1:
          this.escaneados = list;
          this.storage.set(this.key_event_tickets, this.escaneados);
          break;
        case 2:
          this.lecturaOnline = list;
          this.storage.set(this.key_event_history_online, this.lecturaOnline);
          this.setLastUpdateHistory(this.lecturaOnline);
          break;
        default:
          break;
      }
    }
  }


  findOccurrences(data: Ticket[], ticketId: string): any[] {
    const occurrences: any[] = [];
    for (const item of data) {
      if (item.ticket_id === ticketId) {
        occurrences.push(item);
      }
    }
    return occurrences;
  }
  
  findOccurrencesQr(data: Ticket[], ticketQr: string): any[] {
    const occurrences: any[] = [];
    for (const item of data) {
      if (item.codeNumericQR === ticketQr) {
        console.log('item en findqr', JSON.stringify(item, null, 2));
        occurrences.push(item);
      }
    }
    return occurrences;
  }

  async modalScanner(item: TicketItem) {
    const modal = await this.modalController.create({
      component: ModalScannerPage,
      componentProps: {
        'item': item,
        'entered': this.entered,
        'online': this.lecturaOnline,
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
    // Carga los siguientes 10 elementos
    const startIndex = this.displayedOnline.length;
    const endIndex = startIndex + 10;
    if (endIndex <= this.lecturaOnline.length) {
      this.displayedOnline = this.displayedOnline.concat(this.lecturaOnline.slice(startIndex, endIndex));
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }
}
