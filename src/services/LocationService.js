import Geolocation from 'react-native-geolocation-service';
import {PermissionsAndroid, Platform} from 'react-native';

import {getIpLocation} from './IpLocationService';

class LocationService {
  async requestPermission() {
    if (Platform.OS === 'ios') {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'TutorX Location Permission',
        message:
          'TutorX needs your location to find nearby tutors.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  async getCurrentLocation() {
    const permission = await this.requestPermission();

    if (!permission) {
      const ipLocation = await getIpLocation();

      if (ipLocation) {
        return ipLocation;
      }

      throw new Error('Location permission denied.');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            source: 'gps',
          });
        },
        async error => {
          console.log(error);

          const ipLocation = await getIpLocation();

          if (ipLocation) {
            resolve(ipLocation);
          } else {
            reject(error);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }
}

export default new LocationService();