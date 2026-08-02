import {getDistance} from 'geolib';

export const calculateDistance = (
  studentLatitude,
  studentLongitude,
  tutorLatitude,
  tutorLongitude,
) => {
  const distance = getDistance(
    {
      latitude: studentLatitude,
      longitude: studentLongitude,
    },
    {
      latitude: tutorLatitude,
      longitude: tutorLongitude,
    },
  );

  return Number((distance / 1000).toFixed(2));
};