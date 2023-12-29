import {StatusBar} from 'react-native';
import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer} from '@react-navigation/native';
import { createStackNavigator} from '@react-navigation/stack';
import LoginScreen from './data/vistas/LoginScreen';
import Drawer from './data/vistas/Drawer/Drawer';
import Bienvenida from './data/vistas/Bienvenida';
import ChatPrivado from './data/vistas/Drawer/ChatPrivado';
import PerdidoFormulario from './data/vistas/Appbar/PerdidoFormulario';
import AdopcionFormulario from './data/vistas/Appbar/AdopcionFormulario';
import EditarPublicacionPerdido from './data/vistas/Drawer/EditarPublicacionPerdido';
import EditarPublicacionAdoptar from './data/vistas/Drawer/EditarPublicacionAdoptar';
import PostForoForm from './data/vistas/Appbar/PostForoForm';
import EditarPublicacionForo from './data/vistas/Drawer/EditarPublicacionForo';
import PublicacionesScreen from './data/vistas/Drawer/PublicacionesScreen';
import ReportesScreen from './data/vistas/Appbar/ReportesScreen';
import PublicacionAdmin from './data/vistas/Drawer/PublicacionAdmin';
import ForoForm from './data/vistas/Appbar/ForoForm';
import Similitud from './data/vistas/Appbar/Similitud';
import MejoresCandidatos from './data/vistas/Appbar/MejoresCandidatos';

const Stack = createStackNavigator();

export default function App() {

  return (   
    <NavigationContainer >
      <StatusBar backgroundColor={'#000'}/>
      <Stack.Navigator>
            <Stack.Screen
                name="LoginScreen"
                component={LoginScreen}
                options={{ headerShown: false }}>
            </Stack.Screen>

            <Stack.Screen
                name="Bienvenida"
                component={Bienvenida}
                options={{ headerShown: false }}>
            </Stack.Screen>

            <Stack.Screen
                name="Drawer"
                component={Drawer}
                options={{ headerShown: false }}>
            </Stack.Screen>
            
            <Stack.Screen 
              name="PerdidoFormulario" 
              component={PerdidoFormulario}
              options={{ headerShown: false }}
            />

            <Stack.Screen 
              name="PostForoForm" 
              component={PostForoForm}
              options={{ headerShown: false }}
            />

            <Stack.Screen 
              name="EditarPublicacionPerdido" 
              component={EditarPublicacionPerdido}
              options={{ headerShown: false }}
            />

            <Stack.Screen 
              name="EditarPublicacionAdoptar" 
              component={EditarPublicacionAdoptar}
              options={{ headerShown: false }}
            />

            <Stack.Screen 
              name="EditarPublicacionForo" 
              component={EditarPublicacionForo}
              options={{ headerShown: false }}
            />

            <Stack.Screen 
              name="AdopcionFormulario" 
              component={AdopcionFormulario}
              options={{ headerShown: false }}
            />

             <Stack.Screen 
              name="ForoForm" 
              component={ForoForm} 
              options={{ headerShown: false }}
            />
           
            <Stack.Screen 
              name="ChatPrivado" 
              component={ChatPrivado} 
              options={{ headerShown: false }}
            />

            <Stack.Screen
                name="PublicacionesScreen"
                component={PublicacionesScreen}
                options={{ headerShown: false }}>
            </Stack.Screen>

            <Stack.Screen
                name="ReportesScreen"
                component={ReportesScreen}
                options={{ headerShown: false }}>
            </Stack.Screen>

            <Stack.Screen
                name="PublicacionAdmin"
                component={PublicacionAdmin}
                options={{ headerShown: false }}>
            </Stack.Screen>

            <Stack.Screen
                name="Similitud"
                component={Similitud}
                options={{ headerShown: false }}>
            </Stack.Screen>

            <Stack.Screen
                name="MejoresCandidatos"
                component={MejoresCandidatos}
                options={{ headerShown: false }}>
            </Stack.Screen>
        </Stack.Navigator>

        <StatusBar 
          translucent={true} 
          backgroundColor={'#fff'}
          showHideTransition="slide"
        /> 
    </NavigationContainer>
  );
}