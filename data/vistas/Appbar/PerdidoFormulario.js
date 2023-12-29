import { Text, View, Button, Alert, StyleSheet, ScrollView,Image, Modal, Pressable, FlatList, ImageBackground, Easing ,Animated ,TouchableOpacity, Keyboard } from "react-native";
import React, { useState, useEffect, useRef } from 'react';
import { TextInput } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, {Marker} from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from "react-hook-form";
import Icon from 'react-native-vector-icons/FontAwesome';
import {app} from "../../../database/firebase";
import { updateDoc, collection, getFirestore, doc, addDoc, getDoc, query, getDocs, where} from "firebase/firestore";
import { getStorage, uploadBytes,ref, getDownloadURL } from "firebase/storage";
import Constants from 'expo-constants';
import { MaterialIcons, Feather, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Lottie from 'lottie-react-native';
import { getAuth } from "@firebase/auth";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PerdidoFormBeta({navigation, navigation: { goBack }}) {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [pantallaPregunta, setPantallaPregunta] = useState(true);
    const imagenes = []; //No es un hook, no se coge el valor actualizado
    const [imagenesOfi, setImagenesOfi] = useState([]);
    const [date, setDate] = useState(null);
    const [region, setRegion] = useState({
        latitude: 40.416775,
        longitude: -3.703790,
        latitudeDelta: 0,
        longitudeDelta: 0
      });
    const [show, setShow] = useState(false);
    const [mapa, setMapa] = useState(false);
    const [button, setButton] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [animacion, setAnimacion] = useState(false);
    const [loading, setLoading] = useState(false);
    const animationProgress = useRef(new Animated.Value(0));
    const [mascota, setMascota] = useState(null);
    
    const auth = getAuth(app);
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
          nombre: '',
          fecha: date,
          ubicacion: '',
          informacion: '',
          fotos: imagenesOfi,
        }
    });

    function onChange(event, selectedDate){
        setShow(Platform.OS === 'ios');
        setDate(selectedDate);
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function subirDatos(nombre, info, fecha, coordenadas){
        if(getValues('fotos').length > 5)
            Alert.alert('¡Error!','Has adjuntado más de 5 fotos');
        else{
            coordenadas.latitudeDelta = 0;
            coordenadas.longitudeDelta = 0;
            
            const storage = getStorage(app, 'gs://tfg-56e1b.appspot.com');
            const newMetadata = {
            contentType: 'image/jpeg'
            };
    
            var i = 0;
            var imagenesBaseDatos = [];
    
            while(i<imagenesOfi.length){
            const promises = [];
            const img = await fetch(imagenesOfi[i]);
            const bytes = await img.blob();
    
            const filename = imagenesOfi[i].substring(imagenesOfi[i].lastIndexOf('/')+1);
            const storageRef = ref(storage, 'images/'+filename);
                        
            await uploadBytes(storageRef, bytes, newMetadata);
            await getDownloadURL(storageRef).then((url) => {
                imagenesBaseDatos[i] = url;
            })
            
            i++;
            } 
            setAnimacion(true);
            setLoading(true);
            const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
            const datosConsultaUsuario = await getDocs(consultaUsuario);

            const docRef =  await addDoc(collection(getFirestore(app),'Perdidos'), {Nombre:nombre, Informacion: info, Fotos: imagenesBaseDatos, Fecha: fecha, Coordenadas: coordenadas, Id_Usuario: getAuth(app).currentUser.uid, Mascota:mascota});
            addDoc(collection(getFirestore(app),'Publicaciones'), {Fecha:new Date(), Publicacion:docRef, Tipo:'Perdidos', Reportes: [], Usuario:datosConsultaUsuario.docs[0].ref}); 
            await sleep(8000);
            setAnimacion(false);
            setLoading(false);
            Alert.alert("¡Enhorabuena!","Su publicación se ha guardado con éxito.");
            reset();
            setValue('nombre', '');
            setValue('informacion', '');
            setImagenesOfi([]);
            setDate(null);
        }
      }
    
    React.useEffect(
        () =>
          navigation.addListener('beforeRemove', (e) => {
            const action = e.data.action;
    
            e.preventDefault();           
            
            if(!getValues('animal') && getValues('fotos').length==0 && !getValues('informacion') && !getValues('zona'))
                navigation.dispatch(action);

            else{
              Alert.alert('¡Espera, vas a salir!','Perderás toda la información introducida en el formulario', [
                { 
                  text: "Cancelar", 
                  style: 'cancel', 
                  onPress: () => null 
                },
                {
                  text: 'Aceptar',
                  style: 'destructive',
                  onPress: () => navigation.dispatch(action),
                },
              ]);
            }
          }),
        [navigation]
    );

    useEffect(() => {
        Animated.timing(animationProgress.current, {
            toValue: 1,
            duration: 5000,
            easing: Easing.linear,
            useNativeDriver: false
          }).start();

        (async () => {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setErrorMsg('El permiso fue denegado');
            var region = {
                latitude: 40.416775,
                longitude: -3.703790,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421
              };    
            setRegion(region);
            return;
          }
          else{
            let location = await Location.getCurrentPositionAsync({});
            
            var region = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421
            };

            setRegion(region);
          }
      })();
    }, []);

    useEffect(()=>{
        setValue('fecha', date);
        clearErrors('fecha');
    }, [date]);
    
    useEffect(()=>{
        setValue('fotos', imagenesOfi);
        clearErrors('fotos');
    }, [imagenesOfi]);

    function marcador(event){
        setValue('ubicacion',{latitude:event.nativeEvent.coordinate.latitude, 
                              longitude:event.nativeEvent.coordinate.longitude,
                              latitudeDelta: event.nativeEvent.coordinate.latitudeDelta,
                              longitudeDelta: event.nativeEvent.coordinate.longitudeDelta})
        setRegion({latitude:event.nativeEvent.coordinate.latitude, 
                              longitude:event.nativeEvent.coordinate.longitude,
                              latitudeDelta: 0,
                              longitudeDelta:0,});
        
        if(errors.ubicacion) 
            clearErrors('ubicacion');
    }

    return(
    <View style={{flex:1, }}>
        <ImageBackground
            source={modoNocturno ? require('../../imagenes/formularios.jpg') : require('../../imagenes/fondoNocturno.jpg')}
            resizeMode={'cover'}
            style={{flex:1, position:'absolute', width: '100%', height:'100%',marginTop: Constants.statusBarHeight}}>
        </ImageBackground>

        <View style={[{flex:0.32, backgroundColor: '#F0B27A', borderBottomLeftRadius:170, marginTop: Constants.statusBarHeight}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
            <View style={{flexDirection:'row', marginLeft:15, marginTop: 5}}>
                <TouchableOpacity onPress={()=>{goBack()}}>
                    {modoNocturno ? <MaterialCommunityIcons name="keyboard-backspace" size={50} color="black"/> : <MaterialCommunityIcons name="keyboard-backspace" size={50} color="white"/>}
                </TouchableOpacity>
                <Text style={{textAlign:'center', alignSelf:'center', fontWeight:"bold", color:'#fff', fontSize:25, marginLeft:40}}>Mascota Perdida</Text>
                </View>
                    {!isKeyboardVisible && !loading &&
                        <View style={{justifyContent:'center', alignItems:'center', marginTop:5, }}>
                             <Image
                                style={styles.tinyLogo}
                                source={require('../../imagenes/animalPerdidoForm.png')}
                            />
                        </View>
                    }
                </View>
        {pantallaPregunta && 
         <View style={{flex:0.8, padding:5,}}>
            <LinearGradient  
                colors={modoNocturno ? ['#f6d1af','#F0B27A'] : ['#323639','#323639']} 
                style={{flex:1, borderRadius:40}}
            >
                <View style={{alignItems:'flex-end', marginRight:20, marginTop:50}}>
                    <Text style={[{textAlign:'center', width:'auto' ,color:'#101010', fontSize:35}, modoNocturno ? null : {color:'#fff'}]}>Antes de continuar...</Text>
                    <Text style={[{marginLeft:10, marginRight:10, marginTop:30 ,color: '#101010', fontSize:20}, modoNocturno ? null : {color:'#fff'}]}>¿La publicación va dirigida a tu mascota o a un animal encontrado en supuesto estado de desaparición?</Text>
                </View>
        
                <View style={{justifyContent:'center', alignItems:'center', marginBottom:15, flexDirection:'row', marginTop:10,}}>
                    <TouchableOpacity onPress={() =>{setPantallaPregunta(!pantallaPregunta); setMascota(true)}} style={{backgroundColor:'#3a99d8', padding:10, borderRadius:6, width:115}}>
                        <Text style={{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}}>Mi mascota</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() =>{setPantallaPregunta(!pantallaPregunta); setMascota(false); setValue('nombre', 'encontrado')}} style={{backgroundColor:'#3a99d8', padding:10, borderRadius:6, width:105, marginLeft:10, marginRight:10}}>
                        <Text style={{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}}>Animal encontrado</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
        }
        {!loading && !pantallaPregunta &&
        <View style={[{backgroundColor:'#F0B27A', marginLeft:30, marginRight:30, marginTop:20, marginBottom:5, borderRadius:20, flex:1}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <View style={{alignItems:'center', }}>
                    <View style={{width:'100%',  paddingLeft:40, paddingRight:40, marginTop:30}}>
                        <ScrollView>
                            {mascota && <View>
                                <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Nombre de la mascota</Text>
                                <Controller
                                    control={control}
                                    rules={{
                                        required: true,
                                        minLength: 3,
                                        maxLength: 15,
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder="Nombre de la mascota"
                                            style={[styles.caja, tamañoNormal ? null : {fontSize:18}, {padding:2}]} 
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    )}
                                    name="nombre"
                                />
                                {errors.nombre && errors.nombre.type == 'required' &&<Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>Este campo es requerido</Text>}
                                { errors.nombre &&  errors.nombre.type == 'minLength' && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>El nombre es demasiado corto</Text>}
                                { errors.nombre && errors.nombre.type == 'maxLength' && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>El nombre es demasiado largo</Text>}
                            </View>
                            }
                            <View>
                                {mascota && <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:20}]}>Fecha de la desaparición</Text>}
                                {!mascota && <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:20}]}>Fecha en la que fue encontrada</Text>}
                                <Controller
                                    control={control}
                                    rules={{
                                        required: true,
                                    }}
                                    render={({ field: { onChange, onBlur, value }}) => (
                                        <View>
                                            <TouchableOpacity  onPress={() => {setShow(true); setValue("fecha", date);}}>
                                                <View style={styles.fecha}>
                                                    <MaterialIcons name="date-range" size={20} color="grey" />
                                                    {!date && <Text style={[{fontSize:15, textAlign:'center', padding:5, width:180, fontWeight:"300", color:'grey'}, tamañoNormal ? null : {fontSize:18}]}>Fecha desaparición</Text> }
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
                                <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Última vez vista</Text>
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
                                                    {!getValues('ubicacion') && <Text style={[{fontSize:15, textAlign:'center', padding:5, width:180, fontWeight:"300", color:'grey'}, tamañoNormal ? null : {fontSize:18}]}>Ubicación</Text>}
                                                    {getValues('ubicacion') && <Text style={[{fontSize:15, textAlign:'center', padding:5, width:180, fontWeight:"400", color:'grey'}, tamañoNormal ? null : {fontSize:18}]}>Ubicación seleccionada</Text>}
                                                </View> 
                                            </TouchableOpacity>
                                        </View>
                                )}
                                name="ubicacion"    
                                />
                                {errors.ubicacion && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>Este campo es requerido</Text>}
                            </View>
                            
                            <View>
                                <View style={{flexDirection:'row', justifyContent:'space-between', marginLeft:1}}>
                                    {mascota && <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Adjunte fotos de su mascota</Text>}
                                    {!mascota && <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Adjunte fotos del animal</Text>}
                                    {imagenesOfi.length != 0 && 
                                        <TouchableOpacity onPress = {() => {setModalVisible(!modalVisible)}}>
                                            <Feather name="edit" size={20} color={modoNocturno ? "black" : "white"}/>
                                        </TouchableOpacity>
                                    }
                                </View>
                                
                                <Controller
                                    control={control}
                                    rules={{
                                        required: true,
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TouchableOpacity 
                                            onPress = {() => { Alert.alert('¡Atención!', 'Solamente puedes adjuntar un máximo de 5 fotos', [
                                           
                                            {text: 'Continuar', onPress: () => elegirfoto()},
                                            ])}}  
                                        >
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
                                <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Información adicional</Text>
                                <Controller
                                    control={control}
                                    rules={{
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
                                { errors.informacion && errors.informacion.type == 'minLength' && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>La descripción es demasiado corta</Text>}
                                { errors.informacion && errors.informacion.type == 'maxLength' && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>La descripción es demasiado larga</Text>}
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
                        </ScrollView>
                    </View>
                </View>
        </View>
        }
        
        {loading && 
            <View style={{justifyContent:'center', alignItems:'center', width:'100%', height:'50%', backgroundColor:'#fff', marginTop:'30%', borderRadius:80}}>
                <Text style={{position:'absolute', top:0, marginTop:30, fontWeight:"700", fontSize:20}}>Espere unos segundos...</Text>
                <Lottie
                    source={require('../../animaciones/loading.json')}
                    autoPlay loop
                    style={{alignSelf:'center', height:250}}
                /> 
            </View>
        }

        {mapa && <MapView
                    style={{width: '100%', height: '100%', position:'absolute', marginTop:Constants.statusBarHeight}}
                    zoomEnabled={true}
                    onPress = {(event)=> {marcador(event)}}
                    initialRegion={region}
                    minZoomLevel={0}  // default => 0
                    maxZoomLevel={20} // default => 20
                >
                    <Marker
                        coordinate={{latitude: region.latitude, longitude: region.longitude}}
                        title="Aquí ví por última vez a mí mascota"
                        description='Se establecerá un radio de desaparición'
                    >
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
           }}>
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
        width: '45%',
        height: '60%',
        marginBottom:100,
    },
});