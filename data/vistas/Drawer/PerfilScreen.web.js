import { StyleSheet, Text, View, Image ,TouchableOpacity, Pressable, Modal, TextInput, ImageBackground, Platform, Dimensions} from 'react-native';
import {getAuth, reauthenticateWithCredential, EmailAuthProvider,signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile, updateEmail, updatePassword, signOut} from 'firebase/auth';
import Constants from 'expo-constants';
import { app } from '../../../database/firebase';
import React, { useState, useEffect } from "react";
import { MaterialCommunityIcons, Fontisto, AntDesign, Ionicons, Feather} from '@expo/vector-icons'; 
import { getStorage, uploadBytes,ref, getDownloadURL, deleteObject } from "firebase/storage";
import { FlatList, ScrollView } from 'react-native-gesture-handler';
import { collection, getFirestore, getDocs, query, where, doc, updateDoc} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AwesomeAlert from 'react-native-awesome-alerts';

const auth = getAuth(app);

export default function PerfilScreen({navigation, route}) {
    const [usuario, setUsuario] = useState("");
    const [photoUrl, setPhotoUrl] = useState(null);
    const [email, setEmail] = useState("");
    const [contraseña, setContraseña] = useState("");
    const [reContraseña, setReContraseña] = useState("");
    const [contraseñaSeguridad, setContraseñaSeguridad] = useState("");
    
    const [idDocUpdate, setIdDocUpdate] = useState("");

    const [abrirModalUsuario, setAbrirModalUsuario] = useState(null);
    const [abrirModalEmail, setAbrirModalEmail] = useState(null);
    const [abrirModalContraseña, setAbrirModalContraseña] = useState(null);

    const [modoNocturno, setModoNocturno] = useState(null);
    const [tamañoNormal, setTamañoNormal] = useState(null);
    const [abrirAjustesPerfil, setAbrirAjustesPerfil] = useState(null);
    const [abrirAjustesSistema, setAbrirAjustesSistema] = useState(null);
    const [valorSwitch, setValorSwitch] = useState(null);
    const [valorSwitchTamaño, setValorSwitchTamaño] = useState(null);
    
    const [alertaExito, setAlertaExito] = useState(false);
    const [alertaAviso, setAlertaAviso] = useState(false);
    const [alertaError, setAlertaError] = useState(false);
    const [mensajeAviso, setMensajeAviso] = useState("");
    const [mensajeError, setMensajeError] = useState("");
    const [alertaCambiarFoto, setAlertaCambiarFoto] = useState(false);
    const [fotoCambiar, setFotoCambiar] = useState("");
    
    const [visualizarMovil, setVisualizarMovil] = useState(false);
    const screenDimensions = Dimensions.get('screen');

    useEffect(() => {
      if(screenDimensions.width < 600){
          setVisualizarMovil(true);
      }
    }, []); 

    async function cambiarTema(){
        const theme = await AsyncStorage.getItem('themePreference');

        if(theme == 'light'){
            AsyncStorage.setItem('themePreference', 'dark');
        }
        else{
            AsyncStorage.setItem('themePreference', 'light');
        }
        setValorSwitch(!valorSwitch);
        navigation.navigate('Drawer');
    }

    async function cambiarTamaño(booleano){
        if(!booleano){
            AsyncStorage.setItem('letterPreference', 'normal');
        }
        else{
            AsyncStorage.setItem('letterPreference', 'grande');
        }

        setValorSwitchTamaño(!valorSwitchTamaño);
        navigation.navigate('Drawer');
    }

    useFocusEffect(React.useCallback(() => {
    (async () => {
        const theme = await AsyncStorage.getItem('themePreference');
        theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);
        })()
    }, [valorSwitch]));

    useFocusEffect(React.useCallback(() => {
        (async () => {
            const tamaño = await AsyncStorage.getItem('letterPreference');
            tamaño == 'normal' ? setTamañoNormal(true) : setTamañoNormal(false);
            })()
        }, [valorSwitchTamaño]));

    useEffect(() => {
        (async() =>{
            const consulta = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", auth.currentUser.uid));
            const datosConsulta = await getDocs(consulta);

            setIdDocUpdate(datosConsulta.docs[0]["id"]);
            setPhotoUrl(datosConsulta.docs[0].data()['Foto']);
        })()
       
    }, []); 

    async function mostrarFotosPerfil(item){
        updateProfile(auth.currentUser, {
           photoURL:item,
           displayName: auth.currentUser.displayName
        }).then(()=>{
            setAlertaExito(true);

        }).catch((error) =>{

        });
        updateDoc(doc(getFirestore(app),'Usuarios', idDocUpdate), {
            Foto:item,
        });
    }

    async function elegirFotodePerfil(){
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: false,
            saveToPhotos:true,
          });  
        
        if(!result.canceled){
            setFotoCambiar(result.assets[0].uri);
            setAlertaCambiarFoto(true);
        }
    }

    async function borrarAntiguaFotoPerfil(){
        const storage = getStorage(app, 'gs://tfg-56e1b.appspot.com');
        const storageRef = ref(storage, getAuth(app).currentUser.photoURL);

        await deleteObject(storageRef);
    }

    async function cambiarFotoPerfil(foto){
        if(photoUrl != 'https://firebasestorage.googleapis.com/v0/b/tfg-56e1b.appspot.com/o/perfil%2FPerfil3.PNG?alt=media&token=7bf7d53b-e6b0-4c46-ad51-d933d7ea032e'){
            borrarAntiguaFotoPerfil();
        }

        let urlFoto = null;

        const storage = getStorage(app, 'gs://tfg-56e1b.appspot.com');
        const newMetadata = {contentType: 'image/jpeg'};

        const filename = foto.substring(foto.lastIndexOf('/')+1);
        const storageRef = ref(storage, 'perfil/'+filename);

        const img = await fetch(foto);
        const bytes = await img.blob();

        await uploadBytes(storageRef, bytes, newMetadata);
        await getDownloadURL(storageRef).then((url) => {
            urlFoto = url;
        })

        await updateProfile(auth.currentUser, {
            photoURL:urlFoto,
            displayName: auth.currentUser.displayName
         }).then(()=>{
             setAlertaExito(true);
 
         }).catch((error) =>{
 
         });
         
        await updateDoc(doc(getFirestore(app),'Usuarios', idDocUpdate), {
             Foto:urlFoto,
         });

        setPhotoUrl(urlFoto);
    }

    return(
        <View style={{marginTop: Constants.statusBarHeight, flex:1}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground> 
            
            <View style={[styles.header, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <View style={{marginTop:15, marginLeft:20, flexDirection:'row'}}>
                    <Pressable onPress={()=>{navigation.openDrawer()}}>
                        {modoNocturno && <Fontisto name="nav-icon-a" size={20} color="black" style={{marginTop:10}} />}
                        {!modoNocturno && <Fontisto name="nav-icon-a" size={20} color="white" style={{marginTop:10}} />}
                    </Pressable>
                    <Text style={{ fontWeight:"bold", color:'#fff', fontSize:30, marginLeft:40}}>Editar Perfil</Text>
                </View>
            </View>
            
            {photoUrl && 
                <TouchableOpacity style={styles.avatar} onPress={() =>{elegirFotodePerfil();}}>
                    <Image
                        style={{width:'100%', height:'100%',borderRadius: 63,}}
                        source={{ uri: photoUrl? photoUrl : 'https://firebasestorage.googleapis.com/v0/b/tfg-56e1b.appspot.com/o/perfil%2FPerfil3.PNG?alt=media&token=7bf7d53b-e6b0-4c46-ad51-d933d7ea032e'}}>
                    </Image>
                </TouchableOpacity>
            }
            <ScrollView style={[{flex:1, marginTop:30, padding:20,}, visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                <TouchableOpacity style={{padding:15, backgroundColor:'#fff', borderRadius:20, alignContent:'center', justifyContent:'center', marginTop:10}} onPress={()=>{setAbrirAjustesPerfil(!abrirAjustesPerfil)}}>
                        <Text style={{color:'blue', marginBottom:5, fontWeight:500, fontSize:20, textAlign:'center'}}>Editar Información personal</Text>
                </TouchableOpacity>
                {abrirAjustesPerfil &&  
                    <View style={styles.infoPersonal}>
                        <TouchableOpacity onPress={() => setAbrirModalUsuario(true)}>
                            <Text style={[{fontSize:18}, tamañoNormal ? null : {fontSize:22}]}>Nombre de Usuario</Text>
                            <View style={{flexDirection:'row', marginTop:15}}>
                                <AntDesign name="user" size={18} color="black" />
                                <Text style={[{fontWeight:300, marginLeft:10, fontSize:16}, ,tamañoNormal ? null : {fontSize:22}]}>{auth.currentUser.displayName}</Text>
                            </View>
                            <View style={{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth,}}/>
                        </TouchableOpacity>
                    
                        <TouchableOpacity style={{marginBottom:20, marginTop:20}} onPress={() => setAbrirModalEmail(true)}>
                            <Text style={[{fontSize:18}, ,tamañoNormal ? null : {fontSize:22}]}>Email</Text>
                            <View style={{flexDirection:'row', marginTop:15}}>
                                <MaterialCommunityIcons name="email-edit-outline" size={20} color="black" />
                                <Text style={[{fontWeight:300, marginLeft:10, fontSize:16}, ,tamañoNormal ? null : {fontSize:22}]}>{auth.currentUser.email}</Text>
                            </View>
                            <View style={{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth,}}/>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => setAbrirModalContraseña(true)}>
                            <Text style={[{fontSize:18}, ,tamañoNormal ? null : {fontSize:22}]}>Contraseña</Text>
                            <View style={{flexDirection:'row', marginTop:15,}}>
                                <Ionicons name="md-lock-closed-outline" size={20} color="black" />
                                <Text style={[{fontWeight:300, marginLeft:10}, tamañoNormal ? null : {fontSize:22}]}>* * * * * * * *</Text>
                            </View>
                            <View style={{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, marginBottom:20}}/>
                        </TouchableOpacity>
                    </View>
                }
                <TouchableOpacity style={{padding:15, backgroundColor:'#fff', borderRadius:20, alignContent:'center', justifyContent:'center', marginTop:10}} onPress={()=>{setAbrirAjustesSistema(!abrirAjustesSistema)}}>
                        <Text style={{color:'blue', marginBottom:5, fontWeight:500, fontSize:20, textAlign:'center'}}>Ajustes del sistema</Text>
                </TouchableOpacity>
                {abrirAjustesSistema && 
                    <View style={styles.infoPersonal}>
                        <Text style={{fontSize:20, fontWeight:400}}>Modo nocturno</Text>
                        <View style={[styles.contenedor, valorSwitch ? null : styles.modoNoche]}>
                            <TouchableOpacity style={[valorSwitch ? styles.modoDiaBoton : styles.modoNocheBoton]} onPress={()=>{cambiarTema(true)}}>
                                <Feather 
                                    name={valorSwitch ? 'sun' : 'moon'}
                                    size={24} 
                                    color={valorSwitch ? '#000' : '#82D8CF'}
                                    style={[styles.icono, valorSwitch ? styles.iconoDia : null]} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={{fontSize:20, fontWeight:400, marginTop:5}}>Tamaño del texto</Text>
                        <View style={{flexDirection:'row', padding:10}}>
                            <TouchableOpacity style={[{padding:10, borderRadius:10}, valorSwitchTamaño? {borderWidth:2} : {borderWidth:0.4}]} onPress={()=>{cambiarTamaño(false)}}>
                                <Text style={[{fontSize:20}, valorSwitchTamaño ? {fontWeight:600} : {fontWeight:200}]}>Normal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[{marginLeft:20, padding:10, borderRadius:10}, valorSwitchTamaño? {borderWidth:0.4} : {borderWidth:2}]} onPress={()=>{cambiarTamaño(true)}}>
                                <Text style={[{fontSize:20}, valorSwitchTamaño ? {fontWeight:200} : {fontWeight:600}]}>Grande</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                <TouchableOpacity onPress={() => signOut(auth).then(()=>{navigation.navigate('LoginScreen')})}>
                    <Text style={{fontSize:18, textAlign:'center', marginTop:10, borderWidth:1, alignSelf:'center', padding:8, backgroundColor:'#fff'}}><Ionicons name="exit" size={20} color="black"/> Cerrar sesión</Text>
                </TouchableOpacity>
            </ScrollView>

            {abrirModalUsuario && 
            <Modal
                animationType="slide"
                transparent={true}
                visible={abrirModalUsuario}
                onRequestClose={() => {
                setAbrirModalUsuario(!abrirModalUsuario);
            }}>
                <TouchableOpacity style={{flex:1,}} onPress={() => {}}>
                    <View style={{height: 'auto', marginTop: 'auto', backgroundColor:'#f6f6f6', borderTopLeftRadius:30, borderTopRightRadius:30, borderWidth:1}}>
                        <View style={{height:40, width:50, margin:5, marginLeft:5}}>
                            <Pressable
                                style={{margin:5}}
                                onPress={() => setAbrirModalUsuario(!abrirModalUsuario)}>
                                <AntDesign name="closecircle" size={28} color="black" />
                            </Pressable>
                        </View>
                        <View style={{borderRadius:20, marginTop:5, marginLeft:30, marginRight:30,}}>
                            <View style={{justifyContent:'center', alignItems:'center'}}>
                                <Text style={{fontWeight:"bold", fontSize:24, marginBottom:10}}>Cambiar nombre de usuario</Text>
                            </View>
                            <TextInput 
                                placeholder="Nombre de usuario nuevo" 
                                style={[{padding:20, marginLeft:1, borderWidth:1,}, tamañoNormal ? null : {fontSize:18}]}
                                editable={true}
                                multiline={true}
                                onChangeText={(texto) => setUsuario(texto)}
                                value={usuario}
                            />
                            
                                <TouchableOpacity style={{marginTop:10, marginBottom:10, justifyContent:'center', alignItems:'center', borderWidth:0, padding:10, marginLeft:80, marginRight:80, backgroundColor:'#3a99d8', borderRadius:6}} onPress={() => {
                                    if(usuario.length < 5 ){
                                        setMensajeAviso("El campo usuario no tiene los caracteres necesarios");
                                        setAbrirModalUsuario(!abrirModalUsuario);
                                        setAlertaAviso(true);
                                    }
                                    else if(usuario.length > 15){
                                        setMensajeAviso("El campo usuario es demasiado largo");
                                        setAbrirModalUsuario(!abrirModalUsuario);
                                        setAlertaAviso(true);
                                    }
                                    else{
                                        updateProfile(auth.currentUser, {
                                            displayName:usuario,
                                            photoURL: auth.currentUser.photoURL
                                        }).then(()=>{
                                            setAlertaExito(true);
                                            setAbrirModalUsuario(!abrirModalUsuario);
                                            updateDoc(doc(getFirestore(app),'Usuarios', idDocUpdate), {
                                                Nombre:usuario,
                                            });
                                        }).catch((error) =>{
                                            setMensajeError("Se ha producido algún error. Inténtelo de nuevo.");
                                            setAlertaError(true);
                                            setAbrirModalUsuario(!abrirModalUsuario);
                                        });
                                        setUsuario("");
                                    }
                                }}>
                                    <Text style={[{textAlign:'center', fontWeight:"bold", color:'#fff'}, tamañoNormal ? null : {fontSize:18}]}>Guardar cambios</Text>
                                </TouchableOpacity>  
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
            }
            {abrirModalEmail && 
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={abrirModalEmail}
                    onRequestClose={() => {
                    setContraseñaSeguridad("");
                }}>
                    <TouchableOpacity style={{flex:1,}} onPress={() => {setContraseñaSeguridad("");}}>
                        <View style={{height: 'auto', marginTop: 'auto', backgroundColor:'#f6f6f6', borderTopLeftRadius:30, borderTopRightRadius:30, borderWidth:1}}>
                            <View style={{height:40, width:50, margin:5, marginLeft:5}}>
                                <Pressable
                                    style={{margin:5}}
                                    onPress={() =>  { setContraseñaSeguridad(""); setAbrirModalEmail(!abrirModalEmail)}}>
                                    <AntDesign name="closecircle" size={28} color="black" />
                                </Pressable>
                            </View>
                            <View style={{borderRadius:20, marginTop:5, marginLeft:30, marginRight:30}}>
                                <View style={{justifyContent:'center', alignItems:'center'}}>
                                    <Text style={{fontWeight:"bold", fontSize:24, marginBottom:10}}>Cambiar correo electrónico</Text>
                                </View>
                                <TextInput 
                                    placeholder="Email nuevo" 
                                    style={[{padding:20, marginLeft:1, height:50, marginTop:2, borderWidth:1}, tamañoNormal ? null : {fontSize:18}]}
                                    editable={true}
                                    multiline={true}
                                    onChangeText={(texto) => setEmail(texto)}
                                    value={email}
                                />
                                <Text style={[{fontWeight:400, marginTop:20, fontSize:16}, tamañoNormal ? null : {fontSize:18}]}>Por motivos de seguridad, escriba su contraseña</Text>
                                <TextInput 
                                    placeholder="Contraseña" 
                                    style={[{padding:20, marginLeft:1, height:50, marginTop:2, borderWidth:1, marginBottom:10}, tamañoNormal ? null : {fontSize:18}]}
                                    editable={true}
                                    multiline={true}
                                    onChangeText={(texto) => setContraseñaSeguridad(texto)}
                                    value={contraseñaSeguridad}
                                />
                                <Pressable 
                                    style={{marginBottom:10}}
                                    onPress = {() => { 
                                        let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;

                                        if(email.length==0){
                                            setAbrirModalEmail(!abrirModalEmail);
                                            setMensajeAviso("El campo email está vacío");
                                            setAlertaAviso(true);
                                        }
                                        else if(contraseñaSeguridad.length==0){
                                            setAbrirModalEmail(!abrirModalEmail);
                                            setMensajeAviso("El campo contraseña está vacío");
                                            setAlertaAviso(true);
                                        }
                                        
                                        else if(reg.test(email) === false) {
                                            setAbrirModalEmail(!abrirModalEmail);
                                            setMensajeAviso("El email introducido no es válido");
                                            setAlertaAviso(true);
                                        }
                                        else{
                                            const credential = EmailAuthProvider.credential(
                                                usuario["email"],
                                                contraseñaSeguridad
                                            );
                                            reauthenticateWithCredential(getAuth(app).currentUser, credential).then(() => {
                                                
                                            }).catch((error) => {
                                                setMensajeError("La contraseña introducida es incorrecta");
                                                setAlertaError(true);
                                            });

                                            updateEmail(auth.currentUser, email).then(()=>{
                                                setContraseñaSeguridad("");
                                                setEmail("");
                                                setAlertaExito(true);
                                            }).catch((error) =>{

                                            });
                                        }
                                    }}>
                                    <View style={{marginTop:10, justifyContent:'center', alignItems:'center', borderWidth:0, padding:10, marginLeft:80, marginRight:80, backgroundColor:'#3a99d8', borderRadius:6}}>
                                        <Text style={[{textAlign:'center', fontWeight:"bold", color:'#fff'}, tamañoNormal ? null : {fontSize:18}]}>Guardar cambios</Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>
            }
            {abrirModalContraseña &&  
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={abrirModalContraseña}
                    onRequestClose={() => {
                    setAbrirModalContraseña(!abrirModalContraseña);
                }}>
                    <TouchableOpacity style={{flex:1,}} onPress={() => { setContraseñaSeguridad("")}}>
                        <View style={{height: 'auto', marginTop: 'auto', backgroundColor:'#f6f6f6', borderTopLeftRadius:30, borderTopRightRadius:30, borderWidth:1}}>
                            <View style={{height:40, width:50, margin:5, marginLeft:5}}>
                                <Pressable
                                    style={{margin:5}}
                                    onPress={() => { setContraseñaSeguridad("");setAbrirModalContraseña(!abrirModalContraseña)}}>
                                    <AntDesign name="closecircle" size={28} color="black" />
                                </Pressable>
                            </View>
                            <View style={{borderRadius:20, marginTop:5, marginLeft:30, marginRight:30}}>
                                <View style={{justifyContent:'center', alignItems:'center'}}>
                                    <Text style={{fontWeight:"bold", fontSize:24, marginBottom:10}}>Cambiar contraseña</Text>
                                </View>
                                <TextInput 
                                    placeholder="Contraseña nueva" 
                                    style={[{padding:20, marginLeft:1, height:50, marginTop:2, borderWidth:1, marginBottom:10}, tamañoNormal ? null : {fontSize:18}]}
                                    editable={true}
                                    multiline={true}
                                    onChangeText={(texto) => setContraseña(texto)}
                                    value={contraseña}
                                />
                                <TextInput 
                                    placeholder="Repita la Contraseña nueva" 
                                    style={[{padding:20, marginLeft:1, height:50, marginTop:2, borderWidth:1}, tamañoNormal ? null : {fontSize:18}]}
                                    editable={true}
                                    multiline={true}
                                    onChangeText={(texto) => setReContraseña(texto)}
                                    value={reContraseña}
                                />
                                <Text style={[{fontWeight:400, marginTop:20}, tamañoNormal ? null : {fontSize:18}]}>Por motivos de seguridad, escriba su contraseña antigua</Text>
                                <TextInput 
                                    placeholder="Contraseña antigua" 
                                    style={[{padding:20, marginLeft:1, height:50, marginTop:2, borderWidth:1, marginBottom:10}, tamañoNormal ? null : {fontSize:18}]}
                                    editable={true}
                                    multiline={true}
                                    onChangeText={(texto) => setContraseñaSeguridad(texto)}
                                    value={contraseñaSeguridad}
                                />
                                <Pressable 
                                    style={{marginBottom:10}}
                                    onPress = {() => { 
                                        if(contraseña.length==0 || reContraseña.length==0){
                                            setMensajeAviso("No puedes enviar una contraseña vacía");
                                            setAbrirModalContraseña(!abrirModalContraseña);
                                            setAlertaAviso(true);
                                        }
                                        else if(contraseña != reContraseña){
                                            setMensajeAviso("Las contraseñas no coinciden");
                                            setAbrirModalContraseña(!abrirModalContraseña);
                                            setAlertaAviso(true);
                                        }
                                        else{
                                            const credential = EmailAuthProvider.credential(
                                                usuario["email"],
                                                contraseñaSeguridad
                                            );

                                            reauthenticateWithCredential(getAuth(app).currentUser, credential).then(() => {
                                                
                                            }).catch((error) => {
                                                setMensajeError("La contraseña introducida es incorrecta");
                                                setAlertaError(true);
                                            });

                                            updatePassword(auth.currentUser, contraseña).then(()=>{
                                                setContraseñaSeguridad("");
                                                setContraseña("");
                                                setReContraseña("");
                                                setAlertaExito(true);
                                            }).catch((error) =>{

                                            });
                                        }
                                    }}>
                                    <View style={{marginTop:10, justifyContent:'center', alignItems:'center', borderWidth:0, padding:10, marginLeft:80, marginRight:80, backgroundColor:'#3a99d8', borderRadius:6}}>
                                        <Text style={[{textAlign:'center', fontWeight:"bold", color:'#fff'}, tamañoNormal ? null : {fontSize:18}]}>Guardar cambios</Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>
            }
        
             <AwesomeAlert
                show={alertaExito}
                showProgress={false}
                title="¡Éxito!"
                message="La operación se ha realizado correctamente."
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={false}
                showConfirmButton={true}
                cancelText="No"
                confirmText="Aceptar"
                confirmButtonColor="#3a99d8"
                onCancelPressed={() => {
                    setAlertaExito(!alertaExito);
                }}
                onConfirmPressed={() => {
                    setAlertaExito(!alertaExito);
                }}
            />
            <AwesomeAlert
                show={alertaAviso}
                showProgress={false}
                title="¡Atención!"
                message={mensajeAviso}
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={false}
                showConfirmButton={true}
                cancelText="No"
                confirmText="Aceptar"
                confirmButtonColor="#3a99d8"
                onCancelPressed={() => {
                    
                }}
                onConfirmPressed={() => {
                    setMensajeAviso("");   
                    setAlertaAviso(!alertaAviso);
                }}
            />
            <AwesomeAlert
                show={alertaCambiarFoto}
                showProgress={false}
                title="¡Atención!"
                message="¿Estás seguro que deseas cambiar la imagen por la seleccionada?"
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={true}
                showConfirmButton={true}
                cancelText="No"
                confirmText="Si"
                confirmButtonColor="#3a99d8"
                onCancelPressed={() => {
                    setAlertaCambiarFoto(!alertaCambiarFoto);
                }}
                onConfirmPressed={() => {
                    cambiarFotoPerfil(fotoCambiar);
                    setAlertaCambiarFoto(!alertaCambiarFoto);
                }}
            />

            <AwesomeAlert
                show={alertaError}
                showProgress={false}
                title="¡Error!"
                message={mensajeError}
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={false}
                showConfirmButton={true}
                cancelText="No"
                confirmText="Aceptar"
                confirmButtonColor="#3a99d8"
                onCancelPressed={() => {
                    setAlertaError(!alertaError);
                }}
                onConfirmPressed={() => {
                    setAlertaError(!alertaError);
                }}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    header: {
      backgroundColor: '#F0B27A',
      borderBottomRightRadius:20,
      borderBottomLeftRadius:20,
      flex:0.22,
      marginBottom:35
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 63,
      borderWidth: 4,
      borderColor: 'white',
      marginBottom: 10,
      alignSelf: 'center',
      position: 'absolute',
      marginTop: 80,
    },
    infoPersonal:{
        flex: 1, 
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
        marginTop:10,
        borderRadius:10
    },
    modoNoche: {
        backgroundColor:'#242321',
    },
    modoDiaBoton: {
        alignItems:'flex-start',
        borderColor:'#000', 
    },
    modoNocheBoton: {
        alignItems:'flex-end',
        borderColor:'#FFF', 
    },
    icono:{
        borderWidth:2, 
        padding: 6, 
        borderRadius: 80, 
        margin:3,
        borderColor:'#fff'
    },
    iconoDia:{
        borderColor:'#000'
    },
    contenedor: {
        flex: 1,
        borderRadius:80,
        borderColor:'#000',
        borderWidth:0.5,
        marginRight:10,
        marginLeft:10,
        marginTop:10,
        marginBottom:10,
        backgroundColor:'#E9E9E9',
        width:100
    },
  })
  