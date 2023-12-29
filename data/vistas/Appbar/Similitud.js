import React, { useEffect, useState} from 'react';
import { View, Image, Text, ImageBackground, StyleSheet, Alert} from 'react-native';
import * as tf from '@tensorflow/tfjs';
import * as FileSystem from 'expo-file-system';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as ImagePicker from 'expo-image-picker';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import {Entypo, MaterialCommunityIcons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, CameraType } from 'expo-camera';
import Lottie from 'lottie-react-native';
import * as Location from 'expo-location';
import {getDocs, collection, getFirestore} from "firebase/firestore";
import {app} from "../../../database/firebase";

//Componente encargado de realizar el reconocimiento del animal a través de Inteligencia Artificial
export default function Similitud({navigation, navigation:{goBack}}) {
    
    const [imagenSeleccionada, setimagenSeleccionada] = useState(null);
    const [modoNocturno, setModoNocturno] = useState(null);
    const [vistaCamara, setvistaCamara] = useState(null);
    const [loading, setLoading] = useState(false);
    const [posicionUsuario, setPosicionUsuario] = useState(null);
    const [tamañoNormal, setTamañoNormal] = useState(null);
    const [candidatos, setCandidatos] = useState(new Map());

    let cameraRef = useState(null);

    useFocusEffect(React.useCallback(() => {
    (async () => {
        const theme = await AsyncStorage.getItem('themePreference');
        theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);

        const tamaño = await AsyncStorage.getItem('letterPreference');
        tamaño == 'normal' ? setTamañoNormal(true) : setTamañoNormal(false);
        })()
    }, []));

    //Hook encargado de obtener la ubicación del usuario
    useEffect(()=>{
        (async () =>{ 
            let location = await Location.watchPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 10
              },
                (location) =>{
                  setPosicionUsuario(location)
                }
              );
        })()
    }, []);

    //Función encargada de escoger una foto de la galería del usuario
    async function handleSelectImage(op){
        try{
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
            });

            if(!result.canceled){
                const {uri} = result.assets[0];
            
                setimagenSeleccionada(uri);
            }
        }
        catch(error){
            console.log(error);
        }
    }

    //Función encargada de realizar la evaluación de una foto. Dicha evaluación será para determinar si es un gato o perro
    //Parámetro: url de la foto a evaluar
    //Devuelve un array de dos posiciones (la primera posición indica la probabilidad de que sea gato y en la segunda de que sea perro)
    async function evaluarFoto(imageUri) { 
        await tf.ready();

        const modelJson = await require('../../modelo/model.json');
        const modelWeight = await require('../../modelo/weights.bin');

        const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeight));

        const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64
        });
        
        const imgBuffer = tf.util.encodeString(imageBase64, 'base64').buffer;
        const raw = new Uint8Array(imgBuffer);
        let imageTensor = decodeJpeg(raw);

        const tensor = imageTensor.resizeNearestNeighbor([224,224]).toFloat().expandDims();

        const resultado = await model.predict(tensor);

        return resultado.dataSync(); 
    }

    //Función encargada de realizar la evaluación de una foto. Dicha evaluación será para determinar la raza del gato
    //Parámetro: url de la foto a evaluar
    //Devuelve un array (en las posiciones del array indica la probabilidad de que sea de una raza u otra)
    async function evaluarFotoGato(imageUri) { //Perro o Gato
        await tf.ready();

        const modelJson = await require('../../modelo/clasificadorGato/model.json');
        const modelWeight = await require('../../modelo/clasificadorGato/weights.bin');

        const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeight));

        const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64
        });
        
        const imgBuffer = tf.util.encodeString(imageBase64, 'base64').buffer;
        const raw = new Uint8Array(imgBuffer);
        let imageTensor = decodeJpeg(raw);

        const tensor = imageTensor.resizeNearestNeighbor([224,224]).toFloat().expandDims();

        const resultado = await model.predict(tensor);

        return (resultado.dataSync());
    }

    //Función encargada de realizar la evaluación de una foto. Dicha evaluación será para determinar la raza del perro
    //Parámetro: url de la foto a evaluar
    //Devuelve un array (en las posiciones del array indica la probabilidad de que sea de una raza u otra)
    async function evaluarFotoPerro(imageUri) {
        await tf.ready();

        const modelJson = await require('../../modelo/clasificadorPerro/model.json');
        const modelWeight = await require('../../modelo/clasificadorPerro/weights.bin');

        const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeight));

        const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64
        });
        
        const imgBuffer = tf.util.encodeString(imageBase64, 'base64').buffer;
        const raw = new Uint8Array(imgBuffer);
        let imageTensor = decodeJpeg(raw);

        const tensor = imageTensor.resizeNearestNeighbor([224,224]).toFloat().expandDims();

        const resultado = await model.predict(tensor);

        return (resultado.dataSync()); //True -> Gato , False -> Perro
    }

    //Función encargada de obtener todas las publicaciones candidatas (animales que se parecen al de la foto tomada)
    //Parámetro: url de la foto a evaluar, tipo de animal de la foto (gato o perro)
    async function posiblesCandidatos(imagenSeleccionada, animalFoto){
        const distanciaProxima = 1.00; //10 km
        let fotoPrincipalRaza = null;
        let posiblesPrincipalRaza = [];
        
        const datosConsulta = await getDocs(collection(getFirestore(app),'Perdidos'));  
        const datosBD = datosConsulta.docs


        //Extraemos la raza de la foto principal
        if(animalFoto){
            fotoPrincipalRaza = await evaluarFotoGato(imagenSeleccionada); 
        }
        else{
            fotoPrincipalRaza = await evaluarFotoPerro(imagenSeleccionada);
        }

        //Obtenemos las tres posibles razas del animal
        posiblesPrincipalRaza = obtenerRazas(fotoPrincipalRaza);
        
        //Si se trata de la misma especie, extraemos la raza y realizamos una comparación en la cual le otorgamos una puntuación
        //Obtenemos todas las publicaciones en un radio de 10km
       await Promise.all(datosBD.map(async (doc, index) => {
            const distancia = calculoDistanciaDosPuntos(doc.data()["Coordenadas"]["latitude"], doc.data()["Coordenadas"]["longitude"], posicionUsuario.coords.latitude, posicionUsuario.coords.longitude);
           
            if(distancia <= distanciaProxima){
               await eleccionCandidatos(doc, index, posiblesPrincipalRaza, animalFoto); 
            }
        }));
    }

    //Función encargada de filtar los posibles candidatos. Si dicho candidato es el mismo animal que el de la foto (gato o perro), se procede a evaluar su raza y 
    // a otorgarle una puntuación
    //Parámetro: documento de la publicación, índice, razas del animal el cual ha sido tomado la foto, tipo de animal (gato o perro) del animal de la foto sacada
    async function eleccionCandidatos(doc, index, posiblesPrincipalRaza, animalFoto){
        let localPath = FileSystem.documentDirectory + 'imagen' + index +'.png';
        
        await FileSystem.downloadAsync(doc.data()['Fotos'][0], localPath);
        let arrayGatoPerro = [];

        try{
            arrayGatoPerro =  await evaluarFoto(localPath);
        }
        catch(e){
            console.log(e); 
            return;
        }

        let gatoPerro = null;

        if(arrayGatoPerro[0] > arrayGatoPerro[1]){
            gatoPerro = true;
        }
        else{
            gatoPerro = false;
        }

        let puntuacion = 0;

        if(gatoPerro === animalFoto){
            let fotoComparar = [];

            if(gatoPerro){
                fotoComparar = await evaluarFotoGato(localPath);
            }
            else{
                fotoComparar = await evaluarFotoPerro(localPath);
            }
            
            let posiblesCompararRazas = obtenerRazas(fotoComparar);

            puntuacion = asignarPuntuacion(posiblesPrincipalRaza, posiblesCompararRazas);
        }
        
        
        if(candidatos.has(puntuacion)){
            while(candidatos.has(puntuacion)){
                puntuacion = puntuacion - 1;
            }
            setCandidatos(candidatos.set(puntuacion, doc));
        }   
        else{
            setCandidatos(candidatos.set(puntuacion, doc));
        }  
    }

    //Función encargada de obtener los índices (correspondiente a las razas) de los tres valores más altos
    //Parámetro: array con la probabilidad de las posibles razas del animal a evaluar
    function obtenerRazas(arrayRazas){
        const paresClaveValor = Object.entries(arrayRazas);

        paresClaveValor.sort((a, b) => b[1] - a[1]);

        const indicesDeLosTresMasGrandes = paresClaveValor.slice(0, 3).map(par => parseInt(par[0]));
   
        return indicesDeLosTresMasGrandes;
    }

    function asignarPuntuacion(principalRaza, compararRaza){
        let puntuacion = 0;

        for(let i=0; i<3; i++){
            for(let k=0; k<3; k++){
                if(principalRaza[i] === compararRaza[k]){
                    puntuacion += compararRaza[i];
                }
            }
        }

        return puntuacion;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

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

    //Función encargada de realizar la comparación de la foto tomada con el conjunto de publicaciones en un área de 10km
    //Devuelve las publicaciones con mayor parecido al animal de la foto
    async function comparar(){
        setCandidatos(new Map());
        
        if(!imagenSeleccionada){
            Alert.alert('¡Atención!', 'Escoja una foto antes de buscar al animal');
        }
        else if(!posicionUsuario){
            Alert.alert('¡Atención!', 'Debes habilitar la ubicación para acceder a esta funcionalidad');
        }
        else{
            setLoading(true);
           
            const gatoPerro = await evaluarFoto(imagenSeleccionada);
            let animalFoto = null;
            
            if(Math.max(...gatoPerro)*100 < 90){
                Alert.alert('¡Atención!', 'No tenemos claro de que animal se trata. ¿Es un perro o un gato?', [
                    {
                        text: 'Gato', onPress: () => animalFoto = true
                    },
                    {
                        text: 'Perro', onPress: () => animalFoto = false
                    }
                ]);
            }
            else{
                animalFoto = gatoPerro[0] > gatoPerro[1]; //True Gato, False Perro
            }

            await sleep(8000);
            await posiblesCandidatos(imagenSeleccionada, animalFoto); //Filtrado de candidatos por Gato o Perro
            
           console.log('TERMINA DEL TODO');
           await sleep(5000);
           console.log(candidatos.size);

            const claves = Array.from(candidatos.keys());
            const candidatosOrdenados = [];

            claves.sort((a, b) => b[1] - a[1]);

            for (const clave of claves) {
                candidatosOrdenados.push(candidatos.get(clave));
            }

            setLoading(false);

            if(candidatosOrdenados.length == 0){
                Alert.alert('', 'No se han obtenido resultados');
            }
            else{
                Alert.alert('', 'Se han obtenido resultados');
                navigation.navigate('MejoresCandidatos', {Publicaciones:candidatosOrdenados});
            }
        }
    }

    async function usarCamara(){
        (async () => {
            const permisosCamara = await Camera.requestCameraPermissionsAsync();
            if(permisosCamara.status != 'granted'){
                Alert.alert('¡Atención!', 'Para usar la cámara debes de conceder los permisos necesarios', [
                    {
                        text: 'Cancelar',
                        style:"default",
                    },
                    {text: 'Aceptar'}
                ]);
            }
            else if(permisosCamara.status === 'granted'){
                setvistaCamara(true);
            }
           
        })();
    }

    useEffect(()=>{
        (async () => {
            const permisosCamara = await Camera.requestCameraPermissionsAsync();
            
            setvistaCamara(permisosCamara.status === 'granted');
        })();
    },[]);

    async function sacarFoto(){
        if(cameraRef){
            try{
                const data = await cameraRef.takePictureAsync();
                setimagenSeleccionada(data.uri);
                setvistaCamara(!vistaCamara);
            }
            catch(e){
                console.log(e);
            }
        }
    }

    return(
        <View style={[{flex:1}, vistaCamara ? {backgroundColor:'#000'} : null]}>
            {vistaCamara && <View style={{flex:1}}>
                <Camera style={{flex:1, backgroundColor:'#000'}} type={CameraType.back} ref={(r)=>{cameraRef=r}}>
                  
                </Camera>    
                
                <TouchableOpacity style={{flexDirection:'row', justifyContent:'center', backgroundColor:'#000', padding:12, borderTopLeftRadius:40, borderTopRightRadius:40}} onPress={()=>{sacarFoto()}}>
                    <Entypo name="camera" size={24} color="white" style={{marginRight:10}} />
                    <Text style={[{color:'#fff', fontSize:18}, tamañoNormal ? null : {fontSize:22}]}>Sacar Foto</Text>
                </TouchableOpacity>
            </View>
            }

            {!vistaCamara && <View style={{marginTop: Constants.statusBarHeight, flex:1}}>
                <ImageBackground
                    source={modoNocturno ? require('../../imagenes/mensajes.jpg') : require('../../imagenes/fondoNocturno.jpg')}
                    resizeMode={'cover'}
                    style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
                </ImageBackground> 
            
                <View style={[styles.header, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
                    <View style={{marginTop:15, marginLeft:20, flexDirection:'row'}}>
                        <TouchableOpacity onPress={()=>{goBack()}}>
                            {modoNocturno ? <MaterialCommunityIcons name="keyboard-backspace" size={50} color="black"/> : <MaterialCommunityIcons name="keyboard-backspace" size={50} color="white"/>}
                        </TouchableOpacity>
                        <Text style={[{fontWeight:"bold", color:'#fff', fontSize:30, marginLeft:40}]}>Buscador</Text>
                    </View>
                </View>

                {!loading && <View style={{flex:1}}>
                    <View style={{backgroundColor:'white', height:'70%', marginLeft:30, marginRight:30, borderWidth:1, borderStyle:'dashed'}}>
                        {imagenSeleccionada && <Image 
                            source={{uri:imagenSeleccionada}}  
                            style={{
                                flex:1
                            }}
                        />
                        }
                    </View>
                
                    <View style={{justifyContent:'center', alignItems:'center', marginBottom:15, flexDirection:'row', marginTop:10}}>
                        <TouchableOpacity style={{backgroundColor:'#3a99d8', padding:10, borderRadius:6, width:115}} 
                            onPress={()=>{ usarCamara()}}
                        >
                            <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:20}]}>Sacar</Text>
                            <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:20}]}>Foto</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{backgroundColor:'#3a99d8', padding:10, borderRadius:6, width:105, marginLeft:10, marginRight:10}} 
                            onPress={()=>{ Alert.alert('¡Atención!', 'El proceso que se realizará a continuación, puede tardar unos segundos en completarse', [
                                {
                                    text: 'Cancelar',
                                    style:"default",
                                },
                                {text: 'Aceptar', onPress: () => comparar()}
                                ]);
                            }}
                        >
                            <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:20}]}>Buscar</Text>
                            <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:20}]}>Animal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{backgroundColor:'#3a99d8', padding:10, borderRadius:6, width:100}} onPress={() => {handleSelectImage(1)}}>
                            <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:20}]}>Escoger</Text>
                            <Text style={[{textAlign:'center', fontWeight:500, fontSize:16, color:'white'}, tamañoNormal ? null : {fontSize:20}]}>Foto</Text>
                        </TouchableOpacity>
                        
                    </View>
                </View>
                }
                {loading && 
                    <View style={{justifyContent:'center', alignItems:'center', width:'100%', backgroundColor:'#fff', flex:0.5, borderRadius:80, marginTop:50}}>
                        <Text style={{position:'absolute', top:0, marginTop:30, fontWeight:"700", fontSize:20}}>Espere unos segundos...</Text>
                        <Lottie
                            source={require('../../animaciones/perroCaminando.json')}
                            autoPlay loop
                            style={{alignSelf:'center'}}
                        /> 
                    </View>
                }
            </View>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#F0B27A',
        borderBottomRightRadius:20,
        borderBottomLeftRadius:20,
        flex:0.12,
        marginBottom:35
      },
  });
    