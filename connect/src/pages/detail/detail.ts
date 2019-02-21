import {
  Component,
  NgZone
} from '@angular/core';
import {
  NavController,
  NavParams
} from 'ionic-angular';
import {
  ToastController
} from 'ionic-angular';
import {
  BLE
} from '@ionic-native/ble';

@Component({
  selector: 'page-detail',
  templateUrl: 'detail.html',
})
export class DetailPage {

  peripheral: any = {};
  statusMessage: string;

  public outputData: any[] = []
  public device

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private ble: BLE,
    private toastCtrl: ToastController,
    private ngZone: NgZone,
    private toast: ToastController
  ) {

    let device = navParams.get('device');
    this.device = device

    this.setStatus('Connecting to ' + device.name || device.id);

    this.ble.connect(device.id).subscribe(
      peripheral => this.onConnected(peripheral),
      peripheral => this.onDeviceDisconnected(peripheral)
    );

  }

  onConnected(peripheral) {
    this.ngZone.run(() => {
      this.setStatus('');
      this.peripheral = peripheral;
    });
  }

  startNotifications(peripheral) {
    peripheral.characteristics.forEach(c => {
      if (c.properties.indexOf('Notify') >= 0) this.ble.startNotification(this.device.id, c.service, c.characteristic).subscribe(data => this.outputData.push(new Uint8Array(data)), err => this.outputData.push(err))
    })
  }

  initNotification(service: string, characteristic: string) {
    this.ble.startNotification(this.device.id, service, characteristic)
      .subscribe(
        data => {
          this.ngZone.run(() => {
            this.toast.create({message: 'NEW DATA: ' + data, duration: 2000}).present()
            this.outputData.push('NEW DATA: ' + data)
          })
        },
        err => this.toast.create({message: err, duration: 2000}).present()
      )
  }

  readCharacteristic(service: string, characteristic: string) {
    this.ble.read(this.device.id, service, characteristic).then(data => {
      this.ngZone.run(() => {
        //this.toast.create({message: 'NEW DATA: ' + data, duration: 2000}).present()
        this.outputData.push(this.bytesToString(data))
      })
    }).catch(err => {
      this.ngZone.run(() => {
        //this.toast.create({message: 'ERROR: ' + err, duration: 2000}).present()
        this.outputData.push(err)
      })
    })
  }

  write(service: string, characteristic: string) {
    const text = 'TEST_EPSIDEV'
    this.ble.write(this.device.id, service, characteristic, this.stringToBytes(text)).then(data => {
      this.ngZone.run(() => {
        this.toast.create({message: 'WRITTEN: ' + text + data, duration: 2000}).present()
        this.outputData.push(this.bytesToString(data))
        this.outputData.push(data)
      })
    }).catch(err => {
      this.ngZone.run(() => {
        //this.toast.create({message: 'ERROR: ' + err, duration: 2000}).present()
        this.outputData.push(err)
      })
    })
  }

  bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
     }
     return array.buffer;
 }

  onDeviceDisconnected(peripheral) {
    let toast = this.toastCtrl.create({
      message: 'The peripheral unexpectedly disconnected',
      duration: 3000,
      position: 'middle'
    });
    toast.present();
  }

  // Disconnect peripheral when leaving the page
  ionViewWillLeave() {
    console.log('ionViewWillLeave disconnecting Bluetooth');
    this.ble.disconnect(this.peripheral.id).then(
      () => console.log('Disconnected ' + JSON.stringify(this.peripheral)),
      () => console.log('ERROR disconnecting ' + JSON.stringify(this.peripheral))
    )
  }

  setStatus(message) {
    console.log(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

}
