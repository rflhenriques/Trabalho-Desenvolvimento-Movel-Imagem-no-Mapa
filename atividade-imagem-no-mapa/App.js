import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function App() {
  const [localizacao, setLocalizacao] = useState(null);
  const [marcadores, setMarcadores] = useState([]);
  const [fotoSelecionada, setFotoSelecionada] = useState(null);

  const [permissaoCamera, solicitarPermissaoCamera] = useCameraPermissions();
  const [cameraAberta, setCameraAberta] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão negada',
          'Precisamos da sua localização para o mapa.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocalizacao(loc.coords);
    })();
  }, []);

  const abrirCamera = async () => {
    if (!permissaoCamera?.granted) {
      const permissao = await solicitarPermissaoCamera();
      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Você precisa permitir o acesso à câmera.'
        );
        return;
      }
    }
    setCameraAberta(true);
  };

  const tirarFoto = async () => {
    if (cameraRef.current) {
      const foto = await cameraRef.current.takePictureAsync();

      if (localizacao) {
        setMarcadores((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            latitude: localizacao.latitude,
            longitude: localizacao.longitude,
            photoUri: foto.uri,
          },
        ]);
      }

      setCameraAberta(false);
    }
  };

  if (cameraAberta) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.botoesCameraContainer}>
            <TouchableOpacity
              style={styles.botaoAcaoCamera}
              onPress={() => setCameraAberta(false)}>
              <Text style={styles.textoBotaoCamera}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoAcaoCamera}
              onPress={tirarFoto}>
              <Text style={styles.textoBotaoCamera}>Tirar Foto</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation
        initialRegion={
          localizacao
            ? {
                latitude: localizacao.latitude,
                longitude: localizacao.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : null
        }
        onPress={() => setFotoSelecionada(null)}>
        {marcadores.map((marcador) => (
          <Marker
            key={marcador.id}
            coordinate={{
              latitude: marcador.latitude,
              longitude: marcador.longitude,
            }}
            onPress={(e) => {
              e.stopPropagation();
              setFotoSelecionada(marcador.photoUri);
            }}
          />
        ))}
      </MapView>

      <TouchableOpacity style={styles.botaoFlutuante} onPress={abrirCamera}>
        <Text style={styles.textoBotaoFlutuante}>📷 Abrir Câmera</Text>
      </TouchableOpacity>

      {fotoSelecionada && (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: fotoSelecionada }}
            style={styles.imagemPreview}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  botoesCameraContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingBottom: 40,
    paddingTop: 20,
  },
  botaoAcaoCamera: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
  },
  textoBotaoCamera: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  botaoFlutuante: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  textoBotaoFlutuante: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  previewContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    width: 140,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  imagemPreview: {
    width: '100%',
    height: '100%',
  },
});
