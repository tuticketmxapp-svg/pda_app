export class User {
  message: string| undefined;
  status: string| undefined;
  title: string| undefined;
  token: string| undefined;
  userData: userData| undefined;
}

export class userData {
  conection: string| undefined;
  gastos_cancelacion: number| undefined;
  idAgencia: number| undefined;
  idOperador: string| undefined;
  idUser: number| undefined;
  origen: string| undefined;
  outlet: string| undefined;
}

export class UsuarioStyles {
  color: string = '#005DAC';
  colorMenu: string = '#363636';
  colorBtnPrimary: string = '#428bca';
  colorBtnInfo: string = '#5bc0de';
  colorBtnSuccess: string = '#5cb85c';
  colorBtnDanger: string = '#d9534f';
  txtColor: string = '#fff';
  txtColorMenu: string = '#fff';
  txtPrimary: string = '#fff';
  txtInfo: string = '#fff';
  txtSuccess: string = '#fff';
  txtDanger: string = '#fff';
}