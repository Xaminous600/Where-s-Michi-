import { StyleSheet, Text, View, Alert, Image ,TouchableOpacity, ScrollView, TextInput, Keyboard, ImageBackground, Platform } from 'react-native';
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification} from 'firebase/auth';
import {collection, getFirestore, addDoc} from "firebase/firestore";
import Constants from 'expo-constants';
import { app } from '../../database/firebase';
import { MaterialCommunityIcons, Ionicons, AntDesign} from '@expo/vector-icons';

export default function LoginScreen({navigation}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailRegistro, setEmailRegistro] = useState("");
  const [passwordRegistro, setPasswordRegistro] = useState("");
  const [passwordRegistro2, setPasswordRegistro2] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");

  const [keyboardIsVisible, setKeyboardIsVisible] = useState(false)
  const [iniciarSesion, setIniciarSesion] = useState(true);

  const auth = getAuth(app);
    
  //Listener que escucha el estado de autenticación del usuario
    useEffect(() => {
        onAuthStateChanged(auth, (user) =>{
            if(user && user.emailVerified){
                navigation.navigate('Drawer');
            }
        })
    }, []); 
  
  //Función encargada en la verificación de los parámetros para iniciar sesión
  function iniciarSesionFuncion(){
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;

    if(reg.test(email) === false) {
        Alert.alert("Error", "El email introducido no es correcto");
        return false;
    }
    else if(password.length==0){
        Alert.alert("Error", "Introduzca una contraseña válida")
        return false;
    }

    signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
        if(!userCredential.user.emailVerified){
            Alert.alert('Atención', 'Verifique el email para poder entrar. Consulte la bandeja de Spam.');
        }
    }).catch((error) => {
        Alert.alert("Error","El usuario y contraseña no coinciden");
    // ..
    });
  }

  //Función encargada de que los parámetros introducidos para registrarse, sean correctos
  async function registrarseFuncion(){
    try{
        let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;

        if(nombreUsuario.length<3){
            Alert.alert("Error","Introduzca un nombre de usuario con al menos 3 caracteres");
            return false;
        }
        if(reg.test(emailRegistro) === false) {
            Alert.alert("Error","El email introducido no es correcto");
            return false;
        }
        else if(passwordRegistro.length<6){
            Alert.alert("Error","Introduzca una contraseña con al menos 6 caracteres");
            return false;
        }
        else if(passwordRegistro != passwordRegistro2){
            Alert.alert("Error","Las contraseñas no son iguales");
            return false;
        }
    
        await createUserWithEmailAndPassword(auth, emailRegistro, passwordRegistro).then((userCredential) => {
            auth.currentUser.displayName = nombreUsuario;
            auth.currentUser.photoURL = 'https://firebasestorage.googleapis.com/v0/b/tfg-56e1b.appspot.com/o/perfil%2FPerfil3.PNG?alt=media&token=7bf7d53b-e6b0-4c46-ad51-d933d7ea032e';
            addDoc(collection(getFirestore(app),'Usuarios'), {Nombre:nombreUsuario, Id:userCredential.user.uid, Adoptar_Favoritos:[], Post_Favoritos:[], Bloqueados:[], Email: emailRegistro, Foto: 'https://firebasestorage.googleapis.com/v0/b/tfg-56e1b.appspot.com/o/perfil%2FPerfil3.PNG?alt=media&token=7bf7d53b-e6b0-4c46-ad51-d933d7ea032e', Admin: false, Ocultar: []});
            Alert.alert('¡Éxito!', "Te has registrado correctamente");
        }).catch((error) => {
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert("Error", "El email introducido ya está registrado");
                return;
            }
            else if (error.code == 'auth/weak-password') {
                Alert.alert("Error", "Introduzca una contraseña más robusta");
            }  
        // ..
        });
        
        if(auth){
            await sendEmailVerification(auth.currentUser);
            Alert.alert('Se ha enviado un correo de verificación', 'Por favor, verifica tu correo antes de iniciar sesión. Consulte en la carpeta de Spam.');
        }

    } catch(err){
        Alert.alert("Error", "Ha habido un error al realizar el registro");
        console.log(err);
    }
  }

  //Hook encargado de establecer un Listener cuando se abre o se cierra el teclado
  useEffect(() => {
    Keyboard.addListener("keyboardDidShow", () => {
        setKeyboardIsVisible(true)
    })
    Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardIsVisible(false)
    })
  }, [])

  return (
    <View style={styles.container}>
      <ImageBackground
            source={require('../imagenes/loginBackground.jpg')}
            resizeMode={'cover'}
            style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
      </ImageBackground>

      <StatusBar style="auto" />
      <View style={{backgroundColor:'#F0B27A', height:'30%', borderBottomEndRadius:40, borderBottomLeftRadius:40, flexDirection:"column", justifyContent:'center',alignItems:'center',}}>
            <View>  
                <Image
                    source={require('../imagenes/loginSuperior.png')}
                    style={styles.tinyLogo}
                />
            </View>
            
            {!keyboardIsVisible && 
                <View style={{flexDirection:"row", }}>
                    <TouchableOpacity style={{marginBottom:15,marginRight:30}} onPress={()=> {setIniciarSesion(true); setEmailRegistro(""); setPasswordRegistro(""); setPasswordRegistro2("")}}>
                        <Text style={{color:'#373737', fontStyle:"italic", fontWeight:"bold", fontSize:18}}>Iniciar Sesión</Text>
                        { iniciarSesion && 
                            <View style={{ borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, margin:10}}/>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={{marginBottom:15}} onPress={()=> {setIniciarSesion(false);setEmail("");setPassword("")}}>
                        <Text style={{color:'#373737', fontStyle:"italic", fontWeight:"bold", fontSize:18}}>Registrarse</Text>
                        {!iniciarSesion && 
                            <View style={{ borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, margin:10}}/>
                        }
                    </TouchableOpacity>
                </View>
            }
      </View>

      {iniciarSesion &&
      <View style={[{borderRadius:20, marginTop:30}, Platform.OS != 'web' ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
            <ScrollView>
                <Text style={{fontSize:28, marginTop:20, textAlign:'center', fontWeight:500}}>Bienvenido de nuevo</Text>
                <View style={{marginTop:20, height:100, marginLeft:20, marginRight:20,}}>
                    <View style={{flexDirection:'row', borderWidth:0.2, borderRadius:20, marginTop:5}}>
                        <MaterialCommunityIcons style={{ borderRadius:20, marginTop:15, marginBottom:10, marginLeft:20}} name="email-outline" size={24} color="black" />
                        <TextInput 
                            placeholder="Correo electrónico"
                            style={styles.caja} 
                            onChangeText={(texto) => setEmail(texto)}
                        />
                    </View>
                    <View style={{flexDirection:'row', borderWidth:0.2, borderRadius:20, marginTop:30, height:50}}>
                        <Ionicons  style={{ borderRadius:20, marginTop:15, marginBottom:10, marginLeft:20}} name="md-lock-closed-outline" size={20} color="black" />
                        <TextInput 
                            placeholder="Contraseña"
                            style={styles.caja} 
                            onChangeText={(texto) => setPassword(texto)}
                            secureTextEntry={true}
                        />
                    </View>
                </View>
                <View style={{justifyContent:'center', alignItems:'center', marginTop:60}}>
                    <TouchableOpacity style={{backgroundColor:'#F0B27A', padding:20, borderRadius:20,}} onPress={() => iniciarSesionFuncion()}>
                        <Text style={{textAlign:'center', color:'#373737', fontWeight:"bold", fontSize:20 }}>Iniciar Sesión</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={{ borderBottomColor: 'black', borderBottomWidth: StyleSheet.hairlineWidth, margin:10}}/>
            </ScrollView>
      </View>
      }

      {!iniciarSesion &&  
        <ScrollView>
            <Text style={{fontSize:28, marginTop:20, textAlign:'center', fontWeight:500}}>Registro</Text>
            <View style={[{marginTop:20, marginLeft:20, marginRight:20},  Platform.OS != 'web' ? null : {paddingLeft:'30%', paddingRight:'30%'}]}>
                <View style={{flexDirection:'row', borderWidth:0.2, borderRadius:20, marginTop:5, marginBottom:10}}>
                    <AntDesign name="user" style={{ borderRadius:20, marginTop:15, marginBottom:10, marginLeft:20}}  size={24} color="black" />
                    <TextInput 
                            placeholder="Nombre de usuario"
                            style={styles.caja} 
                            onChangeText={(texto) => setNombreUsuario(texto)}
                        />
                </View>
                <View style={{flexDirection:'row', borderWidth:0.2, borderRadius:20, marginTop:5, marginBottom:10}}>
                    <MaterialCommunityIcons style={{ borderRadius:20, marginTop:15, marginBottom:10, marginLeft:20}} name="email-outline" size={24} color="black" />
                    <TextInput 
                        placeholder="Correo electrónico"
                        style={styles.caja} 
                        onChangeText={(texto) => setEmailRegistro(texto)}
                    />
                </View>
                <View style={{flexDirection:'row', borderWidth:0.2, borderRadius:20, marginTop:5,  marginBottom:10}}>
                    <Ionicons  style={{ borderRadius:20, marginTop:15, marginBottom:10, marginLeft:20}} name="md-lock-closed-outline" size={20} color="black" />
                    <TextInput 
                        placeholder="Contraseña"
                        style={styles.caja} 
                        onChangeText={(texto) => setPasswordRegistro(texto)}
                    />
                </View>
                <View style={{flexDirection:'row', borderWidth:0.2, borderRadius:20, marginTop:5}}>
                    <Ionicons  style={{ borderRadius:20, marginTop:15, marginBottom:10, marginLeft:20}} name="md-lock-closed-outline" size={20} color="black" />
                    <TextInput 
                        placeholder="Repita la Contraseña"
                        style={styles.caja} 
                        onChangeText={(texto) => setPasswordRegistro2(texto)}
                    />
                </View>

                <View style={{justifyContent:'center', alignItems:'center'}}>
                    <TouchableOpacity style={{backgroundColor:'#F0B27A',  width:'50%', padding:20, borderRadius:20, marginTop:20}} onPress={() => registrarseFuncion()}>
                        <Text style={{textAlign:'center', color:'#373737', fontWeight:"bold", fontSize:20}}>Registrarse</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
      }
    </View> 
  );
}
const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: "#fff",
    marginTop:Constants.statusBarHeight,
  },
  caja:{
    marginBottom:10,
    borderRadius: 20,
    paddingLeft:30,
    marginRight:10,
    fontSize:18,
    marginTop:5,
    height:40,
    flex:1
  },
  tinyLogo: {
    height: 150,
    width: 200,
    borderRadius: 25,
    marginTop: 20,
  }
})