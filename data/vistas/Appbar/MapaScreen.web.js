import { StyleSheet, Text, View, Button, Alert, Modal, Image, Pressable, FlatList, TouchableOpacity, ScrollView, Dimensions} from 'react-native';
import React, { useState, useEffect} from 'react';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import Header from '../Header';
import MapView, {Marker} from 'react-native-maps';
import * as Location from 'expo-location';
import {app} from "../../../database/firebase";
import {getDocs, collection, getFirestore, query, where, addDoc} from "firebase/firestore";
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import {getAuth, signOut} from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function MapaScreen({navigation}) {
  const [region, setRegion] = useState(null);
  const [posicionUsuario, setPosicionUsuario] = useState(null);
  const [datosBD, setdatosBD] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [datosUnico, setDatosUnico] = useState(null);
  const [idDatos, setIdDatos] = useState(null);
  const [usuario, setUsuario] = useState([]);

  const [modalImagen, setModalImagen] = useState(false);
  const [imagenMostrar, setImagenMostrar] = useState('');
  const [alertaContacto, setAlertaContacto] = useState(false);
  const [alertaError1, setAlertaError1] = useState(false);
  const [alertaError2, setAlertaError2] = useState(false);
  const [alertaReporte, setAlertaReporte] = useState(false);

  const [abrirAyuda, setAbrirAyuda] = useState(false);
  const [visualizarMovil, setVisualizarMovil] = useState(false);

  const auth = getAuth(app);
  const screenDimensions = Dimensions.get('screen');

  const [modoNocturno, setModoNocturno] = useState(null);
  const [tamañoNormal, setTamañoNormal] = useState(null);

  useEffect(() => {
    if(screenDimensions.width < 600){
        setVisualizarMovil(true);
    }
}, []); 

  useFocusEffect(React.useCallback(() => {
    (async () => {
      const theme = await AsyncStorage.getItem('themePreference');
      theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);

      const tamaño = await AsyncStorage.getItem('letterPreference');
      tamaño == 'normal' ? setTamañoNormal(true) : setTamañoNormal(false);
      })()
  }, []));

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  var meses = [
    "Enero", "Febrero", "Marzo",
    "Abril", "Mayo", "Junio", "Julio",
    "Agosto", "Septiembre", "Octubre",
    "Noviembre", "Diciembre"
  ]
  
  useEffect(()=>{
    (async () =>{ 
      const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", auth.currentUser.uid));
      const datosConsultaUsuario = await getDocs(consultaUsuario);

      setUsuario(datosConsultaUsuario.docs[0].data());
    })()
  }, []);

  React.useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        const action = e.data.action;

        e.preventDefault();           

          if(!auth.currentUser){
            navigation.dispatch(action);
          }
          else{
            Alert.alert('¡Espera, vas a salir!','¿Estás seguro de querer cerrar sesión?', [
              { 
                text: "Cancelar", 
                style: 'cancel', 
                onPress: () => null 
              },
              {
                text: 'Aceptar',
                style: 'destructive',
                onPress: () => {signOut(auth).then(()=>{navigation.dispatch(action)}).catch((error)=>{console.log(error)})},
              },
            ]);
          }
      }),
    [navigation]
);
  
  useFocusEffect(React.useCallback(() => {
      (async () => {
        const datosConsulta = await getDocs(collection(getFirestore(app),'Perdidos'));  
        
        setdatosBD(datosConsulta.docs);
        

      try{
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('El permiso fue denegado');
          var region = {
            latitude: 0.0,
            longitude: 0.0,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          };
          setRegion(region);
          return;
        }
        
        let location = await Location.watchPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 10
        },
          (location) =>{
            setPosicionUsuario(location),
            setRegion({latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421})
          }
        );
        
      }
      catch(e){
        var region = {
          latitude: 40.416775,
          longitude: -3.703790,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        };
  
        setRegion(region);
      }  
    })();
  }, []));

    async function contactarDueño(Id_Dueño){
      if(getAuth(app).currentUser.uid == Id_Dueño){
        setAlertaError1(!alertaError1)
      }
      else{
        const consultaUsuario = query(collection(getFirestore(app),'Salas'), where("Id_Usuario1", "==", auth.currentUser.uid), where("Id_Usuario2", "==", Id_Dueño));
        const datosConsultaUsuario = await getDocs(consultaUsuario);
        
        const consultaRemitente = query(collection(getFirestore(app),'Salas'), where("Id_Usuario1", "==", Id_Dueño), where("Id_Usuario2", "==", auth.currentUser.uid));
        const datosConsultaRemitente = await getDocs(consultaRemitente);

        if(datosConsultaRemitente.docs.length==0){   //SALA (DUEÑO MASCOTA - USUARIO)
          const sala = {Id_Usuario1: Id_Dueño, Id_Usuario2: auth.currentUser.uid, Mensajes:[], ult_Acceder: new Date(), ult_Mensaje: new Date()}
          addDoc(collection(getFirestore(app),'Salas'), sala); 
        }

        if(datosConsultaUsuario.docs.length==0){ //SALA (USUARIO - DUEÑO MASCOTA)
            const sala = {Id_Usuario1: auth.currentUser.uid, Id_Usuario2: Id_Dueño, Mensajes:[], ult_Acceder: new Date(), ult_Mensaje: new Date()};
            addDoc(collection(getFirestore(app),'Salas'), sala); 
            navigation.navigate('ChatPrivado', {Sala:sala});
        }
        else{ //Si ya existe una sala del chat
          if(usuario['Bloqueados'].includes(datosConsultaUsuario.docs[0].data()['Id_Usuario2'])){
            setAlertaError2(!alertaError2)
          }
          else
            navigation.navigate('ChatPrivado', {Sala: datosConsultaUsuario.docs[0].data()});
        }
      }
    }
    
    return (
    <View style={{flex:1}}>
        <Header numero={1} navegar={navigation}/>

        <MapView 
          style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}
          initialRegion={region}
          minZoomLevel={0}  // default => 0
          maxZoomLevel={20} // default => 20
          provider='google'
          googleMapsApiKey={'AIzaSyAozjCSYISlkP-mLiKk7r8zYmYgVZYIP-g'}
        >
      
        {datosBD && datosBD.map((doc, index) => {
          return( <Marker
              coordinate={{
                latitude: doc.data()["Coordenadas"]["latitude"],
                longitude: doc.data()["Coordenadas"]["longitude"],
              }}
              key={index}
              onPress = {() => {setModalVisible(!modalVisible), setDatosUnico(doc.data()), setIdDatos(doc.id)}}
              >
              {doc.data()["Mascota"] && <Image source={require('../../imagenes/pet.png')} style={{height: 35, width:35 }} />}
              {!doc.data()["Mascota"] && <Image source={require('../../imagenes/mascota.png')} style={{height: 35, width:35 }} />}

          </Marker>
          )
        })} 

          {posicionUsuario && <Marker
            coordinate={{
              latitude: posicionUsuario.coords.latitude,
              longitude: posicionUsuario.coords.longitude,
            }}
          >
            
            <Image source={require('../../imagenes/user.png')} style={{height: 35, width:35 }}/>
          </Marker>}

        </MapView>
        
      <StatusBar translucent={true} backgroundColor={'transparent'}/> 

      <View style={{position:'absolute', top:0, left:0, marginLeft:20, marginBottom:30, marginTop:105}}>
        <TouchableOpacity style={{borderRadius:60, borderWidth:0.5, backgroundColor:'white'}} onPress={() =>{setAbrirAyuda(!abrirAyuda)}}>
          <AntDesign name="questioncircleo" size={35} color="black" />
        </TouchableOpacity>
      </View>

      {abrirAyuda && <View style={{position:'absolute', top:0, marginBottom:30, marginTop:145}}> 
        <View style={{backgroundColor:'white', padding:30, borderRadius:20, borderWidth:0.5, marginRight:42, marginLeft:10}}>
          <View style={{flexDirection:'row', marginBottom:15}}>
            <Image source={require('../../imagenes/pet.png')} style={{height: 35, width:35 }}/>
            <Text style={{fontSize:18, fontWeight:400, marginLeft:10, marginRight:10}}>Un animal se ha perdido por dicha zona</Text>
          </View>

          <View style={{flexDirection:'row',}}>
            <Image source={require('../../imagenes/mascota.png')} style={{height: 35, width:35 }}/>
            <Text style={{fontSize:18, fontWeight:400, marginLeft:10, marginRight:10}}>Un animal ha sido avistado por dicha zona</Text>
          </View>

          <View style={{flexDirection:'row', marginTop:15}}>
            <Image source={require('../../imagenes/user.png')} style={{height: 35, width:35 }}/>
            <Text style={{fontSize:18, fontWeight:400, marginLeft:10, marginRight:10, marginTop:5}}>Tu posición</Text>
          </View>
        </View>
      </View>
      }
      {datosUnico && 
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}>
          <View style={[visualizarMovil ? styles.modalView :styles.modalViewWeb]}>
            <View style={{flex:0.8, borderRadius:20,}}>
              <View style={{height:25, width:50, margin:5,}}>
                  <Pressable
                    style={[styles.button]}
                    onPress={() => setModalVisible(!modalVisible)}>
                    <AntDesign name="closecircle" size={24} color="black" />
                  </Pressable>
              </View>
                <View style={[styles.viewImagenes, visualizarMovil ? null: {marginLeft:'25%', marginRight:'25%', backgroundColor:'#e7ebda'}]}>
                  <FlatList
                    horizontal
                    scrollEventThrottle={2}
                    showsHorizontalScrollIndicator={true} 
                    pagingEnabled={true}
                    data={datosUnico["Fotos"]}
                    snapToAlignment={'center'}  
                    contentContainerStyle={{justifyContent: 'center', alignItems:'center', backgroundColor:'#e7ebda', borderColor:'#000'}}
                    renderItem={ ({ item, index }) => (
                      <TouchableOpacity onPress={() =>{setImagenMostrar(item);setModalImagen(!modalImagen)}}>
                        <Image 
                          source={{uri:item}}
                          key={index}      
                          style={[{
                            width:'auto',
                            height:240,
                            margin:8,
                            aspectRatio:1,
                            borderRadius:20,
                            alignSelf:'center',
                            marginLeft:16
                          }, ]}
                        />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              
            </View>
            <View style={{flex:1, backgroundColor:'#e7ebda', borderRadius:20}}>
              <View style={styles.contenedor}>
                <Image
                  source={require('../../imagenes/perroModal.png')}
                  style={styles.tinyLogo}
                />
              </View>
              <ScrollView>
                {datosUnico["Mascota"] && 
                  <View style={styles.viewDatos}>
                    <Text style={[{fontSize:18, marginBottom:5}, tamañoNormal ? null : {fontSize:22}]}>Mi mascota se llama <Text style={{fontWeight:"bold"}}>{datosUnico["Nombre"]}</Text> y desapareció el 
                    <Text style={{fontWeight:"bold"}}> {datosUnico["Fecha"].toDate().getDate()} de {meses[datosUnico["Fecha"].toDate().getMonth()]} de {datosUnico["Fecha"].toDate().getFullYear()}</Text> por esta zona. {'\n'}</Text>
                    <Text style={[{fontWeight:400, fontSize:18}, tamañoNormal ? null : {fontSize:22}]}>{datosUnico["Informacion"]}</Text>
                  </View>
                }
                 {!datosUnico["Mascota"] && 
                  <View style={styles.viewDatos}>
                    <Text style={[{fontSize:18, marginBottom:5}, tamañoNormal ? null : {fontSize:22}]}>He encontrado un animal en supuesto estado de desaparición, el 
                    <Text style={{fontWeight:"bold"}}> {datosUnico["Fecha"].toDate().getDate()} de {meses[datosUnico["Fecha"].toDate().getMonth()]} de {datosUnico["Fecha"].toDate().getFullYear()}</Text> por esta zona. {'\n'}</Text>
                    <Text style={[{fontWeight:400, fontSize:18}, tamañoNormal ? null : {fontSize:22}]}>{datosUnico["Informacion"]}</Text>
                  </View>
                }
              </ScrollView>
              <View style={{alignItems:'center', justifyContent:'center'}}>

                  <TouchableOpacity style={{marginTop:10, justifyContent:'center'}} onPress={()=>{ setAlertaContacto(!alertaContacto); setModalVisible(!modalVisible)}
                  }>
                    <Text style={[{fontSize:15, textAlign:'center', paddingBottom:10}, tamañoNormal ? null : {fontSize:17}]}>Contactar con el dueño: <Ionicons name="paper-plane" size={20} /> </Text>
                  </TouchableOpacity>

                  <Pressable
                        style={{position:'absolute', right:15, marginTop:3}}
                        onPress={() =>{ 
                          setAlertaReporte(!alertaReporte); setModalVisible(!modalVisible);
                        }}>
                        <MaterialIcons name="report" size={30} color="red" />
                  </Pressable>
                
              </View>
            </View>
          </View>
        </Modal>
      }

      {modalImagen && 
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalImagen}
          onRequestClose={() => {
            setModalImagen(!modalImagen);
          }}
        > 
          <TouchableOpacity onPress={()=>{setModalImagen(false)}} style={{flex:1}}>
            <View style={styles.modalImagen}>
              <Image 
                source={{uri:imagenMostrar}}   
                style={{
                  width:'100%',
                  height:'100%',
                  marginTop:60,
                  aspectRatio:1,
                  borderRadius:20,
                  alignSelf:'center',
                  marginLeft:20,
                  marginRight:20,
                }}
                />
            </View>
          </TouchableOpacity>
        </Modal>
      }

        <AwesomeAlert
          show={alertaContacto}
          showProgress={false}
          title=""
          message="¿Deseas contactar con el dueño?"
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={false}
          showCancelButton={true}
          showConfirmButton={true}
          cancelText="No"
          confirmText="Si"
          confirmButtonColor="#3a99d8"
          onCancelPressed={() => {
            setAlertaContacto(!alertaContacto);
          }}
          onConfirmPressed={() => {
            setAlertaContacto(!alertaContacto);
            contactarDueño(datosUnico["Id_Usuario"]);
          }}
        />

        <AwesomeAlert
          show={alertaError1}
          showProgress={false}
          title="¡Error!"
          message="No te puedes poner en contacto contigo mismo"
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={false}
          showCancelButton={false}
          showConfirmButton={true}
          cancelText=" "
          confirmText="Aceptar"
          confirmButtonColor="#3a99d8"
          onCancelPressed={() => {
            
          }}
          onConfirmPressed={() => {
            setAlertaError1(!alertaError1);
          }}
        />

        <AwesomeAlert
          show={alertaError2}
          showProgress={false}
          title="¡Atención!"
          message="El usuario al que intentas contactar, está bloqueado"
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={false}
          showCancelButton={false}
          showConfirmButton={true}
          cancelText=" "
          confirmText="Aceptar"
          confirmButtonColor="#3a99d8"
          onCancelPressed={() => {
            
          }}
          onConfirmPressed={() => {
            setAlertaError2(!alertaError2);
          }}
        />

        <AwesomeAlert
          show={alertaReporte}
          showProgress={false}
          title="¡Atención!"
          message="¿Deseas reportar la publicación?"
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={false}
          showCancelButton={true}
          showConfirmButton={true}
          cancelText="No"
          confirmText="Si"
          confirmButtonColor="#3a99d8"
          onCancelPressed={() => {
            setAlertaReporte(!alertaReporte);
          }}
          onConfirmPressed={() => {
            setAlertaReporte(!alertaReporte);
            navigation.navigate('ReportesScreen', {idDoc:idDatos, tipo:"Perdidos"});
          }}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble:{
    alignItems:'flex-start',
    backgroundColor: '#fff',
    borderRadius:6,
    borderColor:'#ccc',
    borderWidth: 0.5,
    padding:15,
    flex:1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    flex: 1, 
    backgroundColor: '#e7ebda',
    margin: 30,  
    marginBottom:5,
    borderRadius: 20,
    flexDirection: 'column',
    borderColor:'#fff',
  },
  modalViewWeb: {
    flex: 1, 
    backgroundColor: '#e7ebda',
    margin: 30,
    marginLeft:'30%',
    marginRight:'30%',  
    marginBottom:5,
    borderRadius: 20,
    flexDirection: 'column',
    borderColor:'#fff',
  },
  modalImagen: {
    flex: 0.5, 
    backgroundColor: '#e7ebda',
    margin: 30,  
    marginBottom:5,
    borderRadius: 20,
    flexDirection: 'column',
    borderColor:'#fff',
  },
  button: {
    borderRadius: 20,
    width:25,
    height:25,
    justifyContent: 'flex-start',
    marginLeft:10,
  },
  buttonBienvenida: {
    borderRadius: 20,
    width:60,
    height:40,
    justifyContent: 'flex-start',
    marginLeft:20,
    marginTop:15
  },
  textStyle: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  contenedor: {
    backgroundColor: '#fff',
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tinyLogo: {
    height: 70,
    width: 120,
    borderRadius: 25,
    marginBottom:10,
  },
  viewDatos: {
    margin:30, 
    backgroundColor:'#fff', 
    shadowColor: 'black', 
    padding:20, 
    borderRadius:5, 
    shadowColor: "#000",
    shadowOffset: {
	    width: 0,
	    height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  viewImagenes: {
    marginLeft:25,
    marginBottom:25,
    marginRight:25,
    flex:1,
    backgroundColor:'#fff', 
    shadowColor: 'black', 
    padding:2, 
    borderRadius:5, 
    shadowColor: "#000",
    shadowOffset: {
	    width: 0,
	    height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  buttonClose: {
    backgroundColor: '#fff',
  },
});
  