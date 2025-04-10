import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.page.html',
  standalone: false,
})
export class ModalScannerPage implements OnInit {
  @Input() item: any;
  constructor(public modalController: ModalController) { }
  closeModal() {
    this.modalController.dismiss();
  }
  ngOnInit() {
  }
  showCorrect(item: { checkin: number; ticket_status: number; }) {
    if (item.checkin == 0 || item.ticket_status == 0) {
      return false;
    } else {
      return true;
    }
  }
}
