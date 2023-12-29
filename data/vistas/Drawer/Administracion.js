import { StyleSheet, Text, View, TouchableOpacity, Image, Keyboard, FlatList, Modal, TouchableHighlight, Pressable, ImageBackground, Alert, Platform} from 'react-native';
import React, { useState, useEffect, useRef} from 'react';
import Constants from 'expo-constants';
import { FontAwesome5, Fontisto, AntDesign, MaterialIcons} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {getDocs, collection, getFirestore, query, where, getDoc, doc, deleteDoc, updateDoc, orderBy, limit} from "firebase/firestore";
import {app} from "../../../database/firebase";
import { SearchBar } from 'react-native-elements';
import { getStorage, uploadBytes,ref, getDownloadURL, deleteObject} from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Administracion({navigation}) {
    const [activeUSuarios, setActiveUsuarios] = useState(true);
    const [activePublicaciones, setActivePublicaciones] = useState(false);
    const [isKeyboardVisible, setKeyboardIsVisible] = useState(false);

    const [dataUsuarios, setDataUsuarios] = useState([]);
    const [dataPublicaciones, setDataPublicaciones] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [modoNocturno, setModoNocturno] = useState(null);
    
    useFocusEffect(React.useCallback(() => {
    (async () => {
        const theme = await AsyncStorage.getItem('themePreference');
        theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);
        })()
    }, []));

    //Función encargada de filtrar los elementos del array, dado el parámetro data.
    function filterData(data){
        return data.filter((item) =>
            item.data()['Email'].toLowerCase().includes(searchText.toLowerCase())
        );
    };
    
    useEffect(() => {
        Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardIsVisible(true)
        })
        Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardIsVisible(false)
        })
    }, []);

    //Componente encargado de visualizar a todos los usuarios del sistema
    //Parámetros: usuario, id del usuario y la referencia al usuario
    const VistaUsuario= ({item, idDoc, navigation, refUsuario}) =>{ //Destinatario
        const [modalVisible, setModalVisible] = useState(false);

        async function banearUsuario(){
            const publicacionesUsuario = query(collection(getFirestore(app),'Publicaciones'), where("Usuario", "==", refUsuario));
            const datosPublicacionesUsuario = await getDocs(publicacionesUsuario);
    
            datosPublicacionesUsuario.docs.map((item)=>{
                borrarUnaPublicacion(item.data()['Publicacion'], item.data()['Tipo'], item);
                
                deleteDoc(doc(getFirestore(app), 'Publicaciones', item.id));
            });
            
            updateDoc(doc(getFirestore(app), "Usuarios", idDoc), {Baneado: true});
            Alert.alert("","Todas las publicaciones del usuario han sido eliminadas con éxito y se ha bloqueado al usuario del sistema.");
        }

        //Función encargada de desblosquear al usuario del sistema
        async function desBanearUsuario(){
            updateDoc(doc(getFirestore(app), "Usuarios", idDoc), {Baneado: false});
            Alert.alert("","El usuario ha sido desbloqueado del sistema con éxito.");
        }

        //Función encargada de otorgar privilegios de administración al usuario
        async function otorgarAdministrador(){
            Alert.alert('¡Atención!','Esta acción es de alto riesgo. ¿Estás seguro de que deseas continuar?', [
                { 
                text: "Cancelar", 
                style: 'cancel', 
                onPress: () => null 
                },
                {
                text: 'Aceptar',
                style: 'destructive',
                onPress: () => { updateDoc(doc(getFirestore(app), "Usuarios", idDoc), {Admin: true}); Alert.alert("¡Éxito!", "El usuario ahora es administrador")},
                },
            ]);
        }

        //Función encargada de borrar una publicación
        //Parámetros: referencia a la publicación padre, tipo y la referencia a la publicación hija (Adopción, Foro, Perdidos) 
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

        return(
            <View style={[{flex:1}, Platform.OS != 'web' ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                <TouchableOpacity onPress={()=>{setModalVisible(true)}} style={[{flexDirection:'row', marginTop:20, backgroundColor:'#fff', height:90, borderRadius:20, marginLeft:25, marginRight:25, justifyContent:'center', alignItems:'center'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                    <Image
                        style={[styles.tinyLogo, Platform.OS != 'web' ? null : {width:70, height:70}]}
                        source={{
                            uri: item["Foto"],
                        }}
                    />

                    <View style={[{marginLeft:65, marginRight:30, width:180}, Platform.OS != 'web' ? null : {width:'auto'}]}>
                        <Text style={[{fontWeight:400, fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>{item["Email"]}</Text>
                    </View> 

                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => {
                            setModalVisible(!modalVisible);
                        }}
                    > 
                        <TouchableOpacity onPress={()=>{setModalVisible(false)}} style={[{flex:1}, Platform.OS != 'web' ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                            <View style={[styles.modalMenu, Platform.OS != 'web' ? null : {paddingBottom:20}]}>
                                <View style={{margin:5, flexDirection:'row'}}>
                                    <Pressable
                                        style={[styles.button]}
                                        onPress={() => setModalVisible(!modalVisible)}>
                                        <AntDesign name="closecircle" size={20} color="black" />
                                    </Pressable>
                                    <Text style={{textAlign:'center', fontSize:20, marginRight:30, marginTop:5, marginLeft: 10}}>¿Qué acción deseas realizar?</Text>
                                </View>

                                <TouchableOpacity onPress={()=>{setModalVisible(!modalVisible);navigation.navigate('PublicacionesScreen', {idUsuario: item["Id"], administrar: true})}} style={{flexDirection:'row', marginTop:10, borderBottomWidth:0.5, marginLeft:10, marginRight:10}}>
                                    <AntDesign name="search1" size={18} color="black" />
                                    <Text style={{fontWeight:300, marginLeft:10, fontSize:18, marginBottom:20}}>Consultar publicaciones</Text>
                                </TouchableOpacity>

                                {!item['Baneado'] && <TouchableOpacity style={{flexDirection:'row', marginTop:15, marginLeft:10}} onPress={()=>{
                                    Alert.alert('¡Atención!','Esta acción es irreversible y además, supondrá el borrado de toda información del usuario almacenada en el sistema.', [
                                        { 
                                            text: "Cancelar", 
                                            style: 'cancel', 
                                            onPress: () => null 
                                        },
                                        {
                                            text: 'Aceptar',
                                            style: 'destructive',
                                            onPress: () => {banearUsuario()},
                                        },
                                    ]);}}
                                    >

                                    <FontAwesome5 name="ban" size={18} color="red" />
                                    <Text style={{fontWeight:300, marginLeft:10, fontSize:18}}>Bloquear del sistema</Text>
                                </TouchableOpacity>
                                }

                                {item['Baneado'] && <TouchableOpacity style={{flexDirection:'row', marginTop:15, marginLeft:10}} onPress={()=>{
                                    Alert.alert('¡Atención!','Esta acción supondrá el desbloqueo del sistema al usuario.', [
                                        { 
                                            text: "Cancelar", 
                                            style: 'cancel', 
                                            onPress: () => null 
                                        },
                                        {
                                            text: 'Aceptar',
                                            style: 'destructive',
                                            onPress: () => {desBanearUsuario()},
                                        },
                                        ]);}}
                                    >
                                        <FontAwesome5 name="ban" size={18} color="blue" />
                                        <Text style={{fontWeight:300, marginLeft:10, fontSize:18}}>Desbloquear del sistema</Text>
                                </TouchableOpacity>
                                }

                                {!item['Admin'] && <TouchableOpacity onPress={()=>{otorgarAdministrador()}} style={{flexDirection:'row', marginTop:20, borderTopWidth:0.5, marginLeft:10, marginRight:10}}>
                                    <MaterialIcons name="admin-panel-settings" size={20} style={{marginTop:24}} color="black" />
                                    <Text style={{fontWeight:300, marginLeft:10, fontSize:18, marginTop:20}}>Otorgar administrador</Text>
                                </TouchableOpacity>
                                }

                                {item['Admin'] && <Text style={{fontWeight:300, marginLeft:10, fontSize:18, marginTop:20}}>El usuario ya es administrador</Text>}
                                </View>
                            </TouchableOpacity>
                        </Modal>
                </TouchableOpacity>
            </View>
        );
    }

    //Componente encargado de visualizar todas las publicaciones reportadas
    //Parámetros: publicación, id de la publicación
    const VistaPublicacion= ({item, idDoc, navigation}) =>{ 
        return(
            <View style={[Platform.OS != 'web' ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                <View style={[{flexDirection:'row', marginTop:20, backgroundColor:'#fff', height:90, borderRadius:20, marginLeft:25, marginRight:25, justifyContent:'center', alignItems:'center'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                    {item['Motivo'].length < 5 && <Image
                        style={styles.tinyLogo}
                        source={require('../../imagenes/alertaMedia.png')}
                    />
                    }
                    {item['Motivo'].length >= 5 && <Image
                        style={styles.tinyLogo}
                        source={require('../../imagenes/alertaMaxima.png')}
                    />
                    }
                    <View style={{marginLeft:65, marginRight:30, width:180}}>
                        <Text style={[{fontWeight:400, fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>Num. Reportes: {item['Motivo'].length}</Text>
                        <TouchableOpacity style={{fontWeight:400, marginTop:4}} onPress={() =>{navigation.navigate('PublicacionAdmin', {IdReportes: idDoc});}}>
                            <Text style={[{fontSize:16, color:'blue', fontWeight:400}, modoNocturno ? null : {color:'#fff'}]}> Ver Más Detalles</Text>
                        </TouchableOpacity>
                    </View> 
                </View>
            </View>
        );
    }

    //Hook encargado de obtener todos los reportes y ordenarlos descendientemente
    useFocusEffect(React.useCallback(() => {
        (async () =>{
            const consultaUsuarios= collection(getFirestore(app),'Usuarios');
            const datosConsultaUsuarios = await getDocs(consultaUsuarios);

            setDataUsuarios(datosConsultaUsuarios.docs);

            const consultaPublicaciones= query(collection(getFirestore(app),'Reportes'), orderBy('Num_Reportes', 'desc'));
            const datosConsultaPublicaciones = await getDocs(consultaPublicaciones);

            setDataPublicaciones(datosConsultaPublicaciones.docs);
        })()
    },[]));

    return ( 
        <View style={{flex:1, marginTop:Constants.statusBarHeight}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground> 

            <View style={[{flex:0.30, backgroundColor: '#F0B27A', borderBottomLeftRadius:170}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <View style={{flexDirection:'row', marginLeft:20, marginTop:15}}>
                    <Pressable onPress={()=>{navigation.openDrawer()}}>
                        {modoNocturno ? <Fontisto name="nav-icon-a" size={20} color="black" style={{marginTop:5}}/> : <Fontisto name="nav-icon-a" size={20} color="white" style={{marginTop:5}}/>}
                    </Pressable>
                    <Text style={{textAlign:'center', alignSelf:'center', fontWeight:"bold", color:'#fff', fontSize:25, marginLeft:40}}>Administración</Text>
                </View>
                
                <View style={[{justifyContent:'center', alignItems:'center', marginTop:10}, Platform.OS != 'web' ? null : {flex:1}]}>
                    <Image
                        style={[styles.tinyImage, Platform.OS != 'web' ? null : {width:'10%', height:'100%'}]}
                        source={require('../../imagenes/administracionSeccion.png')}
                    />
                </View>
            </View>

            {!isKeyboardVisible && 
                <View style={[{flex:0.05}, Platform.OS != 'web' ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                    <View style={{flexDirection:'row', marginLeft:20, marginTop:10, justifyContent:'space-between', marginRight:20, alignItems:'center',}}>
                        <Text style={[{fontWeight:"bold", fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>Filtrar Por:</Text> 

                        <TouchableOpacity style={[activeUSuarios && {borderBottomWidth:1}]} onPress={()=>{setActiveUsuarios(true); setActivePublicaciones(false);}}>
                            <Text style={[{fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>Usuarios</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[activePublicaciones && {borderBottomWidth:1}]} onPress={()=>{setActiveUsuarios(false); setActivePublicaciones(true);}}>
                            <Text style={[{fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>Publicaciones</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            }

            <View style={{flex:0.63}}>
                {activeUSuarios && dataUsuarios && 
                    <View>
                        <View style={[{marginTop:10, marginLeft:15, marginRight:15, marginBottom:10}, , Platform.OS != 'web' ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                            <SearchBar
                                placeholder="Buscar por email..."
                                onChangeText={(text) => setSearchText(text)}
                                value={searchText}
                                lightTheme
                                round
                                inputContainerStyle={{backgroundColor:'#fff', borderRadius:80, height:40}}
                                platform = "ios"
                                containerStyle={{borderRadius:80, height:40}}
                                cancelButtonTitle='Cancelar'
                            />
                        </View>

                        <View>
                            <FlatList
                                data={filterData(dataUsuarios)}
                                renderItem={({item}) => <VistaUsuario item={item.data()} idDoc={item['id']} navigation={navigation} refUsuario={item.ref}/>}
                                keyExtractor={item => item.id}
                                nestedScrollEnabled
                            />
                        </View>
        
                    </View>
                }

                {activePublicaciones && dataPublicaciones && 
                    <View>
                        <FlatList
                            data={dataPublicaciones}
                            renderItem={({item, index}) => <VistaPublicacion item={item.data()} idDoc={item['id']} docRef={dataPublicaciones[index].data()['Publicacion']} navigation={navigation}/>}
                            keyExtractor={item => item.id}
                            nestedScrollEnabled
                        />
                    </View>
                }

            </View>
        </View>
    );
}

const styles = StyleSheet.create({    
    tinyImage: {
        width: '45%',
        height: '80%',
    },
    caja:{
        backgroundColor:'#F0B27A',
        height:100,
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
    tinyLogo: {
        width: 50,
        height: 50,
        borderRadius:40,
        position:'absolute',
        left:30
    },
    modalMenu:{
        flex: 0.40, 
        backgroundColor: '#ffff',
        margin: 30,  
        borderRadius: 20,
        flexDirection: 'column',
        borderColor:'#fff',
        marginTop:100
    },
    button: {
        borderRadius: 20,
        width:25,
        height:25,
        justifyContent: 'flex-start',
        marginLeft:10,
        marginTop:10,
      },
})