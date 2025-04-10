import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.page.html',
  standalone: false,
})
export class ModalScannerPage implements OnInit {
  @Input() item: any;
  @Input() entered: any;
  @Input() online: any;
  history: any;
  constructor(public modalController: ModalController) { }
  closeModal() {
    this.modalController.dismiss();
  }
  ngOnInit() {
    this.getLastAcces(this.item);
    console.log(this.item);
  }
  getLastAcces(item: { ticket_id: string; }) {
    const fdx = this.entered.find((objeto: { ticket_id: string; }) => objeto.ticket_id === item.ticket_id);
    const online = this.online.find((objeto: { ticket_id: string; }) => objeto.ticket_id === item.ticket_id.toLowerCase());
    if (online) {
      this.history = online;
    } else {
      if (fdx) {
        this.history = fdx;
      }
    }
  }
  showCorrect(item: { ticket_status: number; }) {
    if (item.ticket_status == 0) {
      return false;
    } else {
      return true;
    }
  }
}
