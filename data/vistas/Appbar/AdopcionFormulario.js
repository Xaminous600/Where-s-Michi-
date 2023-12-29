import { Text, View, Button, Alert, StyleSheet, ScrollView,Image, Modal, Pressable, FlatList, ImageBackground, Easing ,Animated ,TouchableOpacity, Keyboard } from "react-native";
import React, { useState, useEffect, useRef } from 'react';
import { TextInput } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from "react-hook-form";
import {app} from "../../../database/firebase";
import { updateDoc, collection, getFirestore, doc, addDoc, getDoc, query, getDocs, where} from "firebase/firestore";
import { getStorage, uploadBytes, ref, getDownloadURL } from "firebase/storage";
import Constants from 'expo-constants';
import { MaterialIcons, Feather, AntDesign, MaterialCommunityIcons} from '@expo/vector-icons';
import Lottie from 'lottie-react-native';
import { getAuth } from "@firebase/auth";
import SelectDropdown from "react-native-select-dropdown";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AbandonadoFormBeta({navigation, navigation: { goBack }}) {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const imagenes = []; //No es un hook, no se coge el valor actualizado
    const [imagenesOfi, setImagenesOfi] = useState([]);
    const [date, setDate] = useState(null);
  
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const animationProgress = useRef(new Animated.Value(0));

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

    const provincias = ["Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Gerona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", "Lérida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Orense", "Palencia", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo","Valencia", "Valladolid","Vizcaya", "Zamora", "Zaragoza"];
    const animales = ["Perros", "Gatos", "Conejos", "Cobayas", "Pajaros"];

      const { control, handleSubmit, setValue, clearErrors, reset, getValues, formState: { errors } } = useForm({  //FormState booleano modificación
        defaultValues: {  //Valores a almacenar por el formulario
            zona: '',
            animal: '',
            informacion: '',
            fotos: imagenesOfi,
          }
      });

    function onChange(selected, opcion){
        if(opcion == 'Animal'){
            setAnimalOfi(selected);
            setValue('animal', selected);
        }
           
        else{
            setZonaOfi(selected);
            setValue('zona', selected);
        }  
    }

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
            ]
          );
          }
          }),
        [navigation]
    );
    
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function renderIcon(){
        return <AntDesign name="down" size={20} color="black" />;
    }

    async function subirDatos( zona, animal, informacion){
        if(getValues('fotos').length > 5)
            Alert.alert('¡Error!','Has adjuntado más de 5 fotos');
        else{
            const storage = getStorage(app, 'gs://tfg-56e1b.appspot.com');
            const newMetadata = {
            contentType: 'image/jpeg'
            };
    
            var i = 0;
            var imagenesBaseDatos = [];
    
            while(i<imagenesOfi.length){
            const img = await fetch(imagenesOfi[i]);
            const bytes = await img.blob();
    
            const filename = imagenesOfi[i].substring(imagenesOfi[i].lastIndexOf('/')+1);
            const storageRef = ref(storage, 'adopcion/'+filename);
                        
            await uploadBytes(storageRef, bytes, newMetadata);
            await getDownloadURL(storageRef).then((url) => {
                imagenesBaseDatos[i] = url;
            })
            i++;
            } 
          
            setLoading(true);
            const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
            const datosConsultaUsuario = await getDocs(consultaUsuario);

            const docRef = await addDoc(collection(getFirestore(app),'Adopcion'), {Animales:animal, Zona: zona, Fotos: imagenesBaseDatos, Informacion: informacion, Id_Usuario: getAuth(app).currentUser.uid, Reportes: []});
            addDoc(collection(getFirestore(app),'Publicaciones'), {Fecha:new Date(), Publicacion:docRef, Tipo:'Adopcion', Reportes: [], Usuario:datosConsultaUsuario.docs[0].ref}); 
            reset();

            await sleep(8000);
            setLoading(false);
            Alert.alert("¡Enhorabuena!","Su publicación se ha guardado con éxito.");
         
            setValue('informacion', '');
            setValue('zona', '');
            setValue('animal', '');
            setImagenesOfi([]);
        }
    }

    useEffect(() => {
        Animated.timing(animationProgress.current, {
            toValue: 1,
            duration: 5000,
            easing: Easing.linear,
            useNativeDriver: false
          }).start();
    }, []);

    useEffect(()=>{
        setValue('fecha', date);
        clearErrors('fecha');
    }, [date]);
    
    useEffect(()=>{
        setValue('fotos', imagenesOfi);
        clearErrors('fotos');
    }, [imagenesOfi]);
      
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
                <Text style={{textAlign:'center', alignSelf:'center', fontWeight:"bold", color:'#fff', fontSize:25, marginLeft:40}}>Dar en Adopción</Text>
            </View>
            {!isKeyboardVisible && !loading &&
                <View style={{justifyContent:'center', alignItems:'center', marginTop:5}}>
                    <Image
                        style={styles.tinyLogo}
                        source={require('../../imagenes/animalAbandonadoForm.png')}
                    />
                </View>
            }
        </View>
        
        {!loading && 
        <View style={[{backgroundColor:'#F0B27A', marginLeft:30, marginRight:30, marginTop:20, marginBottom:5, borderRadius:20, flex:1}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{/*justifyContent:'center',*/ alignItems:'center', }}>
                    <View style={{width:'100%',  paddingLeft:40, paddingRight:40, marginTop:30}}>
                        <View style={{marginBottom:10}}>
                            <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null: {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Seleccione el lugar</Text> 
                            <Controller
                                control={control}
                                rules={{
                                    required: true,
                                }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <SelectDropdown
                                        data={provincias}
                                        onSelect={(selectedItem, index) => {onChange(selectedItem, 'Lugar')}} //Onchange cambia el valor del campo en el form
                                        onBlur={onBlur}
                                        defaultButtonText= {getValues('zona') ? getValues('zona') : 'Zona'}
                                        buttonStyle={styles.dropdown1BtnStyle}
                                        buttonTextStyle={styles.buttonTextStyle}
                                        dropdownIconPosition="right"
                                        renderDropdownIcon={renderIcon}
                                    />
                                )}
                                name="zona"
                            />
                            {errors.zona && <Text style={[styles.errores, , tamañoNormal ? null : {fontSize:19}]}>Este campo es requerido</Text>}
                        </View>
                        
                        <View style={{marginBottom:5, flex:1, width:'100%'}}>
                            <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null: {color:'#fff'}, , tamañoNormal ? null : {fontSize:22}]}>Indique el animal del que se trata</Text> 
                            <Controller
                                control={control}
                                rules={{
                                    required: true,
                                }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <SelectDropdown
                                        data={animales}
                                        onSelect={(selectedItem, index) => {onChange(selectedItem, 'Animal')}} //Onchange cambia el valor del campo en el form
                                        onBlur={onBlur}
                                        defaultButtonText= {getValues('animal') ? getValues('animal') : 'Animales'}
                                        buttonStyle={styles.dropdown1BtnStyle}
                                        dropdownIconPosition="right"
                                        renderDropdownIcon={renderIcon}
                                    />
                                )}
                                name="animal"
                            />
                            {errors.animal && <Text style={[styles.errores, , tamañoNormal ? null : {fontSize:19}]}>Este campo es requerido</Text>}
                        </View>

                        <View>
                            <View style={{flexDirection:'row', justifyContent:'space-between', marginLeft:1}}>
                                <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null: {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Adjunte fotos del animal</Text> 
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
                            <Text style={[{fontWeight:"bold", fontSize:16}, modoNocturno ? null: {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>Información adicional</Text>
                            <Controller
                                control={control}
                                rules={{
                                    minLength: 50,
                                    maxLength:400,
                                    required: true
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
                            { errors.informacion && (errors.informacion.type == 'minLength' || errors.informacion.type == 'required') && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>La descripción es demasiado corta</Text>}
                            { errors.informacion && errors.informacion.type == 'maxLength' && <Text style={[styles.errores, tamañoNormal ? null : {fontSize:19}]}>La descripción es demasiado larga</Text>}
                        </View>
                        
                        <View style={{justifyContent:'center', alignItems:'center', marginBottom:15}}>
                            <TouchableOpacity style={{backgroundColor:'#3a99d8', padding:15, borderRadius:6}} onPress={handleSubmit( ()=>{
                                Alert.alert('¡Atención!', '¿Estás seguro que los datos introducidos son correctos?', [
                                    {
                                    text: 'No',
                                    style: 'cancel',
                                    },
                                    {text: 'Si', onPress: () =>  subirDatos(getValues("zona"), getValues("animal"), getValues("informacion"))}
                                ])
                            })}>
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
        width: '40%',
        height: '75%',
        marginBottom:100,
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
});