import { StyleSheet, View, Image, Pressable } from 'react-native';
import React, { useState} from 'react';
import Constants from 'expo-constants';
import { Fontisto } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

//Dependiendo del parámetro introducido se devolverá una imagen correspondiente a dicha sección
export default function Header({numero, navegar}) {

 const [modoNocturno, setModoNocturno] = useState(null);

 useFocusEffect(React.useCallback(() => {
  (async () => {
    const theme = await AsyncStorage.getItem('themePreference');
    theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);
    })()
  }, []));

  let variable;

  switch(numero){
    case 1: modoNocturno ? variable= require('../imagenes/perro.png') : variable = require('../imagenes/perroNocturno.png'); break;
    case 2: modoNocturno ? variable= require('../imagenes/gato.png') : variable = require('../imagenes/gatoNocturno.png'); break;
    case 3: modoNocturno ? variable= require('../imagenes/pajaro.png'): variable = require('../imagenes/pajaroNocturno.png'); break;
    case 4: modoNocturno ? variable= require('../imagenes/gatoperro.png'): variable = require('../imagenes/gatoperroNocturno.png'); break;
  }

  return (   
   <View style={[styles.contenedor, modoNocturno ? null : styles.modoNocturno]}>
      <View >
        <Pressable onPress={()=>{navegar.openDrawer()}}>
          {modoNocturno ? <Fontisto name="nav-icon-a" size={18} color="black" /> : <Fontisto name="nav-icon-a" size={18} color="white" />}
        </Pressable>
      </View>

      <View>
        <Image
          source={variable}
          style={styles.tinyLogo}
        />
      </View>

      <View></View>
      
   </View>
  );
}

const styles = StyleSheet.create({
    contenedor: {
      marginTop: Constants.statusBarHeight,
      backgroundColor: '#F0B27A',
      height: 50,
      flexDirection:'row',
      justifyContent:'space-between',
      alignItems:'center',
      padding:10
    },
    tinyLogo: {
      height: 70,
      width: 120,
      borderRadius: 25,
      marginTop: 20,
    },
    modoNocturno:{
      backgroundColor: '#323639',
    }
  });