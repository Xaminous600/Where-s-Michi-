import { StyleSheet, Text, View, ScrollView, Pressable, Animated, TouchableOpacity, TextInput, Alert, Image, Modal, FlatList, Keyboard, ImageBackground} from 'react-native';
import Constants from 'expo-constants';
import { Feather, MaterialIcons, Fontisto, AntDesign, MaterialCommunityIcons} from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import {getFirestore, doc, updateDoc} from "firebase/firestore";
import {app} from "../../../database/firebase";
import {getAuth} from 'firebase/auth';
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, {Marker} from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, uploadBytes,ref, getDownloadURL, deleteObject,} from "firebase/storage";
import Lottie from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

//Componente encargado de realizar el proceso de edición de la información de una publicación sobre una mascota perdida
export default function EditarPublicacionPerdido({route, navigation, navigation: { goBack }}){
    const [date, setDate] = useState(new Date(route.params.item["Fecha"]["seconds"] * 1000 + route.params.item["Fecha"]["nanoseconds"]/1000000));
    const imagenes = []; //No es un hook, no se coge el valor actualizado
    const [imagenesOfi, setImagenesOfi] = useState(route.params.item['Fotos']);
    const [imagenesOfiNo, setImagenesOfiNo] = useState([]);
    const [show, setShow] = useState(false);
    const [mapa, setMapa] = useState(false);
    const [button, setButton] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [region, setRegion] = useState(route.params.item['Coordenadas']);
    const [animacion, setAnimacion] = useState(false);
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

    var meses = [
        "enero", "febrero", "marzo",
        "abril", "mayo", "junio", "julio",
        "agosto", "septiembre", "octubre",
        "noviembre", "diciembre"
    ];

    const { control, handleSubmit, setValue, clearErrors, reset, getValues, formState: { errors } } = useForm({  //FormState booleano modificación
        defaultValues: {  //Valores a almacenar por el formulario
          nombre: route.params.item['Nombre'],
          fecha: date,
          ubicacion: route.params.item['Coordenadas'],
          informacion: route.params.item['Informacion'],
          fotos: imagenesOfi,
        }
    });

    //Hook encargado de inicializar la variable ImagenesOfiNo
    useEffect(()=> {
        setImagenesOfiNo({...imagenesOfi});
    },[]);

    //Función encargada de añadir un retardo
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //Función encargada de comprobar si se ha realizado alguna modificación
    function noModificacion(){
        if(getValues('nombre') == route.params.item['Nombre'] && getValues('fecha').getTime() === date.getTime() && getValues('informacion') == route.params.item['Informacion'] && JSON.stringify(getValues('ubicacion')) == JSON.stringify(route.params.item['Coordenadas']) && JSON.stringify(imagenesOfiNo) == JSON.stringify({...imagenesOfi}))
            return true;

        else 
            return false;  
    }

    //Función encargada de procesar los datos
    //Parámetros: nombre de la mascota, información, fecha de desaparición y la ubicación exacta
    async function subirDatos(nombre, info, fecha, coordenadas){
        if(noModificacion())
            Alert.alert('','No se ha realizado ninguna modificación');
        else{
            const storage = getStorage(app, 'gs://tfg-56e1b.appspot.com');
            const newMetadata = {
            contentType: 'image/jpeg'
            };
            
            var i = 0;
                
            var imagenesSubir = imagenesOfi.filter((element) => !Object.values(imagenesOfiNo).includes(element));
            var imagenesEliminar = Object.values(imagenesOfiNo).filter((element) => !imagenesOfi.includes(element));
            var imagenesBaseDatos = Object.values(imagenesOfiNo);

            while(i<imagenesSubir.length){
            const promises = [];
            const img = await fetch(imagenesSubir[i]);
            const bytes = await img.blob();
    
            const filename = imagenesSubir[i].substring(imagenesSubir[i].lastIndexOf('/')+1);
            const storageRef = ref(storage, 'images/'+filename);
        
            await uploadBytes(storageRef, bytes, newMetadata);
            
            await getDownloadURL(storageRef).then((url) => {
                imagenesBaseDatos.push(url);
            })
            
            i++;
            }

            i=0;

            while(i<imagenesEliminar.length){
                const storageRef = ref(storage, imagenesEliminar[i]);
                imagenesBaseDatos = imagenesBaseDatos.filter((element) => element !== imagenesEliminar[i]);
                await deleteObject(storageRef);
            
                i++;
            }
            
            setAnimacion(true);
            setLoading(true);
        
            updateDoc(doc(getFirestore(app), "Perdidos", route.params.idDoc), {Nombre:nombre, Informacion: info, Fotos: imagenesBaseDatos, Fecha: fecha, Coordenadas: coordenadas, Id_Usuario: getAuth(app).currentUser.uid});
            await sleep(8000);
            setAnimacion(false);
            setLoading(false);
            Alert.alert("¡Enhorabuena!","Su publicación ha sido modificada con éxito.");
            goBack();
        }
    }

    //Función encargada de escoger una foto de la galería
    async function elegirfoto(){
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          aspect: [4, 3],
          quality: 1,
          allowsMultipleSelection: true,
          saveToPhotos:true,
        });      
        
        if(result.assets != null){
          result.assets.forEach(function (item, index) {
            imagenes.push(result.assets[index].uri);
          });
        }
  
        setImagenesOfi(imagenesOfi.concat(imagenes));
    }

    //Función encargada de ubicar el marker dentro del mapa
    function marcador(event){
        setRegion({...region, latitude:event.nativeEvent.coordinate.latitude, 
                              longitude:event.nativeEvent.coordinate.longitude,
                              latitudeDelta: 0,
                              longitudeDelta: 0,});
        if(errors.ubicacion) 
            clearErrors('ubicacion');
    }

    function onChange(event, selectedDate){
        setShow(Platform.OS === 'ios');
        setDate(selectedDate);
    }

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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

    
    return(
        <View style={{flex:1, marginTop:Constants.statusBarHeight}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground> 

            <View style={[{flex:0.32, backgroundColor: '#F0B27A', borderBottomLeftRadius:170}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <View style={{flexDirection:'row', marginLeft:15, marginTop:5}}>
                    <TouchableOpacity onPress={()=>{goBack()}}>
                        {modoNocturno ? <MaterialCommunityIcons name="keyboard-backspace" size={50} color="black"/> : <MaterialCommunityIcons name="keyboard-backspace" size={50} color="white"/>}
                    </TouchableOpacity>
                    <Text style={{textAlign:'center', alignSelf:'center', fontWeight:"bold", color:'#fff', fontSize:25, marginLeft:40}}>Editar Publicacion</Text>
                </View>

                {!isKeyboardVisible && !loading &&
                    <View style={{justifyContent:'center', alignItems:'center'}}>
                        <Image
                            style={styles.tinyLogo}
                            source={require('../../imagenes/editarPublicacion.png')}
                        />
                    </View>
                }
            </View>

            {!loading && 
                <View style={[{backgroundColor:'#F0B27A', marginLeft:30, marginRight:30, marginTop:20, marginBottom:5, borderRadius:20, flex:0.85}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
                        <View style={{alignItems:'center', marginTop:30 }}>
                            <View style={{width:'100%',  paddingLeft:40, paddingRight:40}}>
                                {route.params.item['Mascota'] &&<View>
                                    <Text style={[{fontWeight:"bold"}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Nombre de la mascota</Text>
                                    <Controller
                                        control={control}
                                        rules={{
                                            required: true,
                                            minLength:3,
                                            maxLength:15,
                                        }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder= {route.params.item["Nombre"]}
                                                style={[styles.caja, tamañoNormal ? null : {fontSize:18, padding:2}]} 
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                value={value}
                                            />
                                        )}
                                        name="nombre"
                                    />
                                     {errors.nombre && errors.nombre.type == 'required' &&<Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>Este campo es requerido</Text>}
                                     {errors.nombre &&  errors.nombre.type == 'minLength' && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>El nombre es demasiado corto</Text>}
                                     {errors.nombre && errors.nombre.type == 'maxLength' && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>El nombre es demasiado largo</Text>}
                                </View>
                                }

                                <View>
                                    <Text style={[{fontWeight:"bold"}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:20}]}>Fecha de la desaparición</Text>
                                    <Controller
                                        control={control}
                                        rules={{
                                            required: true,
                                            min: 3,
                                        }}
                                        render={({ field: { onChange, onBlur, value }}) => (
                                            <View>
                                                <TouchableOpacity  onPress={() => {setShow(true); setValue("fecha", date);}}>
                                                    <View style={styles.fecha}>
                                                        <MaterialIcons name="date-range" size={20} color="grey" />
                                                        {!date && <Text style={{fontSize:15, textAlign:'center', padding:5, width:180, fontWeight:"300", color:'grey'}}>Fecha desaparición</Text> }
                                                        {date && <Text style={[{fontSize:15, textAlign:'center', padding:5, width:180, fontWeight:"400", color:'black'}, tamañoNormal ? null : {fontSize:18}]}>{date.getDate() + ' de ' + meses[date.getMonth()] + ' de ' + date.getFullYear()}</Text>}
                                                    </View> 
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        name="fecha"
                                    />
                                    {errors.fecha && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>Este campo es requerido</Text>}

                                    {show &&
                                        <DateTimePicker
                                            testID='dateTimePicker'
                                            value={date? date : new Date()}
                                            mode={'date'}
                                            is24Hour={true}
                                            display='default'
                                            onChange={onChange}
                                            maximumDate={new Date()}
                                        />
                                    }
                                </View>
                
                                <View>
                                    <Text style={[{fontWeight:"bold"}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:19}]}>Última vez vista</Text>
                                    <Controller
                                        control={control}
                                        rules={{
                                            required: true,
                                        }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <View>
                                                <TouchableOpacity onPress={() => {Alert.alert('¡Atención!', "Para guardar la ubicación cliquee en el botón: 'Guardar y Salir'"); setMapa(true); setButton(true); setValue("ubicacion", region);}}>
                                                    <View style={styles.fecha}>
                                                        <MaterialIcons name="place" size={20} color="grey" />
                                                        {!getValues('ubicacion') && <Text style={{fontSize:15, textAlign:'center', padding:5, width:180, fontWeight:"300", color:'grey'}}>Ubicacion</Text>}
                                                        {getValues('ubicacion') && <Text style={[{fontSize:15, textAlign:'center', padding:5, width:180, fontWeight:"300", color:'grey'}, tamañoNormal ? null : {fontSize:18}]}>Ubicacion seleccionada</Text>} 
                                                    </View> 
                                                </TouchableOpacity>
                                            </View>
                                    )}
                                    name="ubicacion"    
                                    />
                                    {errors.ubicacion && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>Este campo es requerido</Text>}
                                </View>
                
                                <View>
                                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                                        <Text style={[{fontWeight:"bold"}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Adjunte fotos de su mascota</Text> 
                                        {imagenesOfi.length != 0 && 
                                            <TouchableOpacity onPress = {() => {setModalVisible(!modalVisible)}}>
                                                {modoNocturno ? <Feather name="edit" size={20} color="black" /> : <Feather name="edit" size={20} color="white"/>}
                                            </TouchableOpacity>
                                        }
                                    </View>
                            
                                    <Controller
                                        control={control}
                                        rules={{
                                            required: true,
                                        }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TouchableOpacity onPress = {() => { elegirfoto()}}  >
                                                <View style={styles.fecha}>
                                                    <MaterialIcons name="photo" size={20} color="grey" />
                                                    <Text style={[{fontSize:15, textAlign:'center', padding:5, width:180, fontWeight:"300", color:'grey'}, tamañoNormal ? null : {fontSize:18}]}>Fotos</Text>
                                                </View> 
                                            </TouchableOpacity>
                                        )}
                                        name="fotos"
                                    />
                                    {errors.fotos && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>Introduzca al menos una foto</Text>}
                                </View>

                                <View>
                                    <Text style={[{fontWeight:"bold"}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Información adicional</Text>
                                    <Controller
                                        control={control}
                                        rules={{
                                            required: true,
                                            minLength: 50,
                                            maxLength:400
                                        }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder="Información adicional"
                                                style={[styles.caja, tamañoNormal ? null : {fontSize:18}, {padding:10}]} 
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                value={value}
                                                multiline={true}
                                                numberOfLines={4}
                                            />
                                        )}
                                        name="informacion"
                                    />
                                    {errors.informacion && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>Este campo es requerido</Text>}
                                </View>
                
                                <View style={{justifyContent:'center', alignItems:'center', marginBottom:15}}>
                                    <TouchableOpacity style={{backgroundColor:'#3a99d8', padding:15, borderRadius:6}} onPress={handleSubmit( ()=>{
                                        Alert.alert('¡Atención!', '¿Estás seguro que los datos introducidos son correctos?', [
                                            {
                                            text: 'No',
                                            style: 'cancel',
                                            },
                                            {text: 'Si', onPress: () =>  subirDatos(getValues("nombre"), getValues("informacion"), getValues("fecha"), getValues("ubicacion"))},
                                        ])
                                    })}
                                    >
                                        <Text style={[{textAlign:'center', fontWeight:"bold", color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Continuar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            }

            {loading && 
                <View style={{justifyContent:'center', alignItems:'center', width:'100%', height:'50%', backgroundColor:'#fff', marginTop:'30%', borderRadius:80}}>
                    <Text style={{position:'absolute', top:0, marginTop:30, fontWeight:"700", fontSize:20}}>Espere unos segundos...</Text>
                    <Lottie
                        source={require('../../animaciones/perroCaminando.json')}
                        autoPlay loop
                        style={{alignSelf:'center'}}
                    /> 
                </View>
            }

            {mapa && <MapView
                    style={{width: '100%', height: '100%', position:'absolute', flex:1, }}
                    zoomEnabled={true}
                    onPress = {(event)=> marcador(event)}
                    initialRegion={region}
                    minZoomLevel={0}  // default => 0
                    maxZoomLevel={20} // default => 20
                >
                        <Marker
                            coordinate={{ latitude: region.latitude, longitude: region.longitude}}
                            title="Aquí ví por última vez a mí mascota"
                            description='Se establecerá un radio de desaparición'>
                                <Image source={require('../../imagenes/marker.png')} style={{height: 35, width:35 }} />
                        </Marker>
                 </MapView> 
            }
            
            {button && 
                <TouchableOpacity onPress={() => {setMapa(false); setButton(false); Alert.alert(' ', 'Ubicación guardada con éxito')}}>
                    <View style={{justifyContent:'center', alignItems:'center', marginBottom:80}}>
                        <Text style={{fontSize:20, backgroundColor:'#1AA2F1', padding:20, borderRadius:40, color:'white', fontWeight:'bold'}}>Guardar y Salir</Text>
                    </View>
                </TouchableOpacity>
            }

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <TouchableOpacity style={{flex:1}} onPress={() => {setModalVisible(!modalVisible)}}>
                        <View style={styles.modalView}>
                            <View style={{flexDirection:'row', alignItems:'center', marginTop:20}}>
                                <View style={{height:25, marginLeft:10, marginRight:10, marginBottom:0}}>
                                    <Pressable
                                        style={[styles.botonModal]}
                                        onPress={() => setModalVisible(!modalVisible)}>
                                            <AntDesign name="closecircle" size={24} color="black" />
                                    </Pressable>
                                </View>
                                <Text style={{fontWeight:"bold", fontSize:20, textAlign:'center', marginLeft:20}}>Borrar imágenes</Text>
                            </View>
                            <FlatList
                                horizontal={true} 
                                showsHorizontalScrollIndicator={true} 
                                data={imagenesOfi}
                                contentContainerStyle={{justifyContent:'center', alignItems:'center'}}
                                renderItem={ ({ item, index }) => (
                                <TouchableOpacity onPress={() => Alert.alert('Atención', '¿Deseas borrar la imagen?', [
                                    {
                                    text: 'No',
                                    style: 'cancel',
                                    },
                                    {text: 'Si', onPress: () => imagenesOfi.splice(index,1)},
                                ])}
                                >    
                                    <Image source={{uri:item}} 
                                        key={index}      
                                        style={{
                                            width:260,
                                            height:260,
                                            margin:8,
                                            aspectRatio:1,
                                        }}
                                    />
                                </TouchableOpacity>
                                )}
                            />
                        </View>
                
                </TouchableOpacity>
            </Modal>

        </View>
    );
}

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
        width: '40%',
        height: '75%',
    },
})