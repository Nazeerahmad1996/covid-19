import React from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import MapView from 'react-native-maps';
import { Marker, Callout } from 'react-native-maps';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import StarRating from 'react-native-star-rating';
import Modal from 'react-native-modal';

import * as firebase from 'firebase';


var config = {
  apiKey: "AIzaSyAnHlRVgNxEuk-3hXusgB9HOP1tPQDuLtA",
  authDomain: "auth-226ca.firebaseapp.com",
  databaseURL: "https://auth-226ca.firebaseio.com",
  projectId: "auth-226ca",
  storageBucket: "auth-226ca.appspot.com",
  messagingSenderId: "533567482896",
  appId: "1:533567482896:web:b8e1fac116b7592156ee95"
};
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      region: null,
      latitude: null,
      longitude: null,
      closed: false,
      starCount: 4,
      isModalVisible: false,
      isModalStock: false,
      marker: {
        latitude: 24.9485622,
        longitude: 66.9577431,
      },
      dataSource: [],
      description: '',
      distance: '',
      feedbackRating: 0,
      feedbackStock: 0,
      Feedback: [],
      listFeedback: [],
      listButtons: [
        {
          name: 'Covid',
          id: 5,
          place: 'hospital',
          icon: 'hospital',
          keyword: 'doctor',
          isTrue: true,
          type: 'health'
        },
        {
          name: 'Pharmacy',
          id: 0,
          place: 'pharmacy',
          icon: 'pharmacy',
          keyword: 'health',
          isTrue: false,
          type: 'food'
        },
        {
          name: 'Store',
          id: 2,
          place: 'grocery_or_supermarket',
          icon: 'store',
          keyword: 'store',
          isTrue: false,
          type: 'food'
        },
        {
          name: 'Restaurants',
          id: 1,
          place: 'restaurant',
          icon: 'silverware-fork-knife',
          keyword: 'food',
          isTrue: false,
          type: 'food'
        },
        {
          name: 'Hotel',
          id: 3,
          place: 'hotel',
          icon: 'bed-empty',
          keyword: 'hotel',
          isTrue: false,
          type: 'room'
        },
      ],
      place: 'store',
      type: '',
    };
  }


  toggleModal = () => {
    if (this.state.description.opening_hours !== undefined && !this.state.description.opening_hours.open_now) {

    } else {
      this.setState({ isModalVisible: !this.state.isModalVisible });
    }
  };

  stockModal = () => {
    this.setState({ isModalStock: !this.state.isModalStock });
  };


  Vote = (feedbackStock) => {
    let ref = firebase.database().ref().child('Rating').child(this.state.description.id);
    ref.push(
      {
        busy: this.state.feedbackRating,
        stock: feedbackStock,
        id: this.state.description.id,
      }
    ).then((data) => {
      this.setState({ Loading: false })
      Alert.alert(
        'Upload Successfully'
      )
      var Key = data.key
      ref.child(Key).update({
        Node: Key
      })

      ref.once("value", snapshot => {
        const data = snapshot.val()
        if (snapshot.val()) {
          const initMessages = [];
          Object
            .keys(data)
            .forEach(feedback => {
              initMessages.push(data[feedback])
            });

          let busyTotal = 0;
          let stockTotal = 0;

          initMessages.map(i => {
            busyTotal += i.busy
            stockTotal += i.stock
          })

          let busyAverage = busyTotal / initMessages.length;
          let stockAverage = stockTotal / initMessages.length;

          firebase.database().ref().child('RatingAverage').child(this.state.description.id).set({
            busy: Math.round(busyAverage),
            stock: Math.round(stockAverage),
            id: this.state.description.id.toString()
          }).catch(err => {
            console.log(err)
          })

        }
      }).catch(err => {
        console.log(err)
      });

    }).catch((error) => {
      //error callback
      this.setState({ Loading: false })
      Alert.alert(
        'Upload Not Successfully' + error
      )
    });
  }


  async componentDidMount() {
    console.log('componentDidMount');
    if (Platform.OS === 'android' && !Constants.isDevice) {
      Alert.alert('Oops, this will not work on Sketch in an Android emulator. Try it on your device!');
      // this.setState({
      //   errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      // });

    } else {
      let { status } = await Permissions.askAsync(Permissions.LOCATION);
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        // this.setState({
        //   errorMessage: 'Permission to access location was denied',
        // });
      }
      else {
        await navigator.geolocation.getCurrentPosition(
          position => {
            const location = JSON.stringify(position);
            let UserRegion = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }

            var markers =
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }

            let url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + position.coords.longitude + "," + position.coords.latitude + "&radius=1500&type=hospital&keyworkd=doctor&key=AIzaSyA0AraK8GbVbOX4VkQYGONbeqldBEDX4rc"

            fetch("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + position.coords.latitude + "," + position.coords.longitude + "&radius=1500&type=hospital&keyworkd=doctor&key=AIzaSyA0AraK8GbVbOX4VkQYGONbeqldBEDX4rc")
              .then(response => response.json())
              .then((responseJson) => {
                this.setState({
                  dataSource: responseJson.results
                })
              })
              .catch(error => console.log(error)) //to catch the errors if any

            this.setState({ region: UserRegion, marker: markers })

          },
          error => console.log(error.message),
          { getPositionAsync: true, enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
      }
    }


  }

  Search = (item) => {
    console.log('item: ' + item)
    this.setState({ type: item.type, description: '' })
    if (this.state.region) {
      fetch("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + this.state.region.latitude + "," + this.state.region.longitude + "&radius=3500&type=" + item.place + "&keyworkd=" + item.keyword + "&key=AIzaSyA0AraK8GbVbOX4VkQYGONbeqldBEDX4rc")
        .then(response => response.json())
        .then((responseJson) => {
          console.log(responseJson)
          this.setState({
            dataSource: responseJson.results
          });

          this.setState({
            listButtons: this.state.listButtons.map(el => (el.id === item.id ? { ...el, isTrue: true } : { ...el, isTrue: false }))
          });
        })
        .catch(error => console.log(error)) //to catch the errors if any
    }
  }

  markerClick = async (item) => {
    let d = this.distance(this.state.marker.latitude, this.state.marker.longitude, item.geometry.location.lat, item.geometry.location.lng)
    this.setState({ description: item, distance: d })

    let busy, stock;
    await firebase.database().ref('RatingAverage').child(item.id).once('value').then(function (snapshot) {
      busy = (snapshot.val() && snapshot.val().busy);
      stock = (snapshot.val() && snapshot.val().stock);
    });
    if (busy !== null && stock !== null) {
      this.setState({ feedbackRating: busy, feedbackStock: stock })
    }
    else {
      this.setState({ feedbackRating: 0, feedbackStock: 0 })
    }

  }

  distance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km (change this constant to get miles)
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    if (d > 1) return Math.round(d) + " km";
    else if (d <= 1) return Math.round(d * 1000) + " m";
    return d;
  }


  render() {

    return (
      <SafeAreaView style={styles.container}>

        <Modal
          onBackdropPress={() => this.toggleModal()}
          style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }} isVisible={this.state.isModalVisible}>
          <View style={{ justifyContent: 'center', backgroundColor: '#fff', width: '100%', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 15, alignItems: 'center' }}>
            <Text style={{ textAlign: 'center', fontSize: 30 }}>How busy is the business</Text>
            <View style={{ width: 150, marginVertical: 20 }}>
              <StarRating
                selectedStar={(rating) => {
                  if (this.state.type === 'food') {
                    this.setState({ feedbackRating: rating, isModalVisible: false, isModalStock: true });
                  }
                  else {
                    this.setState({ feedbackRating: rating, isModalVisible: false },
                      () => this.Vote(0));

                  }
                }}
                starSize={40}
                halfStarEnabled={false}
                disabled={false}
                emptyStar={'ios-man'}
                fullStar={'ios-man'}
                emptyStarColor={'#e2e3e6'}
                iconSet={'Ionicons'}
                maxStars={5}
                rating={this.state.feedbackRating}
                fullStarColor={this.state.feedbackRating === 5 ? '#ff6d41' : this.state.feedbackRating <= 2 ? '#85dda3' : '#fb9900'}
                starStyle={{ marginRight: 3 }}
              />
            </View>
          </View>
        </Modal>

        <Modal
          onBackdropPress={() => this.stockModal()}
          style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }} isVisible={this.state.isModalStock}>
          <View style={{ justifyContent: 'center', backgroundColor: '#fff', width: '100%', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 15, alignItems: 'center' }}>
            <Text style={{ textAlign: 'center', fontSize: 30 }}>How busy is the business</Text>
            <View style={{ width: 160, marginVertical: 20 }}>
              <StarRating
                selectedStar={(rating) => {
                  this.setState({ isModalStock: false, feedbackStock: rating });
                  this.Vote(rating)
                }}
                starSize={36}
                halfStarEnabled={false}
                disabled={false}
                emptyStar={'star'}
                fullStar={'star'}
                emptyStarColor={'#85dda3'}
                iconSet={'FontAwesome'}
                maxStars={5}
                rating={this.state.feedbackStock}
                fullStarColor={this.state.feedbackStock === 5 ? '#ff6d41' : this.state.feedbackStock <= 2 ? '#85dda3' : '#fb9900'}
              />
            </View>
          </View>
        </Modal>




        <MapView style={styles.mapStyle}
          initialRegion={this.state.region}
          showsUserLocation={true}
          showsCompass={true}
          rotateEnabled={false}
          style={{ flex: 1 }}
        >
          {this.state.dataSource.map((marker, index) => {
            return (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.geometry.location.lat,
                  longitude: marker.geometry.location.lng
                }}
                title={marker.name}
                // description={marker.vicinity}
                image={index % 2 == 0 ? require('./assets/pin.png') : require('./assets/pin2.png')}
                onPress={() => this.markerClick(marker)}
              >
              </Marker>
            )
          })}

        </MapView>
        <View style={{ position: 'absolute', top: 40, height: 60 }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            legacyImplementation={false}
            data={this.state.listButtons}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => this.Search(item)}
                style={{ elevation: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: item.isTrue ? '#AF7AC5' : '#fff', marginLeft: 10, justifyContent: 'center', height: 40, paddingHorizontal: 12, borderRadius: 20 }}>
                <MaterialCommunityIcons color={item.isTrue ? '#fff' : '#000'} name={item.icon} size={18} />
                <Text style={{ marginLeft: 3, color: item.isTrue ? '#fff' : '#000' }}>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id.toString()}
          />
        </View>
        {this.state.description !== '' && (
          <View style={styles.BottomCard}>
            {(this.state.description.opening_hours !== undefined && !this.state.description.opening_hours.open_now) && (
              <View style={{ backgroundColor: '#4d4d4d', padding: 10, borderTopRightRadius: 20, borderTopLeftRadius: 20 }}>
                <Text style={{ textAlign: 'center', color: '#fff', fontSize: 18 }}>Closed</Text>
              </View>
            )}
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name='md-pin' size={22} color='#ff6d41' />
                <View style={{ flex: 1, marginLeft: 25, marginRight: 10 }}>
                  <Text style={{ color: '#c2c4c8', fontSize: 13, textAlign: 'center' }}>{this.state.distance}</Text>
                  <Text style={{ fontSize: 20, }}>{this.state.description.name}</Text>
                  <Text style={{ fontSize: 13 }}>{this.state.description.vicinity}</Text>
                </View>
                <TouchableOpacity
                  onPress={this.toggleModal}
                  style={{ backgroundColor: (this.state.description.opening_hours !== undefined && !this.state.description.opening_hours.open_now) ? '#c2c3c8' : '#785eff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 }}>
                  <Text style={{ color: '#fff' }}>Vote</Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 15, borderTopWidth: 0.5, paddingTop: 15, borderColor: '#c2c4c8', flexDirection: 'row' }}>
                <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, color: (this.state.description.opening_hours !== undefined && !this.state.description.opening_hours.open_now) ? '#c2c4c8' : this.state.feedbackRating === 5 ? '#ff6d41' : this.state.feedbackRating <= 2 ? '#85dda3' : '#fb9900', fontWeight: 'bold' }}>Busy: </Text>
                  {(this.state.description.opening_hours !== undefined && !this.state.description.opening_hours.open_now) ? (
                    <Text style={{ fontSize: 22, color: '#c2c4c8', fontWeight: 'bold' }}>- -</Text>
                  ) : (
                      <StarRating
                        starSize={25}
                        halfStarEnabled={false}
                        disabled={true}
                        emptyStar={'ios-man'}
                        fullStar={'ios-man'}
                        emptyStarColor={'#c2c4c8'}
                        iconSet={'Ionicons'}
                        maxStars={5}
                        rating={this.state.feedbackRating}
                        fullStarColor={this.state.feedbackRating === 5 ? '#ff6d41' : this.state.feedbackRating <= 2 ? '#85dda3' : '#fb9900'}
                        starStyle={{ marginRight: 3 }}
                      />
                    )}

                </View>
                <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                  <Text onPress={this.stockModal} style={{ fontSize: 22, color: (this.state.description.opening_hours !== undefined && !this.state.description.opening_hours.open_now) ? '#c2c4c8' : this.state.feedbackStock === 5 ? '#ff6d41' : this.state.feedbackStock <= 2 ? '#85dda3' : '#fb9900', fontWeight: 'bold' }}>Stocks: </Text>
                  {((this.state.description.opening_hours !== undefined && !this.state.description.opening_hours.open_now) || this.state.type !== 'food') ? (
                    <Text style={{ fontSize: 22, color: '#c2c4c8', fontWeight: 'bold' }}>- -</Text>
                  ) : (
                      <StarRating
                        starSize={20}
                        halfStarEnabled={false}
                        disabled={true}
                        emptyStar={'star'}
                        fullStar={'star'}
                        emptyStarColor={'#c2c4c8'}
                        iconSet={'FontAwesome'}
                        maxStars={5}
                        rating={this.state.feedbackStock}
                        fullStarColor={this.state.feedbackStock === 5 ? '#ff6d41' : this.state.feedbackStock <= 2 ? '#85dda3' : '#fb9900'}
                      />
                    )}

                </View>
              </View>

            </View>

          </View>
        )}

      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapStyle: {
    flex: 1
  },
  BottomCard: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#fff',
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  }
});
