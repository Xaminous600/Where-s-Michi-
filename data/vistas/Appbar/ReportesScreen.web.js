import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Pressable, ImageBackground, Dimensions} from 'react-native';
import React, { useState, useEffect, useRef} from 'react';
import Constants from 'expo-constants';
import { FontAwesome, Fontisto, AntDesign, EvilIcons, Entypo} from '@expo/vector-icons';
import { app } from '../../../database/firebase';
import {getDocs, collection, getFirestore, query, where, addDoc, updateDoc, doc, arrayRemove, arrayUnion, getDoc} from "firebase/firestore";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AwesomeAlert from 'react-native-awesome-alerts';
import { getAuth } from '@firebase/auth';

export default function ReportesScreen({navigation, route, navigation: { goBack }}) {
    const [isKeyboardVisible, setKeyboardIsVisible] = useState(false);
    const [primerFAQ, setPrimerFAQ] = useState(false);
    const [segundoFAQ, setSegundoFAQ] = useState(false);
    const [tercerFAQ, setTercerFAQ] = useState(false);
    const [motivo, setMotivo] = useState(null);
    const [publicacion, setPublicacion] = useState(null);
    const [modoNocturno, setModoNocturno] = useState(null);
    const [tamañoNormal, setTamañoNormal] = useState(null);

    const [alertaAviso, setAlertaAviso] = useState(false);
    const [alertaExito, setAlertaExito] = useState(false);

    const idDoc = route.params.idDoc;
    const tipo = route.params.tipo;

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

    useEffect(()=>{
        (async () =>{ 
          const consultaDest= query(collection(getFirestore(app),'Publicaciones'), where("Publicacion", "==", doc(getFirestore(app), tipo, idDoc)));
          const datosConsultaDest = await getDocs(consultaDest);
            
          setPublicacion(datosConsultaDest.docs[0]);
        })()
      }, []);
      
    async function procesarReporte(){
        let consultaDest = [];
        if(!motivo){
            alert("Atención, escoja una opción para realizar el reporte");
            return;
        }
        consultaDest= query(collection(getFirestore(app),'Reportes'), where("Publicacion", "==", doc(collection(getFirestore(app), 'Publicaciones'), publicacion.id)));
        const datosConsultaDest = await getDocs(consultaDest);
        
        if(!datosConsultaDest.docs[0]){
            addDoc(collection(getFirestore(app),'Reportes'),{Publicacion: doc(collection(getFirestore(app), 'Publicaciones'), publicacion.id), Motivo: [motivo], Num_Reportes:1}); 
        }
        else{
            updateDoc(doc(getFirestore(app),'Reportes', datosConsultaDest.docs[0].id), {
                Motivo: arrayUnion(motivo),
                Num_Reportes: datosConsultaDest.docs[0].data()['Num_Reportes']+1,
            });
        }

        const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
        const datosConsultaUsuario = await getDocs(consultaUsuario);

        if(publicacion.data()['Tipo'] == "PostForo"){
            const documento = await getDoc(publicacion.data()['Publicacion']);

            updateDoc(doc(getFirestore(app), 'Usuarios', datosConsultaUsuario.docs[0].id), {
                Ocultar: arrayUnion(publicacion.id),
                Post_Favoritos: arrayRemove(doc(collection(getFirestore(app), 'PostForo'), documento.id)),
            })
        }
        else if(publicacion.data()['Tipo'] == 'Adopcion'){
            const documento = await getDoc(publicacion.data()['Publicacion']);

            updateDoc(doc(getFirestore(app), 'Usuarios', datosConsultaUsuario.docs[0].id), {
                Ocultar: arrayUnion(publicacion.id),
                Adoptar_Favoritos: arrayRemove(doc(collection(getFirestore(app), 'Adopcion'), documento.id)),
            })
        }
        else{
            updateDoc(doc(getFirestore(app), 'Usuarios', datosConsultaUsuario.docs[0].id), {
                Ocultar: arrayUnion(publicacion.id),
            })
        }


        setAlertaExito(true);
    }

    return (
        <View style={{flex:1, marginTop:Constants.statusBarHeight}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground> 
            <View style={[{flex:0.32, backgroundColor: '#F0B27A', borderBottomLeftRadius:170}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <View style={{flexDirection:'row', marginLeft:20, marginTop:15}}>
                    <Pressable onPress={()=>{goBack();}}>
                        <View style={{marginTop:2}}>
                            {modoNocturno ? <AntDesign name="arrowleft" size={40} color="black" /> : <AntDesign name="arrowleft" size={40} color="white"/> }
                        </View>
                    </Pressable>
                    <Text style={{textAlign:'center', alignSelf:'center', fontWeight:"bold", color:'#fff', fontSize:25, marginLeft:40}}>Reportar publicación</Text>
                </View>

                <View style={{justifyContent:'center', alignItems:'center', marginTop:10}}>
                    {!isKeyboardVisible && 
                        <Image
                            style={styles.tinyImage}
                            source={require('../../imagenes/reporteImagen.png')}
                        />
                    }
                </View>
            </View>
            <View style={{flex:0.68, alignItems:'center',}}>
                <ScrollView>
                    <Text style={[{fontSize:25, fontWeight:'bold', marginBottom:5, textAlign:'center',}, modoNocturno ? null :{color:'#fff'}, tamañoNormal ? null : {fontSize:30}]}>Motivo del reporte</Text>
                    <View style={[{flex:1, marginLeft:20, marginRight:70, borderRadius:20, marginTop:10}, visualizarMovil ? {marginRight:20} : null]}>
                        <TouchableOpacity onPress={()=>{setPrimerFAQ(true); setSegundoFAQ(false); setTercerFAQ(false); setMotivo("Palabras ofensivas o incitación a que otros acosen")}} style={{padding:15, backgroundColor:'#fff', borderRadius:20}}>
                            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                                {!primerFAQ && <Entypo name="circle" style={{marginRight:20, marginLeft:15}} size={30} color="black" />}
                                {primerFAQ && <FontAwesome name="circle" style={{marginRight:20, marginLeft:15}} size={30} color="black" />}
                                <Text style={[{marginBottom:10, fontSize:18, fontWeight:400, marginRight:40, marginTop:5}, tamañoNormal ? null : {fontSize:22}]}>Palabras ofensivas o incitación a que otros acosen</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity  onPress={()=>{setPrimerFAQ(false); setSegundoFAQ(true); setTercerFAQ(false); setMotivo("Expuesto a contenido delicado o perturbador")}} style={{padding:15, marginBottom:10, marginTop:10, backgroundColor:'#fff', borderRadius:20}}>
                            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                                {!segundoFAQ && <Entypo name="circle" style={{marginRight:20, marginLeft:20}} size={30} color="black" />}
                                {segundoFAQ && <FontAwesome name="circle" style={{marginRight:20, marginLeft:20}} size={30} color="black" />}
                                <Text style={[{marginBottom:10, fontSize:18, fontWeight:400, marginRight:40, marginTop:5}, tamañoNormal ? null : {fontSize:22}]}>Expuesto a contenido delicado o perturbador</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity  onPress={()=>{setPrimerFAQ(false); setSegundoFAQ(false); setTercerFAQ(true); setMotivo("Expuesto a información engañosa")}} style={{padding:15, backgroundColor:'#fff', marginBottom:10, borderRadius:20}}>
                            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                                {!tercerFAQ && <Entypo name="circle" style={{marginRight:20, marginLeft:30}} size={30} color="black" />}
                                {tercerFAQ && <FontAwesome name="circle" style={{marginRight:20, marginLeft:30}} size={30} color="black" />}
                                <Text style={[{marginBottom:10, fontSize:18, fontWeight:400, marginRight:40, marginTop:5}, tamañoNormal ? null : {fontSize:22}]}>Expuesto a información engañosa</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity  onPress={()=>{setAlertaAviso(!alertaAviso)}} style={{padding:10, backgroundColor:'#fff', borderRadius:20, marginLeft:90, marginRight:120, marginTop:10}}>
                        <View style={{justifyContent:'center', alignItems:'center'}}>
                            <Text style={[{marginBottom:10, fontSize:18, fontWeight:400, marginRight:10, marginTop:5}, tamañoNormal ? null : {fontSize:22}]}>Continuar</Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <AwesomeAlert
                show={alertaAviso}
                showProgress={false}
                title="¡Atención!"
                message="¿Estás seguro que deseas continuar?'"
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                showCancelButton={true}
                showConfirmButton={true}
                cancelText="No"
                confirmText="Si"
                confirmButtonColor="#3a99d8"
                onCancelPressed={() => {
                    setAlertaAviso(!alertaAviso);
                }}
                onConfirmPressed={() => {
                    setAlertaAviso(!alertaAviso);
                    procesarReporte(); 
                }}
            />

            <AwesomeAlert
                show={alertaExito}
                showProgress={false}
                title="¡Éxito!"
                message="El reporte de la publicación se realizó correctamente. Nuestro personal lo visualizará lo antes posible"
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
                    goBack();
                }}
            />

        </View>
    );
}

const styles = StyleSheet.create({    
    tinyImage: {
        width: 180,
        height: 160,
    },
});