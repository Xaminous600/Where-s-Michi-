import { StyleSheet, Text, View, ScrollView, Pressable, TouchableOpacity, Image, ImageBackground, Platform} from 'react-native';
import Constants from 'expo-constants';
import {Fontisto, AntDesign} from '@expo/vector-icons';
import React, { useState} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

//Componente que muestra la sección de ayuda del sistema
export default function Ayuda({route, navigation, navigation: { goBack }}){

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [primerFAQ, setPrimerFAQ] = useState(false);
    const [segundoFAQ, setSegundoFAQ] = useState(false);
    const [tercerFAQ, setTercerFAQ] = useState(false);
    const [cuartoFAQ, setCuartoFAQ] = useState(false);
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

    return(
        <View style={{flex:1, marginTop:Constants.statusBarHeight}}>
            <ImageBackground
                source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground>

            <View style={[{flex:0.32, backgroundColor: '#F0B27A', borderBottomLeftRadius:120, borderBottomRightRadius:120, marginBottom:20}, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                <View style={{marginTop:15, marginLeft:20, flexDirection:'row'}}>
                    <Pressable onPress={()=>{navigation.openDrawer()}}>
                        {modoNocturno && <Fontisto name="nav-icon-a" size={20} color="black" style={{marginTop:10}}/>}
                        {!modoNocturno && <Fontisto name="nav-icon-a" size={20} color="white" style={{marginTop:10}}/>}
                    </Pressable>
                    <Text style={{fontWeight:"bold", color:'#fff', fontSize:30, marginLeft:40, textAlign:'center'}}>Sección de ayuda</Text>
                </View>

                <View style={{justifyContent:'center', alignItems:'center', marginTop:10}}>
                    <Image
                        style={[styles.tinyLogo, Platform.OS != 'web' ? null : {width:'20%', height:'100%', marginBottom:100, marginTop:60}]}
                        source={require('../../imagenes/ayuda.png')}
                    />
                </View>
            </View>

            <View style={{flex:0.68, alignItems:'center',}}>
                <ScrollView>
                    <Text style={[{fontSize:25, fontWeight:'bold', marginBottom:5, textAlign:'center',}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:30, marginRight:20}]}>Preguntas Frecuentes</Text>
                    <View style={{flex:1, marginLeft:20, marginRight:70, borderRadius:20, marginTop:10}}>
                        <TouchableOpacity onPress={()=>{setPrimerFAQ(!primerFAQ)}} style={{padding:15, backgroundColor:'#fff', borderRadius:20}}>
                            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                                {!primerFAQ && <AntDesign style={{marginRight:20, marginLeft:15}} name="plus" size={30} color="black" />}
                                {primerFAQ && <AntDesign style={{marginRight:20, marginLeft:15}} name="minus" size={30} color="black" />}
                                <Text style={[{marginBottom:10, fontSize:18, fontWeight:400, marginRight:40, marginTop:5}, tamañoNormal ? null : {fontSize:22}]}>¿Qué funciones y características ofrece esta App?</Text>
                            </View>
                            {primerFAQ && <Text style={[{fontSize:19, padding:20, fontWeight:300}, tamañoNormal ? null : {fontSize:22}]}>Esta aplicación te brinda la posibilidad de buscar a tu mascota
                                perdida, dar en adopción a un animal y consultar/realizar posts en el foro.
                                Todo esto de una forma anónima y completamente segura.
                            </Text>}
                        </TouchableOpacity>

                        <TouchableOpacity  onPress={()=>{setSegundoFAQ(!segundoFAQ)}} style={{padding:15, marginBottom:10, marginTop:10, backgroundColor:'#fff', borderRadius:20}}>
                            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                                {!segundoFAQ && <AntDesign style={{marginRight:20, marginLeft:20}} name="plus" size={30} color="black" />}
                                {segundoFAQ && <AntDesign style={{marginRight:20, marginLeft:20}} name="minus" size={30} color="black" />}
                                <Text style={[{marginBottom:10, fontSize:18, fontWeight:400, marginRight:40, marginTop:5}, tamañoNormal ? null : {fontSize:22}]}>¿Con qué animo de lucro se desarrolló la aplicación?</Text>
                            </View>
                            {segundoFAQ && <Text style={[{fontSize:19, padding:20, fontWeight:300}, tamañoNormal ? null : {fontSize:22}]}>La aplicación se desarrolló con el objetivo de ofrecer servicios para el bienestar
                                animal y de poder brindarles una segunda oportunidad.
                            </Text>}
                        </TouchableOpacity>

                        <TouchableOpacity  onPress={()=>{setTercerFAQ(!tercerFAQ)}} style={{padding:15, backgroundColor:'#fff', marginBottom:10, borderRadius:20}}>
                            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                                {!tercerFAQ && <AntDesign style={{marginRight:20, marginLeft:30}} name="plus" size={30} color="black" />}
                                {tercerFAQ && <AntDesign style={{marginRight:20, marginLeft:30}} name="minus" size={30} color="black" />}
                                <Text style={[{marginBottom:10, fontSize:18, fontWeight:400, marginRight:40, marginTop:5}, tamañoNormal ? null : {fontSize:22}]}>¿La aplicación es compatible con múltiples dispositivos o plataformas?</Text>
                            </View>
                            {tercerFAQ && <Text style={[{fontSize:19, padding:20, fontWeight:300}, tamañoNormal ? null : {fontSize:22}]}>Nuestra aplicación puede visualizarse y manipularse tanto en dispositivos móviles de Apple, Android e incluso Web.
                            </Text>}
                        </TouchableOpacity>

                        <TouchableOpacity  onPress={()=>{setCuartoFAQ(!cuartoFAQ)}} style={{padding:10, backgroundColor:'#fff', borderRadius:20}}>
                            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                                {!cuartoFAQ && <AntDesign style={{marginRight:20, marginLeft:10}} name="plus" size={30} color="black" />}
                                {cuartoFAQ && <AntDesign style={{marginRight:20, marginLeft:10}} name="minus" size={30} color="black" />}
                                <Text style={[{marginBottom:10, fontSize:18, fontWeight:400, marginRight:40, marginTop:5}, tamañoNormal ? null : {fontSize:22}]}>¿Cuáles son los términos y condiciones de uso de la aplicación?</Text>
                            </View>

                            {cuartoFAQ && <View style={{padding:20}}>
                                <Text style={[{marginBottom:5, marginTop:5, fontSize:19, fontWeight:300},tamañoNormal ? null : {fontSize:22}]}>Aceptación de los términos: Al utilizar esta aplicación, aceptas cumplir con los siguientes términos y condiciones de uso.</Text>
                                <Text style={[{marginBottom:5, marginTop:5, fontSize:19, fontWeight:300},tamañoNormal ? null : {fontSize:22}]}>Propiedad intelectual: Todos los derechos relacionados con esta aplicación, incluyendo el diseño, la marca y los contenidos, son propiedad exclusiva de los desarrolladores.</Text>
                                <Text style={[{marginBottom:5, marginTop:5, fontSize:19, fontWeight:300},tamañoNormal ? null : {fontSize:22}]}>Uso adecuado: Se prohíbe el uso de esta aplicación para actividades ilegales, abusivas o que violen los derechos de terceros. No se permite el uso no autorizado de la aplicación ni la manipulación de su contenido.</Text>
                                <Text style={[{marginBottom:5, marginTop:5, fontSize:19, fontWeight:300},tamañoNormal ? null : {fontSize:22}]}>Responsabilidad del usuario: El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. Cualquier actividad realizada en la aplicación utilizando su cuenta será de su exclusiva responsabilidad.</Text>
                                <Text style={[{marginBottom:5, marginTop:5, fontSize:19, fontWeight:300},tamañoNormal ? null : {fontSize:22}]}>Limitaciones de responsabilidad: Los desarrolladores no se hacen responsables de cualquier daño o pérdida sufridos por el usuario debido al uso de esta aplicación. El uso de la aplicación se realiza bajo su propio riesgo.</Text>
                                <Text style={[{marginBottom:5, marginTop:5, fontSize:19, fontWeight:300},tamañoNormal ? null : {fontSize:22}]}>Cancelación o terminación: Los desarrolladores se reservan el derecho de cancelar o terminar el acceso a la aplicación en cualquier momento y sin previo aviso, si se detecta un incumplimiento de los términos y condiciones.</Text>
                            </View>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({    
    tinyLogo: {
        width: '45%',
        height: '80%',
        marginLeft:20,
        marginBottom:100
      },
      header: {
        backgroundColor: '#F0B27A',
        height: 160,
        borderBottomRightRadius:20,
        borderBottomLeftRadius:20
      },
    
})