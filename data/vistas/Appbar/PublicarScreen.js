import { StyleSheet, Text, View, ImageBackground, TouchableOpacity} from 'react-native';
import React, { useState} from 'react';
import Constants from 'expo-constants';
import Header from '../Header';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PublicarScreen({navigation}) {  
  const [modoNocturno, setModoNocturno] = useState(null);

  useFocusEffect(React.useCallback(() => {
  (async () => {
      const theme = await AsyncStorage.getItem('themePreference');
      theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);
      })()
  }, []));

    return (
    <View style={{flex:1}}>
      <ImageBackground
        source={modoNocturno ? require('../../imagenes/publicacion.jpg'): require('../../imagenes/publicarNocturno.jpg')}
        resizeMode={'cover'}
        style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
    </ImageBackground> 

      <TouchableOpacity style={[styles.publicacionesPerdido, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]} onPress={()=> navigation.navigate('PerdidoFormulario')}>
        <Text style={[styles.textoPublicaciones, modoNocturno ? null: {color:'#fff'}]}>¿Se ha perdido tu mascota?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.publicacionesAbandonado, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]} onPress={()=> navigation.navigate('AdopcionFormulario')}>
        <Text style={[styles.textoPublicaciones, modoNocturno ? null: {color:'#fff'}]}>¿Quieres dar en adopción a algún animal?</Text>
      </TouchableOpacity>

      <Header numero={2} navegar={navigation} style={{position:'absolute'}}/>
    </View>       
  );
}

const styles = StyleSheet.create({
  publicacionesPerdido: {
      flex: 1,
      position: 'absolute',
      width: '75%',
      left: '10%',
      top: '30%',
      height: '25%',
      backgroundColor: '#F0B27A',
      borderRadius: 40,
      borderWidth: 1,
      justifyContent: 'center',
      padding: 20,
  },
  publicacionesAbandonado: {
    flex: 1,
    position: 'absolute',
    width: '75%',
    left: '10%',
    top: '60%',
    height: '25%',
    backgroundColor: '#F0B27A',
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 20,
  },
  textoPublicaciones: {
      textAlign: 'center',
      fontSize: 20,
  },
})
