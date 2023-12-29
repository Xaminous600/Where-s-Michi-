import { StyleSheet, Text, View, Image, Pressable, SafeAreaView, FlatList, ImageBackground, Modal, ScrollView, Alert, TouchableHighlight, Dimensions, TouchableOpacity} from 'react-native';
import Header from '../Header';
import React, { useState, useEffect} from 'react';
import {app} from "../../../database/firebase";
import {getDocs, collection, getFirestore, query, where, updateDoc, arrayRemove, arrayUnion, doc, getDoc, onSnapshot, addDoc} from "firebase/firestore";
import Constants from 'expo-constants';
import { Ionicons, AntDesign, Entypo, MaterialIcons } from '@expo/vector-icons';
import SelectDropdown from "react-native-select-dropdown";
import {getAuth} from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdoptarScreen({navigation}) {
    const [datosBD, setdatosBD] = useState([]);
    const [abrirModalFiltro, setabrirModalFiltro] = useState(null);
    const [animalFiltro, setAnimalFiltro] = useState(null);
    const [zonaFiltro, setZonaFiltro] = useState(null);
    const [usuario, setUsuario] = useState(null);
    const [recargar, setRecargar] = useState(null);

    const animales = ["Perros", "Gatos", "Conejos", "Cobayas", "Pajaros"];
    const provincias = ["Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Gerona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", "Lérida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Orense", "Palencia", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo","Valencia", "Valladolid","Vizcaya", "Zamora", "Zaragoza"];

    const [vistaFavorito, setVistaFavorito] = useState(false);

    const [datosBDFavorito, setDatosBDFavorito] = useState([]);

    const auth = getAuth(app);

    const [modoNocturno, setModoNocturno] = useState(null);
    const [tamañoNormal, setTamañoNormal] = useState(null);

    useFocusEffect(React.useCallback(() => {
    (async () => {
        const theme = await AsyncStorage.getItem('themePreference');
        theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);

        const tamaño = await AsyncStorage.getItem('letterPreference');
        tamaño == 'normal' ? setTamañoNormal(true) : setTamañoNormal(false);
      })()
    }, []));

    useEffect(() => {
      let documentos = [];
    
        (async () => { 
          const datosConsulta = await getDocs(query(collection(getFirestore(app),'Publicaciones'), where("Tipo", "==", "Adopcion")));  
          const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
          const datosConsultaUsuario = await getDocs(consultaUsuario);

          const user = datosConsultaUsuario.docs[0].data();
          setUsuario(user);

          await Promise.all(datosConsulta.docs.map(async(doc)=>{         
            if(!Object.values(user['Ocultar']).includes(doc.id)){
              var documento = await getDoc(doc.data()['Publicacion']);

              if(animalFiltro && zonaFiltro){
                if(documento.data()['Zona'] == zonaFiltro && documento.data()['Animales'] == animalFiltro){
                  documentos.push(documento);
                }
              }
              else if(animalFiltro){
                if(documento.data()['Animales'] == animalFiltro){
                  documentos.push(documento);
                }
              }
              else if(zonaFiltro){
                if(documento.data()['Zona'] == zonaFiltro){
                  documentos.push(documento);
                }
              }
              else{
                documentos.push(documento);
              }
            }
          })
        )
        
        setdatosBD(documentos);
        })();
      
    }, [animalFiltro, zonaFiltro, recargar]); 

    useEffect(()=> {
      (async () =>{
          const consulta = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
          const datosConsulta = await getDocs(consulta);

          let idDoc = '';
          let i = 0;
          let documentosFavoritos = [];

          while(i < datosConsulta.docs[0].data()['Adoptar_Favoritos'].length){
            idDoc = datosConsulta.docs[0].data()['Adoptar_Favoritos'][i].path.split('/')[1];
            var documento = await getDoc(doc(getFirestore(app),'Adopcion',  idDoc));
            
            
            if(documento.data() != undefined){
              documentosFavoritos.push(documento);
            }
            else{
              await updateDoc(doc(getFirestore(app),'Usuarios', datosConsulta.docs[0]["id"]), {
                Adoptar_Favoritos: arrayRemove(doc(collection(getFirestore(app), 'Adopcion'), idDoc))
              });
            }
            i++;

          }
          
          setDatosBDFavorito(documentosFavoritos);
      })()
    },[vistaFavorito]);

    const Elementos = ({publicacion, navegacion, idDoc}) => {
      const [modalVisible, setModalVisible] = useState(false);
      const [datosUnico, setDatosUnico] = useState(null);

      const [modalImagen, setModalImagen] = useState(false);
      const [imagenMostrar, setImagenMostrar] = useState('');

      const [addFavorito, setAddFavorito] = useState(false);
    
      async function contactarDueño(Id_Dueño){
        if(getAuth(app).currentUser.uid == Id_Dueño)
          Alert.alert('¡Error!', 'No te puedes poner en contacto contigo mismo');

        else{
          const consultaUsuario = query(collection(getFirestore(app),'Salas'), where("Id_Usuario1", "==", getAuth(app).currentUser.uid), where("Id_Usuario2", "==", Id_Dueño));
          const datosConsultaUsuario = await getDocs(consultaUsuario);
          
          const consultaRemitente = query(collection(getFirestore(app),'Salas'), where("Id_Usuario1", "==", Id_Dueño), where("Id_Usuario2", "==", getAuth(app).currentUser.uid));
          const datosConsultaRemitente = await getDocs(consultaRemitente);
      
          if(datosConsultaRemitente.docs.length==0){   //SALA (DUEÑO MASCOTA - USUARIO)
            const sala = {Id_Usuario1: Id_Dueño, Id_Usuario2: auth.currentUser.uid, Mensajes:[], ult_Acceder: new Date(), ult_Mensaje: new Date()}
            addDoc(collection(getFirestore(app),'Salas'), sala); 
          }
      
          if(datosConsultaUsuario.docs.length==0){ //SALA (USUARIO - DUEÑO MASCOTA)
              const sala = {Id_Usuario1: auth.currentUser.uid, Id_Usuario2: Id_Dueño, Mensajes:[]};
              addDoc(collection(getFirestore(app),'Salas'), sala); 
              navegacion.navigate('ChatPrivado', {Sala:sala});
          }
          else{ //Si ya existe una sala del chat
            navegacion.navigate('ChatPrivado', {Sala: datosConsultaUsuario.docs[0].data()});
          }
        }
      }
    
      async function imprimirFavorito(){
        const consulta = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
        const datosConsulta = await getDocs(consulta);
       
        if(!addFavorito){
          Alert.alert('','Se ha añadido a favorito la publicación.');
          await updateDoc(doc(getFirestore(app),'Usuarios', datosConsulta.docs[0]["id"]), {
            Adoptar_Favoritos: arrayUnion(doc(collection(getFirestore(app), 'Adopcion'), idDoc))
          });
        }
        else{
          Alert.alert('','Se ha eliminado de favorito la publicación.');
          await updateDoc(doc(getFirestore(app),'Usuarios', datosConsulta.docs[0]["id"]), {
            Adoptar_Favoritos: arrayRemove(doc(collection(getFirestore(app), 'Adopcion'), idDoc))
          });
        }
      }
      
      useEffect(()=>{
        (async () =>{ 
          let i = 0;
          while(i < datosBDFavorito.length){
            if(datosBDFavorito[i].id == idDoc)
              setAddFavorito(true);
            i++;
          }
        })()
      }, []);
    
      return(
        <View style={[{flex:1}]}>
          <View style={[styles.caja, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1},]}> 
            <View style={{flex:1, borderTopLeftRadius:20, borderBottomLeftRadius:20}}>
              <View style={[{padding:10}]}>
                <Image
                  style={{height:'100%', width:'100%', borderRadius:20,}}
                  source={{
                    uri: publicacion.data()['Fotos'][0],
                    }}
                  />
              </View>
            </View>
      
            <View style={{flex:1, padding:20, paddingLeft:0, borderTopRightRadius:20, borderBottomRightRadius:20,}}>
              <Text numberOfLines={tamañoNormal ? 7 : 4} style={[{fontWeight: 500, marginRight:25}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>{publicacion.data()['Informacion']}</Text>
              <Pressable
                style={styles.button}
                onPress = {() => {setModalVisible(!modalVisible),setDatosUnico(publicacion.data())}}>
                  <Text style={[{textAlign: 'center'}, tamañoNormal ? null : {fontSize:15}]}>Más detalles</Text>
              </Pressable>
              <TouchableOpacity onPress = {() => {setAddFavorito(!addFavorito); imprimirFavorito()}}style={{position:'absolute', right:5, top:0, marginTop:10,}}>
                  {!addFavorito && modoNocturno && <AntDesign name="staro" size={25} color="black" style={{marginRight:10}} />}
                  {!addFavorito && !modoNocturno && <AntDesign name="staro" size={25} color="white" style={{marginRight:10}} />}
                  {addFavorito && <AntDesign name="star" size={25} color='#f75b53' style={{marginRight:10,}} />}
              </TouchableOpacity>
              <TouchableOpacity onPress = {() => {setAddFavorito(!addFavorito); imprimirFavorito()}}style={{position:'absolute', right:5, top:0, marginTop:10}}>
                  {!addFavorito && modoNocturno && <AntDesign name="staro" size={25} color="black" style={{marginRight:10}} />}
                  {!addFavorito && !modoNocturno && <AntDesign name="staro" size={25} color="white" style={{marginRight:10}} />}
                  {addFavorito && <AntDesign name="star" size={25} color='#f75b53' style={{marginRight:10,}} />}
                </TouchableOpacity>
            </View>
      
            {datosUnico && 
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
                        style={[styles.botonModal]}
                        onPress={() => setModalVisible(!modalVisible)}>
                        <AntDesign name="closecircle" size={24} color="black" />
                      </Pressable>
                    </View>
                    <View style={[styles.viewImagenes]}>
                      <FlatList
                          horizontal
                          scrollEventThrottle={2}
                          showsHorizontalScrollIndicator={true} 
                          pagingEnabled
                          data={datosUnico["Fotos"]}
                          snapToAlignment={'center'}  
                          contentContainerStyle={{justifyContent: 'center', alignItems:'center', backgroundColor:'#e7ebda', borderColor:'#000'}}
                          renderItem={ ({ item, index }) => (
                            <TouchableOpacity onPress={() =>{setImagenMostrar(item);setModalImagen(!modalImagen)}}>
                              <Image 
                                source={{uri:item}}
                                key={index}      
                                style={{
                                  width:160,
                                  height:240,
                                  margin:8,
                                  aspectRatio:1,
                                  borderRadius:20,
                                  alignSelf:'center',
                                  marginLeft:16
                                }}
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
                      <View style={styles.viewDatos}>
                        <Text style={[{fontWeight:400, fontSize:18}, tamañoNormal ? null : {fontSize:22}]}>{datosUnico["Informacion"]}</Text>
                      </View>
                    </ScrollView>
                    <View style={{alignItems:'center', justifyContent:'center', marginBottom:18}}>
                      <TouchableOpacity onPress={()=>{
                        Alert.alert('', '¿Deseas contactar con el dueño?', [
                          {
                            text: 'No',
                            style: 'cancel',
                          },
                          {text: 'Si', onPress: () =>{contactarDueño(datosUnico["Id_Usuario"])}},
                        ])}
                      }>
                        <Text style={[{fontSize:15}, tamañoNormal ? null : {fontSize:18, marginRight:10}]}>Contactar con el dueño: <Ionicons name="paper-plane" size={20} /> </Text>
                      </TouchableOpacity>
                      <Pressable
                        style={{position:'absolute', right:15, marginTop:3}}
                        onPress={() => Alert.alert('¡Atención!', '¿Deseas reportar la publicación?', [
                          {
                            text: 'No',
                            style: 'cancel',
                          },
                          {text: 'Si', onPress: () =>{setModalVisible(!modalVisible); navigation.navigate('ReportesScreen', {idDoc:idDoc, tipo:"Adopcion"})}},
                        ])}>
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
                  <View style={[styles.modalImagen]}>
                    <Image 
                      source={{uri:imagenMostrar}}   
                      style={[{
                        width:'100%',
                        height:'100%',
                        marginTop:60,
                        aspectRatio:1,
                        borderRadius:20,
                        alignSelf:'center',
                        marginLeft:20,
                        marginRight:20,
                      }]}
                      />
                  </View>
                </TouchableOpacity>
              </Modal>
            }
          </View>
        </View>
      );
    }

    return (
    <View style={{flex:1}}>
      <ImageBackground
        source={modoNocturno ? require('../../imagenes/adoptarFondo.jpg') : require('../../imagenes/adoptarNocturno.jpg')}
        resizeMode={'cover'}
        style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
      </ImageBackground>

      <View style={{marginBottom:20,}}>
        <Header numero={4} navegar={navigation}/>
      </View>
      
      {!vistaFavorito && 
        <View style={{flexDirection:'row'}}>
          <Pressable
            style={styles.botonFiltrar}
            onPress = {() => {setabrirModalFiltro(true)}}>
            <Text style={[{textAlign: 'center', fontWeight:500}, tamañoNormal ? null : {fontSize:18}]}><Ionicons name="filter" size={16} color="black" /> Filtrar</Text>
          </Pressable>
        
          {animalFiltro && 
            <Pressable
              style={styles.botonFiltrar}
              onPress = {() => {setAnimalFiltro(null)}}>
              <Text style={[{textAlign: 'center'}, tamañoNormal ? null : {fontSize:16}]}><AntDesign name="closecircleo" size={14} color="black"/> {animalFiltro}</Text>
            </Pressable>
          }
          {zonaFiltro &&
            <Pressable
              style={styles.botonFiltrar}
              onPress = {() => {setZonaFiltro(null)}}>
              <Text style={[{textAlign: 'center'}, tamañoNormal ? null : {fontSize:16}]}><AntDesign name="closecircleo" size={14} color="black"/> {zonaFiltro}</Text>
            </Pressable>
          }
        </View>
      }
      <View style={{flexDirection:'row', marginTop:5, justifyContent:'space-between'}}>
        <TouchableOpacity onPress={()=>{setVistaFavorito(!vistaFavorito)}} style={[styles.botonFavorito, tamañoNormal ? null : {width:130}]}>
            {!vistaFavorito && <AntDesign name="staro" size={25} color="black" style={{marginRight:10}} />}
            {vistaFavorito && <AntDesign name="star" size={25} color='#f75b53' style={{marginRight:10,}} />}
            <Text style={[tamañoNormal ? null : {fontSize:17}]}>Favoritos</Text>
        </TouchableOpacity>

        {!vistaFavorito && 
          <TouchableOpacity onPress={()=>{setRecargar(!recargar)}} style={[{padding:10, backgroundColor:'#fff', justifyContent:'center', alignContent:'center', borderRadius:40, marginRight:20}]}>
              <AntDesign name="reload1" size={25} color="black" style={{padding:5}}/>
          </TouchableOpacity>
        }
      </View>

      {!vistaFavorito && 
        <FlatList
          data={datosBD}
          renderItem={({item}) => {return <Elementos publicacion={item} navegacion={navigation} idDoc={item.id}/>}}
          keyExtractor={item => item.id}
          style={{marginBottom:10}}
        />
      }

      {vistaFavorito &&
        <FlatList
          data={datosBDFavorito}
          renderItem={({item}) => {return <Elementos publicacion={item} navegacion={navigation} idDoc={item.id}/>}}
          keyExtractor={item => item.id}
          style={[{marginBottom:10, marginTop:30,}]}
        />
      }

      {abrirModalFiltro && 
        <Modal
          animationType="slide"
          transparent={true}
          visible={abrirModalFiltro}
          onRequestClose={() => {
            setabrirModalFiltro(!abrirModalFiltro);
          }}
        >
          <TouchableOpacity style={{flex:1,}} onPress={() => {setabrirModalFiltro(!abrirModalFiltro)}}>
            <View style={styles.modalViewFiltro}>
              <View style={{height:25, width:50, margin:5,}}>
                <Pressable
                  style={[styles.botonModal]}
                  onPress={() => setabrirModalFiltro(!abrirModalFiltro)}>
                  <AntDesign name="closecircle" size={24} color="black" />
                </Pressable>
              </View>
              <View style={{padding:20,}}>
                <Text style={{fontWeight:'bold', fontSize:22, marginBottom:20}}>Filtrar por</Text>

                <SelectDropdown
                  data={animales}
                  onSelect={(selectedItem, index) => {setAnimalFiltro(selectedItem);}} 
                  defaultButtonText= {
                    animalFiltro && <Text>{animalFiltro}</Text> || <Text style={{fontWeight:'bold', borderColor:'#000', fontSize:15}}>Animal <Entypo name="triangle-down" size={15} color="black"/></Text> 
                  }
                  buttonStyle={styles.dropdown1BtnStyle}
                />

                <View style={{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, marginTop:20, marginBottom:20}}/>

                <SelectDropdown
                  data={provincias}
                  onSelect={(selectedItem, index) => {setZonaFiltro(selectedItem)}} //Onchange cambia el valor del campo en el form
                  defaultButtonText= {
                    zonaFiltro && <Text>{zonaFiltro}</Text> || <Text style={{fontWeight:'bold', borderColor:'#000', fontSize:15}}>Zona <Entypo name="triangle-down" size={15} color="black"/></Text> 
                  }
                  buttonStyle={styles.dropdown1BtnStyle}
                />

                </View>
              </View>
          </TouchableOpacity>
        </Modal>
      }
    </View>   
  );
}

const styles = StyleSheet.create({
  caja:{
    backgroundColor:'#F0B27A',
    height:200,
    marginTop:10,
    marginBottom:10,
    flexDirection: 'row',
    borderRadius:20,
    marginLeft:10,
    marginRight:10,
    borderColor:'#000', 
    borderWidth:1,
  },
  button:{
    backgroundColor:'#fff',
    borderRadius:20,
    marginLeft:'25%',
    marginBottom:10,
    bottom:0,
    width: 'auto',
    padding:10,
    position: 'absolute'
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
  botonModal: {
    borderRadius: 20,
    width:25,
    height:25,
    justifyContent: 'flex-start',
    marginLeft:10,
  },
  botonFiltrar:{
    backgroundColor:'#fff',
    borderRadius:20,
    width: 100,
    padding:10,
    marginLeft:5,
    borderColor:'black',
    borderWidth:1
  },
  botonFavorito:{
    backgroundColor:'#fff',
    borderRadius:20,
    width: 120,
    padding:10,
    marginLeft:5,
    borderColor:'black',
    borderWidth:1,
    flexDirection:'row',
    marginTop:5
  },
  modalViewFiltro: {
    flex: 0.40, 
    backgroundColor: '#e7ebda',
    margin: 30,  
    borderRadius: 20,
    flexDirection: 'column',
    borderColor:'#fff',
    marginTop:100
  },
  dropdown1BtnStyle:{
    backgroundColor:'#fff',
    borderWidth:1,
    borderRadius:15,
    borderColor:'#000',
    width:130,
  }
});
  