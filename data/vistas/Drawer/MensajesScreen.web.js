import { StyleSheet, Text, View, Dimensions, TouchableOpacity, FlatList, Image, Pressable, ImageBackground, Platform} from 'react-native';
import Constants from 'expo-constants';
import { AntDesign, Fontisto, Entypo, FontAwesome5} from '@expo/vector-icons'; 
import React, { useState, useEffect, } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {app} from "../../../database/firebase";
import {getDocs, collection, getFirestore, query, where, doc, deleteDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove, orderBy} from "firebase/firestore";
import {getAuth} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function MensajesScreen({navigation}) {
    const auth = getAuth(app);
    const [datosBD, setdatosBD] = useState([]);
    const [datosBDBloqueados, setdatosBDBloqueados] = useState([]);
    const [listaBloqueados, setListaBloqueados] = useState(false);
    const [idDocUsuario, setIdDocUsuario] = useState(null);
    const [modoNocturno, setModoNocturno] = useState(null);
    const [tamañoNormal, setTamañoNormal] = useState(null);

    const [alertaExito, setAlertaExito] = useState(false);
    const [alertaAvisoBloquear, setAlertaAvisoBloquear] = useState(false);
    const [alertaAvisoDesbloquear, setAlertaAvisoDesbloquear] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [idBloquear, setIdBloquear] = useState(null);
    const [idDesbloquear, setIdDesbloquear] = useState(null);
    const [idFiltrarDoc, setIdFiltrarDoc] = useState(null);

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

        const tamaño = await AsyncStorage.getItem('letterPreference');
        tamaño == 'normal' ? setTamañoNormal(true) : setTamañoNormal(false);
        })()
    }, []));

    useFocusEffect(React.useCallback(()=> {
        (async () =>{
            const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", auth.currentUser.uid));
            const datosConsultaUsuario = await getDocs(consultaUsuario);
            setIdDocUsuario(datosConsultaUsuario.docs[0].id);
            
            if(!listaBloqueados){
                const consulta = query(collection(getFirestore(app),'Salas'), where("Id_Usuario1", "==", auth.currentUser.uid), orderBy('ult_Mensaje', 'asc'));
                const datosConsulta = await getDocs(consulta);

                let i = 0;
                let arrayChats = [];
                
                while(i < datosConsulta.size){
                    if(!datosConsultaUsuario.docs[0].data()['Bloqueados'].includes(datosConsulta.docs[i].data()['Id_Usuario2']))
                        arrayChats.push(datosConsulta.docs[i]);
                        
                        i++;
                }
                setdatosBD(arrayChats);            
            }
            else{
                setdatosBDBloqueados(datosConsultaUsuario.docs[0].data()['Bloqueados']);
            }
        })()
      },[listaBloqueados]));
    
    async function desbloquear(){
        await updateDoc(doc(getFirestore(app),'Usuarios', idDocUsuario), {
            Bloqueados: arrayRemove(idDesbloquear)
        });
        setListaBloqueados(!listaBloqueados);
        setMensaje("El usuario ha sido desbloqueado exitosamente");
        setAlertaExito(true);
    }

    const Bloqueados = ({idUsuario}) =>{
        const [usuario, setUsuario] = useState([]);
        useEffect(()=> {
            (async () =>{
                const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", idUsuario));
                const datosConsultaUsuario = await getDocs(consultaUsuario);

                setUsuario(datosConsultaUsuario.docs[0].data());
            })()
        },[]);

        return(
            <TouchableOpacity style={[visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}]} onPress={()=> {setIdDesbloquear(idUsuario);setAlertaAvisoDesbloquear(true)}}>
                <View style={[{flexDirection:'row', marginTop:20, backgroundColor:'#fff', height:90, borderRadius:20, marginLeft:25, marginRight:25, justifyContent:'center', alignItems:'center'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                    <Image
                        style={styles.tinyLogo}
                        source={{
                            uri: usuario["Foto"],
                        }}
                    />
                    <View style={{marginLeft:20}}>
                        <Text numberOfLines={1} style={[{fontSize:20}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>{usuario["Nombre"]}</Text>
                    </View> 
                </View>
            </TouchableOpacity>
        );
    }

    async function bloquearUsuario(){
    
        updateDoc(doc(getFirestore(app),'Usuarios', idDocUsuario), {
            Bloqueados: arrayUnion(idBloquear),
        });

        setdatosBD(datosBD.filter((element) => {
            return element.id != idFiltrarDoc;
        }))
        setMensaje("El usuario ha sido bloqueado");
        setAlertaExito(true);
    }

    const Chats = ({navegar, sala, idDoc1}) =>{
        const [usuario, setUsuario] = useState([]);
        const [mensajeNuevo, setMensajeNuevo] = useState(null);
    
        useEffect(()=>{
            (async () =>{
            const docRef = doc(getFirestore(app), 'Salas', idDoc1);
            
            const unsubscribe = onSnapshot(docRef, (doc) => { //Actualizar a tiempo real
                const ult_Mensaje = new Date(doc.data()["ult_Mensaje"]["seconds"] * 1000 + doc.data()["ult_Mensaje"]["nanoseconds"]/1000000);
                const ult_Acceder = new Date(doc.data()["ult_Acceder"]["seconds"] * 1000 + doc.data()["ult_Acceder"]["nanoseconds"]/1000000);
                
                if(ult_Mensaje > ult_Acceder)
                    setMensajeNuevo(true);
                        
                else
                    setMensajeNuevo(false);
            });
                    
            const consulta = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", sala['Id_Usuario2']));
            const datosConsulta = await getDocs(consulta);   
           
            setUsuario(datosConsulta.docs[0].data());
    
            return unsubscribe;
            })()
          }, [idDoc1]) //Necesito saber el ID del documento a modificar previamente para establecer un listener
    
        function actualizarEstado(){
            updateDoc(doc(getFirestore(app),'Salas', idDoc1), {
                ult_Acceder: new Date(),
            });
        }
    
        return(
            <TouchableOpacity style={[visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}]} onPress={()=> {actualizarEstado();navegar.navigate('ChatPrivado', {Sala:sala})}}>
                <View style={[{flexDirection:'row', marginTop:20, backgroundColor:'#fff', height:90, borderRadius:20, marginLeft:25, marginRight:25, justifyContent:'center', alignItems:'center'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                    <Image
                        style={styles.tinyLogo}
                        source={{
                            uri: usuario["Foto"],
                        }}
                    />
                    <View style={{marginLeft:65, marginRight:30, width:180}}>
                        <Text numberOfLines={1} style={[{fontWeight:400, fontSize:20}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:24}]}>{usuario["Nombre"]}</Text>
                        {sala['Mensajes'].length >0 && <Text style={[{marginTop:5, fontWeight:300, fontSize:14}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:20}]} numberOfLines={1}>{sala['Mensajes'][sala['Mensajes'].length-1]['Mensaje']}</Text>}
                    </View> 
                    {mensajeNuevo && <Text style={{position:'absolute', top:0, right:0, marginRight:20, marginTop:10}}> <AntDesign name="exclamationcircleo" size={24} color="orange"/></Text>}
                    <View style={{flexDirection:'row', position:'absolute', right:0, marginRight:10, bottom:0, marginBottom:10}}>
                        <TouchableOpacity onPress={()=>{setIdFiltrarDoc(idDoc1);setIdBloquear(sala['Id_Usuario2']);setAlertaAvisoBloquear(true)}}>
                            <Entypo name="block" size={22} color="red" style={{marginRight:15}}/> 
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return(
        <View style={{flex:1, marginTop:Constants.statusBarHeight, backgroundColor:'#EBC2F9',}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground>
            <View style={[{flex:0.42, backgroundColor: '#F0B27A', borderBottomLeftRadius:120, borderBottomRightRadius:120}, modoNocturno ? null : {backgroundColor: '#323639', borderWidth:1}]}>
                <View style={{marginTop:15, marginLeft:20, flexDirection:'row'}}>
                    <Pressable onPress={()=>{navigation.openDrawer()}}>
                        {modoNocturno ? <Fontisto name="nav-icon-a" size={20} color="black" style={{marginTop:10}}/> : <Fontisto name="nav-icon-a" size={20} color="white" style={{marginTop:10}}/>}
                    </Pressable>
                    {!listaBloqueados && <Text style={{fontWeight:"bold", color:'#fff', fontSize:30, marginLeft:40, textAlign:'center'}}>Mensajes</Text>}
                    {listaBloqueados && <Text style={{fontWeight:"bold", color:'#fff', fontSize:30, marginLeft:40, textAlign:'center'}}>Lista de bloqueados</Text>}
                </View>
                <View style={[{justifyContent:'center', alignItems:'center',  flex:1}]}>
                    <Image
                        style={[styles.tinyImage, visualizarMovil ? {width:'35%', height:'100%', marginBottom:0} :  {width:'14%', height:'100%', marginBottom:100, marginTop:70}]}
                        source={require('../../imagenes/chatSeccion.png')}
                    />
                </View>
            </View>
            <TouchableOpacity onPress={()=>{setListaBloqueados(!listaBloqueados)}} style={[styles.botonBloqueado, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}, tamañoNormal ? null : {width:170}]}>
                {!listaBloqueados && modoNocturno && <Entypo name="block" size={24} color="black" style={{marginRight:10}}/>}
                {!listaBloqueados && !modoNocturno && <Entypo name="block" size={24} color="white" style={{marginRight:10}}/>}
                {listaBloqueados && <Entypo name="block" size={25} color='#f75b53' style={{marginRight:10,}} />}
                <Text style={[modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Bloqueados</Text>
            </TouchableOpacity>
            {!listaBloqueados &&
                <FlatList
                    data={datosBD}
                    renderItem={({item}) => {return <Chats navegar={navigation} sala={item.data()} idDoc1 = {item.id}/>}}
                    keyExtractor={item => item.id}
                    style={{marginBottom:10}}
                />
            }
            {listaBloqueados &&
                <FlatList
                    data={datosBDBloqueados}
                    renderItem={({item}) => {return <Bloqueados idUsuario = {item} idDocUsuario = {idDocUsuario}/>}}
                    keyExtractor={(item, index) => index.toString()}
                    style={{marginBottom:10}}
                />
            }
            <AwesomeAlert
                show={alertaExito}
                showProgress={false}
                title="¡Éxito!"
                message={mensaje}
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
                show={alertaAvisoBloquear}
                showProgress={false}
                title="¡Atención!"
                message="¿Estás seguro de querer bloquear al usuario?"
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={true}
                showConfirmButton={true}
                cancelText="No"
                confirmText="Si"
                confirmButtonColor="#3a99d8"
                onCancelPressed={() => {
                    setAlertaAvisoBloquear(!alertaAvisoBloquear);
                }}
                onConfirmPressed={() => {
                    bloquearUsuario();
                    setAlertaAvisoBloquear(!alertaAvisoBloquear);
                }}
            />
            <AwesomeAlert
                show={alertaAvisoDesbloquear}
                showProgress={false}
                title="¡Atención!"
                message="¿Estás seguro de querer desbloquear al usuario?"
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={true}
                showConfirmButton={true}
                cancelText="No"
                confirmText="Si"
                confirmButtonColor="#3a99d8"
                onCancelPressed={() => {
                    setAlertaAvisoDesbloquear(!alertaAvisoDesbloquear);
                }}
                onConfirmPressed={() => {
                    desbloquear();
                    setAlertaAvisoDesbloquear(!alertaAvisoDesbloquear);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    tinyLogo: {
      width: 50,
      height: 50,
      borderRadius:40,
      position:'absolute',
      left:30
    },
    tinyImage:{
        width: '45%',
        height: '80%',
        marginBottom:80
    },
    botonBloqueado:{
        backgroundColor:'#fff',
        borderRadius:20,
        width: 140,
        padding:10,
        marginLeft:5,
        borderColor:'black',
        borderWidth:1,
        flexDirection:'row',
        marginTop:5
      },
  });