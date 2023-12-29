import { StyleSheet, Text, View, Button, Alert, Image, ImageBackground, TouchableOpacity, FlatList, Pressable, Modal } from 'react-native';
import React, {useEffect, useState,} from 'react';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import Header from '../Header';
import { ScrollView } from 'react-native-gesture-handler';
import {app} from "../../../database/firebase";
import {getDocs, collection, getFirestore, query, where, updateDoc, doc, arrayUnion, arrayRemove, getDoc, onSnapshot} from "firebase/firestore";
import {SimpleLineIcons} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AntDesign, Ionicons, Entypo, MaterialIcons} from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import SelectDropdown from "react-native-select-dropdown";
import {getAuth} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from "react-native";

export default function ForoScreen({navigation}) {
    const [datosBD, setdatosBD] = useState([]);
    const [abrirModalFiltro, setabrirModalFiltro] = useState(false);
    const [temaFiltro, setTemaFiltro] = useState(null);
    const temas = ["Politico", "Interés General", "Cuidado y Salud", "Soporte Técnico"];

    const [vistaFavorito, setVistaFavorito] = useState(false);
    const [datosBDFavorito, setDatosBDFavorito] = useState([]);
    const [modoNocturno, setModoNocturno] = useState(null);
    const [tamañoNormal, setTamañoNormal] = useState(null);
    const [recargar, setRecargar] = useState(null);
    const [usuario, setUsuario] = useState(null);

    useFocusEffect(React.useCallback(() => {
    (async () => {
        const theme = await AsyncStorage.getItem('themePreference');
        theme == 'light' ? setModoNocturno(true) : setModoNocturno(false);

        const tamaño = await AsyncStorage.getItem('letterPreference');
        tamaño == 'normal' ? setTamañoNormal(true) : setTamañoNormal(false);
        })()
    }, []));

    useEffect(()=> {
      (async () =>{
        
          setTemaFiltro(null);
       
          const consulta = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
          const datosConsulta = await getDocs(consulta);

          let idDoc = '';
          let i = 0;
          let documentosFavoritos = [];

          while(i < datosConsulta.docs[0].data()['Post_Favoritos'].length){
            idDoc = datosConsulta.docs[0].data()['Post_Favoritos'][i].path.split('/')[1];
            var documento = await getDoc(doc(getFirestore(app),'PostForo',  idDoc));

            if(documento.data() != undefined)
              documentosFavoritos.push(documento);
            else 
              await updateDoc(doc(getFirestore(app),'Usuarios', datosConsulta.docs[0]["id"]), {
                Post_Favoritos: arrayRemove(doc(collection(getFirestore(app), 'PostForo'), idDoc))
              });
              
            i++;
          }
            
          setDatosBDFavorito(documentosFavoritos);
            
      })()
    },[vistaFavorito]);

    useEffect(() => {
        (async () => { 
          const consultaUsuario = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
          const datosConsultaUsuario = await getDocs(consultaUsuario);

          const user = datosConsultaUsuario.docs[0].data();
          setUsuario(user);

          const datosConsulta = await getDocs(query(collection(getFirestore(app),'Publicaciones'), where("Tipo", "==", "PostForo")));  
          let documentos = [];

          await Promise.all(datosConsulta.docs.map(async(doc)=>{         
              if(!Object.values(user['Ocultar']).includes(doc.id)){
                var documento = await getDoc(doc.data()['Publicacion']);

                if(temaFiltro){
                  if(documento.data()['Tema'] == temaFiltro){
                    documentos.push(documento);
                  }
                }
                else{
                  documentos.push(documento);
                }
              }
            })
          )

          setdatosBD(documentos);
        })();

    }, [temaFiltro, recargar]);

    const Publicaciones = ({item, id, navigation}) => {
      const [usuarioDest, setUsuarioDest] = useState('');
      const [addFavorito, setAddFavorito] = useState(false);

      useEffect(()=>{
        (async () =>{ 
          const consultaDest= query(collection(getFirestore(app),'Usuarios'), where("Id", "==", item.data()['Id_Usuario']));
          const datosConsultaDest = await getDocs(consultaDest);
          
          let i = 0;
          while(i < datosBDFavorito.length){
            if(datosBDFavorito[i].id == id)
              setAddFavorito(true);
            i++;
          }
          
          setUsuarioDest(datosConsultaDest.docs[0].data()['Nombre']);
        })()
      }, []);
      
      async function imprimirFavorito(){
        const consulta = query(collection(getFirestore(app),'Usuarios'), where("Id", "==", getAuth(app).currentUser.uid));
        const datosConsulta = await getDocs(consulta);
       
        if(!addFavorito){
          Alert.alert('','Se ha añadido a favorito la publicación.');
          await updateDoc(doc(getFirestore(app),'Usuarios', datosConsulta.docs[0]["id"]), {
            Post_Favoritos: arrayUnion(doc(collection(getFirestore(app), 'PostForo'), id))
          });
        }
        else{
          Alert.alert('','Se ha eliminado de favorito la publicación.');
          await updateDoc(doc(getFirestore(app),'Usuarios', datosConsulta.docs[0]["id"]), {
            Post_Favoritos: arrayRemove(doc(collection(getFirestore(app), 'PostForo'), id))
          });
        }
      }
      
      return (
        <View key={id}>
          <TouchableOpacity onPress={()=> navigation.navigate('ForoForm', {Item: item, Id:id})}>
            <View style={[styles.container, modoNocturno ? null : {backgroundColor:'#323639', borderWidth:1}]}>
              <TouchableOpacity onPress={()=>{setAddFavorito(!addFavorito); imprimirFavorito();}} style={{position:'absolute', right:20, top:10, flexDirection:'row'}}>
                {!addFavorito && !modoNocturno &&  <AntDesign name="staro" size={25} color="white" style={{marginRight:10}} />}
                {!addFavorito && modoNocturno &&  <AntDesign name="staro" size={25} color="black" style={{marginRight:10}} />}
                {addFavorito && <AntDesign name="star" size={25} color='#f75b53' style={{marginRight:10,}} />}
              </TouchableOpacity>
              <View style={{flexDirection:'row',alignItems:"center", width: '70%', flex:1}}>
                <View>
                  <Image
                    source={{uri:item.data()['Foto']}}
                    style={styles.tinyLogo}
                    />
                  <View style={{flexDirection:'row', marginLeft:20, marginTop:5, width:80}}>
                    {modoNocturno ? <AntDesign name="user" size={tamañoNormal ? 18 : 22} color="black" style={{marginTop:5}} /> : <AntDesign name="user" size={tamañoNormal ? 18 : 22} color="white" style={{marginTop:5}} />}
                    <Text numberOfLines={1} style={[{marginLeft:5, marginBottom:9, marginTop:5, marginRight:20}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:18}]}>{usuarioDest}</Text>
                  </View>
                </View>
    
                <View style={{marginTop:5, marginBottom:10}}>
                  <Text numberOfLines={tamañoNormal ? 2 : 1} style={[{fontWeight:500, marginLeft:10, fontSize:18,}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>{item.data()['Titulo']}</Text>
                  <Text numberOfLines={tamañoNormal ? 3 : 2} style={[{fontWeight:400, marginLeft:10, marginTop:10}, modoNocturno ? null : {color:'#fff'}, tamañoNormal ? null : {fontSize:22}]}>{item.data()['Informacion']}</Text>
                </View>
              </View>
            </View>
            <Pressable
              style={{position:'absolute', right:15, bottom:15}}
              onPress={() => Alert.alert('¡Atención!', '¿Deseas reportar la publicación?', [
                {
                  text: 'No',
                  style: 'cancel',
                },
                {text: 'Si', onPress: () =>{navigation.navigate('ReportesScreen', {idDoc:id, tipo:"PostForo"})}},
              ])}>
              <MaterialIcons name="report" size={30} color="red" />
            </Pressable>
          </TouchableOpacity>
        </View>
      );
    }

    return (
    <View style={{flex:1}}>
      <ImageBackground
        source={modoNocturno ? require('../../imagenes/forobackground.jpg') : require('../../imagenes/foroNocturno.png')}
        resizeMode={'cover'}
        style={{flex:1, position:'absolute', width: '100%', height:'100%', marginTop: Constants.statusBarHeight}}>
      </ImageBackground> 

      <View style={{}}>
        <Header numero={3} navegar={navigation}/>
      </View>
      
      <View style={{flexDirection:'row', marginTop:25, justifyContent:'space-between'}}>
        <View style={{flexDirection:'row'}}>
          <Pressable
              style={styles.botonFiltrar}
              onPress = {() => {setabrirModalFiltro(true)}}>
              <Text style={[{textAlign: 'center'}, tamañoNormal ? null : {fontSize:18}]}><Ionicons name="filter" size={tamañoNormal ? 16 : 18} color="black" /> Filtrar</Text>
          </Pressable>
          {temaFiltro && 
            <Pressable
              style={styles.botonFiltrar}
              onPress = {() => {setTemaFiltro(null)}}>
              <Text style={[{textAlign: 'center'}, tamañoNormal ? null : {fontSize:16}]}><AntDesign name="closecircleo" size={14} color="black"/> {temaFiltro}</Text>
            </Pressable>
          }
        </View>
      </View>
      
      <View style={{flexDirection:'row', marginTop:5, justifyContent:'space-between'}}>
        <TouchableOpacity onPress={()=>{setVistaFavorito(!vistaFavorito)}} style={[styles.botonFavorito, tamañoNormal ? null : {width:135}]}>
            {!vistaFavorito && <AntDesign name="staro" size={25} color="black" style={{marginRight:10}} />}
            {vistaFavorito && <AntDesign name="star" size={25} color='#f75b53' style={{marginRight:10,}} />}
            <Text style={[tamañoNormal ? null : {fontSize:18}]}>Favoritos</Text>
        </TouchableOpacity>
        {!vistaFavorito && 
        <TouchableOpacity onPress={()=>{setRecargar(!recargar)}} style={[{padding:10, backgroundColor:'#fff', justifyContent:'center', alignContent:'center', borderRadius:40, marginRight:20}]}>
            <AntDesign name="reload1" size={25} color="black" style={{padding:5}}/>
        </TouchableOpacity>
        }
      </View>

      
      {!vistaFavorito && <FlatList
            data={datosBD}
            renderItem={({item}) => {return <Publicaciones item={item} id={item.id} navigation={navigation}/>}}
            keyExtractor={item => item.id}
            style={{marginBottom:10, marginTop:30}}
        />
      }
      
      {vistaFavorito &&
        <FlatList
          data={datosBDFavorito}
          renderItem={({item}) => {return <Publicaciones item={item} id={item.id} navigation={navigation}/>}}
          keyExtractor={item => item.id}
          style={{marginBottom:10, marginTop:30}}
        />
      }
      <View style={{alignItems:'flex-end', marginBottom:30, marginRight:30, borderRadius:40, position:'absolute', bottom:0, right:0}}>
        <TouchableOpacity onPress={()=>{navigation.navigate('PostForoForm')}} style={{backgroundColor:'#F584AD', height:70, width:70, justifyContent:'center', alignItems:'center', borderRadius:90, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },shadowOpacity: 0.45, shadowRadius: 4.84, elevation: 8}}>
          <SimpleLineIcons name="pencil" size={30} color="black" />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={abrirModalFiltro}
        onRequestClose={() => {
          setabrirModalFiltro(!abrirModalFiltro);
        }}
      >
        <TouchableOpacity style={{flex:1, marginTop:20}} onPress={() => {setabrirModalFiltro(!abrirModalFiltro)}}>
          <View style={styles.modalViewFiltro}>
            <View style={{height:25, width:50, margin:5,}}>
              <Pressable
                style={[styles.botonModal]}
                onPress={() => setabrirModalFiltro(!abrirModalFiltro)}>
                <AntDesign name="closecircle" size={24} color="black" />
              </Pressable>
            </View>

            <View style={{padding:20,}}>
              <Text style={{fontWeight:'bold', fontSize:22, marginBottom:20}}>Filtrar por</Text>

              <SelectDropdown
                data={temas}
                onSelect={(selectedItem, index) => {setTemaFiltro(selectedItem);}} 
                defaultButtonText= {
                  temaFiltro && <Text>{temaFiltro}</Text> || <Text style={{fontWeight:'bold', borderColor:'#000', fontSize:15}}>Tema <Entypo name="triangle-down" size={15} color="black"/></Text> 
                }
                buttonStyle={styles.dropdown1BtnStyle}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>       
  );
};

const styles = StyleSheet.create({
  container:{
    marginBottom:10,
    backgroundColor:'#fff',
    borderRadius:15,
    height:150,
    shadowColor: "#000",
    shadowOffset: {
	    width: 0,
	    height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,

  },
  tinyLogo: {
    width: 100,
    height: 100,
  },
  botonFiltrar:{
    backgroundColor:'#fff',
    borderRadius:20,
    width: 100,
    padding:10,
    marginLeft:5
  },
  modalViewFiltro: {
    flex: 0.30, 
    backgroundColor: '#e7ebda',
    margin: 30,  
    borderRadius: 20,
    flexDirection: 'column',
    borderColor:'#fff',
    marginTop:100,
  },
  dropdown1BtnStyle:{
    backgroundColor:'#fff',
    borderWidth:1,
    borderRadius:15,
    borderColor:'#000',
    width:130,
  },
  botonFavorito:{
    backgroundColor:'#fff',
    borderRadius:20,
    width: 120,
    padding:10,
    marginLeft:5,
    borderColor:'black',
    borderWidth:1,
    flexDirection:'row',
    marginTop:5
  },
  botonModal: {
    borderRadius: 20,
    width:25,
    height:25,
    justifyContent: 'flex-start',
    marginLeft:5,
    marginTop:5
  },
});