import { Injectable } from '@angular/core';

import { ScanData } from "../models/scan-data.model";

import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Contacts, Contact, ContactField, ContactName   } from '@ionic-native/contacts';



import { ModalController, Platform, ToastController } from "ionic-angular";
import { MapaPage } from "../pages/mapa/mapa";



@Injectable()


export class HistorialService {

  private _historial:ScanData[] = [];


  constructor( private iab: InAppBrowser,
               private modalCtrl: ModalController,
               private contacts: Contacts,
               private platform:Platform,
               private toastCtrl:ToastController) { }


  agregar_historial( texto:string ){

    let data = new ScanData( texto );



    this._historial.unshift( data );

    console.table( this._historial );

    //this.abrir_scan(0);


  }


  abrir_scan( index:number){

    let scanData = this._historial[index];
    console.log( scanData );

    switch( scanData.tipo ){

      case "http":
        this.iab.create( scanData.info, "_system" );

      break;

      case "mapa":

        this.modalCtrl.create( MapaPage, { coords: scanData.info })
            .present();

      break;

      case "contacto":

          this.crear_contacto(  scanData.info );

      break;

      case "email":
        this.mandar_email(scanData.info);

      default:
        console.error("Tipo no soportado");

    }


  }

  private mandar_email(texto:string){
    var contenido=[];
    contenido= texto.split (';');

    var start_index = 0
    var number_of_elements_to_remove = 3;
    var noMATMSG_TO;
    var noTO;
    var noSUB;
    var noBODY;

    contenido.forEach(element => {

      if (element.includes('MATMSG:')){
        noMATMSG_TO= element.replace('MATMSG:', '');
        noMATMSG_TO= noMATMSG_TO.replace('TO:', '');
      }

      if (element.includes("SUB:")){
        noSUB=element.replace('SUB:', '');
      }
      if (element.includes("BODY:")){

       noBODY= element.replace('BODY:', '');
      }


    });
    
    this.iab.create('mailto:' + noMATMSG_TO.trim() + '?subject=' + noSUB.trim() + '&body=' + noBODY.trim()+'', "_system");

  }
  private crear_contacto( texto:string ){

    let campos:any = this.parse_vcard( texto );
    console.log( campos );

    let nombre = campos['fn'];
    let tel    = campos.tel[0].value[0];


    if( !this.platform.is('cordova') ){
      console.warn("Estoy en la computadora, no puedo crear contacto.");
      return;
    }

    let contact: Contact = this.contacts.create();

    contact.name = new ContactName(null, nombre );
    contact.phoneNumbers = [ new ContactField('mobile', tel ) ];

    contact.save().then(
      ()=> this.crear_toast("Contacto " + nombre + " creado!"),
      (error) => this.crear_toast( "Error: " + error )
    );


  }

  private crear_toast( mensaje:string ){

    this.toastCtrl.create({
      message: mensaje,
      duration: 2500
    }).present();

  }


  private parse_vcard( input:string ) {

    var Re1 = /^(version|fn|title|org):(.+)$/i;
    var Re2 = /^([^:;]+);([^:]+):(.+)$/;
    var ReKey = /item\d{1,2}\./;
    var fields = {};

    input.split(/\r\n|\r|\n/).forEach(function (line) {
        var results, key;

        if (Re1.test(line)) {
            results = line.match(Re1);
            key = results[1].toLowerCase();
            fields[key] = results[2];
        } else if (Re2.test(line)) {
            results = line.match(Re2);
            key = results[1].replace(ReKey, '').toLowerCase();

            var meta = {};
            results[2].split(';')
                .map(function (p, i) {
                var match = p.match(/([a-z]+)=(.*)/i);
                if (match) {
                    return [match[1], match[2]];
                } else {
                    return ["TYPE" + (i === 0 ? "" : i), p];
                }
            })
                .forEach(function (p) {
                meta[p[0]] = p[1];
            });

            if (!fields[key]) fields[key] = [];

            fields[key].push({
                meta: meta,
                value: results[3].split(';')
            })
        }
    });

    return fields;
};



  cargar_historial(){
    return this._historial;
  }


}
