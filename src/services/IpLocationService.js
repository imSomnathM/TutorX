import axios from 'axios';

export const getIpLocation = async () => {
  try {
    const {data} = await axios.get('https://ipapi.co/json/');

    return {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      city: data.city,
      state: data.region,
      country: data.country_name,
      source: 'ip',
    };
  } catch (error) {
    console.log('IP Location Error:', error);

    return null;
  }
};