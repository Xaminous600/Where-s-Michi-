import { StyleSheet, Text, View, Dimensions, ImageBackground, Pressable, Image, FlatList, BackHandler, Keyboard, Platform} from 'react-native';
import { Ionicons, AntDesign, Entypo} from '@expo/vector-icons';
import { TextInput } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import React, { useEffect, useState, useRef } from 'react';
import { doc, getDocs, getFirestore, query, collection, where, updateDoc, arrayUnion, onSnapshot} from 'firebase/firestore';
import {app} from "../../../database/firebase";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatPrivado({route,  navigation, navigation: { goBack}}){
    const [usuarioDest, setUsuarioDest] = useState([]);
    const [sala, setSala] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [idDoc1, setIdDoc1] = useState("");
    const [idDoc2, setIdDoc2] = useState("");
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const [modoNocturno, setModoNocturno] = useState(null);
    const [tamañoNormal, setTamañoNormal] = useState(null);

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

    BackHandler.addEventListener('hardwareBackPress', function () {
        actualizarEstado();
    });
    
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
          setKeyboardOpen(true);
        });
    
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
          setKeyboardOpen(false);
        });
    
        return () => {
          keyboardDidShowListener.remove();
          keyboardDidHideListener.remove();
        };
      }, []);

    useEffect(()=> {
        (async () =>{ //Es necesario obtener las Ids de los documentos a actualizar
            setSala(await route.params.Sala); //IMPORTANTE: **AWAIT**
        
            const consultaDest= query(collection(getFirestore(app),'Usuarios'), where("Id", "==", route.params.Sala["Id_Usuario2"]));
            const datosConsultaDest = await getDocs(consultaDest);
            setUsuarioDest(datosConsultaDest.docs[0].data());

            const Id_Usuario1 = await route.params.Sala.Id_Usuario1;
            const Id_Usuario2 = await route.params.Sala.Id_Usuario2;
           
            const consGetIdDoc1 = query(collection(getFirestore(app),'Salas'), where("Id_Usuario1", "==", Id_Usuario1));
            const datosGetIdDoc1 = await getDocs(consGetIdDoc1);
           
            setIdDoc1(datosGetIdDoc1.docs[0]["id"]);

            const consGetIdDoc2 = query(collection(getFirestore(app),'Salas'), where("Id_Usuario1", "==", Id_Usuario2));
            const datosGetIdDoc2 = await getDocs(consGetIdDoc2);

            setIdDoc2(datosGetIdDoc2.docs[0]["id"]);
        })()
      },[]);

      useEffect(()=>{
        if(idDoc1){
            const docRef = doc(getFirestore(app), 'Salas', idDoc1);
                const unsubscribe = onSnapshot(docRef, (doc) => { //Actualizar a tiempo real
                    setSala(doc.data());
                  });
                
                return unsubscribe;
        }
      }, [idDoc1]) //Necesito saber el ID del documento a modificar previamente para establecer un listener
    
    function enviarMensaje(){
        if(mensaje.length==0){
            alert('Error, el mensaje debe de contener algún caracter');
            return ;
        }
        const mensajeEnviar = {
            Fecha: new Date().getDate() +'/'+ (new Date().getMonth()+1) + '/'+ new Date().getFullYear()+' '+ new Date().toLocaleTimeString().split(":")[0] +":"+ new Date().toLocaleTimeString().split(":")[1],
            Id_Usuario:sala["Id_Usuario1"],
            Mensaje:mensaje,
        }
    
        updateDoc(doc(getFirestore(app),'Salas', idDoc1), {
            Mensajes: arrayUnion(mensajeEnviar),
            ult_Mensaje: new Date()
        });
        
        updateDoc(doc(getFirestore(app),'Salas', idDoc2), {
            Mensajes: arrayUnion(mensajeEnviar),
            ult_Mensaje: new Date()
        });

        setMensaje("");
    }

    function actualizarEstado(){
        if(idDoc1){
            updateDoc(doc(getFirestore(app),'Salas', idDoc1), {
                ult_Acceder: new Date(),
            });
        }
    }

    const flatListRef = useRef(null);

    useEffect(() => {
        if(sala['Mensajes']){
            if (sala['Mensajes'].length > 0 && flatListRef.current) 
                flatListRef.current.scrollToIndex({ animated: true, index: sala['Mensajes'].length - 1 });  
        }
      }, [sala['Mensajes'], keyboardOpen]);
    
      const getItemLayout = (data, index) => ({
        length: 50, // Reemplaza ITEM_HEIGHT con la altura real de tus elementos
        offset: 50 * index,
        index,
      });

      const MensajeIzquierda = ({index, mensaje}) =>{ //Destinatario
        return(
            <View key={index} style={{marginLeft:10,  maxWidth:'80%',backgroundColor:'#fff', borderRadius:20, marginTop:15,alignSelf:'flex-start'}}>
                <View style={{alignItems:'flex-start',marginLeft:10,marginTop:10, marginRight:10}}>
                    <Text style={[tamañoNormal ? null : {fontSize:22}]}>{mensaje.Mensaje}</Text>
                </View>
                <Text style={{textAlign:'right', marginRight:10, marginBottom:10, paddingLeft:60, marginTop:5,fontSize:12}}>{mensaje.Fecha}</Text>
            </View>
        );
    }
    
    const MensajeDerecha = ({index, mensaje}) =>{ //Usuario
        return(
            <View key={index} style={{marginRight:10,  maxWidth:'80%',backgroundColor:'#D9FDD3', borderRadius:20, alignSelf:'flex-end', marginTop:15}}>
                <View style={{alignItems:'flex-start', marginLeft:10, marginTop:10, marginRight:10 }}>
                    <Text style={[tamañoNormal ? null : {fontSize:22}]}>{mensaje.Mensaje}</Text>
                </View>
                <Text style={[{textAlign:'right', marginRight:10, marginBottom:10, paddingLeft:60, marginTop:5, fontSize:12}, tamañoNormal ? null : {fontSize:16}]}>{mensaje.Fecha}</Text>
            </View>
        );
    }

    return(
        <View style={{flex:1}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground>

            <View style={[{height:60,backgroundColor:'#F0B27A', marginTop:Constants.statusBarHeight, flexDirection:'row', alignItems:'center'}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <Pressable onPress={()=>{goBack(); actualizarEstado();}}>
                    <View style={{marginLeft:20,}}>
                        {modoNocturno ? <AntDesign name="arrowleft" size={24} color="black"/> : <AntDesign name="arrowleft" size={24} color="white"/>}
                    </View>
                </Pressable>
                
                <Image
                    style={styles.tinyLogo}
                    source={{
                        uri:  usuarioDest["Foto"],
                    }}
                />
               
                <Text style={[{fontSize:20, fontWeight:400, marginLeft:20}, modoNocturno ? null : {color:'#fff'},tamañoNormal ? null : {fontSize:25}]}>{usuarioDest["Nombre"]}</Text>                
            </View>
            <View>
                {Platform.OS != 'web' && <FlatList
                    ref={flatListRef}
                    data={sala["Mensajes"]}
                    renderItem={({item,index}) =>{
                        if(item.Id_Usuario == sala["Id_Usuario1"]){
                            return <MensajeDerecha index={index} mensaje={sala["Mensajes"][index]}/>
                        }
                        else{
                            return <MensajeIzquierda index={index} mensaje={sala["Mensajes"][index]}/>
                        }
                    }
                    }
                    keyExtractor={(item, index) => index}
                    getItemLayout={getItemLayout}
                    style={{marginBottom:140, flex:1}}
                    initialScrollIndex={sala['Mensajes'] && sala['Mensajes'].length - 1} // Establecer el índice del último elemento
                />
                }
                {Platform.OS == 'web' && <FlatList
                    data={sala["Mensajes"]}
                    renderItem={({item,index}) =>{
                        if(item.Id_Usuario == sala["Id_Usuario1"]){
                            return <MensajeDerecha index={index} mensaje={sala["Mensajes"][index]}/>
                        }
                        else{
                            return <MensajeIzquierda index={index} mensaje={sala["Mensajes"][index]}/>
                        }
                    }
                    }
                    
                    style={{marginBottom:140, flex:1}}
                />
                }
            </View>
            <View style={[{position:'absolute', bottom:10, flex:1}, visualizarMovil ? {marginLeft:40} : {width:'100%', paddingLeft:'30%', paddingRight:'30%'}]}>
                <View style={{backgroundColor:'#fff', borderRadius:40, height:'auto', flexDirection:"row", alignItems:'center', marginLeft:10, marginRight:10,}}>
                    <TextInput 
                        style={[{width:'90%', padding:10, paddingLeft:30},tamañoNormal ? null : {fontSize:18}]}
                        placeholder='Mensaje'
                        multiline={true}
                        onChangeText={(texto) => setMensaje(texto)}
                        value={mensaje}>
                    </TextInput>
                    <Pressable onPress={()=>{enviarMensaje()}}>
                        <View style={[{marginRight:20,}, visualizarMovil ? null : {marginRight:10}]}>
                            <Ionicons name="send" size={24} color="black" />
                        </View>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tinyLogo: {
      width: 40,
      height: 40,
      borderRadius:40,
      marginLeft:40,
    },
  });