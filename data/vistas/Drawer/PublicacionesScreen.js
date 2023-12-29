import { StyleSheet, Text, View, TouchableOpacity, Image, Keyboard, FlatList, Modal, Platform, Pressable, ImageBackground, Alert} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons, Entypo, Fontisto, AntDesign, EvilIcons} from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import {getDocs, collection, getFirestore, query, where, deleteDoc, doc, arrayRemove, updateDoc} from "firebase/firestore";
import {app} from "../../../database/firebase";
import {getAuth} from 'firebase/auth';
import { getStorage, uploadBytes,ref, getDownloadURL, deleteObject} from "firebase/storage";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PublicacionesScreen({route, navigation, navigation: { goBack }}){
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [mensajeError, setMensajeError] = useState(false);

    const [activePerdido, setactivePerdido] = useState(true);
    const [activeForo, setactiveForo] = useState(false);
    const [activeAdopcion, setactiveAdopcion] = useState(false);

    const [dataPerdido, setDataPerdido] = useState(null);
    const [dataForo, setDataForo] = useState(null);
    const [dataAdopcion, setDataAdopcion] = useState(null);

    const auth = route.params.idUsuario;

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

    const VistaPerdido = ({item, navigation}) =>{ //Destinatario
        
        async function borrarPublicacionPerdido(){
            const consultaPublicacion= query(collection(getFirestore(app),'Publicaciones'), where("Publicacion", "==", item.ref));
            const datosConsultaPublicacion = await getDocs(consultaPublicacion);

            const consultaReportes= query(collection(getFirestore(app),'Reportes'), where("Publicacion", "==", datosConsultaPublicacion.docs[0].ref));
            const datosConsultaReportes = await getDocs(consultaReportes);

            var imagenesEliminar = item.data()['Fotos'];
            let i = 0;
            const storage = getStorage(app, 'gs://tfg-56e1b.appspot.com');

            while(i<imagenesEliminar.length){
                const storageRef = ref(storage, imagenesEliminar[i]);
                await deleteObject(storageRef);
               
                i++;
            }

            deleteDoc(doc(getFirestore(app), "Perdidos", item.id));
            deleteDoc(doc(getFirestore(app), "Publicaciones", datosConsultaPublicacion.docs[0].id));

            if(!datosConsultaReportes.empty){
                deleteDoc(doc(getFirestore(app), "Reportes", datosConsultaReportes.docs[0].id));
            }

            Alert.alert("","Su publicación ha sido eliminada con éxito.");
            setDataPerdido(dataPerdido.filter((element) => {return element.id !=item.id}));
        }

        return(
            <View style={[styles.caja, modoNocturno ? null : {backgroundColor:'#323639'}]}> 
                <View style={{flex:1, borderTopLeftRadius:20, borderBottomLeftRadius:20}}>
                    <View style={[{padding:10}, Platform.OS != 'web' ? null : {flex:1}]}>
                        <Image
                            style={{height:'100%', width:'100%', borderRadius:20,}}
                            source={{
                                uri: item.data()['Fotos'][0],
                            }}
                        />
                    </View>
                </View>

                <View style={{flex:1, padding:15, borderTopRightRadius:20, borderBottomRightRadius:20,}}>
                    <Text numberOfLines={tamañoNormal ? 7 : 5} style={[{fontWeight:500, fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:19}]}>{item.data()['Informacion']}</Text>
                    <View style={styles.button}>
                            <View style={{flexDirection:'row'}}>
                                <TouchableOpacity style={{flexDirection:'row', marginRight:16}} onPress={()=>{ Alert.alert('¡Atención!', '¿Estás seguro de que deseas borrar la publicación?', [
                                    {
                                        text: 'Cancelar',
                                        style:"default",
                                    },
                                    {text: 'Aceptar', onPress: () => borrarPublicacionPerdido()}
                                    ]);}}
                                >  
                                    {modoNocturno ? <AntDesign name="delete" size={20} color="black" /> : <AntDesign name="delete" size={20} color="white" />}
                                    <Text style={[{textAlign: 'center', marginTop:2, marginLeft:5}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:16, marginTop:0}]}>Borrar</Text>
                                </TouchableOpacity>
                                {Platform.OS != 'web' && <TouchableOpacity style={{flexDirection:'row',}} onPress={() =>{navigation.navigate('EditarPublicacionPerdido', {item:item.data(), idDoc:item.id})}}>
                                    {modoNocturno ? <EvilIcons name="pencil" size={24} color="black"/> : <EvilIcons name="pencil" size={24} color="white"/>}
                                    <Text style={[{textAlign: 'center', marginTop:2},modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:16, marginTop:0}]}>Editar</Text>
                                </TouchableOpacity>
                                }
                            </View>
                     </View>
                </View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={mensajeError}
                    onRequestClose={() => {
                        setMensajeError(!mensajeError);
                    }}>
                        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                            <View style={{backgroundColor:'#fff', width:300, height:400}}>
                                <Text>¿Estás seguro de que deseas borrar la publicacion?</Text>
                            </View>
                        </View>
                       
                </Modal>
            </View>
        );
    }

    const VistaForo = ({item, navigation}) =>{ //Destinatario

        async function borrarPublicacionForo(){
            const consultaPublicacion= query(collection(getFirestore(app),'Publicaciones'), where("Publicacion", "==", item.ref));
            const datosConsultaPublicacion = await getDocs(consultaPublicacion);

            const consultaReportes= query(collection(getFirestore(app),'Reportes'), where("Publicacion", "==", datosConsultaPublicacion.docs[0].ref));
            const datosConsultaReportes = await getDocs(consultaReportes);

            deleteDoc(doc(getFirestore(app), "PostForo", item.id));
            deleteDoc(doc(getFirestore(app), "Publicaciones", datosConsultaPublicacion.docs[0].id));

            if(!datosConsultaReportes.empty){
                deleteDoc(doc(getFirestore(app), "Reportes", datosConsultaReportes.docs[0].id));
            }

            Alert.alert("","Su publicación ha sido eliminada con éxito.");
            setDataForo(dataForo.filter((element) => element.id != item.id));

            const consulta = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", auth));
            const datosConsulta = await getDocs(consulta);

            await updateDoc(doc(getFirestore(app),'Usuarios', datosConsulta.docs[0]["id"]), {
                Post_Favoritos: arrayRemove(doc(collection(getFirestore(app), 'PostForo'), item.id))
              });
        }

        return(
            <View style={[styles.caja, modoNocturno ? null : {backgroundColor:'#323639'}]}> 
                <View style={{flex:1, borderTopLeftRadius:20, borderBottomLeftRadius:20}}>
                    <View style={[{padding:10}, Platform.OS != 'web' ? null : {flex:1}]}>
                        <Image
                            style={{height:'100%', width:'100%', borderRadius:20,}}
                            source={{
                                uri: item.data()['Foto'],
                            }}
                        />
                    </View>
                </View>

                <View style={{flex:1, padding:15, borderTopRightRadius:20, borderBottomRightRadius:20,}}>
                    <View>
                        <Text numberOfLines={2} style={[{fontWeight:500, fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:20}]}>{item.data()['Titulo']}</Text>
                        <Text numberOfLines={3} style={[{fontWeight:400, fontSize:16, marginTop:10}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:20}]}>{item.data()['Informacion']}</Text>
                    </View>
                    <View style={styles.button}>
                            <View style={{flexDirection:'row'}}>
                                <TouchableOpacity style={{flexDirection:'row', marginRight:16}} onPress={()=>{ Alert.alert('¡Atención!', '¿Estás seguro de que deseas borrar la publicación?', [
                                    {
                                        text: 'Cancelar',
                                        style:"default",
                                    },
                                    {text: 'Aceptar', onPress: () => borrarPublicacionForo()}
                                    ]);}}
                                >  
                                    {modoNocturno ? <AntDesign name="delete" size={20} color="black" /> : <AntDesign name="delete" size={20} color="white" />}
                                    <Text style={[{textAlign: 'center', marginTop:2, marginLeft:5}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:16, marginTop:0}]}>Borrar</Text>
                                </TouchableOpacity>
                                {Platform.OS != 'web'&& <TouchableOpacity style={{flexDirection:'row',}} onPress={() =>{navigation.navigate('EditarPublicacionForo', {item:item.data(), idDoc:item.id})}}>
                                    {modoNocturno ? <EvilIcons name="pencil" size={24} color="black"/> : <EvilIcons name="pencil" size={24} color="white"/>}
                                    <Text style={[{textAlign: 'center', marginTop:2},modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:16, marginTop:0}]}>Editar</Text>
                                </TouchableOpacity>
                                }
                            </View>
                    </View>
                </View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={mensajeError}
                    onRequestClose={() => {
                        setMensajeError(!mensajeError);
                    }}>
                        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                            <View style={{backgroundColor:'#fff', width:300, height:400}}>
                                <Text>¿Estás seguro de que deseas borrar la publicacion?</Text>
                            </View>
                        </View>
                    
                </Modal>
            </View>
        );
    }

    const VistaAdoptar = ({item, navigation}) =>{ //Destinatario
        
        async function borrarPublicacionAdoptar(){
            var imagenesEliminar = item.data()['Fotos'];
            const consultaPublicacion= query(collection(getFirestore(app),'Publicaciones'), where("Publicacion", "==", item.ref));
            const datosConsultaPublicacion = await getDocs(consultaPublicacion);

            const consultaReportes= query(collection(getFirestore(app),'Reportes'), where("Publicacion", "==", datosConsultaPublicacion.docs[0].ref));
            const datosConsultaReportes = await getDocs(consultaReportes);

            deleteDoc(doc(getFirestore(app), "Publicaciones", datosConsultaPublicacion.docs[0].id));

            if(!datosConsultaReportes.empty){
                deleteDoc(doc(getFirestore(app), "Reportes", datosConsultaReportes.docs[0].id));
            }
            
            let i = 0;
            const storage = getStorage(app, 'gs://tfg-56e1b.appspot.com');

            while(i<imagenesEliminar.length){
                const storageRef = ref(storage, imagenesEliminar[i]);
                await deleteObject(storageRef);
               
                i++;
            }

            deleteDoc(doc(getFirestore(app), "Adopcion", item.id));
            
            Alert.alert("","Su publicación ha sido eliminada con éxito.");
            setDataAdopcion(dataAdopcion.filter((element) => {return element.id!=item.id}));
        }

        return(
            <View style={[styles.caja, modoNocturno ? null : {backgroundColor:'#323639'}]}> 
                <View style={{flex:1, borderTopLeftRadius:20, borderBottomLeftRadius:20}}>
                    <View style={[{padding:10}, Platform.OS != 'web' ? null : {flex:1}]}>
                        <Image
                            style={{height:'100%', width:'100%', borderRadius:20,}}
                            source={{
                                uri: item.data()['Fotos'][0],
                            }}
                        />
                    </View>
                </View>

                <View style={{flex:1, padding:15, borderTopRightRadius:20, borderBottomRightRadius:20,}}>
                    <Text numberOfLines={tamañoNormal ? 7 : 5} style={[{fontWeight:500, fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:19}]}>{item.data()['Informacion']}</Text>
                    <View style={styles.button}>
                            <View style={{flexDirection:'row'}}>
                                <TouchableOpacity style={{flexDirection:'row', marginRight:16}} onPress={()=>{ Alert.alert('¡Atención!', '¿Estás seguro de que deseas borrar la publicación?', [
                                    {
                                        text: 'Cancelar',
                                        style:"default",
                                    },
                                    {text: 'Aceptar', onPress: () => borrarPublicacionAdoptar()}
                                    ]);}}
                                >  
                                    {modoNocturno ? <AntDesign name="delete" size={20} color="black" /> : <AntDesign name="delete" size={20} color="white" />}
                                    <Text style={[{textAlign: 'center', marginTop:2, marginLeft:5}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:16, marginTop:0}]}>Borrar</Text>
                                </TouchableOpacity>
                                {Platform.OS !='web' && <TouchableOpacity style={{flexDirection:'row',}} onPress={() =>{navigation.navigate('EditarPublicacionAdoptar', {item:item.data(), idDoc:item.id})}}>
                                    {modoNocturno ? <EvilIcons name="pencil" size={24} color="black"/> : <EvilIcons name="pencil" size={24} color="white"/>}
                                    <Text style={[{textAlign: 'center', marginTop:2},modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:16, marginTop:0}]}>Editar</Text>
                                </TouchableOpacity>
                                }
                            </View>
                     </View>
                </View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={mensajeError}
                    onRequestClose={() => {
                        setMensajeError(!mensajeError);
                    }}>
                        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                            <View style={{backgroundColor:'#fff', width:300, height:400}}>
                                <Text>¿Estás seguro de que deseas borrar la publicacion?</Text>
                            </View>
                        </View>
                       
                </Modal>
            </View>
        );
    }

    useFocusEffect(React.useCallback(() => {
        (async () =>{
            const consultaPerdido= query(collection(getFirestore(app),'Perdidos'), where("Id_Usuario", "==", auth));
            const datosConsultaPerdido = await getDocs(consultaPerdido);

            const consultaForo= query(collection(getFirestore(app),'PostForo'), where("Id_Usuario", "==", auth));
            const datosConsultaForo = await getDocs(consultaForo);

            const consultaAdopcion= query(collection(getFirestore(app),'Adopcion'), where("Id_Usuario", "==", auth));
            const datosConsultaAdopcion = await getDocs(consultaAdopcion);

            setDataPerdido(datosConsultaPerdido.docs);
            setDataForo(datosConsultaForo.docs);
            setDataAdopcion(datosConsultaAdopcion.docs);
        })()
    },[]));

    return(
        <View style={{flex:1, marginTop:Constants.statusBarHeight}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground> 
            <View style={[{flex:0.32, backgroundColor: '#F0B27A', borderBottomLeftRadius:170}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}, Platform.OS != 'web' ? null : {flex:0.10}]}>
                <View style={{flexDirection:'row', marginLeft:20, marginTop:15}}>
                    {route.params["administrar"] ? 
                        <Pressable onPress={()=>{goBack();}}>
                            <View style={{marginTop:2}}>
                                <AntDesign name="arrowleft" size={40} color= {modoNocturno ? "black" : "white"}/>
                            </View>
                        </Pressable>
                        :
                        <Pressable onPress={()=>{navigation.openDrawer()}}>
                            {modoNocturno ? <Fontisto name="nav-icon-a" size={20} color="black" style={{marginTop:5}}/> : <Fontisto name="nav-icon-a" size={20} color="white" style={{marginTop:5}}/>}
                        </Pressable> 
                    }
                    {route.params["administrar"] ? <Text style={{textAlign:'center', alignSelf:'center', fontWeight:"bold", color:'#fff', fontSize:25, marginLeft:20}}>Gestionar Publicaciones</Text> : <Text style={{textAlign:'center', alignSelf:'center', fontWeight:"bold", color:'#fff', fontSize:25, marginLeft:40}}>Mis Publicaciones</Text>}
                </View>
                {Platform.OS !='web' && <View style={{justifyContent:'center', alignItems:'center', marginTop:10}}>
                    {!isKeyboardVisible && 
                        <Image
                            style={styles.tinyLogo}
                            source={require('../../imagenes/publicaciones.jpg')}
                        />
                    }
                </View>
                }
            </View>
            
            <View style={{flex:0.05}}>
                <View style={{flexDirection:'row', marginLeft:20, marginTop:10, justifyContent:'space-between', marginRight:20, alignItems:'center',}}>
                    <Text style={[{fontWeight:"bold", fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>Filtrar Por:</Text> 
                    <TouchableOpacity style={[activePerdido && {borderBottomWidth:1}]} onPress={()=>{setactivePerdido(true); setactiveForo(false); setactiveAdopcion(false)}}>
                        <Text style={[{fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>Perdido</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[activeForo && {borderBottomWidth:1}]} onPress={()=>{setactivePerdido(false); setactiveForo(true); setactiveAdopcion(false)}}>
                        <Text style={[{fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>Foro</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[activeAdopcion && {borderBottomWidth:1}]} onPress={()=>{setactivePerdido(false); setactiveForo(false); setactiveAdopcion(true)}}>
                        <Text style={[{fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>Adopción</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={[{flex:0.63}, Platform.OS != 'web' ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                {activePerdido && dataPerdido && 
                    <FlatList
                        data={dataPerdido}
                        renderItem={({item}) => <VistaPerdido item={item} navigation={navigation}/>}
                        keyExtractor={item => item.id}
                    />
                }

                {activeForo && dataForo && 
                    <FlatList
                        data={dataForo}
                        renderItem={({item}) => <VistaForo item={item} navigation={navigation}/>}
                        keyExtractor={item => item.id}
                    />
                }

                {activeAdopcion && dataAdopcion && 
                    <FlatList
                        data={dataAdopcion}
                        renderItem={({item}) => <VistaAdoptar item={item} navigation={navigation}/>}
                        keyExtractor={item => item.id}
                    />
                }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({    
    tinyLogo: {
        width: '45%',
        height: '80%',
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
        borderRadius:20,
        width: 170,
        marginTop:15,
        position:'absolute', 
        bottom:0,
        marginBottom:10,
        marginLeft:20
    },
})