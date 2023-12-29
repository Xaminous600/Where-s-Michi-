import { StyleSheet, useColorScheme, Appearance} from 'react-native';
import Constants from 'expo-constants';
import { createDrawerNavigator} from '@react-navigation/drawer';
import Appbar from '../Appbar/appbar';
import CustomDrawer from './CustomDrawer';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import Ayuda from './Ayuda';
import PerfilScreen from './PerfilScreen';
import MensajesScreen from './MensajesScreen';
import PublicacionesScreen from './PublicacionesScreen';
import Administracion from './Administracion';
import {getAuth, signOut } from '@firebase/auth';
import {app} from "../../../database/firebase";
import {getDocs, collection, getFirestore, query, where, doc, deleteDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove, orderBy} from "firebase/firestore";
import React, { useState, useEffect, } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Platform } from "react-native";

const Drawer = createDrawerNavigator();

//Componente encargado de mostrar el Drawer
export default function DrawerNavigator({navigation, route}) {
  const [modoNocturno, setModoNocturno] = useState(null);
  const [tamañoNormal, setTamañoNormal] = useState(null);
  const [posicionUsuario, setPosicionUsuario] = useState(null);
  const [admin, setAdmin] = useState(false);

  useFocusEffect(React.useCallback(() => {
    (async () => {
        const theme = await AsyncStorage.getItem('themePreference');
        theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);

        const tamaño = await AsyncStorage.getItem('letterPreference');
        tamaño == 'normal' ? setTamañoNormal(true) : setTamañoNormal(false);
        })()
    }, [route]));  

  useEffect(()=>{
    (async () =>{
      const themePreference = await AsyncStorage.getItem('themePreference');

      if(!themePreference){
        AsyncStorage.setItem('themePreference', 'light');
      }
      const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
      const datosConsultaUsuario = await getDocs(consultaUsuario);
      
      setAdmin(datosConsultaUsuario.docs[0].data()['Admin']);

      const docRef = doc(getFirestore(app), 'Usuarios', datosConsultaUsuario.docs[0].id);

      const unsubscribe = onSnapshot(docRef, (doc) => { //Actualizar a tiempo real
        
        if(doc.data()['Baneado']){
          navigation.navigate('Bienvenida');
        }
    });

    return unsubscribe; 
    })()
  }, []);

  useEffect(() => {
    // Solicitar permiso de ubicación y obtener la ubicación actual del usuario.
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setPosicionUsuario(location);
    })();
  }, []);

  useEffect(()=>{
    (async() => {
      
      const q = collection(getFirestore(app),'Perdidos');
      const datosConsultaUsuario = await getDocs(q);
      const idsPublicaciones = new Set();
      
      datosConsultaUsuario.forEach((docs)=>{
        idsPublicaciones.add(docs.id);
      })

      const distanciaProxima = 1.00; //10 km

     
      const unsubscribe = onSnapshot(q, (docs) => {
        docs.docChanges().map(async(doc) => {
          if(posicionUsuario){
            const distancia = calculoDistanciaDosPuntos(doc.doc.data()["Coordenadas"]["latitude"], doc.doc.data()["Coordenadas"]["longitude"], posicionUsuario.coords.latitude, posicionUsuario.coords.longitude);
            if(distancia < distanciaProxima && !idsPublicaciones.has(doc.doc.id)){
              enviarNotificacion();
            }
          }
          })
        });

      return unsubscribe;
  })();
  }, []);

  useEffect(()=>{
    (async() => {
        const existingStatus = await Notifications.getPermissionsAsync();

        if(existingStatus !== 'granted'){
            const status = await Notifications.requestPermissionsAsync();

            if(status !== 'granted'){
                return ;
            }
        }
    })
  }, []);

  function calculoDistanciaDosPuntos(lat1, lon1, lat2, lon2){
    const radioTierra = 6371;

    const dLat = convertirRadianes(lat2 - lat1);
    const dLon = convertirRadianes(lon2 - lon1);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(convertirRadianes(lat1)) * Math.cos(convertirRadianes(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return radioTierra * c;
}

function convertirRadianes(angulo){
    return angulo * (Math.PI/180);
}

  async function enviarNotificacion(){
    Notifications.scheduleNotificationAsync({
        content:{
            title: "Atención",
            body: "Una nueva publicación ha sido creada cerca de tu zona",
        },
        trigger:{
            seconds:1
        }
    })
  }
  
    return ( 
      <Drawer.Navigator 
        screenOptions={{
          drawerStyle: {
            width: 280,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            height: '100%',
            backgroundColor: modoNocturno ? '#fff' : '#323639',
          },  
          headerStyle: {backgroundColor:'#F0B27A'},
          headerTitle: 'UCAnimales',
          headerShown: false,
        }}
        drawerContent={props => <CustomDrawer {...props}/>}
      >
        <Drawer.Screen name="Home" component={Appbar} options={{
          drawerLabelStyle: [modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:18}],
          drawerIcon: ({color}) => (
           <Ionicons name="home-outline" color={modoNocturno ? color : '#fff'} size={20} />
          )
        }} />

        <Drawer.Screen name="Perfil" component={PerfilScreen} options={{
          drawerLabelStyle: [modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:18}],
          drawerIcon: ({color}) => (
           <Ionicons name="person-outline" color={modoNocturno ? color : '#fff'} size={20} />
          ),
        }}  />

        {Platform.OS != 'web' &&  <Drawer.Screen name="Mis Publicaciones" component={PublicacionesScreen} initialParams={{idUsuario:getAuth(app).currentUser.uid, administrar: false}} options={{
          drawerLabelStyle: [modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:18}],
          drawerIcon: ({color}) => (
            <AntDesign name="book" size={20} color={modoNocturno ? color : '#fff'} />
          )
        }}  />
        }

        <Drawer.Screen name="Mensajes" component={MensajesScreen} options={{
          drawerLabelStyle: [modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:18}],
          drawerIcon: ({color}) => (
           <Ionicons name="chatbubble-ellipses-outline" color={modoNocturno ? color : '#fff'} size={20} />
          )
        }}  />

        {admin && <Drawer.Screen name="Administración" component={Administracion} options={{
          drawerLabelStyle: [modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:18}],
          drawerIcon: ({color}) => (
           <AntDesign name="tool" color={modoNocturno ? color : '#fff'} size={20} />
          )
        }}  />}

        <Drawer.Screen name="Ayuda" component={Ayuda} options={{
          drawerLabelStyle: [modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:18}],
          drawerIcon: ({color}) => (
           <Ionicons name="information-circle-outline" color={modoNocturno ? color : '#fff'} size={20} />
          )
        }} />
       
      </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginTop: Constants.statusBarHeight,
    backgroundColor: '#F0B27A',
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tinyLogo: {
    width: 110,
    height: 30,
    left: 20,
    bottom: 0,
  },
});