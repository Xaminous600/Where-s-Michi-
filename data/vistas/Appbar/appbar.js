import React, { useState, useEffect, useRef} from 'react';
import { Text, StyleSheet} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapaScreen from './MapaScreen';
import PublicarScreen from './PublicarScreen';
import ForoScreen from './ForoScreen';
import AdoptarScreen from './AdoptarScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Platform } from "react-native";

const Tab = createMaterialBottomTabNavigator();

export default function Appbar() {

const [modoNocturno, setModoNocturno] = useState(null);

 useFocusEffect(React.useCallback(() => {
  (async () => {
    const theme = await AsyncStorage.getItem('themePreference');
    theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);
    })()
  }, []));

  return (
    <Tab.Navigator
      barStyle= {modoNocturno ? {backgroundColor:'#F0B27A'} : {backgroundColor:'#323639'}}
    >
      
      <Tab.Screen 
        name="Mapa" 
        component={MapaScreen}
        options={{
          tabBarLabel: <Text style={[{fontSize:14}, modoNocturno ? null :{color:'#fff'}]}>Mapa</Text>,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="earth-sharp" color={modoNocturno ? color : '#fff'} size={20} />
          ),
        }}
      />

      {Platform.OS != 'web' &&  
        <Tab.Screen 
          name="Publicar" 
          component={PublicarScreen} 
          options={{
            tabBarLabel: <Text style={[{fontSize:14}, modoNocturno ? null :{color:'#fff'}]}>Publicar</Text>,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={modoNocturno ? color : '#fff'} size={20} />
            ),
          }}/>
      }
      
      <Tab.Screen 
          name="Foro" 
          component={ForoScreen} 
          options={{
            tabBarLabel: <Text style={[{fontSize:14}, modoNocturno ? null :{color:'#fff'}]}>Foro</Text>,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-sharp" color={modoNocturno ? color : '#fff'} size={20} />
            ),
          }} />

      <Tab.Screen 
          name="Adoptar" 
          component={AdoptarScreen} 
          options={{
            tabBarLabel: <Text style={[{fontSize:14}, modoNocturno ? null :{color:'#fff'}]}>Adoptar</Text>,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paw-sharp" color={modoNocturno ? color : '#fff'} size={20} />
            ),
          }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barraNocturno: {
    backgroundColor: '#323639',
  },
});