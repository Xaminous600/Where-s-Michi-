import { StyleSheet, Text, View, Button, Alert, Image ,TouchableOpacity, ScrollView, TextInput, Keyboard, ImageBackground } from 'react-native';
import React, { useState, useEffect } from "react";
import {app} from '../../database/firebase';
import {getDocs, collection, getFirestore, query, where, addDoc, updateDoc, doc, arrayRemove, arrayUnion} from "firebase/firestore";
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import {getAuth, signOut } from '@firebase/auth';

//Vista intermedia que solamente se mostrará a aquellos usuarios que estén vetados del sistema
export default function Bienvenida({navigation}) {

    const auth = getAuth(app);
    const [baneado, setBaneado] = useState(false);

    //Hook encargado de obtener el estado del usuario. En caso de estar baneado, se mostrará una vista indicando de que está vetado
    //del sistema. En caso contrario, se le redirigirá a las demás vistas.
    useFocusEffect(React.useCallback(() => {
        if(!auth.currentUser){
            navigation.navigate('LoginScreen');
        }
        else{
        (async () =>{ 
            const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", auth.currentUser.uid));
            const datosConsultaUsuario = await getDocs(consultaUsuario);

            if(datosConsultaUsuario.docs[0].data()['Baneado']){
                setBaneado(true);
            }
            else{
                navigation.navigate('Drawer');
            }
        })()
        }
    }, [])); 

    //Hook encargado de establecer un listener en el botón de atrás. Cuando se pulse, no se le redirige a la vista anterior
    //sino a la pantalla del Login
    React.useEffect(() =>
        navigation.addListener('beforeRemove', (e) => {
        const action = e.data.action;
    
        e.preventDefault();
            
        signOut(getAuth(app)).then(()=>{navigation.navigate('LoginScreen')}).catch((error)=>{console.log(error)});
    }),[navigation]);

    return (
        <View style={{flex:1}}>
            <ImageBackground
                source={require('../imagenes/baneadoWallpaper.jpg')}
                resizeMode={'cover'}
                style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
            </ImageBackground> 
            
            {baneado && 
                <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                    <View style={{backgroundColor:'#F0B27A', height:'auto', padding:30}}>
                        <Text style={{fontWeight:400, fontSize:20}}>Su cuenta está temporalmente vetada debido a que nuestro sistema de administración ha encontrado que has violado los términos y servicios de la aplicación.</Text>
                        <Text style={{marginTop:25, fontWeight:500, fontSize:15}}>Puede realizar una apelación contactándonos vía email. Gracias.</Text>
                    </View>
                </View>
            }
        </View>
    );

}