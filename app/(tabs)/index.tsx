import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, RobotoMono_400Regular } from '@expo-google-fonts/roboto-mono';
import moment from 'moment-hijri';


const { height } = Dimensions.get('window');
const ITEM_HEIGHT = height / 10;

function timeStringToMinutes(timeStr: string): number {
  const [time, modifier] = timeStr.split(/(AM|PM)/);
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function minutesToTimeString(minutes: number): string {
  let hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hrs >= 12 ? 'PM' : 'AM';

  if (hrs === 0) hrs = 12;
  else if (hrs > 12) hrs -= 12;

  const paddedMins = mins.toString().padStart(2, '0');
  return `${hrs}:${paddedMins}${ampm}`;
}

function isTimeInRange(current: number, start: number, end: number): boolean {
  return start < end
    ? current >= start && current < end
    : current >= start || current < end;
}



const TIME_SEGMENTS = [
  {
    name: 'fajr',
    start: timeStringToMinutes('6:15AM'),
    end: timeStringToMinutes('1:30PM'),
    colors: ['#FF7709', '#623007'],
  },
  {
    name: 'zhur',
    start: timeStringToMinutes('1:30PM'),
    end: timeStringToMinutes('6:30PM'),
    colors: ['#2197D6', '#4592BC', '#6D8E9F'],
  },
  {
    name: 'asr',
    start: timeStringToMinutes('6:30PM'),
    end: timeStringToMinutes('8:00PM'),
    colors: ['#4F709C', '#7D8FA3'],
  },
  {
    name: 'magrib',
    start: timeStringToMinutes('8:00PM'),
    end: timeStringToMinutes('8:30PM'),
    colors: ['#1253AF', '#896232'],
  },
  {
    name: 'isha',
    start: timeStringToMinutes('8:30PM'),
    end: timeStringToMinutes('6:15AM'),
    colors: ['#0E1F58', '#191818'],
  },
];

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}



function getCurrentTimeSegmentIndex() {
  const now = getCurrentMinutes();
  for (let i = 0; i < TIME_SEGMENTS.length; i++) {
    const { start, end } = TIME_SEGMENTS[i];
    if (isTimeInRange(now, start, end)) return i+1;
  }
  return 0;
}

const hijriMonthsEnglish = [
  'Muharram',
  'Safar',
  "Rabi' al-awwal",
  "Rabi' al-thani",
  'Jumada al-awwal',
  'Jumada al-thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

function getHijriDateEnglish() {
  const day = moment().iDate(); // day in month (Hijri)
  const monthIndex = moment().iMonth(); // month index 0-11 (Hijri)
  const year = moment().iYear(); // Hijri year
  const monthName = hijriMonthsEnglish[monthIndex];
  return `${monthName} ${day} ${year}`;
}



export default function TabOneScreen() {
  const [colors, setColors] = useState<string[]>([]);
  const animation = useRef(new Animated.Value(0)).current;
  const gradientRef = useRef<{ from: string[]; to: string[] } | null>(null);
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = daysOfWeek[currentDate.getDay()];
  const formattedDate = `${month} ${day}, ${year}`;
  const displayString = `${dayOfWeek}, ${formattedDate}`;

  const hijriDate = getHijriDateEnglish();


  let [fontsLoaded] = useFonts({
    RobotoMono_400Regular,
  });
  
  
  
 
  // This updates the list scroll to the current time segment
const snapToCurrentTimeSegment = () => {
  const index = getCurrentTimeSegmentIndex();
  flatListRef.current?.scrollToIndex({ index, animated: true });
};

// Effect 1: Snap list to current segment on mount and every 10 minutes
useEffect(() => {
  snapToCurrentTimeSegment(); // initial snap on mount

  const snapInterval = setInterval(() => {
    snapToCurrentTimeSegment();
  }, 1000 * 60 * 0.04); // every 10 minutes

  return () => clearInterval(snapInterval);
}, []);

// Effect 2: Update gradient colors with shorter duration and faster interval
useEffect(() => {
  const updateGradients = () => {
    const nowIndex = getCurrentTimeSegmentIndex();
    const from = TIME_SEGMENTS[nowIndex].colors;
    const to = TIME_SEGMENTS[(nowIndex + 1) % TIME_SEGMENTS.length].colors;

    gradientRef.current = { from, to };
    animation.setValue(0);

    Animated.timing(animation, {
      toValue: 1,
      duration: 60000 * 10, // shorter duration for smooth quick transition (~6 sec)
      useNativeDriver: false,
    }).start();
  };

  updateGradients(); // initial gradient update on mount

  const gradientInterval = setInterval(updateGradients, 1000 * 60 * 15); // every 15 minutes

  return () => clearInterval(gradientInterval);
}, []);

    
  

  
  useEffect(() => {
    const listener = animation.addListener(({ value }) => {
      if (gradientRef.current) {
        const blended = interpolateColors(gradientRef.current.from, gradientRef.current.to, value);
        setColors(blended);
      }
    });

    return () => animation.removeListener(listener);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={colors.length > 0 ? colors : ['#000', '#000']}
        style={styles.gradient}
      />
      <ImageBackground
        source={require('../../assets/images/Masjid-Silhouette.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <Text style={styles.date}>{displayString}</Text>
      <Text style={styles.hijraDate}>{hijriDate}</Text>


        <Animated.FlatList
          ref={flatListRef}
          data={TIME_SEGMENTS}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          renderItem={({ item, index }) => {
            const inputRange = [
              (index - 2) * ITEM_HEIGHT,
              (index - 1) * ITEM_HEIGHT,
              index * ITEM_HEIGHT,
              (index + 1) * ITEM_HEIGHT,
              (index + 2) * ITEM_HEIGHT,
            ];

            const scale = scrollY.interpolate({
              inputRange,
              outputRange: [0.7, 0.85, 1.9, 0.85, 0.7], // sharper curve
              extrapolate: 'clamp',
            });
            
            const translateX = scrollY.interpolate({
              inputRange,
              // Only positive values, so items move right or stay in place
              outputRange: [0, 0, 12, 0, 0], 
              extrapolate: 'clamp',
            });
            

            const opacity = scrollY.interpolate({
              inputRange,
              outputRange: [0.4, 0.8, 1, 0.1, 0], // sharper curve
              extrapolate: 'clamp',
            });

            return (
              <Animated.View style={[styles.item, { transform: [{ scale }, {translateX}], opacity }]}>
                <Text style={styles.text}>{item.name}</Text>
                <Text style={styles.time}>{minutesToTimeString(item.start)}</Text>
              </Animated.View>
            );
          }}
          contentContainerStyle={{
            paddingTop: (height - ITEM_HEIGHT) / 18,
            paddingBottom: (height - ITEM_HEIGHT) /1.8 + ITEM_HEIGHT, // extra space
            alignItems: 'flex-start',
            
          }}
          
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          snapToAlignment="start"
        />

    </SafeAreaView>
  );
}

function interpolateColors(from: string[], to: string[], progress: number): string[] {
  const hexToRgb = (hex: string) => {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    return [bigint >> 16 & 255, bigint >> 8 & 255, bigint & 255];
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      '#' +
      [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
    );
  };

  return from.map((startColor, index) => {
    const startRGB = hexToRgb(startColor);
    const endRGB = hexToRgb(to[index] || startColor);
    const r = Math.round(startRGB[0] + (endRGB[0] - startRGB[0]) * progress);
    const g = Math.round(startRGB[1] + (endRGB[1] - startRGB[1]) * progress);
    const b = Math.round(startRGB[2] + (endRGB[2] - startRGB[2]) * progress);
    return rgbToHex(r, g, b);
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    marginLeft: 40,
    width:'100%'
  
  },
  text: {
    fontSize: 28,
    color: 'white',
    
    textAlign: 'left',
    fontFamily: 'Roboto', // 👈 Apply the font
    textTransform:'capitalize',
    shadowOpacity:0.7,
    shadowOffset:{width:1,height:1},
    shadowRadius:1.5,
    width:'100%'
  },
  time:{
    color: 'white',
    fontWeight: 'thin',
    textAlign: 'left',
    fontFamily: 'Roboto',
    shadowOpacity:0.7,
    shadowOffset:{width:1,height:1},
    shadowRadius:1.5
  },
  date:{
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
    fontFamily: 'RobotoMono_400Regular',
    justifyContent: 'center',
    marginLeft: 40,
    fontSize: 20,
    marginTop:30,
    shadowOpacity:0.3,
    shadowOffset:{width:1,height:1},
    shadowRadius:1.5
  },
  hijraDate:{
    color: 'white',
    fontWeight: 'thin',
    textAlign: 'left',
    fontFamily: 'RobotoMono_400Regular',
    justifyContent: 'center',
    marginLeft: 40,
    marginTop: 5,
    shadowOpacity:0.3,
    shadowOffset:{width:1,height:1},
    shadowRadius:1.5
  }
});
