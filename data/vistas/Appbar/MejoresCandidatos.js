import { StyleSheet, Text, View, Image, Pressable, SafeAreaView, FlatList, ImageBackground, Modal, ScrollView, Alert, TouchableHighlight, Dimensions, TouchableOpacity} from 'react-native';
import Header from '../Header';
import React, { useState, useEffect} from 'react';
import {app} from "../../../database/firebase";
import {getDocs, collection, getFirestore, query, where, updateDoc, arrayRemove, arrayUnion, doc, getDoc, deleteDoc, addDoc} from "firebase/firestore";
import Constants from 'expo-constants';
import { Ionicons, AntDesign, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import SelectDropdown from "react-native-select-dropdown";
import {getAuth} from 'firebase/auth';
import { getStorage, uploadBytes,ref, getDownloadURL, deleteObject} from "firebase/storage";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MejoresCandidatos({route, navigation, navigation:{goBack}}) {

    const [datosBD, setdatosBD] = useState([]);
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

    useEffect(()=> {
        setdatosBD(route.params.Publicaciones);
    },[]);

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
            const consultaDest= query(collection(getFirestore(app),'Usuarios'), where("Id", "==", publicacion['Id_Usuario']));
            const datosConsultaDest = await getDocs(consultaDest);
            let idDocFav = '';
            let i = 0;
            while(i < datosConsultaDest.docs[0].data()['Adoptar_Favoritos'].length){
              idDocFav = datosConsultaDest.docs[0].data()['Adoptar_Favoritos'][i].path.split('/')[1];
              if(idDocFav == idDoc)
                setAddFavorito(true);
              i++;
            }
          })()
        }, []);
      
        async function realizarReporte(){
          await updateDoc(doc(getFirestore(app),'Adopcion', idDoc), {
            Reportes: arrayUnion(getAuth(app).currentUser.uid),
            num_Reportes: publicacion['num_Reportes'] + 1
          });
          
          let i =0;
          setdatosBD(datosBD.filter((element) => {
            return element === idDoc;
          }))
      
          setModalVisible(!modalVisible);
        }
      
        return(
          <View style={[styles.caja, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}> 
            <View style={{flex:1, borderTopLeftRadius:20, borderBottomLeftRadius:20}}>
              <View style={{padding:10}}>
                <Image
                  style={{height:'100%', width:'100%', borderRadius:20,}}
                  source={{
                    uri: publicacion['Fotos'][0],
                    }}
                  />
              </View>
            </View>
      
            <View style={{flex:1, padding:20, paddingLeft:0, borderTopRightRadius:20, borderBottomRightRadius:20,}}>
              <Text numberOfLines={tamañoNormal ? 7 : 4} style={[{fontWeight: 500, marginRight:25}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>{publicacion['Informacion']}</Text>
              <Pressable
                style={styles.button}
                onPress = {() => {setModalVisible(!modalVisible),setDatosUnico(publicacion)}}>
                  <Text style={[{textAlign: 'center'}, tamañoNormal ? null : {fontSize:16}]}>Más detalles</Text>
              </Pressable>
            </View>
      
            {datosUnico && 
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                  setModalVisible(!modalVisible);
                }}>
                <View style={styles.modalView}>
                  <View style={{flex:0.8, borderRadius:20,}}>
                    <View style={{height:25, width:50, margin:5,}}>
                      <Pressable
                        style={[styles.botonModal]}
                        onPress={() => setModalVisible(!modalVisible)}>
                        <AntDesign name="closecircle" size={24} color="black" />
                      </Pressable>
                    </View>
                    <View style={styles.viewImagenes}>
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
                        <Text style={[{fontSize:15}, tamañoNormal ? null : {fontSize:18}]}>Contactar con el dueño: <Ionicons name="paper-plane" size={20} /> </Text>
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
          </View>
        );
    }

    return(
        <View style={{marginTop: Constants.statusBarHeight, flex:1}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground> 
            
            <View style={[styles.header, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <View style={{marginTop:15, marginLeft:10, flexDirection:'row'}}>
                    <TouchableOpacity onPress={()=>{goBack()}}>
                        {modoNocturno ? <MaterialCommunityIcons name="keyboard-backspace" size={50} color="black"/> : <MaterialCommunityIcons name="keyboard-backspace" size={50} color="white"/>}
                    </TouchableOpacity>
                    <Text style={{ fontWeight:"bold", color:'#fff', fontSize:30, marginLeft:20}}>Posibles resultados</Text>
                </View>
            </View>

            <FlatList
                data={datosBD}
                renderItem={({item}) => <Elementos publicacion={item.data()} navegacion={navigation} idDoc={item.id}/>}
                keyExtractor={item => item.id}
                style={{marginBottom:10}}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#F0B27A',
        borderBottomRightRadius:20,
        borderBottomLeftRadius:20,
        flex:0.40,
        marginBottom:35
    },
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
    