import { StyleSheet, Text, View, TouchableOpacity, Image, Keyboard, FlatList, Modal, TouchableHighlight, Pressable, ImageBackground, Alert, Platform, Button} from 'react-native';
import {getDocs, collection, getFirestore, query, where, getDoc, doc, arrayRemove, updateDoc, orderBy, limit, deleteDoc} from "firebase/firestore";
import React, { useState, useEffect, useRef} from 'react';
import Constants from 'expo-constants';
import { MaterialIcons, Feather, AntDesign, MaterialCommunityIcons, Fontisto, Ionicons} from '@expo/vector-icons';
import {app} from "../../../database/firebase";
import { ScrollView } from 'react-native-gesture-handler';
import { getStorage, uploadBytes,ref, getDownloadURL, deleteObject} from "firebase/storage";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PublicacionAdmin({navigation, route, navigation: { goBack }}) {
    const [reporte, setReporte] = useState(false);
    const [publicacion ,setPublicacion] = useState(false);
    const [publicacionTipo ,setPublicacionTipo] = useState(false);
    const [usuario, setUsuario] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

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
        (async () =>{
            const consultaReporte= doc(getFirestore(app),'Reportes', route.params.IdReportes);
            const datosConsultaReportes = await getDoc(consultaReporte);

            const consultaPublicacion = await getDoc(datosConsultaReportes.data()['Publicacion']);
            const consultaTipo = await getDoc(consultaPublicacion.data()['Publicacion']);

            const usuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", consultaTipo.data()['Id_Usuario']));
            const dataUsuario = await getDocs(usuario);
            
            setReporte(datosConsultaReportes);
            setPublicacion(consultaPublicacion);
            setPublicacionTipo(consultaTipo);
            setUsuario(dataUsuario);
        })()
    },[]);

    async function borrarPublicacion(){
        var imagenesEliminar = publicacionTipo.data()['Fotos'];
        if(imagenesEliminar){
            let i = 0;
            const storage = getStorage(app, 'gs://tfg-56e1b.appspot.com');

            while(i<imagenesEliminar.length){
                const storageRef = ref(storage, imagenesEliminar[i]);
                await deleteObject(storageRef);
            
                i++;
            }
        }
        deleteDoc(doc(getFirestore(app),publicacion.data()['Tipo'], publicacionTipo.id));
        deleteDoc(doc(getFirestore(app),'Publicaciones', publicacion.id));
        deleteDoc(doc(getFirestore(app),'Reportes', route.params.IdReportes));
        
        Alert.alert("","La publicación ha sido eliminada con éxito.");
        goBack();
    }

    async function bloquearUsuario(){
        const publicacionesUsuario = query(collection(getFirestore(app),'Publicaciones'), where("Usuario", "==", usuario.docs[0].ref));
        const datosPublicacionesUsuario = await getDocs(publicacionesUsuario);

        datosPublicacionesUsuario.docs.map((item)=>{
            borrarUnaPublicacion(item.data()['Publicacion'], item.data()['Tipo'], item);
            
            deleteDoc(doc(getFirestore(app), 'Publicaciones', item.id));
        });
        
        updateDoc(doc(getFirestore(app), "Usuarios", usuario.id), {Baneado: true});
        Alert.alert("","Todas las publicaciones del usuario han sido eliminadas con éxito y se ha bloqueado al usuario del sistema.");
        goBack();
    }

    async function borrarUnaPublicacion(publicacionRef, Tipo, publicacion){
        const publicacionParticular = await getDoc(publicacionRef);
        
        if(publicacionParticular.data()['Fotos']){
            var imagenesEliminar = publicacionParticular.data()['Fotos'];
            let i = 0;
            const storage = getStorage(app, 'gs://tfg-56e1b.appspot.com');

            while(i<imagenesEliminar.length){
                const storageRef = ref(storage, imagenesEliminar[i]);
                await deleteObject(storageRef);
            
                i++;
            }
        }

        deleteDoc(doc(getFirestore(app), Tipo, publicacionParticular.id));

        const reportesPublicacion = query(collection(getFirestore(app),'Reportes'), where("Publicacion", "==", publicacion.ref));
        const reportesRef = await getDocs(reportesPublicacion);
        if(reportesRef.docs[0]){
            deleteDoc(doc(getFirestore(app), 'Reportes', reportesRef.docs[0].id));
        }
    }

    async function borrarReportes(){
        deleteDoc(doc(getFirestore(app),'Reportes', route.params.IdReportes));
        Alert.alert("","Los reportes han sido eliminada con éxito.");
        goBack();
    }

    function fechaPublicacion(fecha){
        let fechaResultante = new Date(fecha["seconds"] * 1000 + fecha["nanoseconds"]/1000000);

        return fechaResultante.toLocaleDateString();
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
                    <Pressable style ={{marginTop:2}} onPress={()=>{goBack()}}>
                        {modoNocturno ? <AntDesign name="arrowleft" size={40} color="black"/> : <AntDesign name="arrowleft" size={40} color="white"/>}
                    </Pressable>
                    <Text style={{ fontWeight:"bold", color:'#fff', fontSize:30, marginLeft:5}}>Publicación Reportada</Text>
                </View>
            </View>
  
            <ScrollView style={{flex:1, marginTop:20, padding:20}}>
                <View style={styles.infoPersonal}>
                    <Text style={[{color:'blue', marginBottom:15, fontWeight:500, fontSize:20, marginLeft:5}, tamañoNormal ? null : {fontSize:22}]}>Información sobre la publicación</Text>
                    <View>
                        <Text style={[{fontSize:18}, tamañoNormal ? null : {fontSize:22}]}>Email del creador</Text>
                        <View style={{marginTop:10}}>
                            {usuario && <Text style={[{fontWeight:300, marginLeft:10, fontSize:16}, tamañoNormal ? null : {fontSize:18}]}>{usuario.docs[0].data()['Email']}</Text>}
                        </View>
                        <View style={{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, marginRight:20}}/>
                    </View>

                    <View style={{marginBottom:20, marginTop:20}}>
                        <Text style={[{fontSize:18}, tamañoNormal ? null : {fontSize:22}]}>Fecha de la creación</Text>
                        <View style={{marginTop:10}}>
                            {publicacion && <Text style={[{fontWeight:300, marginLeft:10, fontSize:16}, tamañoNormal ? null : {fontSize:18}]}>{fechaPublicacion(publicacion.data()['Fecha'])}</Text>}
                        </View>
                        <View style={{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, marginRight:20}}/>
                    </View>

                    <View>
                        <Text style={[{fontSize:18}, tamañoNormal ? null : {fontSize:22}]}>Tipo de publicación</Text>
                        <View style={{marginTop:10}}>
                            {publicacion && <Text style={[{fontWeight:300, marginLeft:10, fontSize:16}, tamañoNormal ? null : {fontSize:18}]}>{publicacion.data()['Tipo']}</Text>}
                        </View>
                        <View style={{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, marginRight:20}}/>
                    </View>

                    <TouchableOpacity onPress={()=>{setModalVisible(!modalVisible)}}>
                        <Text style={[{fontSize:18, marginTop:15}, tamañoNormal ? null : {fontSize:22}]}>Consultar Fotos Adjuntadas</Text>
                        <View style={{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, marginRight:20}}/>
                    </TouchableOpacity>

                    <View>
                        <Text style={[{fontSize:18, marginTop:15}, tamañoNormal ? null : {fontSize:22}]}>Información</Text>
                        <View style={{marginTop:10, marginRight:30}}>
                            {publicacionTipo && <Text style={[{fontWeight:300, marginLeft:10, fontSize:16}, tamañoNormal ? null : {fontSize:18}]}>{publicacionTipo.data()['Informacion']}</Text>}
                        </View>
                        <View style={{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, marginRight:20}}/>
                    </View>

                    <View style={{marginBottom:10, marginTop:10}}>
                        <Text style={[{fontSize:18}, tamañoNormal ? null : {fontSize:22}]}>Reportes</Text>
                        <View style={{marginTop:10, marginRight:30}}>
                            {publicacionTipo && reporte.data()['Motivo'].map((item, index) =>{
                                return (
                                    <View key={index}>
                                        <Text style={[{fontWeight:300, marginLeft:10, fontSize:16, marginBottom:10}, tamañoNormal ? null : {fontSize:18}]}>{index+1}- {item}.</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <View style={{marginBottom:20}}/>
                    </View>

                </View>
            </ScrollView>

            <View style={{justifyContent:'center', alignItems:'center', marginBottom:15, flexDirection:'row', marginTop:10}}>
                <TouchableOpacity style={{backgroundColor:'#3a99d8', padding:10, borderRadius:6, width:115}} 
                    onPress={()=>{ Alert.alert('¡Atención!', '¿Estás seguro de que deseas borrar la publicación?', [
                        {
                            text: 'Cancelar',
                            style:"default",
                        },
                        {text: 'Aceptar', onPress: () => borrarPublicacion()}
                        ]);
                    }}
                >
                    <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:17}]}>Borrar</Text>
                    <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:17}]}>Publicación</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{backgroundColor:'#3a99d8', padding:10, borderRadius:6, width:105, marginLeft:10, marginRight:10}} 
                    onPress={()=>{ Alert.alert('¡Atención!', '¿Estás seguro de que deseas banear al usuario?', [
                        {
                            text: 'Cancelar',
                            style:"default",
                        },
                        {text: 'Aceptar', onPress: () => bloquearUsuario()}
                        ]);
                    }}
                >
                    <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:17}]}>Bloquear</Text>
                    <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:17}]}>Usuario</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{backgroundColor:'#3a99d8', padding:10, borderRadius:6, width:100}}
                    onPress={()=>{ Alert.alert('¡Atención!', '¿Estás seguro de que deseas borrar los reportes de la publicación?', [
                        {
                            text: 'Cancelar',
                            style:"default",
                        },
                        {text: 'Aceptar', onPress: () => borrarReportes()}
                        ]);
                    }}
                >
                    <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:17}]}>Borrar</Text>
                    <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:17}]}>Reportes</Text>
                </TouchableOpacity>
            </View>

            {publicacionTipo && 
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(!modalVisible);
                    }}
                >
                    <View style={{flex:1}} onPress={() => {setModalVisible(!modalVisible)}}>
                            <View style={styles.modalView}>
                                <View style={{flexDirection:'row', alignItems:'center', marginTop:20}}>
                                    <View style={{height:25, marginLeft:10, marginRight:10, marginBottom:0}}>
                                        <Pressable
                                            style={[styles.botonModal]}
                                            onPress={() => setModalVisible(!modalVisible)}>
                                                <AntDesign name="closecircle" size={24} color="black" />
                                        </Pressable>
                                    </View>
                                </View>
                                <FlatList
                                    horizontal={true} 
                                    showsHorizontalScrollIndicator={true} 
                                    data={publicacionTipo.data()['Fotos']}
                                    contentContainerStyle={{justifyContent:'center', alignItems:'center'}}
                                    renderItem={ ({ item, index }) => (
                                    <View>    
                                        <Image source={{uri:item}} 
                                            key={index}      
                                            style={{
                                                width:260,
                                                height:260,
                                                margin:8,
                                                aspectRatio:1,
                                            }}
                                        />
                                    </View>
                                    )}
                                />
                            </View>
                    
                    </View>
                </Modal>
        }
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
      backgroundColor: '#F0B27A',
      height: 100,
      borderBottomRightRadius:20,
      borderBottomLeftRadius:20
    },
    avatar: {
      width: 130,
      height: 130,
      borderRadius: 63,
      borderWidth: 4,
      borderColor: 'white',
      marginBottom: 10,
      alignSelf: 'center',
      position: 'absolute',
      marginTop: 130,
    },
    infoPersonal:{
        flex: 0.9, 
        backgroundColor:'#fff', 
        paddingLeft:20, 
        paddingTop:20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.37,
        shadowRadius: 7.49,
        elevation: 12,
    },
    modalView: {
        flex: 0.7, 
        backgroundColor: '#fff',
        margin: 30,  
        borderRadius: 20,
        flexDirection: 'column',
        borderColor:'#fff',
    },
  })