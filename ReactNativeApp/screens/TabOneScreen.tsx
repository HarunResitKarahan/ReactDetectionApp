// import {StatusBar} from 'expo-status-bar'
import React, {useState, useEffect} from 'react'
import {StyleSheet, Text, View, TouchableOpacity, ImageBackground, ActivityIndicator} from 'react-native'
import {Camera} from 'expo-camera'
import { FlatGrid } from 'react-native-super-grid';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { AntDesign } from '@expo/vector-icons'; 
import { MaterialIcons } from '@expo/vector-icons'; 
import { Entypo } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import Spinner from 'react-native-loading-spinner-overlay';
const tag = '[CAMERA]'
export default function App() {
  const [hasPermission, setHasPermission] = useState<any>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [isdetectedImage, setIsDetectedImage] = useState(false)
  const [detectedImage, setDetectedImage] = useState<any>(null)
  const [capturedImage, setCapturedImage] = useState<any>(null)
  const [clickedproject, setClickedProject] = useState<any>(null)
  const [detectionResult, setDetectionResult] = useState<any>(null)
  const [imagePadding, setImagePadding] = useState(0);
  const [ratio, setRatio] = useState('4:3');  // default is 4:3
  const { height, width } = Dimensions.get('window')
  const screenRatio = height / width;
  const [isRatioSet, setIsRatioSet] =  useState(false);
  const [loading, setLoading] = useState(false)
  const [startOver, setStartOver] = useState(true)
  const [type, setType] = useState(Camera.Constants.Type.back)
  const [items, setItems] = useState<any>(['SafetyZone','PumaFlex','Kapak Sol','Sarı Kablo','Item'])
  const [buttontype, setButtontype] = useState<any>([true,false,false,true,true])
  const [camera, setCamera] = useState(null);
  const serverUrl = "192.168.1.21:8000"
  useEffect(() => {
    ;(async () => {
      const {status} = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
      setInterval(fetch_get, 1000);
    })()
  }, [])
  const prepareRatio = async () => {
    let desiredRatio = '4:3';  // Start with the system default
    // This issue only affects Android
    if (Platform.OS === 'android') {
      const ratios = await camera.getSupportedRatiosAsync();

      // Calculate the width/height of each of the supported camera ratios
      // These width/height are measured in landscape mode
      // find the ratio that is closest to the screen ratio without going over
      let distances = {};
      let realRatios = {};
      let minDistance = null;
      for (const ratio of ratios) {
        const parts = ratio.split(':');
        const realRatio = parseInt(parts[0]) / parseInt(parts[1]);
        realRatios[ratio] = realRatio;
        // ratio can't be taller than screen, so we don't want an abs()
        const distance = screenRatio - realRatio; 
        distances[ratio] = realRatio;
        if (minDistance == null) {
          minDistance = ratio;
        } else {
          if (distance >= 0 && distance < distances[minDistance]) {
            minDistance = ratio;
          }
        }
      }
      // set the best match
      desiredRatio = minDistance;
      //  calculate the difference between the camera width and the screen height
      const remainder = Math.floor(
        (height - realRatios[desiredRatio] * width) / 2
      );
      // set the preview padding and preview ratio
      setImagePadding(remainder);
      setRatio(desiredRatio);
      // Set a flag so we don't do this 
      // calculation each time the screen refreshes
      setIsRatioSet(true);
    }
  };
  const fetch_get = async() => {
    await fetch ("http://"+ serverUrl +"/deneme", {
      method: 'GET',
    })
    .then(response => response.json())
    .then(data  => {
      // console.log(data)
    })
  };
  const setCameraReady = async() => {
    if (!isRatioSet) {
      await prepareRatio();
    }
  };
  const __closeCamera = () => {
    setStartOver(true)
  }
  const __goToHomepage = async () => {
    setIsDetectedImage(false)
    setPreviewVisible(false)
    setStartOver(true)
  }
  const __sendToControl = async () => {
    if (!camera) return
    // console.log(ratio)
    const photo = await camera.takePictureAsync({
      // fixOrientation: false,
      quality: 1,
      skipProcessing: true,
    })
    setCapturedImage(photo)
    setPreviewVisible(true)
    const localUri = photo.uri;
    setLoading(true);
    const filename = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;
    let formData = new FormData();
    // Assume "photo" is the name of the form field the server expects
    formData.append('clickedproject', clickedproject);
    formData.append('photo', { uri: localUri, name: filename, type });
    // console.log(formData)
    await fetch ("http://" + serverUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data',
      },
    })
    .then(response => response.json())
    .then(data  => {
      // console.log(data.image[0])
      // const imageObjectURL = URL.createObjectURL(imageBlob);
      setDetectedImage(data.image[0])
      setDetectionResult(data.result[0])
      setPreviewVisible(false)
      setIsDetectedImage(true)
    })
    setLoading(false)
  }
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" loading={loading} />
      </View>
    )
  }
  return (
    <View style={{flex: 1}}>
      {startOver ? (
        <View style={{flex: 1, backgroundColor: '#fff'}} >
          <FlatGrid
            itemDimension={(width-30) / 2}
            data={items}
            fixed
            spacing={10}
            style= {{
              marginTop: 10,
              flex: 1,
            }}
            renderItem={({ item,index }) => (
            <View style={{
              height: 200,
            }}>
              <TouchableOpacity
                disabled={!buttontype[index]}
                onPress={() => {
                  setStartOver(false)
                  setClickedProject(index)
                }}
                // style={[styles.text, touched && invalid ? styles.textinvalid : styles.textvalid]}
                style={[buttontype[index] ? styles.buttonactive : styles.buttondeactive]}
              >
                <Text
                  style={{
                    fontSize: 20,
                    color: '#fff',
                    fontWeight: '600',
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            </View>
            )}
          />
        </View>
      ) : (
        <View
          style={{
            flex: 1
          }}
        >
          {previewVisible ? (
            <ImageBackground
              source={{uri: capturedImage && capturedImage.uri}}
              style={{
                flex: 1
              }}
            >
              <Spinner
                //visibility of Overlay Loading Spinner
                visible={loading}
                //Text with the Spinner
                textContent={'Lütfen Bekleyin...'}
                //Text style of the Spinner Text
                textStyle={{color: '#FFF'}}
              />
              <View
                style={{
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    // backgroundColor: 'black',
                  }}
                >
                </View>
              </View>
            </ImageBackground>
          ) : null}
          {previewVisible== false && isdetectedImage== false ? (
            (
              <Camera
                style={{
                  flex: 1,
                  marginTop: imagePadding,
                  marginBottom: imagePadding
                }}
                onCameraReady={setCameraReady}
                type={type}
                ratio={ratio}
                ref={(r) => {
                  setCamera(r);
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    flexDirection: 'row'
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      top: '5%',
                      right: '5%'
                    }}
                  >
                    <TouchableOpacity onPress={__closeCamera} style= {{
                      // backgroundColor: '#fc0356',
                      // borderRadius: 100
                    }}
                    >
                      <AntDesign name="closecircle" size={30} color="white" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: '5%',
                      left: '5%'
                    }}
                    onPress={() => {
                      setType(type === Camera.Constants.Type.back ? Camera.Constants.Type.front : Camera.Constants.Type.back)
                    }}
                  >
                    <Ionicons name="camera-reverse-sharp" size={width / 10} color="white" />
                  </TouchableOpacity>
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      flexDirection: 'row',
                      flex: 1,
                      width: '100%',
                      padding: 20,
                      justifyContent: 'space-between'
                    }}
                  >
                    <View
                      style={{
                        alignSelf: 'center',
                        flex: 1,
                        alignItems: 'center'
                      }}
                    >
                      <TouchableOpacity
                        onPress={__sendToControl}
                        style={{
                          width: 70,
                          height: 70,
                          bottom: 0,
                          borderRadius: 50,
                          backgroundColor: '#fff'
                        }}
                      >
                        <MaterialIcons name="camera" size={70} color="black" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Camera>
            )
          ): null}
          {isdetectedImage ? (
            <ImageBackground
            source={{uri: detectedImage}}
            style={{
              flex: 1,
              height: Dimensions.get('window').height,
              width: Dimensions.get('window').width
            }}
          >
            {/* <Spinner
              //visibility of Overlay Loading Spinner
              visible={loading}
              //Text with the Spinner
              textContent={'Lütfen Bekleyin...'}
              //Text style of the Spinner Text
              textStyle={{color: '#FFF'}}
            /> */}
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  // backgroundColor: 'black',
                }}
              >
              {detectionResult == 'NOK' ? null: (
                <View style={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                  <TouchableOpacity
                  onPress={() => {
                    setPreviewVisible(false)
                    setIsDetectedImage(false)
                  }}
                  style={{
                    padding: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#3B9AE1'
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 18
                    }}
                  >
                    <MaterialCommunityIcons name="camera-retake" size={24} color="white" /> Yeniden Çek
                  </Text>
                </TouchableOpacity>
              
                <TouchableOpacity
                  onPress={__goToHomepage}
                  style={{
                    padding: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#3B9AE1'
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 18,
                    }}
                  >
                    <Entypo name="home" size={24} color="white" /> Ana Sayfaya Dön
                  </Text>
                </TouchableOpacity>
                </View>
              )}
                
              </View>
            </View>
          </ImageBackground>
          ): null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonactive: {
    borderRadius: 5,
    backgroundColor: '#3B9AE1',
    padding: 10,
    // flexDirection: 'row',
    justifyContent: 'flex-end',
    // alignItems: 'center',
    height: 200
  },
  buttondeactive: {
    borderRadius: 5,
    backgroundColor: 'gray',
    padding: 10,
    // flexDirection: 'row',
    justifyContent: 'flex-end',
    // alignItems: 'center',
    height: 200
  }
})