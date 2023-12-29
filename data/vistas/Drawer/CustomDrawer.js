import { StyleSheet, Text, View, ImageBackground, Image, Platform} from 'react-native';
import React , {useState, useEffect, } from 'react';
import { DrawerContentScrollView, DrawerItemList} from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

//Componente cuya función es la customización del Drawer
export default function CustomDrawer(props, {route}) {
    const [modoNocturno, setModoNocturno] = useState(null);

    useFocusEffect(React.useCallback(() => {
        (async () => {
            const theme = await AsyncStorage.getItem('themePreference');
            theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);
            })()
        }, [route]));

  return (   
    <DrawerContentScrollView {...props}>
        <View style={styles.divSuperior}>
            <ImageBackground
                source={require('../../imagenes/fondo.png')}
                resizeMode={'cover'}
                style={{ flex: 1, width: '100%'}}>
                <View style={{justifyContent:'center', alignItems:'center'}}>
                    <Image 
                        source={require('../../imagenes/icon.png')} 
                        style={[{width: '40%', height: '65%', borderRadius:100, marginTop:40, backgroundColor:'#F0B27A'}, Platform.OS != 'web' ? null : {width:'40%', height:'100%', marginTop:100}]} />
                </View>
            </ImageBackground>    
        </View>
        <View style={{marginTop:20}}>
            <DrawerItemList {...props}/>
        </View>
        <View>
            <Text style={[{textAlign:'right', marginRight: 10, alignItems: 'flex-end', marginTop: 200, color:'#000'}, modoNocturno ? null : {color:'#fff'}]}> © Escuela Superior de Ingeniería, Cádiz </Text>
        </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
    divSuperior: {
        height: 200,
        borderTopRightRadius: 20,
    },
    contenedor: {
        flex: 1,
        borderRadius:80,
        borderColor:'#000',
        borderWidth:0.5,
        marginRight:90,
        marginLeft:90,
        marginTop:70,
        backgroundColor:'#E9E9E9',
    },
    modoNoche: {
        backgroundColor:'#242321',
    },
    modoDiaBoton: {
        alignItems:'flex-start',
        borderColor:'#000', 
    },
    modoNocheBoton: {
        alignItems:'flex-end',
        borderColor:'#FFF', 
    },
    icono:{
        borderWidth:2, 
        padding: 6, 
        borderRadius: 80, 
        margin:3,
        borderColor:'#fff'
    },
    iconoDia:{
        borderColor:'#000'
    }
});