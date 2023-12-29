import { StyleSheet, Text, View, TouchableOpacity, Image, Keyboard, FlatList, Modal, Dimensions, Pressable, ImageBackground, Alert, Platform} from 'react-native';
import React, { useState, useEffect, useRef} from 'react';
import Constants from 'expo-constants';
import { FontAwesome5, Fontisto, AntDesign, MaterialIcons} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {getDocs, collection, getFirestore, query, where, getDoc, doc, deleteDoc, updateDoc, orderBy, limit} from "firebase/firestore";
import {app} from "../../../database/firebase";
import { SearchBar } from 'react-native-elements';
import { getStorage, uploadBytes,ref, getDownloadURL, deleteObject} from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function Administracion({navigation}) {
    const [activeUSuarios, setActiveUsuarios] = useState(true);
    const [activePublicaciones, setActivePublicaciones] = useState(false);
    const [isKeyboardVisible, setKeyboardIsVisible] = useState(false);

    const [dataUsuarios, setDataUsuarios] = useState([]);
    const [dataPublicaciones, setDataPublicaciones] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [modoNocturno, setModoNocturno] = useState(null);

    const [alertaAvisoBloquear, setAlertaAvisoBloquear] = useState(false);
    const [alertaAvisoDesbloquear, setAlertaAvisoDesbloquear] = useState(false);
    const [alertaAvisoAdministrador, setAlertaAvisoAdministrador] = useState(false);

    const [alertaExito, setAlertaExito] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [parametrosBloquear, setParametrosBloquear] = useState([]);
    const [parametroAlerta, setParametroAlerta] = useState(null);

    const [visualizarMovil, setVisualizarMovil] = useState(false);

    const screenDimensions = Dimensions.get('screen');

    useEffect(() => {
        if(screenDimensions.width < 600){
            setVisualizarMovil(true);
        }
    }, []); 

    useFocusEffect(React.useCallback(() => {
    (async () => {
        const theme = await AsyncStorage.getItem('themePreference');
        theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);
        })()
    }, []));

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

    async function banearUsuario(refUsuario, idDoc){
        const publicacionesUsuario = query(collection(getFirestore(app),'Publicaciones'), where("Usuario", "==", refUsuario));
        const datosPublicacionesUsuario = await getDocs(publicacionesUsuario);

        datosPublicacionesUsuario.docs.map((item)=>{
            borrarUnaPublicacion(item.data()['Publicacion'], item.data()['Tipo'], item);
            
            deleteDoc(doc(getFirestore(app), 'Publicaciones', item.id));
        });
        
        updateDoc(doc(getFirestore(app), "Usuarios", idDoc), {Baneado: true});
        setMensaje("Todas las publicaciones del usuario han sido eliminadas con éxito y se ha bloqueado al usuario del sistema");
        setAlertaExito(true);
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

    async function desBanearUsuario(idDoc){
        updateDoc(doc(getFirestore(app), "Usuarios", idDoc), {Baneado: false});
        setMensaje("El usuario ha sido desbloqueado del sistema");
        setAlertaExito(true);
    }

    async function otorgarAdministrador(idDoc){
        updateDoc(doc(getFirestore(app), "Usuarios", idDoc), {Admin: true}); 
        setMensaje("El usuario ahora es administrador");
        setAlertaExito(true);
    }

    const VistaUsuario= ({item, idDoc, navigation, refUsuario}) =>{ //Destinatario
        const [modalVisible, setModalVisible] = useState(false);

        return(
            <View style={[{flex:1}, visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                <TouchableOpacity onPress={()=>{setModalVisible(true)}} style={[{flexDirection:'row', marginTop:20, backgroundColor:'#fff', height:90, borderRadius:20, marginLeft:25, marginRight:25, justifyContent:'center', alignItems:'center'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                    <Image
                        style={[styles.tinyLogo, visualizarMovil ? null : {width:70, height:70}]}
                        source={{
                            uri: item["Foto"],
                        }}
                    />
                    <View style={[{marginLeft:65, marginRight:30, width:180}, visualizarMovil ? null : {width:'auto'}]}>
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
                            <TouchableOpacity onPress={()=>{setModalVisible(false)}} style={[{flex:1}, visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                                <View style={[styles.modalMenu, visualizarMovil ? null : {paddingBottom:20}]}>
                                    <View style={{margin:5, flexDirection:'row'}}>
                                        <Pressable
                                            style={[styles.button]}
                                            onPress={() => setModalVisible(!modalVisible)}>
                                            <AntDesign name="closecircle" size={20} color="black" />
                                        </Pressable>
                                        <Text style={{textAlign:'center', fontSize:20, marginRight:30, marginTop:5, marginLeft: 10}}>¿Qué acción deseas realizar?</Text>
                                    </View>
                                    {Platform.OS !='web' && <TouchableOpacity onPress={()=>{setModalVisible(!modalVisible);navigation.navigate('PublicacionesScreen', {idUsuario: item["Id"], administrar: true})}} style={{flexDirection:'row', marginTop:10, borderBottomWidth:0.5, marginLeft:10, marginRight:10}}>
                                        <AntDesign name="search1" size={18} color="black" />
                                        <Text style={{fontWeight:300, marginLeft:10, fontSize:18, marginBottom:20}}>Consultar publicaciones</Text>
                                    </TouchableOpacity>
                                    }
                                    {!item['Baneado'] && <TouchableOpacity style={{flexDirection:'row', marginTop:15, marginLeft:10}} onPress={()=>{setParametrosBloquear([refUsuario, idDoc]); setAlertaAvisoBloquear(true)}}>
                                        <FontAwesome5 name="ban" size={18} color="red" />
                                        <Text style={{fontWeight:300, marginLeft:10, fontSize:18}}>Bloquear del sistema</Text>
                                    </TouchableOpacity>
                                    }
                                    {item['Baneado'] && <TouchableOpacity style={{flexDirection:'row', marginTop:15, marginLeft:10}} onPress={()=>{setParametroAlerta(idDoc); setAlertaAvisoDesbloquear(true)}}>
                                        <FontAwesome5 name="ban" size={18} color="blue" />
                                        <Text style={{fontWeight:300, marginLeft:10, fontSize:18}}>Desbloquear del sistema</Text>
                                    </TouchableOpacity>
                                    }
                                    {!item['Admin'] && <TouchableOpacity onPress={()=>{setParametroAlerta(idDoc); setAlertaAvisoAdministrador(true)}} style={{flexDirection:'row', marginTop:20, borderTopWidth:0.5, marginLeft:10, marginRight:10}}>
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

    const VistaPublicacion= ({item, idDoc, navigation}) =>{ //Destinatario
        
        return(
            <View style={[visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
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
                <View style={[{justifyContent:'center', alignItems:'center', marginTop:10, flex:1}]}>
                    <Image
                        style={[styles.tinyImage, visualizarMovil ? null : {width:'10%', height:'100%'}]}
                        source={require('../../imagenes/administracionSeccion.png')}
                    />
                </View>
            </View>
            {!isKeyboardVisible && 
                <View style={[{flex:0.05}, visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
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
                        <View style={[{marginTop:10, marginLeft:15, marginRight:15, marginBottom:10}, , visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
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
            <AwesomeAlert
                show={alertaAvisoBloquear}
                showProgress={false}
                title="¡Atención!"
                message="Esta acción es irreversible y además, supondrá el borrado de toda información del usuario almacenada en el sistemar"
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={true}
                showConfirmButton={true}
                cancelText="Cancelar"
                confirmText="Aceptar"
                confirmButtonColor="#3a99d8"
                onCancelPressed={() => {
                    setAlertaAvisoBloquear(!alertaAvisoBloquear);
                }}
                onConfirmPressed={() => { 
                    banearUsuario(parametrosBloquear[0], parametrosBloquear[1]);   
                    setAlertaAvisoBloquear(!alertaAvisoBloquear);
                }}
            />
            <AwesomeAlert
                show={alertaExito}
                showProgress={false}
                title="¡Éxito!"
                message={mensaje}
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={false}
                showConfirmButton={true}
                cancelText=""
                confirmText="Aceptar"
                confirmButtonColor="#3a99d8"
                onCancelPressed={() => {
                }}
                onConfirmPressed={() => {
                    setAlertaExito(!alertaExito);
                }}
            />
            <AwesomeAlert
                    show={alertaAvisoDesbloquear}
                    showProgress={false}
                    title="¡Atención!"
                    message="Esta acción supondrá el desbloqueo del sistema al usuario"
                    closeOnTouchOutside={true}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText="Cancelar"
                    confirmText="Aceptar"
                    confirmButtonColor="#3a99d8"
                    onCancelPressed={() => {
                        setAlertaAvisoDesbloquear(!alertaAvisoDesbloquear);
                    }}
                    onConfirmPressed={() => {
                        desBanearUsuario(parametroAlerta);
                        setAlertaAvisoDesbloquear(!alertaAvisoDesbloquear);
                    }}
                />
                <AwesomeAlert
                    show={alertaAvisoAdministrador}
                    showProgress={false}
                    title="¡Atención!"
                    message="¿Estás seguro que deseas otorgar privilegio de administración al usuario?"
                    closeOnTouchOutside={true}
                    closeOnHardwareBackPress={false}
                    showCancelButton={true}
                    showConfirmButton={true}
                    cancelText="Cancelar"
                    confirmText="Aceptar"
                    confirmButtonColor="#3a99d8"
                    onCancelPressed={() => {
                        setAlertaAvisoAdministrador(!alertaAvisoAdministrador);
                    }}
                    onConfirmPressed={() => {
                        otorgarAdministrador(parametroAlerta);
                        setAlertaAvisoAdministrador(!alertaAvisoAdministrador);
                    }}
                />
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