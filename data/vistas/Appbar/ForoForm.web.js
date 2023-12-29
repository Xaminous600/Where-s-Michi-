import { Text, View, TextInput, Dimensions, Alert, StyleSheet, Pressable, ScrollView,Image, Modal, TouchableOpacity} from "react-native";
import React, {useEffect, useState } from 'react';
import { Feather, Ionicons, AntDesign } from '@expo/vector-icons'; 
import {app} from "../../../database/firebase";
import {getDoc, updateDoc, getFirestore, doc, arrayUnion, onSnapshot, query, collection, where, getDocs} from "firebase/firestore";
import {getAuth} from 'firebase/auth';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import AwesomeAlert from 'react-native-awesome-alerts';

const Comentarios = ({index, indice, usuario, mensaje, respuestas, arrayUpdate, idDoc, modoNocturno, tamañoLetra, admin, visualizarMovil}) =>{
    const [usuarioResp, setUsuarioResp] = useState("");
    const [respuesta, setRespuesta] = useState("");
    const [abrirModal, setAbrirModal] = useState(null);
    const [alertaExito, setAlertaExito] = useState(false);
    const [alertaError, setAlertaError] = useState(false);

    const auth = getAuth(app);
    
    useEffect(()=> {
        (async () => {
            const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", usuario));
            const datosConsultaUsuario = await getDocs(consultaUsuario);
            setUsuarioResp(datosConsultaUsuario.docs[0].data());
        })();
    },[]);

    function realizarRespuesta(){
        const add = {
            Mensaje: respuesta,
            Id_Usuario: auth.currentUser.uid,
        }

        arrayUpdate[indice]["Respuestas"].push(add);
        
        updateDoc(doc(getFirestore(app),'PostForo', idDoc.Id), {
            Comentarios: arrayUpdate
        });

        setRespuesta("");
        setAlertaExito(true);
    }

    async function eliminarComentario(){
        
        arrayUpdate.splice(indice, 1);

        await updateDoc(doc(getFirestore(app),'PostForo', idDoc.Id), {
            Comentarios: arrayUpdate,
        });

        Alert.alert("¡Éxito!","El comentario ha sido eliminado correctamente.");
    }

    return(
        <View key={index} style={[{backgroundColor:'#fff', padding:30, marginBottom:1}, visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
            <View>
                <View style={{flexDirection:'row', alignItems:'center',}}>
                    <Image 
                        source={{uri: usuarioResp["Foto"]}} 
                        style={{width: 40, height: 40, borderRadius:40, }} />
                    <Text style={[{fontWeight:500, marginBottom:5, marginLeft:5, fontSize:18}, modoNocturno ? null : {color:'#fff'}, tamañoLetra ? null : {fontSize:22}]}>  {usuarioResp["Nombre"]}</Text>
                </View>
                <Text style={[{marginTop:10}, modoNocturno ? null : {color:'#fff'}, tamañoLetra ? null : {fontSize:22}]}>{mensaje}</Text>
                <Pressable
                    onPress = {() => {setAbrirModal(true)}}>
                    <Ionicons name="send" size={20} color= {modoNocturno ? "black" : "white"} style={{position:'absolute', bottom:0, right:0, margin:10,}} /> 
                </Pressable>
            </View>
            <ScrollView>
            {respuestas && respuestas.map((comentario, index)=>{
                return <Respuestas key={index} usuario={comentario["Id_Usuario"]} mensaje={comentario["Mensaje"]} tamañoLetra={tamañoLetra}/>
             })}
            </ScrollView>
             
            {admin && <TouchableOpacity style={{position:'absolute', right:0, top:0, margin:10}} onPress={()=>{eliminarComentario()}}>
                {modoNocturno ? <AntDesign name="delete" size={20} color="black" /> : <AntDesign name="delete" size={20} color="white" />}
            </TouchableOpacity>
            }

            {abrirModal && 
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={abrirModal}
                    onRequestClose={() => {
                    setAbrirModal(!abrirModal);
                }}>
                    <TouchableOpacity style={{flex:1,}} onPress={() => {setRespuesta("")}}>
                        <View style={{height: '30%', marginTop: 'auto', backgroundColor:'#fff',}}>
                            <View style={{height:25, width:50, margin:5,}}>
                                <Pressable
                                    style={[styles.button]}
                                    onPress={() => setAbrirModal(!abrirModal)}>
                                    <AntDesign name="closecircle" size={24} color="black" />
                                </Pressable>
                            </View>
                            <View style={{backgroundColor:'#fff', borderRadius:20, marginTop:5, marginLeft:10, marginRight:10}}>
                                <TextInput 
                                    placeholder="Deja una respuesta" 
                                    style={{padding:20, marginLeft:1, height:100, marginTop:2, borderWidth:1, borderRadius:20 }}
                                    editable={true}
                                    multiline={true}
                                    onChangeText={(texto) => setRespuesta(texto)}
                                    value={respuesta}
                                />
                                <Pressable
                                    onPress = {() => { 
                                        if(respuesta.length==0){
                                            setAlertaError(true);
                                        }
                                        else{
                                            realizarRespuesta();
                                        }
                                    }}>
                                    <Ionicons name="send" size={20} color="black" style={{position:'absolute', bottom:0, right:0, margin:10,}} />
                                </Pressable>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <AwesomeAlert
                        show={alertaExito}
                        showProgress={false}
                        title="¡Éxito!"
                        message="La respuesta se ha realizado correctamente"
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
                            setAlertaExito(false);
                        }}
                    />
                    <AwesomeAlert
                        show={alertaError}
                        showProgress={false}
                        title="¡Atención!"
                        message="La respuesta no puede estar vacía"
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
                            setAlertaError(!alertaError);
                        }}
                    />
                </Modal>
            }
        </View>
    );
}

const Respuestas = ({index, usuario, mensaje, tamañoLetra}) =>{
    const [usuarioResp, setUsuarioResp] = useState('');
    
    useEffect(()=> {
        (async () => {
            
            const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", usuario));
            const datosConsultaUsuario = await getDocs(consultaUsuario);
            setUsuarioResp(datosConsultaUsuario.docs[0].data());
        })();
    },[]);

    return(
        <View style={{marginTop:10}}>
            <View style={styles.lineaVertical}/> 
            <View key={index} style={{backgroundColor:'#edeff1', padding:30, marginTop:15,marginBottom:15, marginLeft:15, borderRadius:20}}>
                <View style={{flexDirection:'row'}}>
                    <Image 
                        source={{uri: usuarioResp['Foto']}} 
                        style={{width: 40, height: 40, borderRadius:40, }} />
                    <Text style={[{fontWeight:500, marginBottom:5, marginLeft:5, fontSize:18}, tamañoLetra ? null : {fontSize:22}]}>  {usuarioResp['Nombre']}</Text>
                </View>
                <Text style={[{marginTop:10}, tamañoLetra ? null : {fontSize:22}]}>{mensaje}</Text> 
            </View>
        </View>
    );
}

export default function ForoForm({ route, navigation: { goBack } }) {
    const [datosBD, setdatosBD] = useState([]);
    const [comentario, setComentario] = useState("");
    const [idPost, setIdPost] = useState("");
    const [usuario, setUsuario] = useState('');
    const [admin, setAdmin] = useState(false);
    const [dejarComentario, setDejarComentario] = useState(false);


    const auth = getAuth(app);
    const [modoNocturno, setModoNocturno] = useState(null);
    const [tamañoNormal, setTamañoNormal] = useState(null);
    const [alertaExito, setAlertaExito] = useState(false);
    const [alertaError, setAlertaError] = useState(false);
    
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

    useEffect(()=> {
       (async () =>{
            const { Id } = route.params;
            const datos = await getDoc(doc(getFirestore(app),'PostForo', Id));
            setdatosBD(datos.data());
            setIdPost(Id);

            const consultaDest= query(collection(getFirestore(app),'Usuarios'), where("Id", "==", route.params.Item.data()['Id_Usuario']));
            const datosConsultaDest = await getDocs(consultaDest);
            setUsuario(datosConsultaDest.docs[0].data());

            if(getAuth(app).currentUser.uid === route.params.Item.data()['Id_Usuario']){
                setAdmin(true);
            }
       })()
    },[]);

    useEffect(()=>{
        if(idPost){
            const docRef = doc(getFirestore(app), 'PostForo', idPost);
                const unsubscribe = onSnapshot(docRef, (doc) => { //Actualizar a tiempo real
                    setdatosBD(doc.data());
                  });
                
                return unsubscribe;
        }
      }, [idPost]) //Necesito saber el ID del documento a modificar previamente para establecer un listener

    function realizarComentario(){
        const comentarios = datosBD["Comentarios"];
        const { Id } = route.params;
    
       const add = {
            Id_Usuario: auth.currentUser.uid,
            Mensaje: comentario,
            Respuestas:[],
        }

        comentarios.push(add);
        updateDoc(doc(getFirestore(app),'PostForo', Id), {
            Comentarios: arrayUnion(add)
        });

        setComentario("");
        setAlertaExito(true);
    }

    return (
      <View style={{flex:1, backgroundColor:'#edeff1'}}>
          <View style={[{ height:60, backgroundColor:'#F0B27A',marginTop: Constants.statusBarHeight, alignItems:'center', flexDirection:'row'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <Pressable onPress={()=>{goBack();}}>
                    <View style={{marginLeft:20,}}>
                        {modoNocturno ? <AntDesign name="arrowleft" size={24} color="black"/> : <AntDesign name="arrowleft" size={24} color="white"/>}
                    </View>
                </Pressable>
                <Text style={[{textAlign:'center', marginLeft:20, fontSize:25, fontWeight:'500'}, modoNocturno ? null : {color:'#fff'}]}> Foro</Text>
            </View>
        <ScrollView>
            <View style={[{backgroundColor:'#fff', padding:30, paddingLeft:'15%', paddingRight:'15%'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Image 
                        source={{uri: usuario['Foto']}} 
                        style={{width: 40, height: 40, borderRadius:40, }} />
                    <Text style={[{fontWeight:500, marginBottom:5, marginLeft:5, fontSize:18}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}> {usuario["Nombre"]} </Text>
                </View>
                <Text style={[{fontWeight:"bold", fontSize:22, marginTop:5}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:24}]}>{datosBD["Titulo"]}</Text>
                <Text style={[{marginTop:10, fontSize:18}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>{datosBD["Informacion"]}</Text>  
                <View style={[{borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, marginTop:15}, modoNocturno ? null : {borderBottomColor:'white'}]}/>  
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <Text style={[{marginTop:10, fontSize:18}, modoNocturno ? null : {color:'#fff'}]}> <Feather name="message-square" size={20} color={modoNocturno ? "black" : "white"} /> {datosBD["Comentarios"] ? datosBD["Comentarios"].length : 0}</Text>
                    <TouchableOpacity onPress={()=>{setDejarComentario(!dejarComentario)}}>
                        <Text style={[{marginTop:10, fontSize:18}, modoNocturno ? null : {color:'#fff'}]}> <Ionicons name="send"size={20} color={modoNocturno ? "black" : "white"} /></Text>
                    </TouchableOpacity>
                </View> 
            </View>
            
            {dejarComentario &&
            <View style={[{marginBottom:1, padding:30}, visualizarMovil ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:5}}>
                    <Image 
                        source={{uri: auth.currentUser.photoURL}} 
                        style={{width: 40, height: 40, borderRadius:40, }} />
                    <Text style={[{fontWeight:500, marginBottom:5, marginLeft:5, fontSize:18}, tamañoNormal ? null : {fontSize:22}]}> {auth.currentUser.displayName} </Text>
                </View>
               
                <View style={{backgroundColor:'#fff', borderRadius:20, height:100}}>
                    <TextInput 
                        placeholder="Deja un comentario" 
                        style={[{padding:20, marginLeft:10, height:100, flex:1, height:100}, tamañoNormal ? null : {fontSize:18}]}
                        editable={true}
                        multiline={true}
                        onChangeText={(texto) => setComentario(texto)}
                        value={comentario}
                    />
                    <Pressable
                        onPress = {() => {
                            if(comentario.length==0){
                                setAlertaError(true);
                            }
                            else{
                                realizarComentario();
                            }}}>
                        <Ionicons name="send" size={20} color="black" style={{position:'absolute', bottom:0, right:0, margin:10,}} />
                    </Pressable>
                </View>
            </View>
            }

            {datosBD["Comentarios"] && 
             datosBD["Comentarios"].map((comentario, index)=>{
                return <Comentarios key={index} indice={index} usuario={comentario["Id_Usuario"]} mensaje={comentario["Mensaje"]} respuestas={comentario["Respuestas"]} arrayUpdate={datosBD["Comentarios"]} idDoc={route.params} modoNocturno={modoNocturno} tamañoLetra={tamañoNormal} admin={admin} visualizarMovil={visualizarMovil}/>
             })
            }
    
        </ScrollView>
        
        {alertaError && <View style={{position:'absolute', top:-100, flex:1, width:'100%', height:'50%'}}>
            <AwesomeAlert
                show={alertaError}
                showProgress={false}
                title="¡Atención!"
                message="La respuesta no puede estar vacía"
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
                    setAlertaError(!alertaError);
                }}
            />
        </View>
        }

        {alertaExito && <View style={{position:'absolute', top:-100, flex:1, width:'100%', height:'50%'}}>
            <AwesomeAlert
                show={alertaExito}
                showProgress={false}
                title="¡Éxito!"
                message="La respuesta se ha realizado correctamente"
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
                    setAlertaExito(false);
                }}
            />
        </View>
        }
      </View>
    );
  }

const styles = StyleSheet.create({
    lineaVertical: {
        height: '100%',
        width: 1,
        backgroundColor: '#909090',
        position:'absolute',
        marginTop:15,
      },
      modalView: {
        backgroundColor: '#e7ebda', 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center', 
      },
  });
  