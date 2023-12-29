import { StyleSheet, Text, View, Alert, Modal, Image, Pressable, FlatList, TouchableOpacity, ScrollView, Platform} from 'react-native';
import React, { useState, useEffect} from 'react';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import Header from '../Header';
import MapView, {Marker} from 'react-native-maps';
import * as Location from 'expo-location';
import {app} from "../../../database/firebase";
import {getDocs, collection, getFirestore, query, where, addDoc, onSnapshot, getDoc} from "firebase/firestore";
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import {getAuth, signOut} from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import Lottie from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MapaScreen({navigation}) {
  const [region, setRegion] = useState(null);
  const [posicionUsuario, setPosicionUsuario] = useState(null);
  const [datosBD, setdatosBD] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [datosUnico, setDatosUnico] = useState(null);
  const [idDatos, setIdDatos] = useState(null);
  const [usuario, setUsuario] = useState(null);

  const [modalImagen, setModalImagen] = useState(false);
  const [imagenMostrar, setImagenMostrar] = useState('');

  const [pantallaBienvenida, setPantallaBienvenida] = useState(true);
  const [pantallaBienvenidaDos, setPantallaBienvenidaDos] = useState(false);
  const [pantallaBienvenidaTres, setPantallaBienvenidaTres] = useState(false);

  const [abrirAyuda, setAbrirAyuda] = useState(false);

  const auth = getAuth(app);
  const [modoNocturno, setModoNocturno] = useState(null);
  const [tamañoNormal, setTamañoNormal] = useState(null);

  //Hook encargado de obtener la temática del tema (color) y del tamaño de la letra
  useFocusEffect(React.useCallback(() => {
    (async () => {
      const theme = await AsyncStorage.getItem('themePreference');
      theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);

      const tamaño = await AsyncStorage.getItem('letterPreference');
      tamaño == 'normal' ? setTamañoNormal(true) : setTamañoNormal(false);
      })()
  }, []));

  var meses = [
    "Enero", "Febrero", "Marzo",
    "Abril", "Mayo", "Junio", "Julio",
    "Agosto", "Septiembre", "Octubre",
    "Noviembre", "Diciembre"
  ]
  
  //Hook encargado de establecer un Listener en el usuario actual, para detectar cambios (principalmente para las publicaciones reportadas)
  useEffect(()=>{
    (async () =>{ 
      const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", auth.currentUser.uid));
      const datosConsultaUsuario = await getDocs(consultaUsuario);

      setUsuario(datosConsultaUsuario.docs[0].data());
     
      onSnapshot(consultaUsuario, (docs)=>{
        setUsuario(docs.docs[0].data());
      }) 

    })()
  }, []);

  //Hook encargado de obtener todas la publicaciones de la tabla "Perdidos". Se vuelve a llamar cada vez que se accede a la vista
  //y cuando cambia el valor de usuario
  useFocusEffect(React.useCallback(() => {
    (async () => {   
      if(usuario){
        const datosConsulta = await getDocs(query(collection(getFirestore(app),'Publicaciones'), where("Tipo", "==", "Perdidos")));  
        let documentos = [];

        await Promise.all(datosConsulta.docs.map(async(doc)=>{         
            if(!Object.values(usuario['Ocultar']).includes(doc.id)){
              var documento = await getDoc(doc.data()['Publicacion']);
            
              documentos.push(documento);
            }
          })
        )
        
        setdatosBD(documentos);
    } 
    })();
  }, [usuario]));

  //Hook encargado de establecer un Listener en el botón de "Atrás". Lo redirige al Login y cierra la sesión.
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
  
  //Hook encargado de obtener la ubicación en segundo plano. En caso de rechazar los permisos, se establece como predeterminada
  //las coordenadas de Madrid.
  useFocusEffect(React.useCallback(() => {
      (async () => {    
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
  
  /*Función encargada de abrir un chat entre el usuario y el dueño de la publicación.
    Parámetro: id del dueño de la publicación
  */
  async function contactarDueño(Id_Dueño){
    if(getAuth(app).currentUser.uid == Id_Dueño){
      Alert.alert('¡Error!', 'No te puedes poner en contacto contigo mismo');
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

      else{ //Si el usuario tiene al dueño de la publicación bloqueado
        if(usuario['Bloqueados'].includes(datosConsultaUsuario.docs[0].data()['Id_Usuario2'])){
          Alert.alert('¡Atención!', 'El usuario al que intentas contactar, está bloqueado');
        }

        else
          navigation.navigate('ChatPrivado', {Sala: datosConsultaUsuario.docs[0].data()});
      }
    }
  }
    
    return (
      <View style={{flex:1}}>
        <MapView 
          style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}
          initialRegion={region}
          minZoomLevel={0}  // default => 0
          maxZoomLevel={20} // default => 20
        >
        
          {datosBD && datosBD.map((doc, index) => {
            return(<Marker
                coordinate={{
                  latitude: doc.data()["Coordenadas"] ? doc.data()["Coordenadas"]["latitude"] : null,
                  longitude: doc.data()["Coordenadas"] ? doc.data()["Coordenadas"]["longitude"]: null,
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
          
          
        <TouchableOpacity style={{backgroundColor:'white', position:'absolute', bottom:0, right:0, marginRight:30, marginBottom:30, padding:15, borderRadius:60, borderWidth:0.5}} onPress={() =>{navigation.navigate('Similitud')}}>
          <AntDesign name="camera" size={35} color="black" />
        </TouchableOpacity>
          
        <StatusBar translucent={true} backgroundColor={'transparent'}/> 
        <Header numero={1} navegar={navigation}/>

        <View style={{position:'absolute', top:0, left:0, marginLeft:20, marginBottom:30, marginTop:105}}>
          <TouchableOpacity style={{borderRadius:60, borderWidth:0.5, backgroundColor:'white'}} onPress={() =>{setAbrirAyuda(!abrirAyuda)}}>
            <AntDesign name="questioncircleo" size={35} color="black" />
          </TouchableOpacity>
        </View>

        {abrirAyuda &&  //Sección de ayuda en el Mapa
        <View style={{position:'absolute', top:0, marginBottom:30, marginTop:145}}> 
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

        {datosUnico && //Datos de la publicación
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(!modalVisible);
            }}>
            <View style={[styles.modalView]}>
              <View style={{flex:0.8, borderRadius:20,}}>
                <View style={{height:25, width:50, margin:5,}}>
                    <Pressable
                      style={[styles.button]}
                      onPress={() => setModalVisible(!modalVisible)}>
                      <AntDesign name="closecircle" size={24} color="black" />
                    </Pressable>
                </View>
                  <View style={[styles.viewImagenes]}>
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
                              width:160,
                              height:240,
                              margin:8,
                              aspectRatio:1,
                              borderRadius:20,
                              alignSelf:'center',
                              marginLeft:16
                            },]}
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
                  <TouchableOpacity style={{marginTop:10, justifyContent:'center'}} onPress={()=>{
                      Alert.alert('', '¿Deseas contactar con el dueño?', [
                        {
                          text: 'No',
                          style: 'cancel',
                        },
                        {text: 'Si', onPress: () =>{setModalVisible(!modalVisible); contactarDueño(datosUnico["Id_Usuario"])}},
                      ])}
                    }>
                      <Text style={[{fontSize:15, textAlign:'center', paddingBottom:10}, tamañoNormal ? null : {fontSize:17}]}>Contactar con el dueño: <Ionicons name="paper-plane" size={20} /> </Text>
                  </TouchableOpacity>
                
                  <Pressable
                    style={{position:'absolute', right:15, marginTop:3}}
                    onPress={() => 
                      Alert.alert('¡Atención!', '¿Deseas reportar la publicación?', [
                        {
                          text: 'No',
                          style: 'cancel',
                        },
                        {text: 'Si', onPress: () =>{setModalVisible(!modalVisible); navigation.navigate('ReportesScreen', {idDoc:idDatos, tipo:"Perdidos"});/*realizarReporte(datosUnico['num_Reportes'])*/}},
                      ])}>
                      <MaterialIcons name="report" size={30} color="red" />
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        }

        {modalImagen && //Imagen agrandada
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

        
        <Modal
              animationType="slide"
              transparent={true}
              visible={pantallaBienvenida}
              onRequestClose={() => {
                setPantallaBienvenida(!pantallaBienvenida);
              }}
        >
          <View style={{flex:1, padding:5}}>
            <LinearGradient  
              colors={modoNocturno ? ['#f6d1af','#F0B27A'] :['#F0B27A','#242321']} 
              style={{flex:1, borderRadius:40}}
            >
              <View style={{height:30, width:50, margin:5,}}>
                <Pressable
                  style={[styles.buttonBienvenida]}
                  onPress={() => setPantallaBienvenida(!pantallaBienvenida)}>
                  <AntDesign name="closecircle" size={30} color="black" />
                </Pressable>
              </View>
              <View style={{flex:0.45, alignItems:'center'}}>
                <Lottie
                  source={require('../../animaciones/gatoBienvenida.json')}
                  autoPlay loop
                  style={{marginRight:25, width:'100%', height:'100%'}}
                  resizeMode='cover'
                /> 
              </View>
              <View style={{flex:0.55}}>
                <View style={{alignItems:'flex-end', marginRight:40}}>
                  <Text style={{textAlign:'right', width:300 ,color:'#fff', fontWeight:"bold", fontSize:35, fontStyle:"italic", marginLeft:40, textShadowColor: 'rgba(0, 0, 0, 0.75)',textShadowOffset: {width: -1, height: 1},textShadowRadius: 30}}>Trae de vuelta a tu mascota perdida</Text>
                  <Text style={{marginLeft:30, marginRight:20, marginTop:30 ,color: '#fff', fontSize:20, fontStyle:'italic', textShadowColor: 'rgba(0, 0, 0, 0.75)',textShadowOffset: {width: -1, height: 1}, textShadowRadius: 5}}>«Dime cómo eres con los animales y te diré qué tipo de persona eres» (J. Manuel Serrano Márquez).</Text>
                </View>
                <View style={{alignItems:'flex-end', marginRight:50, marginTop:50}}>
                  <TouchableOpacity onPress={()=>{setPantallaBienvenidaDos(!pantallaBienvenidaDos); setPantallaBienvenida(!pantallaBienvenida)}}>
                      <View style={{marginLeft:20, backgroundColor:'#1C1C1C', height:65, justifyContent:'center', width:65, alignItems:'center', borderRadius:80}}>
                        <AntDesign name="arrowright" size={45} color="white" />
                      </View>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Modal> 
          
        <Modal
            animationType="slide"
            transparent={true}
            visible={pantallaBienvenidaDos}
            onRequestClose={() => {
              setPantallaBienvenidaDos(!pantallaBienvenidaDos);
            }}
        >
          <View style={{flex:1, padding:5}}>
            <LinearGradient  
              colors={modoNocturno ? ['#f6d1af','#F0B27A'] :['#F0B27A','#242321']} 
              style={{flex:1, borderRadius:40}}
            >
              <View style={{height:30, width:50, margin:5,}}>
                <Pressable
                  style={[styles.buttonBienvenida]}
                  onPress={() => setPantallaBienvenidaDos(!pantallaBienvenidaDos)}>
                  <AntDesign name="closecircle" size={30} color="black" />
                </Pressable>
              </View>
              <View style={{flex:0.45, alignItems:'center'}}>
                <Lottie
                  source={require('../../animaciones/perroBienvenida.json')}
                  autoPlay loop
                  style={{marginRight:25, width:'100%', height:'100%'}}
                  resizeMode='cover'
                /> 
              </View>
              <View style={{flex:0.55}}>
                <View style={{alignItems:'flex-end', marginRight:40}}>
                  <Text style={{textAlign:'right', width:300 ,color:'#fff', fontWeight:"bold", fontSize:35, fontStyle:"italic", marginLeft:40, textShadowColor: 'rgba(0, 0, 0, 0.75)',
                  textShadowOffset: {width: -1, height: 1},textShadowRadius: 30}}>Da en adopción a un fiel amigo</Text>
                  <Text style={{marginLeft:30, marginRight:20, marginTop:30 ,color: '#fff', fontSize:20, fontStyle:'italic', textShadowColor: 'rgba(0, 0, 0, 0.75)',textShadowOffset: {width: -1, height: 1}, textShadowRadius: 5}}>Abre las puertas a un futuro lleno de amor y esperanza, regálale una segunda oportunidad para ser amado.</Text>
                </View>
                <View style={{alignItems:'flex-end', marginRight:50, marginTop:50}}>
                  <TouchableOpacity onPress={()=>{setPantallaBienvenidaDos(!pantallaBienvenidaDos); setPantallaBienvenidaTres(!pantallaBienvenidaTres)}}>
                      <View style={{marginLeft:20, backgroundColor:'#1C1C1C', height:65, justifyContent:'center', width:65, alignItems:'center', borderRadius:80}}>
                        <AntDesign name="arrowright" size={45} color="white" />
                      </View>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Modal> 
          
        <Modal
          animationType="slide"
          transparent={true}
          visible={pantallaBienvenidaTres}
          onRequestClose={() => {
            setPantallaBienvenidaTres(!pantallaBienvenidaTres);
          }}
        >
          <View style={{flex:1, padding:5}}>
            <LinearGradient  
              colors={modoNocturno ? ['#f6d1af','#F0B27A'] :['#F0B27A','#242321']} 
              style={{flex:1, borderRadius:40}}
            >
              <View style={{height:30, width:50, margin:5,}}>
                <Pressable
                  style={[styles.buttonBienvenida]}
                  onPress={() => setPantallaBienvenidaTres(!pantallaBienvenidaTres)}>
                  <AntDesign name="closecircle" size={30} color="black" />
                </Pressable>
              </View>
              <View style={{flex:0.45, alignItems:'center'}}>
                <Lottie
                  source={require('../../animaciones/chatBienvenida.json')}
                  autoPlay loop
                  resizeMode='cover'
                  style={{marginRight:25, width:'100%', height:'100%'}}
                /> 
              </View>
              <View style={{flex:0.55}}>
                <View style={{alignItems:'flex-end', marginRight:40}}>
                  <Text style={{textAlign:'center', width:300 ,color:'#fff', fontWeight:"bold", fontSize:35, fontStyle:"italic", marginLeft:40, textShadowColor: 'rgba(0, 0, 0, 0.75)',
                  textShadowOffset: {width: -1, height: 1},textShadowRadius: 30}}>Forma parte del foro</Text>
                  <Text style={{marginLeft:30, marginRight:20, marginTop:30 ,color: '#fff', fontSize:20, fontStyle:'italic', textShadowColor: 'rgba(0, 0, 0, 0.75)',textShadowOffset: {width: -1, height: 1}, textShadowRadius: 5}}>Únete ya a nuestra comunidad conformada por amantes del mundo animal y comparte tus experiencias con el resto.</Text>
                </View>
                <View style={{alignItems:'flex-end', marginRight:50, marginTop:50}}>
                  <TouchableOpacity onPress={() =>{setPantallaBienvenidaTres(!pantallaBienvenidaTres)}}>
                      <View style={{marginLeft:20, backgroundColor:'#1C1C1C', height:65, justifyContent:'center', width:65, alignItems:'center', borderRadius:80}}>
                        <AntDesign name="arrowright" size={45} color="white" />
                      </View>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Modal>
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
  