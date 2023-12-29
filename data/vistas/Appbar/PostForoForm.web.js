import { Text, View, Button, Alert, StyleSheet, ScrollView,Image, Keyboard ,TouchableOpacity, ImageBackground } from "react-native";
import React, { useState, useEffect, useRef } from 'react';
import { TextInput } from 'react-native-gesture-handler';
import { useForm, Controller } from "react-hook-form";
import {app} from "../../../database/firebase";
import { updateDoc, collection, getFirestore, doc, addDoc, getDoc, query, getDocs, where} from "firebase/firestore";
import Constants from 'expo-constants';
import { MaterialIcons, Feather, AntDesign, MaterialCommunityIcons} from '@expo/vector-icons';
import { getAuth } from "@firebase/auth";
import SelectDropdown from "react-native-select-dropdown";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function PostForoForm({ route, navigation: { goBack } }) {

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [animacion, setAnimacion] = useState(false);
    const temas = ["Politico", "Interés General", "Cuidado y Salud", "Soporte Técnico"];
    const [modoNocturno, setModoNocturno] = useState(null);
    const [tamañoNormal, setTamañoNormal] = useState(null);
    const [alertaExito, setAlertaExito] = useState(false);
    const [alertaValidar, setAlertaValidar] = useState(false);

    useFocusEffect(React.useCallback(() => {
    (async () => {
        const theme = await AsyncStorage.getItem('themePreference');
        theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);

        const tamaño = await AsyncStorage.getItem('letterPreference');
        tamaño == 'normal' ? setTamañoNormal(true) : setTamañoNormal(false);
      })()
    }, []));

    const { control, handleSubmit, setValue, clearErrors, reset, getValues, formState: { errors } } = useForm({  //FormState booleano modificación
        defaultValues: {  //Valores a almacenar por el formulario
            titulo: '',
            informacion: '',
            tema: '',
        }
    });

    function renderIcon(){
        return <AntDesign name="down" size={20} color="black" />;
    }
    
    async function subirDatos(){
        let foto;
        if(getValues('tema') === 'Soporte Técnico')
            foto = 'https://firebasestorage.googleapis.com/v0/b/tfg-56e1b.appspot.com/o/temas%2FtemaSoporte.png?alt=media&token=1375b21a-7e66-4fd6-ad01-7ba3fc33c9e3';
        else if(getValues('tema') === 'Cuidado y Salud')
            foto = 'https://firebasestorage.googleapis.com/v0/b/tfg-56e1b.appspot.com/o/temas%2FtemaSalud.png?alt=media&token=8a5b8a08-d9a7-47f6-9a42-acc10188e105';
        else if(getValues('tema') === 'Interés General')
            foto = 'https://firebasestorage.googleapis.com/v0/b/tfg-56e1b.appspot.com/o/temas%2FtemaInteres.png?alt=media&token=dc86c949-d9af-44ce-9122-db221ed817a4';
        else   
            foto = 'https://firebasestorage.googleapis.com/v0/b/tfg-56e1b.appspot.com/o/temas%2FtemaPolitico.png?alt=media&token=776fb804-9e0f-41ae-b771-ba0f982571ab'; 
        
        const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
        const datosConsultaUsuario = await getDocs(consultaUsuario);
            
        const docRef =  await addDoc(collection(getFirestore(app),'PostForo'), {Titulo:getValues('titulo'), Informacion: getValues('informacion'), Tema: getValues('tema'), Comentarios: [], Id_Usuario: getAuth(app).currentUser.uid, Foto:foto});
        addDoc(collection(getFirestore(app),'Publicaciones'), {Fecha:new Date(), Publicacion:docRef, Tipo:'PostForo', Reportes: [], Usuario:datosConsultaUsuario.docs[0].ref}); 
        
        setAlertaExito(true);
    }

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            },
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            },
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);


    return (
        <View style={{flex:1, marginTop:Constants.statusBarHeight}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/formularios.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%',marginTop: Constants.statusBarHeight}}>
            </ImageBackground>
            <View style={[{flex:0.32, backgroundColor: '#F0B27A', borderBottomLeftRadius:170}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                    <View style={{flexDirection:'row', marginLeft:15, marginTop:5}}>
                        <TouchableOpacity onPress={()=>{goBack()}}>
                            {modoNocturno ? <MaterialCommunityIcons name="keyboard-backspace" size={50} color="black"/> : <MaterialCommunityIcons name="keyboard-backspace" size={50} color="white"/>}
                        </TouchableOpacity>
                        <Text style={{textAlign:'center', alignSelf:'center', fontWeight:"bold", color:'#fff', fontSize:25, marginLeft:40}}>Realizar Post</Text>
                    </View>
                    {!isKeyboardVisible && !loading &&
                        <View style={{justifyContent:'center', alignItems:'center', marginTop:5}}>
                            <Image
                                style={styles.tinyLogo}
                                source={require('../../imagenes/postForo.jpg')}
                            />
                        </View>
                    }
            </View>
            {!loading && 
                <View style={[{backgroundColor:'#F0B27A', marginLeft:30, marginRight:30, marginTop:20, borderRadius:20, flex:1, borderBottomRightRadius:50, borderBottomLeftRadius:50, paddingLeft:'30%', paddingRight:'30%'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, marginTop:10 }}>
                        <View style={{marginTop:30, alignItems:'center', }}>
                            <View style={{width:'100%',  paddingLeft:40, paddingRight:40}}>
                                <View>
                                    <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Título</Text>
                                    <Controller
                                        control={control}
                                        rules={{
                                            required: true,
                                            minLength: 10,
                                            maxLength: 30
                                        }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder= "Título de la publicación"
                                                style={[styles.caja,{height:50},tamañoNormal ? null : {fontSize:18, padding:2}]} 
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                value={value}
                                            />
                                        )}
                                        name="titulo"
                                    />
                                    {errors.titulo && (errors.titulo.type == 'minLength' || errors.titulo.type == 'required') && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>El título es demasiado corto</Text>}
                                    {errors.titulo && errors.titulo.type == 'maxLength' && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>El título es demasiado largo</Text>}
                                </View>

                                <View>
                                    <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Descripción</Text>
                                    <Controller
                                        control={control}
                                        rules={{
                                            minLength: 50,
                                            maxLength:400,
                                            required: true
                                        }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder="Descripción"
                                                style={[styles.caja, tamañoNormal ? null : {fontSize:18}, {padding:10}]} 
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                value={value}
                                                multiline={true}
                                                numberOfLines={8}
                                            />
                                        )}
                                        name="informacion"
                                    />
                                    { errors.informacion && (errors.informacion.type == 'minLength' || errors.informacion.type == 'required') && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>La descripción es demasiado corta</Text>}
                                    { errors.informacion && errors.informacion.type == 'maxLength' && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>La descripción es demasiado larga</Text>}
                                </View>

                                <View style={{marginBottom:10}}>
                                    <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Seleccione el tema del Post</Text> 
                                        <Controller
                                            control={control}
                                            rules={{
                                                required: true,
                                            }}
                                            render={({ field: { onChange, onBlur, value } }) => (
                                                <SelectDropdown
                                                    data={temas}
                                                    onSelect={(selectedItem, index) => {onChange(selectedItem)}} //Onchange cambia el valor del campo en el form
                                                    onBlur={onBlur}
                                                    defaultButtonText= "Elegir Tema"
                                                    buttonStyle={styles.dropdown1BtnStyle}
                                                    buttonTextStyle={styles.buttonTextStyle}
                                                    dropdownIconPosition="right"
                                                    renderDropdownIcon={renderIcon}
                                                />
                                            )}
                                            name="tema"
                                        />
                                        {errors.tema && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>Este campo es requerido</Text>}
                                </View>

                                <View style={{justifyContent:'center', alignItems:'center', marginBottom:15}}>
                                    <TouchableOpacity style={{backgroundColor:'#3a99d8', padding:15, borderRadius:6}} onPress={handleSubmit( ()=>{
                                        setAlertaValidar(true);
                                    })}
                                    >
                                        <Text style={[{textAlign:'center', fontWeight:"bold", color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Continuar</Text>
                                    </TouchableOpacity>
                                </View>
                                <AwesomeAlert
                                    show={alertaExito}
                                    showProgress={false}
                                    title="¡Enhorabuena!"
                                    message="Su publicación ha sido realizada con éxito."
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
                                        goBack();
                                    }}
                                />
                                <AwesomeAlert
                                    show={alertaValidar}
                                    showProgress={false}
                                    title="¡Atención!"
                                    message="¿Estás seguro que los datos introducidos son correctos?"
                                    closeOnTouchOutside={true}
                                    closeOnHardwareBackPress={false}
                                    showCancelButton={true}
                                    showConfirmButton={true}
                                    cancelText="No"
                                    confirmText="Si"
                                    confirmButtonColor="#3a99d8"
                                    onCancelPressed={() => {
                                        setAlertaValidar(false);
                                    }}
                                    onConfirmPressed={() => {
                                        setAlertaValidar(false);
                                        subirDatos(getValues("nombre"), getValues("informacion"), getValues("tema"));
                                    }}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </View>
            }
        </View>
      )
};


const styles = StyleSheet.create({    
    errores:{
        color: 'red',
        bottom:10,
    },
    caja: {
        borderWidth: 1,
        width: '100%',
        textAlign: 'center',
        borderRadius: 5,
        borderColor: '#808080',
        marginBottom:10,
        marginTop:1,
        backgroundColor:'#fff',
    },
    fecha: {
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingLeft:2,
        paddingRight:2,
        flexDirection:"row",
        flexWrap: 'wrap',
        justifyContent:'center',
        marginBottom:10,
        borderColor: '#000',
        borderWidth:0.5,
        flexDirection:'row',
        alignItems:'center'
      },
    buttonMapa: {
        borderRadius: 20,
        padding: 10,
        top: 10,
        position: 'absolute',
        left: 20,
        height: 80,
    },
    centeredView: {
        flex: 0.8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
      },
    modalView: {
        flex: 0.7, 
        backgroundColor: '#fff',
        margin: 30,  
        borderRadius: 20,
        flexDirection: 'column',
        borderColor:'#fff',
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonClose: {
        backgroundColor: '#2196F3',
    },
    botonModal: {
        borderRadius: 20,
        width:25,
        height:25,
        justifyContent: 'flex-start',
        marginLeft:10,
    },
    tinyLogo: {
        height: 170,
        width: 180,
        marginBottom:120,
        marginLeft:20
    },
    dropdown1BtnStyle: {
        borderWidth: 1,
        borderRadius: 4,
        alignItems: 'center',
        backgroundColor:'#fff',
        height:40,
        borderRadius: 10,
        width:'100%',
        marginBottom:10
      },
    buttonTextStyle:{
        fontSize:17,
    }
    
})