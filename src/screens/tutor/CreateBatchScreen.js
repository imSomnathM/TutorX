// src/screens/tutor/CreateBatchScreen.js
import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
   Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS, SIZES} from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import {createBatch} from '../../firebase/firestore';
import {useAuth} from '../../context/AuthContext';
import LocationService from '../../services/LocationService';

import Modal from 'react-native-modal';
import {Calendar} from 'react-native-calendars';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const CLASS_OPTIONS = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SUBJECT_OPTIONS = ['Math','Physics','Chemistry','Biology','History','Geography','English','Bengali','Hindi','Computer Science'];

const formatDateDisplay = d =>
  d ? d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : '';

const formatTimeDisplay = d =>
  d ? d.toLocaleTimeString('en-IN', {hour: 'numeric', minute: '2-digit', hour12: true}) : '';

const CreateBatchScreen = ({navigation}) => {
  const {user} = useAuth();
  const [batchName, setBatchName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [medium, setMedium] = useState('');
  const [address, setAddress] = useState('');
  const [maxStudents, setMaxStudents] = useState('30');
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  // const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  // const [showTimePicker, setShowTimePicker] = useState(false);

  const [showTimeModal, setShowTimeModal] = useState(false);

  const [selectedHour, setSelectedHour] = useState('06');
  const [selectedMinute, setSelectedMinute] = useState('30');
  const [selectedPeriod, setSelectedPeriod] = useState('PM');

  const [selectedDays, setSelectedDays] = useState([]);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const toggleDay = d => setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleSubject = s => setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const result = await LocationService.getCurrentLocation();
      setLocation(result);
      Alert.alert(
        'Location Added',
        result.source === 'gps'
          ? 'GPS location captured successfully.'
          : 'Approximate location captured using IP.',
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to get location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      setStartDate(selectedDate);
    }
    if (Platform.OS === 'android') setShowDatePicker(false);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedTime) {
      setStartTime(selectedTime);
    }
    if (Platform.OS === 'android') setShowTimePicker(false);
  };

  const handleCreate = async () => {
    if (!batchName.trim()) return Alert.alert('Error', 'Batch name is required');
    if (!selectedClass) return Alert.alert('Error', 'Please select a class');
    if (selectedSubjects.length === 0) return Alert.alert('Error', 'Select at least one subject');
    if (!address.trim()) return Alert.alert('Error', 'Batch address is required');
    if (!location) return Alert.alert('Error', 'Please capture the batch location');

    setLoading(true);
    try {
      await createBatch(user.uid, {
        batchName: batchName.trim(),
        forClass: selectedClass,
        subjects: selectedSubjects.join(', '),
        medium: medium.trim(),
        address: address.trim(),
        maxStudents: parseInt(maxStudents, 10) || 30,
        startDate: formatDateDisplay(startDate),
        startTime: formatTimeDisplay(startTime),
        days: selectedDays,
        price: price.trim(),
        tutorName: user.displayName || '',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          source: location.source,
        },
      });
      Alert.alert('Batch Created', `"${batchName}" has been created successfully.`, [
        {text: 'View Batches', onPress: () => navigation.navigate('Batches')},
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Create New Batch</Text>
        <View style={{width: 24}} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Basic Information</Text>
            <CustomInput label="Batch Name *" placeholder="e.g. Science Batch for Class 9" value={batchName} onChangeText={setBatchName} iconName="class" autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Class *</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowClassPicker(!showClassPicker)}>
              <Icon name="format-list-numbered" size={20} color={COLORS.textSecondary} style={{marginRight: 10}} />
              <Text style={[styles.selectText, !selectedClass && {color: COLORS.textSecondary}]}>
                {selectedClass || 'Select class'}
              </Text>
              <Icon name={showClassPicker ? 'expand-less' : 'expand-more'} size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            {showClassPicker && (
  <ScrollView
    style={styles.dropdown}
    nestedScrollEnabled={true}
    showsVerticalScrollIndicator={true}>
    {CLASS_OPTIONS.map(cls => (
      <TouchableOpacity
        key={cls}
        style={[
          styles.dropdownItem,
          selectedClass === cls && styles.dropdownItemActive,
        ]}
        onPress={() => {
          setSelectedClass(cls);
          setShowClassPicker(false);
        }}>
        <Text
          style={[
            styles.dropdownText,
            selectedClass === cls && {
              color: COLORS.primary,
              fontWeight: '700',
            },
          ]}>
          {cls}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
)}

            <Text style={[styles.fieldLabel, {marginTop: 12}]}>Subjects *</Text>
            <View style={styles.chipsWrap}>
              {SUBJECT_OPTIONS.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, selectedSubjects.includes(s) && styles.chipActive]}
                  onPress={() => toggleSubject(s)}>
                  <Text style={[styles.chipText, selectedSubjects.includes(s) && {color: COLORS.white}]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput label="Medium" placeholder="e.g. Bengali / English" value={medium} onChangeText={setMedium} iconName="language" style={{marginTop: 12}} />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Location & Capacity</Text>
            <CustomInput label="Batch Address *" placeholder="e.g. 12/A, Puabagan, Bankura" value={address} onChangeText={setAddress} iconName="place" autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Batch Location *</Text>
            <CustomButton
              title={
                locationLoading
                  ? 'Getting Location...'
                  : location
                  ? 'Location Captured'
                  : 'Use Current Location'
              }
              iconName="my-location"
              onPress={handleGetLocation}
              loading={locationLoading}
            />
            {location && (
              <Text style={{color: 'green', fontWeight: '600', marginTop: 8, marginBottom: 4}}>
                ✓ {location.source === 'gps' ? 'GPS Location Captured' : 'Approximate Location Captured'}
              </Text>
            )}

            <CustomInput label="Maximum Students" placeholder="30" value={maxStudents} onChangeText={setMaxStudents} iconName="people" keyboardType="numeric" style={{marginTop: 8}} />
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅Schedule & Pricing</Text>

            <Text style={styles.fieldLabel}>Start Date</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCalendar(true)}>
              <Icon name="event" size={20} color={COLORS.textSecondary} style={{marginRight: 10}} />
              <Text style={[styles.selectText, !startDate && {color: COLORS.textSecondary}]}>
                {startDate ? formatDateDisplay(startDate) : 'Select start date'}
              </Text>
            </TouchableOpacity>
            
            <Modal
    isVisible={showCalendar}
    onBackdropPress={() => setShowCalendar(false)}>

    <View style={styles.calendarContainer}>

        <Calendar
            minDate={new Date().toISOString().split('T')[0]}
            onDayPress={day => {
                setStartDate(new Date(day.dateString));
                setShowCalendar(false);
            }}
        />

    </View>

</Modal>

            <Text style={[styles.fieldLabel, {marginTop: 12}]}>Start Time</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowTimeModal(true)}>
              <Icon name="schedule" size={20} color={COLORS.textSecondary} style={{marginRight: 10}} />
              <Text style={[styles.selectText, !startTime && {color: COLORS.textSecondary}]}>
                {startTime ? formatTimeDisplay(startTime) : 'Select start time'}
              </Text>
            </TouchableOpacity>
            
            <Modal
              isVisible={showTimeModal}
              onBackdropPress={() => setShowTimeModal(false)}>

              <View style={styles.timeModal}>

                <Text style={styles.modalTitle}>Select Time</Text>

                <View style={styles.timeRow}>

                  {/* Hour */}
                  <View style={styles.column}>
                    {Array.from({length:12}, (_,i)=>String(i+1).padStart(2,'0')).map(hour=>(
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.option,
                          selectedHour===hour && styles.optionActive
                        ]}
                        onPress={()=>setSelectedHour(hour)}>
                        {/* <Text>{hour}</Text> */}
                        <Text
                          style={[
                            styles.optionText,
                            selectedHour === hour && styles.optionTextActive,
                          ]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Minute */}
                  <View style={styles.column}>
                    {['00','15','30','45'].map(min=>(
                      <TouchableOpacity
                        key={min}
                        style={[
                          styles.option,
                          selectedMinute===min && styles.optionActive
                        ]}
                        onPress={()=>setSelectedMinute(min)}>
                        {/* <Text>{min}</Text> */}
                        <Text
                          style={[
                            styles.optionText,
                            selectedMinute === min && styles.optionTextActive,
                          ]}>
                          {min}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* AM PM */}
                  <View style={styles.column}>
                    {['AM','PM'].map(p=>(
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.option,
                          selectedPeriod===p && styles.optionActive
                        ]}
                        onPress={()=>setSelectedPeriod(p)}>
                        {/* <Text>{p}</Text> */}
                        <Text
                          style={[
                            styles.optionText,
                            selectedPeriod === p && styles.optionTextActive,
                          ]}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                </View>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={()=>{
                    let hour = parseInt(selectedHour,10);

                    if(selectedPeriod==='PM' && hour<12) hour+=12;
                    if(selectedPeriod==='AM' && hour===12) hour=0;

                    const date = new Date();

                    date.setHours(hour);
                    date.setMinutes(parseInt(selectedMinute,10));
                    date.setSeconds(0);

                    setStartTime(date);
                    setShowTimeModal(false);
                  }}>

                  <Text style={styles.doneButtonText}>
                    Select
                  </Text>

                </TouchableOpacity>

              </View>

            </Modal>

            <Text style={[styles.fieldLabel, {marginTop: 12}]}>Days per Week</Text>
            <View style={styles.daysRow}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayBtn, selectedDays.includes(day) && styles.dayBtnActive]}
                  onPress={() => toggleDay(day)}>
                  <Text style={[styles.dayText, selectedDays.includes(day) && {color: COLORS.white}]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput label="Price per Month (₹)" placeholder="e.g. 500" value={price} onChangeText={setPrice} iconName="currency-rupee" keyboardType="numeric" style={{marginTop: 8}} />
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <CustomButton title="Create Batch" onPress={handleCreate} loading={loading} iconName="add-circle" iconRight />
            <CustomButton title="Cancel" onPress={() => navigation.goBack()} variant="outline" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.surface, elevation: 2, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  backBtn: {padding: 4},
  pageTitle: {fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text},
  container: {paddingVertical: 16, paddingHorizontal: 16, paddingBottom: 40},
  section: {backgroundColor: COLORS.surface, borderRadius: 18, padding: 18, marginBottom: 14, elevation: 1},
  sectionTitle: {fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 16},
  fieldLabel: {fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8},
  selectBtn: {flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 4},
  selectText: {flex: 1, fontSize: SIZES.md, color: COLORS.text},
  dropdown: {backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, overflow: 'hidden', elevation: 4, maxHeight: 180},
  dropdownItem: {paddingHorizontal: 16, paddingVertical: 12},
  dropdownItemActive: {backgroundColor: COLORS.primaryLight},
  dropdownText: {fontSize: SIZES.md, color: COLORS.text},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background},
  chipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  chipText: {fontSize: SIZES.sm, fontWeight: '500', color: COLORS.text},
  daysRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8},
  dayBtn: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background},
  dayBtnActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  dayText: {fontWeight: '600', color: COLORS.text, fontSize: SIZES.sm},
  calendarContainer: {backgroundColor: '#fff',borderRadius: 20,padding: 15,},
  timeModal: {
  backgroundColor: COLORS.surface,
  borderRadius: 18,
  padding: 20,
},

modalTitle: {
  fontSize: SIZES.lg,
  fontWeight: '700',
  color: COLORS.text,
  textAlign: 'center',
  marginBottom: 20,
},

timeRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},

column: {
  flex: 1,
  marginHorizontal: 4,
},

option: {
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 8,
  backgroundColor: COLORS.background,
  borderWidth: 1,
  borderColor: COLORS.border,
},

optionActive: {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
},

optionText: {
  fontSize: SIZES.md,
  color: COLORS.text,
  fontWeight: '600',
},

optionTextActive: {
  color: COLORS.white,
},

doneButton: {
  marginTop: 20,
  backgroundColor: COLORS.primary,
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: 'center',
},

doneButtonText: {
  color: COLORS.white,
  fontSize: SIZES.md,
  fontWeight: '700',
},
});

export default CreateBatchScreen;
